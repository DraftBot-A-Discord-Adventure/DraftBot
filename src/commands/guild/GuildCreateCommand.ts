import {Entity} from "../../core/models/Entity";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {DraftBotValidateReactionMessage} from "../../core/messages/DraftBotValidateReactionMessage";
import Guild, {Guilds} from "../../core/models/Guild";
import {MissionsController} from "../../core/missions/MissionsController";
import {BlockingUtils, sendBlockedError} from "../../core/utils/BlockingUtils";
import {ICommand} from "../ICommand";
import {Constants} from "../../core/Constants";
import {checkNameString} from "../../core/utils/StringUtils";
import {replyErrorMessage, sendErrorMessage} from "../../core/utils/ErrorUtils";
import {TranslationModule, Translations} from "../../core/Translations";
import {Data, DataModule} from "../../core/Data";
import {BlockingConstants} from "../../core/constants/BlockingConstants";

type InformationModules = { guildCreateModule: TranslationModule, guildCreateData: DataModule }

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
	const guildCreateData = Data.getModule("commands.guildCreate");
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
		replyErrorMessage(interaction, language, guildCreateModule.get("alreadyInAGuild"));
		return;
	}

	const askedName = interaction.options.getString("name");

	if (!checkNameString(askedName, Constants.GUILD.MIN_GUILD_NAME_SIZE, Constants.GUILD.MAX_GUILD_NAME_SIZE)) {
		replyErrorMessage(
			interaction,
			language,
			guildCreateModule.get("invalidName") + "\n" + Translations.getModule("error", language).format("nameRules", {
				min: Constants.GUILD.MIN_GUILD_NAME_SIZE,
				max: Constants.GUILD.MAX_GUILD_NAME_SIZE
			}));
		return;
	}

	guild = await getGuildByName(askedName);

	if (guild !== null) {
		// the name is already used
		replyErrorMessage(
			interaction,
			language,
			guildCreateModule.get("nameAlreadyUsed")
		);
		return;
	}

	const endCallback = endCallbackGuildCreateValidationMessage(entity, guild, askedName, interaction, language, {
		guildCreateModule,
		guildCreateData
	});

	const validationEmbed = createValidationEmbedGuildCreation(interaction, endCallback, askedName, {
		guildCreateModule,
		guildCreateData
	});

	await validationEmbed.reply(interaction, (collector) => BlockingUtils.blockPlayerWithCollector(entity.discordUserId, BlockingConstants.REASONS.GUILD_CREATE, collector));
}

async function getGuildByName(askedName: string) {
	try {
		return await Guilds.getByName(askedName);
	}
	catch (error) {
		return null;
	}
}

function endCallbackGuildCreateValidationMessage(entity: Entity, guild: Guild, askedName: string, interaction: CommandInteraction, language: string, informationModules: InformationModules) {
	return async (validateMessage: DraftBotValidateReactionMessage) => {
		BlockingUtils.unblockPlayer(entity.discordUserId, BlockingConstants.REASONS.GUILD_CREATE);
		if (validateMessage.isValidated()) {
			guild = await getGuildByName(askedName);
			if (guild !== null) {
				// the name is already used
				return sendErrorMessage(interaction.user, interaction, language, informationModules.guildCreateModule.get("nameAlreadyUsed"));
			}
			if (entity.Player.money < informationModules.guildCreateData.getNumber("guildCreationPrice")) {
				return sendErrorMessage(interaction.user, interaction, language, informationModules.guildCreateModule.get("notEnoughMoney"));
			}

			const newGuild = await Guild.create({
				name: askedName,
				chiefId: entity.id
			});

			entity.Player.guildId = newGuild.id;
			await entity.Player.addMoney(entity, -informationModules.guildCreateData.getNumber("guildCreationPrice"), interaction.channel, language);
			newGuild.updateLastDailyAt();
			newGuild.save();
			await Promise.all([
				entity.save(),
				entity.Player.save()
			]);

			await MissionsController.update(entity, interaction.channel, language, {missionId: "joinGuild"});
			await MissionsController.update(entity, interaction.channel, language, {
				missionId: "guildLevel",
				count: newGuild.level,
				set: true
			});

			return interaction.followUp({
				embeds: [new DraftBotEmbed()
					.formatAuthor(informationModules.guildCreateModule.get("createTitle"), interaction.user)
					.setDescription(informationModules.guildCreateModule.format("createSuccess", {guildName: askedName}))]
			});
		}

		// Cancel the creation
		return sendErrorMessage(interaction.user, interaction, language, informationModules.guildCreateModule.get("creationCancelled"), true);
	};
}

function createValidationEmbedGuildCreation(
	interaction: CommandInteraction,
	endCallback: (validateMessage: DraftBotValidateReactionMessage) => Promise<any>,
	askedName: string,
	informationsModule: InformationModules
) {
	return new DraftBotValidateReactionMessage(interaction.user, endCallback)
		.formatAuthor(informationsModule.guildCreateModule.get("buyTitle"), interaction.user)
		.setDescription(
			informationsModule.guildCreateModule.format("buyConfirm",
				{
					guildName: askedName,
					price: informationsModule.guildCreateData.getNumber("guildCreationPrice")
				}
			))
		.setFooter(informationsModule.guildCreateModule.get("buyFooter"), null);
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
		disallowEffects: [Constants.EFFECT.BABY, Constants.EFFECT.DEAD]
	},
	mainGuildCommand: false
};