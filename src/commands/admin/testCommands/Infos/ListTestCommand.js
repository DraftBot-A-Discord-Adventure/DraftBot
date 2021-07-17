import {DraftBotEmbed} from "../../../../core/messages/DraftBotEmbed";

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
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @return {module:"discord.js".MessageEmbed} - The successful message formatted
 */
const listTestCommand = (language, message) => {
	const embedListCommandsTest = new DraftBotEmbed()
		.formatAuthor(message.author.username + ", voici la liste des commandes tests disponibles :", message.author)
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