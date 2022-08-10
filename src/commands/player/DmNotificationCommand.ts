import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Entity} from "../../core/database/game/models/Entity";
import {escapeUsername} from "../../core/utils/StringUtils";
import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";
import {Translations} from "../../core/Translations";
import {Constants} from "../../core/Constants";
import {sendBlockedError} from "../../core/utils/BlockingUtils";

/**
 * Activate or deactivate DMs notifications.
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param entity
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity) {
	if (await sendBlockedError(interaction, language)) {
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
			await sendBlockedError(interaction, language);
		}

	}
	else {
		await interaction.reply({embeds: [dmNotificationEmbed], ephemeral: true});
	}
	// TODO refact la commande "log"
	// log("Player " + interaction.user + " switched dms to " + entity.Player.dmNotification);
	await entity.Player.save();
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("dmnotifications")
		.setDescription("Activates or desactivates the notifications through direct messages"),
	executeCommand,
	requirements: {
		disallowEffects: [Constants.EFFECT.BABY, Constants.EFFECT.DEAD]
	},
	mainGuildCommand: false
};