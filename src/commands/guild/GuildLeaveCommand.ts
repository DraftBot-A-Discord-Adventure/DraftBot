import Guild, {Guilds} from "../../core/database/game/models/Guild";
import {ICommand} from "../ICommand";
import {CommandInteraction} from "discord.js";
import {TranslationModule, Translations} from "../../core/Translations";
import {BlockingUtils, sendBlockedError} from "../../core/utils/BlockingUtils";
import {DraftBotValidateReactionMessage} from "../../core/messages/DraftBotValidateReactionMessage";
import {replyErrorMessage, sendErrorMessage} from "../../core/utils/ErrorUtils";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {BlockingConstants} from "../../core/constants/BlockingConstants";
import {draftBotInstance} from "../../core/bot";
import {EffectsConstants} from "../../core/constants/EffectsConstants";
import {Constants} from "../../core/Constants";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {LogsDatabase} from "../../core/database/logs/LogsDatabase";
import Player, {Players} from "../../core/database/game/models/Player";

type UserInformation = { guild: Guild, player: Player };

/**
 * Get the callback for the guild leave command
 * @param userInformation
 * @param interaction
 * @param guildLeaveModule
 */
function getEndCallbackGuildLeave(userInformation: UserInformation, interaction: CommandInteraction, guildLeaveModule: TranslationModule) {
	return async (msg: DraftBotValidateReactionMessage): Promise<void> => {
		BlockingUtils.unblockPlayer(
			userInformation.player.discordUserId,
			userInformation.player.id === userInformation.guild.chiefId && userInformation.guild.elderId
				? BlockingConstants.REASONS.CHIEF_GUILD_LEAVE
				: BlockingConstants.REASONS.GUILD_LEAVE);
		if (msg.isValidated()) {
			// the user confirmed the choice to leave
			try {
				userInformation.guild = await Guilds.getById(userInformation.player.guildId);
			}
			catch (error) {
				userInformation.guild = null;
			}
			if (userInformation.guild === null) {
				// guild was destroyed since the command was launched
				await sendErrorMessage(
					interaction.user,
					interaction,
					guildLeaveModule.language,
					guildLeaveModule.get("guildDestroy")
				);
				return;
			}

			if (userInformation.guild.elderId === userInformation.player.id) {
				// the elder of the guild is leaving
				await draftBotInstance.logsDatabase.logGuildElderRemove(userInformation.guild, userInformation.guild.elderId);
				userInformation.guild.elderId = null;
			}

			if (userInformation.player.id === userInformation.guild.chiefId) {
				// the chief of the guild is leaving
				if (userInformation.guild.elderId) {
					// an elder can recover the guild

					await draftBotInstance.logsDatabase.logGuildChiefChange(userInformation.guild, userInformation.guild.elderId);
					userInformation.guild.chiefId = userInformation.guild.elderId;
					await draftBotInstance.logsDatabase.logGuildElderRemove(userInformation.guild, userInformation.guild.elderId);
					userInformation.guild.elderId = null;
					interaction.channel.send({
						content: guildLeaveModule.format("newChiefTitle", {
							guild: userInformation.guild.name
						})
					});
				}
				else {
					// no one can recover the guild.
					await userInformation.guild.completelyDestroyAndDeleteFromTheDatabase();
				}
			}

			LogsDatabase.logGuildLeave(userInformation.guild, userInformation.player.discordUserId).then();

			userInformation.player.guildId = null;

			await Promise.all([
				userInformation.guild.save(),
				userInformation.player.save()
			]);


			await interaction.followUp({
				embeds: [
					new DraftBotEmbed()
						.setAuthor({
							name: guildLeaveModule.format("successTitle", {
								pseudo: userInformation.player.getPseudo(guildLeaveModule.language),
								guildName: userInformation.guild.name
							}),
							iconURL: interaction.user.displayAvatarURL()
						})
						.setDescription(guildLeaveModule.get("leavingSuccess"))
				]
			});
			return;
		}

		// the user chose to stay in the guild or did not respond
		await sendErrorMessage(interaction.user, interaction, guildLeaveModule.language,
			guildLeaveModule.get("leavingCancelled"), true);
	};
}

/**
 * Allow to leave its guild
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param player
 */
async function executeCommand(interaction: CommandInteraction, language: string, player: Player): Promise<void> {

	if (await sendBlockedError(interaction, language)) {
		return;
	}

	const guildLeaveModule = Translations.getModule("commands.guildLeave", language);
	const guild = await Guilds.getById(player.guildId);

	if (guild === null) {
		await replyErrorMessage(
			interaction,
			language,
			Translations.getModule("bot", language).get("notInAGuild")
		);
		return;
	}

	const endCallback = getEndCallbackGuildLeave(
		{guild, player},
		interaction,
		guildLeaveModule
	);

	const validationEmbed = new DraftBotValidateReactionMessage(interaction.user, endCallback)
		.formatAuthor(guildLeaveModule.get("leaveTitle"), interaction.user)
		.setDescription(guildLeaveModule.format("leaveDesc", {
			guildName: guild.name
		}));
	let elder: Player = null;
	if (player.id === guild.chiefId) {
		if (guild.elderId) {
			elder = await Players.getById(guild.elderId);
			validationEmbed.setDescription(guildLeaveModule.format("leaveChiefDescWithElder", {
				guildName: guild.name,
				elderName: elder.getPseudo(language)
			}));
		}
		else {
			validationEmbed.setDescription(guildLeaveModule.format("leaveChiefDesc", {
				guildName: guild.name
			}));
		}
	}

	await validationEmbed.reply(interaction, (collector) => {
		if (elder && player.id === guild.chiefId) {
			BlockingUtils.blockPlayerWithCollector(elder.discordUserId, BlockingConstants.REASONS.CHIEF_GUILD_LEAVE, collector);
			return;
		}
		BlockingUtils.blockPlayerWithCollector(player.discordUserId, BlockingConstants.REASONS.GUILD_LEAVE, collector);
	});
}

const currentCommandFrenchTranslations = Translations.getModule("commands.guildLeave", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.guildLeave", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations, currentCommandEnglishTranslations),
	executeCommand,
	requirements: {
		disallowEffects: [EffectsConstants.EMOJI_TEXT.BABY, EffectsConstants.EMOJI_TEXT.DEAD],
		guildRequired: true
	},
	mainGuildCommand: false
};