import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction, User} from "discord.js";
import {Entities, Entity} from "../../core/database/game/models/Entity";
import {Constants} from "../../core/Constants";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import Guild, {Guilds} from "../../core/database/game/models/Guild";
import {replyErrorMessage, sendErrorMessage} from "../../core/utils/ErrorUtils";
import {TranslationModule, Translations} from "../../core/Translations";
import {escapeUsername} from "../../core/utils/StringUtils";
import {DraftBotValidateReactionMessage} from "../../core/messages/DraftBotValidateReactionMessage";
import {BlockingUtils, sendBlockedError} from "../../core/utils/BlockingUtils";
import {BlockingConstants} from "../../core/constants/BlockingConstants";
import {draftBotInstance} from "../../core/bot";
import {EffectsConstants} from "../../core/constants/EffectsConstants";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";

type PersonInformation = { user: User, entity: Entity };
type TextInformation = { interaction: CommandInteraction, guildElderModule: TranslationModule }

/**
 * callback for the reaction collector
 * @param chief
 * @param elder
 * @param guild
 * @param textInformation
 */
function getEndCallbackGuildElder(
	chief: PersonInformation,
	elder: Entity,
	guild: Guild,
	textInformation: TextInformation): (msg: DraftBotValidateReactionMessage) => Promise<void> {
	return async (msg: DraftBotValidateReactionMessage): Promise<void> => {
		BlockingUtils.unblockPlayer(chief.entity.discordUserId, BlockingConstants.REASONS.GUILD_ELDER);
		if (msg.isValidated()) {
			const elderUpdated = await Entities.getById(elder.id);
			if (elder.Player.guildId !== elderUpdated.Player.guildId) {
				return await sendErrorMessage(
					chief.user,
					textInformation.interaction,
					textInformation.guildElderModule.language,
					textInformation.guildElderModule.get("problemWhilePromoting"),
					true
				);
			}

			// change the elder
			guild.elderId = elder.id;
			await guild.save();

			draftBotInstance.logsDatabase.logGuildElderAdd(guild, elder.discordUserId).then();

			await textInformation.interaction.followUp({
				embeds: [
					new DraftBotEmbed()
						.setAuthor(
							{
								name: textInformation.guildElderModule.format("successElderAddTitle", {
									pseudo: escapeUsername(await elder.Player.getPseudo(textInformation.guildElderModule.language)),
									guildName: guild.name
								}),
								iconURL: chief.user.displayAvatarURL()
							}
						)
						.setDescription(textInformation.guildElderModule.get("successElderAdd"))
				]
			});
			return;
		}

		// Cancel the creation
		return await sendErrorMessage(
			chief.user,
			textInformation.interaction,
			textInformation.guildElderModule.language,
			textInformation.guildElderModule.get("elderAddCancelled"),
			true);
	};
}

/**
 * Check if the elder is eligible
 * @param elderGuild
 * @param guild
 * @param textInformation
 * @param elderEntity
 */
async function checkElderEligibility(elderGuild: Guild, guild: Guild, textInformation: TextInformation, elderEntity: Entity): Promise<boolean> {
	// check if the elder is in the right guild
	if (elderGuild === null || elderGuild.id !== guild.id) {
		await replyErrorMessage(
			textInformation.interaction,
			textInformation.guildElderModule.language,
			textInformation.guildElderModule.get("notInTheGuild")
		);
		return false;
	}

	// chief cannot be the elder
	if (guild.chiefId === elderEntity.id) {
		await replyErrorMessage(
			textInformation.interaction,
			textInformation.guildElderModule.language,
			textInformation.guildElderModule.get("chiefError")
		);
		return false;
	}

	// check if the elder is already an elder
	if (elderGuild.elderId === elderEntity.id) {
		await replyErrorMessage(
			textInformation.interaction,
			textInformation.guildElderModule.language,
			textInformation.guildElderModule.get("alreadyElder")
		);
		return false;
	}
	return true;
}

/**
 * Allow to display the promoted a user to become an elder
 * @param interaction
 * @param language
 * @param entity
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity): Promise<void> {
	if (await sendBlockedError(interaction, language)) {
		return;
	}
	const guildElderModule = Translations.getModule("commands.guildElder", language);
	const elderEntity = await Entities.getByOptions(interaction);
	const guild = await Guilds.getById(entity.Player.guildId);
	const elderGuild = await Guilds.getById(elderEntity.Player.guildId);

	// check if the elder is eligible
	const eligible = await checkElderEligibility(elderGuild, guild, {interaction, guildElderModule}, elderEntity);
	if (!eligible) {
		return;
	}

	const endCallback = getEndCallbackGuildElder(
		{
			user: interaction.user,
			entity: entity
		},
		elderEntity,
		guild,
		{
			interaction,
			guildElderModule
		}
	);

	await new DraftBotValidateReactionMessage(
		interaction.user, endCallback).formatAuthor(guildElderModule.get("elderAddTitle"), interaction.user)
		.setDescription(guildElderModule.format("elderAdd", {
			elder: escapeUsername(await elderEntity.Player.getPseudo(language)),
			guildName: guild.name
		}))
		.reply(interaction, (collector) => BlockingUtils.blockPlayerWithCollector(entity.discordUserId, BlockingConstants.REASONS.GUILD_ELDER, collector));
}

const currentCommandFrenchTranslations = Translations.getModule("commands.guildElder", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.guildElder", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations, currentCommandEnglishTranslations)
		.addUserOption(option =>
			SlashCommandBuilderGenerator.generateUserOption(
				currentCommandFrenchTranslations, currentCommandEnglishTranslations, option
			).setRequired(true)
		) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		disallowEffects: [EffectsConstants.EMOJI_TEXT.BABY, EffectsConstants.EMOJI_TEXT.DEAD],
		guildPermissions: Constants.GUILD.PERMISSION_LEVEL.CHIEF,
		guildRequired: true
	},
	mainGuildCommand: false
};