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
import {MissionsController} from "../../core/missions/MissionsController";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {escapeUsername} from "../../core/utils/StringUtils";

type UserInformation = { guild: Guild, entity: Entity };

function getEndCallbackGuildLeave(userInformation : UserInformation, interaction: CommandInteraction, guildLeaveModule: TranslationModule) {
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

			if (userInformation.guild.elderId === entity.Player.id) {
				guild.elderId = null;
			}

			await Promise.all([
				inviter.guild.save(),
				invited.invitedEntity.save(),
				invited.invitedEntity.Player.save()
			]);

			await MissionsController.update(invited.invitedEntity.discordUserId, commandInformations.interaction.channel, commandInformations.language, "joinGuild");
			await MissionsController.update(invited.invitedEntity.discordUserId, commandInformations.interaction.channel, commandInformations.language, "guildLevel", inviter.guild.level, null, true);

			return commandInformations.interaction.followUp({
				embeds: [
					new DraftBotEmbed()
						.setAuthor(
							guildAddModule.format("successTitle", {
								pseudo: escapeUsername(invited.invitedUser.username),
								guildName: inviter.guild.name
							}),
							invited.invitedUser.displayAvatarURL()
						)
						.setDescription(guildAddModule.get("invitationSuccess"))
				]
			});
		}

		// the user chose to stay in the guild or did not respond
		return sendErrorMessage(invited.invitedUser, commandInformations.interaction.channel, commandInformations.language,
			guildAddModule.format("invitationCancelled", {guildName: inviter.guild.name}), true);
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
	const elder = guild.elderId ? await Entities.getById(guild.elderId) : null;

	const endCallback = getEndCallbackGuildLeave(
		{guild, entity},
		{invitedEntity, invitedUser},
		{interaction, language},
		guildLeaveModule
	);

	const validationEmbed = new DraftBotValidateReactionMessage(invitedUser, endCallback)
		.formatAuthor(guildAddModule.get("invitationTitle"), invitedUser)
		.setDescription(guildAddModule.format("invitation", {
			guildName: guild.name
		})) as DraftBotValidateReactionMessage;
	await validationEmbed.reply(interaction, (collector) => BlockingUtils.blockPlayerWithCollector(invitedEntity.discordUserId, "guildAdd", collector));


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