import {DraftBotValidateReactionMessage} from "../../core/messages/DraftBotValidateReactionMessage";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Guild, Guilds} from "../../core/database/game/models/Guild";
import {MissionsController} from "../../core/missions/MissionsController";
import {BlockingUtils, sendBlockedError} from "../../core/utils/BlockingUtils";
import {ICommand} from "../ICommand";
import {Constants} from "../../core/Constants";
import {CommandInteraction} from "discord.js";
import {SlashCommandBuilder} from "@discordjs/builders";
import {replyErrorMessage, sendErrorMessage} from "../../core/utils/ErrorUtils";
import {TranslationModule, Translations} from "../../core/Translations";
import {BlockingConstants} from "../../core/constants/BlockingConstants";
import {draftBotInstance} from "../../core/bot";
import {EffectsConstants} from "../../core/constants/EffectsConstants";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import Player, {Players} from "../../core/database/game/models/Player";

type PlayerInformation = { player: Player, guild: Guild }
type TextInformation = { interaction: CommandInteraction, guildKickModule: TranslationModule, language: string }

/**
 * Get the callback for the guild kick command
 * @param playerInformation
 * @param textInformation
 */
async function getValidationCallback(
	playerInformation: PlayerInformation,
	textInformation: TextInformation
): Promise<(validateMessage: DraftBotValidateReactionMessage) => Promise<void>> {
	const kickedPlayer = await Players.getByOptions(textInformation.interaction);
	return async (validateMessage: DraftBotValidateReactionMessage): Promise<void> => {
		BlockingUtils.unblockPlayer(playerInformation.player.discordUserId, BlockingConstants.REASONS.GUILD_KICK);
		if (validateMessage.isValidated()) {
			let kickedGuild;
			try {
				kickedGuild = await Guilds.getById(kickedPlayer.guildId);
			}
			catch (error) {
				kickedGuild = null;
			}

			if (kickedGuild === null) {
				// not the same guild
				await sendErrorMessage(
					textInformation.interaction.user,
					textInformation.interaction,
					textInformation.language,
					textInformation.guildKickModule.get("notInTheGuild")
				);
				return;
			}
			draftBotInstance.logsDatabase.logGuildKick(kickedGuild, kickedPlayer.discordUserId).then();
			kickedPlayer.guildId = null;
			if (playerInformation.guild.elderId === kickedPlayer.id) {
				playerInformation.guild.elderId = null;
			}

			await Promise.all([
				playerInformation.guild.save(),
				kickedPlayer.save()
			]);

			const embed = new DraftBotEmbed();
			embed.setAuthor({
				name: textInformation.guildKickModule.format("successTitle", {
					kickedPseudo: kickedPlayer.getPseudo(textInformation.language),
					guildName: playerInformation.guild.name
				}),
				iconURL: textInformation.interaction.user.displayAvatarURL()
			})
				.setDescription(textInformation.guildKickModule.get("kickSuccess"));
			await MissionsController.update(kickedPlayer, textInformation.interaction.channel, textInformation.language, {
				missionId: "guildLevel",
				count: 0,
				set: true
			});
			await textInformation.interaction.followUp({embeds: [embed]});
			return;
		}

		// Cancel the kick
		await sendErrorMessage(
			textInformation.interaction.user,
			textInformation.interaction,
			textInformation.language,
			textInformation.guildKickModule.format("kickCancelled", {kickedPseudo: kickedPlayer.getPseudo(textInformation.language)}),
			true);
	};
}

/**
 * Say if a given player can be kicked from the guild
 * @param entityInformation
 * @param textInformation
 * @param kickedPlayer
 */
async function isNotEligible(entityInformation: PlayerInformation, textInformation: TextInformation, kickedPlayer: Player): Promise<boolean> {
	if (kickedPlayer === null) {
		// no user provided
		await replyErrorMessage(
			textInformation.interaction,
			textInformation.language,
			textInformation.guildKickModule.get("cannotGetKickedUser")
		);
		return true;
	}
	let kickedGuild;
	// search for a user's guild
	try {
		kickedGuild = await Guilds.getById(kickedPlayer.guildId);
	}
	catch (error) {
		kickedGuild = null;
	}

	if (kickedGuild === null || kickedGuild.id !== entityInformation.guild.id) {
		// not the same guild
		await replyErrorMessage(
			textInformation.interaction,
			textInformation.language,
			textInformation.guildKickModule.get("notInTheGuild")
		);
		return true;
	}

	if (kickedPlayer.id === entityInformation.player.id) {
		await sendErrorMessage(
			textInformation.interaction.user,
			textInformation.interaction,
			textInformation.language,
			textInformation.guildKickModule.get("excludeHimself")
		);
		return true;
	}
	return false;
}

/**
 * Allow to kick a member from a guild
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param player
 */
async function executeCommand(interaction: CommandInteraction, language: string, player: Player): Promise<void> {
	if (await sendBlockedError(interaction, language)) {
		return;
	}
	const guildKickModule = Translations.getModule("commands.guildKick", language);
	const guild = await Guilds.getById(player.guildId);
	const kickedEntity = await Players.getByOptions(interaction);

	if (await isNotEligible({player, guild}, {interaction, guildKickModule, language}, kickedEntity)) {
		return;
	}

	await new DraftBotValidateReactionMessage(
		interaction.user,
		await getValidationCallback({player, guild}, {interaction, guildKickModule, language})
	)
		.formatAuthor(guildKickModule.get("kickTitle"), interaction.user)
		.setDescription(guildKickModule.format("kick", {
			guildName: guild.name,
			kickedPseudo: kickedEntity.getPseudo(language)
		}))
		.reply(interaction, (collector) => BlockingUtils.blockPlayerWithCollector(player.discordUserId, BlockingConstants.REASONS.GUILD_KICK, collector));
}

const currentCommandFrenchTranslations = Translations.getModule("commands.guildKick", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.guildKick", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations, currentCommandEnglishTranslations)
		.addUserOption(option =>
			SlashCommandBuilderGenerator.generateUserOption(
				currentCommandFrenchTranslations, currentCommandEnglishTranslations, option
			).setRequired(false)
		)
		.addIntegerOption(option =>
			SlashCommandBuilderGenerator.generateRankOption(
				currentCommandFrenchTranslations, currentCommandEnglishTranslations, option
			).setRequired(false)
		) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		disallowEffects: [EffectsConstants.EMOJI_TEXT.BABY, EffectsConstants.EMOJI_TEXT.DEAD],
		guildRequired: true,
		guildPermissions: Constants.GUILD.PERMISSION_LEVEL.CHIEF
	},
	mainGuildCommand: false
};