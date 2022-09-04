import {DraftBotEmbed} from "../../../../core/messages/DraftBotEmbed";
import {escapeUsername} from "../../../../core/utils/StringUtils";
import {CommandInteraction} from "discord.js";
import {Constants} from "../../../../core/Constants";
import {CommandsTest, ITestCommand} from "../../../../core/CommandsTest";

export const commandInfo: ITestCommand = {
	name: "list",
	commandFormat: "",
	messageWhenExecuted: "Voici la liste des commandes tests disponibles :",
	description: "Affiche la liste des commandes tests",
	commandTestShouldReply: true,
	execute: null // defined later
};

/**
 * Print the whole test command list, filtered by category
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 */
const listTestCommand = (language: string, interaction: CommandInteraction): Promise<DraftBotEmbed> => {
	const embedListCommandsTest = new DraftBotEmbed()
		.formatAuthor(`${escapeUsername(interaction.user.username)}, voici la liste des commandes tests disponibles :`, interaction.user)
		.setDescription("Si vous voulez plus d'informations sur une commande test en particulier, écrivez ceci : `test help <command>`")
		.setColor(Constants.TEST_EMBED_COLOR.SUCCESSFUL);
	CommandsTest.testCommType.forEach(category => {
		const allTestCommInCate = CommandsTest.getAllCommandsFromCategory(category);
		let stringForThisCategory = "";
		allTestCommInCate.forEach(testCommand => {
			stringForThisCategory += `${testCommand.name} • `;
		});
		embedListCommandsTest.addFields({
			name: `**${category}**`,
			value: stringForThisCategory === "" ? "*Pas de commandes dans cette catégorie*" : stringForThisCategory.slice(0, stringForThisCategory.length - 3)
		});
	});
	return Promise.resolve(embedListCommandsTest);
};

commandInfo.execute = listTestCommand;