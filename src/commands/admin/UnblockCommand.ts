import {Entities} from "../../core/models/Entity";
import {BlockingUtils} from "../../core/utils/BlockingUtils";
import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {Constants} from "../../core/Constants";
import {CommandInteraction, User} from "discord.js";
import {draftBotClient} from "../../core/bot";
import {Translations} from "../../core/Translations";

declare function sendDirectMessage(user: User, title: string, description: string, color: string, language: string): void;

/**
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 */
async function executeCommand(interaction: CommandInteraction, language: string): Promise<void> {
	const idToUnblock = interaction.options.getInteger("discordId", true).toString(10);
	if (await Entities.getByDiscordUserId(idToUnblock) === null) {
		await interaction.reply({content: "Id unrecognized (is it a message id ?)", ephemeral: true});
		return;
	}
	if (await BlockingUtils.getPlayerBlockingReason(idToUnblock) === null) {
		await interaction.reply({content: "Not blocked", ephemeral: true});
		return;
	}
	const unblockModule = Translations.getModule("commands.unblock", language);
	BlockingUtils.unblockPlayer(idToUnblock);
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
		.addNumberOption(option => option.setName("discordId")
			.setDescription("The discord id of the blocked user")
			.setRequired(true)) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		allowEffects: null,
		requiredLevel: null,
		disallowEffects: null,
		guildPermissions: null,
		guildRequired: null,
		userPermission: Constants.ROLES.USER.BOT_OWNER
	},
	mainGuildCommand: true,
	slashCommandPermissions: null
};