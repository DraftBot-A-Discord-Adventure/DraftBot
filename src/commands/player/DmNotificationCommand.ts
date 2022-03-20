import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Entity} from "../../core/models/Entity";
import {escapeUsername} from "../../core/utils/StringUtils";
import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction, TextChannel, User} from "discord.js";
import {Translations} from "../../core/Translations";
import {Constants} from "../../core/Constants";
import {CommandRegisterPriority} from "../CommandRegisterPriority";

declare function sendBlockedError(user: User, channel: TextChannel, language: string): Promise<boolean>;

declare function sendErrorMessage(user: User, channel: TextChannel, language: string, reason: string, isCancelling?: boolean, interaction?: CommandInteraction): Promise<void>;

/**
 * Activate or desactivate DMs notifications.
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param entity
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity) {
	if (await sendBlockedError(interaction.user, <TextChannel>interaction.channel, language)) {
		return;
	}
	const translationsDmn = Translations.getModule("commands.dmNotification", language);
	// update value user dmNotification
	entity.Player.dmNotification = !entity.Player.dmNotification;
	const isDmNotificationOn = entity.Player.dmNotification;
	// send message updated value
	const dmNotificationEmbed = new DraftBotEmbed()
		.setDescription(
			translationsDmn.format("normal", {
				pseudo: escapeUsername(interaction.user.username),
				notifOnVerif: isDmNotificationOn ? translationsDmn.get("open") : translationsDmn.get("closed")
			})
		)
		.formatAuthor(translationsDmn.get("title"), interaction.user);
	if (isDmNotificationOn) {
		try {
			await interaction.user.send({embeds: [dmNotificationEmbed]});
			await interaction.reply({embeds: [dmNotificationEmbed], ephemeral: true});
		}
		catch (err) {
			entity.Player.dmNotification = false;
			await sendErrorMessage(
				interaction.user,
				<TextChannel>interaction.channel,
				language,
				translationsDmn.get("error"),
				false,
				interaction
			);
		}

	}
	else {
		await interaction.reply({embeds: [dmNotificationEmbed], ephemeral: true});
	}
	// TODO refact la commande "log"
	console.log("Player " + interaction.user + " switched dms to " + entity.Player.dmNotification);
	await entity.Player.save();
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("dmnotifications")
		.setDescription("Activates or desactivates the notifications through direct messages"),
	executeCommand,
	requirements: {
		allowEffects: null,
		requiredLevel: null,
		disallowEffects: [Constants.EFFECT.BABY, Constants.EFFECT.DEAD],
		guildPermissions: null,
		guildRequired: null,
		userPermission: null
	},
	mainGuildCommand: false,
	slashCommandPermissions: null,
	registerPriority: CommandRegisterPriority.LOWEST
};