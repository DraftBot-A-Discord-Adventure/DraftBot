module.exports.help = {
	name: "help",
	aliases: ["h"],
	commandFormat: "<command>",
	typeWaited: {
		command: typeVariable.STRING
	},
	messageWhenExecuted: "",
	description: "Affiche l'aide pour une commande"
};

const CT = require("../../../../core/CommandsTest");

/**
 * Help the player about one given test command
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {module:"discord.js".MessageEmbed} - The successful message formatted
 */
const help = async (language, message, args) => {
	let helpOnCommand;
	try {
		helpOnCommand = await CT.getTestCommand(args[0]);
	}
	catch (e) {
		throw new Error("Commande inexistante : " + args[0]);
	}
	const embedHelpTest = new discord.MessageEmbed()
		.setAuthor("Commande test : " + helpOnCommand.infos.name, message.author.displayAvatarURL())
		.addFields(
			{
				name: "Description",
				value: helpOnCommand.infos.description
			},
			{
				name: "Utilisation",
				value: "`test " + helpOnCommand.infos.name + (helpOnCommand.infos.commandFormat === "" ? "" : " " + helpOnCommand.infos.commandFormat) + "`"
			}
		)
		.setColor(TEST_EMBED_COLOR.SUCCESSFUL);
	if (helpOnCommand.infos.typeWaited !== undefined) {
		if (Object.keys(helpOnCommand.infos.typeWaited).length !== 0) {
			let reqArgs = "";
			Object.keys(helpOnCommand.infos.typeWaited).forEach(arg => {
				reqArgs += "\n - `<" + arg + ">` : " + helpOnCommand.infos.typeWaited[arg].type;
			});
			embedHelpTest.addField(Object.keys(helpOnCommand.infos.typeWaited).length === 1 ? "Argument attendu : " : "Arguments attendus : ", reqArgs);
		}
	}
	if (helpOnCommand.infos.aliases !== undefined) {
		if (helpOnCommand.infos.aliases.length !== 0) {
			let aliases = "";
			helpOnCommand.infos.aliases.forEach(alias => {
				aliases += "`" + alias + "`, ";
			});
			embedHelpTest.addField("Alias : ", aliases.slice(0, aliases.length - 2));
		}
	}
	return embedHelpTest;
};

module.exports.execute = help;