import {Entity} from "../../core/database/game/models/Entity";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {DraftBotValidateReactionMessage} from "../../core/messages/DraftBotValidateReactionMessage";
import Guild, {Guilds} from "../../core/database/game/models/Guild";
import {MissionsController} from "../../core/missions/MissionsController";
import {BlockingUtils, sendBlockedError} from "../../core/utils/BlockingUtils";
import {ICommand} from "../ICommand";
import {Constants} from "../../core/Constants";
import {checkNameString} from "../../core/utils/StringUtils";
import {replyErrorMessage, sendErrorMessage} from "../../core/utils/ErrorUtils";
import {TranslationModule, Translations} from "../../core/Translations";
import {BlockingConstants} from "../../core/constants/BlockingConstants";
import {NumberChangeReason} from "../../core/database/logs/LogsDatabase";
import {draftBotInstance} from "../../core/bot";
import {EffectsConstants} from "../../core/constants/EffectsConstants";
import {GuildCreateConstants} from "../../core/constants/GuildCreateConstants";

/**
 * Get a guild by its name
 * @param askedName
 */
async function getGuildByName(askedName: string): Promise<Guild> {
	try {
		return await Guilds.getByName(askedName);
	}
	catch (error) {
		return null;
	}
}

/**
 * Get the callback for the guild create command
 * @param entity
 * @param guild
 * @param askedName
 * @param interaction
 * @param language
 * @param guildCreateModule
 */
function endCallbackGuildCreateValidationMessage(
	entity: Entity,
	guild: Guild,
	askedName: string,
	interaction: CommandInteraction,
	language: string,
	guildCreateModule: TranslationModule
): (validateMessage: DraftBotValidateReactionMessage) => Promise<void> {
	return async (validateMessage: DraftBotValidateReactionMessage): Promise<void> => {
		BlockingUtils.unblockPlayer(entity.discordUserId, BlockingConstants.REASONS.GUILD_CREATE);
		if (validateMessage.isValidated()) {
			guild = await getGuildByName(askedName);
			if (guild !== null) {
				// the name is already used
				await sendErrorMessage(interaction.user, interaction, language, guildCreateModule.get("nameAlreadyUsed"));
				return;
			}
			if (entity.Player.money < GuildCreateConstants.PRICE) {
				await sendErrorMessage(interaction.user, interaction, language, guildCreateModule.get("notEnoughMoney"));
				return;
			}

			const newGuild = await Guild.create({
				name: askedName,
				chiefId: entity.id
			});

			entity.Player.guildId = newGuild.id;
			await entity.Player.addMoney({
				entity,
				amount: -GuildCreateConstants.PRICE,
				channel: interaction.channel,
				language,
				reason: NumberChangeReason.GUILD_CREATE
			});
			newGuild.updateLastDailyAt();
			await newGuild.save();
			await Promise.all([
				entity.save(),
				entity.Player.save()
			]);

			draftBotInstance.logsDatabase.logGuildCreation(entity.discordUserId, newGuild).then();

			await MissionsController.update(entity, interaction.channel, language, {missionId: "joinGuild"});
			await MissionsController.update(entity, interaction.channel, language, {
				missionId: "guildLevel",
				count: newGuild.level,
				set: true
			});

			await interaction.followUp({
				embeds: [new DraftBotEmbed()
					.formatAuthor(guildCreateModule.get("createTitle"), interaction.user)
					.setDescription(guildCreateModule.format("createSuccess", {guildName: askedName}))]
			});
			return;
		}

		// Cancel the creation
		await sendErrorMessage(interaction.user, interaction, language, guildCreateModule.get("creationCancelled"), true);
	};
}

/**
 * Get the validation embed for a guild creation
 * @param interaction
 * @param endCallback
 * @param askedName
 * @param guildCreateModule
 */
function createValidationEmbedGuildCreation(
	interaction: CommandInteraction,
	endCallback: (validateMessage: DraftBotValidateReactionMessage) => Promise<void>,
	askedName: string,
	guildCreateModule: TranslationModule
): DraftBotValidateReactionMessage {
	return new DraftBotValidateReactionMessage(interaction.user, endCallback)
		.formatAuthor(guildCreateModule.get("buyTitle"), interaction.user)
		.setDescription(
			guildCreateModule.format("buyConfirm",
				{
					guildName: askedName,
					price: GuildCreateConstants.PRICE
				}
			))
		.setFooter({text: guildCreateModule.get("buyFooter")});
}

/**
 * Allow to Create a guild
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param entity
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity): Promise<void> {
	if (await sendBlockedError(interaction, language)) {
		return;
	}
	const guildCreateModule = Translations.getModule("commands.guildCreate", language);
	// search for a user's guild
	let guild;
	try {
		guild = await Guilds.getById(entity.Player.guildId);
	}
	catch (error) {
		guild = null;
	}
	if (guild !== null) {
		// already in a guild
		await replyErrorMessage(interaction, language, guildCreateModule.get("alreadyInAGuild"));
		return;
	}

	const askedName = interaction.options.getString("name");

	if (!checkNameString(askedName, Constants.GUILD.MIN_GUILD_NAME_SIZE, Constants.GUILD.MAX_GUILD_NAME_SIZE)) {
		await replyErrorMessage(
			interaction,
			language,
			`${guildCreateModule.get("invalidName")}\n${Translations.getModule("error", language).format("nameRules", {
				min: Constants.GUILD.MIN_GUILD_NAME_SIZE,
				max: Constants.GUILD.MAX_GUILD_NAME_SIZE
			})}`);
		return;
	}

	guild = await getGuildByName(askedName);

	if (guild !== null) {
		// the name is already used
		await replyErrorMessage(
			interaction,
			language,
			guildCreateModule.get("nameAlreadyUsed")
		);
		return;
	}

	const endCallback = endCallbackGuildCreateValidationMessage(entity, guild, askedName, interaction, language, guildCreateModule);

	const validationEmbed = createValidationEmbedGuildCreation(interaction, endCallback, askedName, guildCreateModule);

	await validationEmbed.reply(interaction, (collector) => BlockingUtils.blockPlayerWithCollector(entity.discordUserId, BlockingConstants.REASONS.GUILD_CREATE, collector));
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("guildcreate")
		.setDescription("Creates a new guild")
		.addStringOption(option => option.setName("name")
			.setDescription("The name of the new guild")
			.setRequired(true)) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		requiredLevel: Constants.GUILD.REQUIRED_LEVEL,
		disallowEffects: [EffectsConstants.EMOJI_TEXT.BABY, EffectsConstants.EMOJI_TEXT.DEAD]
	},
	mainGuildCommand: false
};