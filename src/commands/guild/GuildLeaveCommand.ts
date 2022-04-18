import {Entities, Entity} from "../../core/models/Entity";
import Guild, {Guilds} from "../../core/models/Guild";
import {ICommand} from "../ICommand";
import {Constants} from "../../core/Constants";
import {CommandInteraction} from "discord.js";
import {SlashCommandBuilder} from "@discordjs/builders";
import {TranslationModule, Translations} from "../../core/Translations";
import {BlockingUtils, sendBlockedError} from "../../core/utils/BlockingUtils";
import {DraftBotValidateReactionMessage} from "../../core/messages/DraftBotValidateReactionMessage";
import {sendErrorMessage} from "../../core/utils/ErrorUtils";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";

type UserInformation = { guild: Guild, entity: Entity };

function getEndCallbackGuildLeave(userInformation: UserInformation, interaction: CommandInteraction, guildLeaveModule: TranslationModule) {
	return async (msg: DraftBotValidateReactionMessage) => {
		BlockingUtils.unblockPlayer(userInformation.entity.discordUserId);
		if (msg.isValidated()) {
			// the user confirmed the choice to leave
			try {
				userInformation.guild = await Guilds.getById(userInformation.entity.Player.guildId);
			}
			catch (error) {
				userInformation.guild = null;
			}
			if (userInformation.guild === null) {
				// guild is destroyed
				return sendErrorMessage(
					interaction.user,
					interaction.channel,
					guildLeaveModule.language,
					guildLeaveModule.get("guildDestroy")
				);
			}

			if (userInformation.guild.elderId === userInformation.entity.id) {
				userInformation.guild.elderId = null;
			}

			if (userInformation.entity.id === userInformation.guild.chiefId) {
				// the chief of the guild is leaving
				if (userInformation.guild.elderId) {
					// an elder can recover the guild
					// TODO : Refaire le sysème de logs
					// log(elder.discordUserId + " becomes the chief of  " + guild.name);

					userInformation.guild.chiefId = userInformation.guild.elderId;
					userInformation.guild.elderId = null;
					interaction.channel.send({
						content: guildLeaveModule.format("newChiefTitle", {
							guild: userInformation.guild.name
						})
					}
					);
				}
				else {
					// no one can recover the guild.
					// TODO : Refaire le sysème de logs
					// log(guild.name +	" has been destroyed");
					await userInformation.guild.completelyDestroyAndDeleteFromTheDatabase();
				}
			}

			await Promise.all([
				userInformation.guild.save(),
				userInformation.entity.save(),
				userInformation.entity.Player.save()
			]);


			return interaction.followUp({
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
		}

		// the user chose to stay in the guild or did not respond
		return sendErrorMessage(interaction.user, interaction.channel, guildLeaveModule.language,
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

	if (await sendBlockedError(interaction.user, interaction.channel, language, interaction)) {
		return;
	}

	const guildLeaveModule = Translations.getModule("commands.guildLeave", language);
	const guild = await Guilds.getById(entity.Player.guildId);


	const endCallback = getEndCallbackGuildLeave(
		{guild, entity},
		interaction,
		guildLeaveModule
	);

	const validationEmbed = new DraftBotValidateReactionMessage(interaction.user, endCallback)
		.formatAuthor(guildLeaveModule.get("leaveTitle"), interaction.user)
		.setDescription(guildLeaveModule.format("leaveDesc", {
			guildName: guild.name
		})) as DraftBotValidateReactionMessage;
	let elder: Entity;
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
		BlockingUtils.blockPlayerWithCollector(entity.discordUserId, "guildLeave", collector);
		if (elder) {
			BlockingUtils.blockPlayerWithCollector(elder.discordUserId, "chiefGuildLeave", collector);
		}
	});
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("guildleave")
		.setDescription("Leave your guild"),
	executeCommand,
	requirements: {
		disallowEffects: [Constants.EFFECT.BABY, Constants.EFFECT.DEAD],
		guildPermissions: Constants.GUILD.PERMISSION_LEVEL.ELDER,
		guildRequired: true
	},
	mainGuildCommand: false
};