import {Entities} from "../../core/models/Entity";
import {BlockingUtils} from "../../core/utils/BlockingUtils";
import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {Constants} from "../../core/Constants";
import {CommandInteraction} from "discord.js";
import {draftBotClient} from "../../core/bot";
import {Translations} from "../../core/Translations";
import {sendDirectMessage} from "../../core/utils/MessageUtils";

/**
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 */
async function executeCommand(interaction: CommandInteraction, language: string): Promise<void> {
	const idToUnblock = interaction.options.getString("discordid");
	if (await Entities.getByDiscordUserId(idToUnblock) === null) {
		await interaction.reply({content: "Id unrecognized (is it a message id ?)", ephemeral: true});
		return;
	}
	const blockingReason = await BlockingUtils.getPlayerBlockingReason(idToUnblock);
	if (blockingReason === []) {
		await interaction.reply({content: "Not blocked", ephemeral: true});
		return;
	}
	const unblockModule = Translations.getModule("commands.unblock", language);
	blockingReason.forEach(reason => BlockingUtils.unblockPlayer(idToUnblock, reason));
	await interaction.reply({content: "Unblocked with success", ephemeral: true});
	const user = await draftBotClient.users.fetch(idToUnblock);
	const [entity] = await Entities.getOrRegister(idToUnblock);
	if (entity.Player.dmNotification) {
		sendDirectMessage(
			user,
			unblockModule.get("title"),
			unblockModule.get("description"),
			null, // Data.getModule("bot").getString("embed.default"),
			language
		);
	}


}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("unblock")
		.setDescription("Unblock a given player (admin only)")
		.addStringOption(option => option.setName("discordid")
			.setDescription("The discord id of the blocked user")
			.setRequired(true)) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		userPermission: Constants.ROLES.USER.BOT_OWNER
	},
	mainGuildCommand: true
};