import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {Constants} from "../../core/Constants";
import {CommandInteraction, Guild} from "discord.js";
import {Translations} from "../../core/Translations";
import {draftBotClient} from "../../core/bot";
import * as fs from "fs";

declare function getValidationInfos(guild: Guild): { validation: string, humans: number, bots: number, ratio: number }

/**
 * Allows an admin to check the server list
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 */
async function executeCommand(interaction: CommandInteraction, language: string): Promise<void> {
	let count = 0;
	let total = 0;
	let result = "";

	function logMapElements(guild: Guild) {
		count++;
		const {validation, humans, bots, ratio} = getValidationInfos(guild);
		total += humans;
		result += Translations.getModule("bot", language).format("serverList", {
			count: count,
			guild: guild,
			humans: humans,
			robots: bots,
			ratio: ratio,
			validation: validation
		}) + "\n";
	}

	draftBotClient.guilds.cache.forEach(logMapElements);
	result += "\n" + Translations.getModule("bot", language).format("totalUsersCount", {count: total});
	if (result.length > 1800) {
		fs.appendFileSync(
			"servers.txt",
			result
		);
		await interaction.reply({files: ["servers.txt"]});
		fs.rmSync("servers.txt");
		return;
	}
	await interaction.reply({content: result});
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("servers")
		.setDescription("Give the full list of all servers where the bot is present (admin only)"),
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