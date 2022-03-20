import {DraftBotEmbed} from "../../../../core/messages/DraftBotEmbed";
import {escapeUsername} from "../../../../core/utils/StringUtils";

module.exports.commandInfo = {
	name: "list",
	commandFormat: "",
	messageWhenExecuted: "Voici la liste des commandes tests disponibles :",
	description: "Affiche la liste des commandes tests"
};

const CT = require("../../../../core/CommandsTest");

/**
 * Print the whole test command list, filtered by category
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 */
const listTestCommand = (language, interaction) => {
	const embedListCommandsTest = new DraftBotEmbed()
		.formatAuthor(escapeUsername(interaction.user.username) + ", voici la liste des commandes tests disponibles :", interaction.user)
		.setDescription("Si vous voulez plus d'informations sur une commande test en particulier, écrivez ceci : `test help <command>`")
		.setColor(TEST_EMBED_COLOR.SUCCESSFUL);
	CT.testCommType.forEach(category => {
		const allTestCommInCate = CT.getAllCommandsFromCategory(category);
		let stringForThisCategory = "";
		allTestCommInCate.forEach(testCommand => {
			stringForThisCategory += testCommand.commandInfo.name + " • ";
		});
		embedListCommandsTest.addField(
			"**" + category + "**",
			stringForThisCategory === "" ? "*Pas de commandes dans cette catégorie*" : stringForThisCategory.slice(0, stringForThisCategory.length - 3)
		);
	});
	return embedListCommandsTest;
};

module.exports.execute = listTestCommand;