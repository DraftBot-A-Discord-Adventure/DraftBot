import {Entities, Entity} from "../../core/database/game/models/Entity";
import Guild, {Guilds} from "../../core/database/game/models/Guild";
import {ICommand} from "../ICommand";
import {Constants} from "../../core/Constants";
import {CommandInteraction} from "discord.js";
import {SlashCommandBuilder} from "@discordjs/builders";
import {TranslationModule, Translations} from "../../core/Translations";
import {BlockingUtils, sendBlockedError} from "../../core/utils/BlockingUtils";
import {DraftBotValidateReactionMessage} from "../../core/messages/DraftBotValidateReactionMessage";
import {replyErrorMessage, sendErrorMessage} from "../../core/utils/ErrorUtils";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {BlockingConstants} from "../../core/constants/BlockingConstants";
import {draftBotInstance} from "../../core/bot";

type UserInformation = { guild: Guild, entity: Entity };

function getEndCallbackGuildLeave(userInformation: UserInformation, interaction: CommandInteraction, guildLeaveModule: TranslationModule) {
	return async (msg: DraftBotValidateReactionMessage) => {
		BlockingUtils.unblockPlayer(
			userInformation.entity.discordUserId,
			userInformation.entity.id === userInformation.guild.chiefId && userInformation.guild.elderId
				? BlockingConstants.REASONS.CHIEF_GUILD_LEAVE
				: BlockingConstants.REASONS.GUILD_LEAVE);
		if (msg.isValidated()) {
			// the user confirmed the choice to leave
			try {
				userInformation.guild = await Guilds.getById(userInformation.entity.Player.guildId);
			}
			catch (error) {
				userInformation.guild = null;
			}
			if (userInformation.guild === null) {
				// guild was destroyed since the command was launched
				sendErrorMessage(
					interaction.user,
					interaction,
					guildLeaveModule.language,
					guildLeaveModule.get("guildDestroy")
				);
				return;
			}

			if (userInformation.guild.elderId === userInformation.entity.id) {
				// the elder of the guild is leaving
				draftBotInstance.logsDatabase.logGuildElderRemove(userInformation.guild, userInformation.guild.elderId).then();
				userInformation.guild.elderId = null;
			}

			if (userInformation.entity.id === userInformation.guild.chiefId) {
				// the chief of the guild is leaving
				if (userInformation.guild.elderId) {
					// an elder can recover the guild

					draftBotInstance.logsDatabase.logGuildChiefChange(userInformation.guild, userInformation.guild.elderId).then();
					userInformation.guild.chiefId = userInformation.guild.elderId;
					draftBotInstance.logsDatabase.logGuildElderRemove(userInformation.guild, userInformation.guild.elderId).then();
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

			draftBotInstance.logsDatabase.logGuildLeave(userInformation.guild, userInformation.entity.discordUserId).then();

			userInformation.entity.Player.guildId = null;

			await Promise.all([
				userInformation.guild.save(),
				userInformation.entity.save(),
				userInformation.entity.Player.save()
			]);


			interaction.followUp({
				embeds: [
					new DraftBotEmbed()
						.setAuthor(
							guildLeaveModule.format("successTitle", {
								pseudo: await userInformation.entity.Player.getPseudo(guildLeaveModule.language),
								guildName: userInformation.guild.name
							}),
							interaction.user.displayAvatarURL()
						)
						.setDescription(guildLeaveModule.get("leavingSuccess"))
				]
			});
			return;
		}

		// the user chose to stay in the guild or did not respond
		sendErrorMessage(interaction.user, interaction, guildLeaveModule.language,
			guildLeaveModule.get("leavingCancelled"), true);
	};
}

/**
 * Allow to leave its guild
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param entity
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity): Promise<void> {

	if (await sendBlockedError(interaction, language)) {
		return;
	}

	const guildLeaveModule = Translations.getModule("commands.guildLeave", language);
	const guild = await Guilds.getById(entity.Player.guildId);

	if (guild === null) {
		replyErrorMessage(
			interaction,
			language,
			guildLeaveModule.get("notInAGuild")
		);
		return;
	}

	const endCallback = getEndCallbackGuildLeave(
		{guild, entity},
		interaction,
		guildLeaveModule
	);

	const validationEmbed = new DraftBotValidateReactionMessage(interaction.user, endCallback)
		.formatAuthor(guildLeaveModule.get("leaveTitle"), interaction.user)
		.setDescription(guildLeaveModule.format("leaveDesc", {
			guildName: guild.name
		}));
	let elder: Entity = null;
	if (entity.id === guild.chiefId) {
		elder = await Entities.getById(guild.elderId);
		if (elder) {
			validationEmbed.setDescription(guildLeaveModule.format("leaveChiefDescWithElder", {
				guildName: guild.name,
				elderName: await elder.Player.getPseudo(language)
			}));
		}
		else {
			validationEmbed.setDescription(guildLeaveModule.format("leaveChiefDesc", {
				guildName: guild.name
			}));
		}
	}

	await validationEmbed.reply(interaction, (collector) => {
		if (elder && entity.id === guild.chiefId) {
			BlockingUtils.blockPlayerWithCollector(elder.discordUserId, BlockingConstants.REASONS.CHIEF_GUILD_LEAVE, collector);
			return;
		}
		BlockingUtils.blockPlayerWithCollector(entity.discordUserId, BlockingConstants.REASONS.GUILD_LEAVE, collector);
	});
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("guildleave")
		.setDescription("Leave your guild"),
	executeCommand,
	requirements: {
		disallowEffects: [Constants.EFFECT.BABY, Constants.EFFECT.DEAD],
		guildRequired: true
	},
	mainGuildCommand: false
};