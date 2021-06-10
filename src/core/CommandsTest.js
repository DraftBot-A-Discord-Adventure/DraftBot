const fs = require("fs");

global.typeVariable = {
	INTEGER: {
			type: "number",
			check: (v) => typeof v === typeVariable.INTEGER.type
		},
	MENTION: {
		type: "mention",
		check: (v) => isAMention(v)
	},
	EMOJI: {
			type: "emoji",
			check: (v) => isAnEmoji(v)
		},
	STRING: {
		type: "string",
		check: () => true
	}
};

/**
 * @class
 */
class CommandsTest {
	/**
	 * load all the test commands from source files
	 */
	static init() {
		CommandsTest.testCommandsArray = new Map();
		CommandsTest.aliasesCommandsArray = new Map();

		fs.readdir("src/commands/admin/testCommands", (err, folders) => {
			folders.forEach(folder => {
				const commandsFiles = fs.readdirSync(`src/commands/admin/testCommands/${folder}`).filter(command => command.endsWith(".js"));
				for (const commandFile of commandsFiles) {
					const testCommand = require(`../commands/admin/testCommands/${folder}/${commandFile}`);
					testCommand.infos.category = folder;
					CommandsTest.testCommandsArray.prepare(testCommand);
				}
			});
		});
	}

	static prepare(commandToPrepare) {

		CommandsTest.testCommandsArray.set(commandToPrepare.infos.name, commandToPrepare);

		if (commandToPrepare.infos.aliases !== undefined) {
			commandToPrepare.infos.aliases.forEach(alias => {
				CommandsTest.aliasesCommandsArray.set(alias, commandToPrepare);
			});
		}
	}

	static isGoodFormat(commandTest, args) {
		if (commandTest.infos.typeWaited === undefined) {
			return args.length === 0 ? [true,""] : [
				false,
				":x: | Mauvais format pour la commande :" + commandTest.infos.name + ". Format attendu : `test " + commandTest.infos.name + " " + commandTest.infos.commandFormat + "`"
			];
		}
		const nbArgsWaited = commandTest.infos.typeWaited.length;
		if (nbArgsWaited !== args.length) {
			return [
				false,
				":x: | Mauvais format pour la commande :" + commandTest.infos.name + ". Format attendu : `test " + commandTest.infos.name + " " + commandTest.infos.commandFormat + "`"
			];
		}
		for (let i = 0; i < nbArgsWaited; i++) {
			if (commandTest.infos.typeWaited[i].type !== CommandsTest.getTypeOf(args[i])) {
				return [
					false,
					":x: | Mauvais argument pour la commande :" + commandTest.infos.name + ". \n" +
					"Format attendu : `test " + commandTest.infos.name + " " + commandTest.infos.commandFormat + "`\n" +
					"Format de l'argument " + commandTest.infos.typeWaited.keys()[i] + " : " + commandTest.infos.typeWaited[i]
				];
			}
		}
		return [true,""];
	}

	static async executeAndAlertUser(message, language, commandTestCurrent, args) {
		try {
			const embedTestSuccessful = new discord.MessageEmbed()
				.setAuthor("Commande test `" + commandTestCurrent.infos.name + "` exécuté :", message.author.displayAvatarURL());
			embedTestSuccessful.setDescription(await commandTestCurrent.execute(message, language, args));
			await message.channel.send(embedTestSuccessful);
		}
		catch (e) {
			await message.channel.send(":x: | Une erreur est survenue pendant la commande test : " + commandTestCurrent.infos.name + " : ```" + e + "```");
		}
	}

	static getTypeOf(variable) {
		typeVariable.forEach(typeIn => {
			if (typeIn.check(variable)) {
				return typeIn.type;
			}
		});
		return typeVariable.STRING.type;
	}
}


module.exports = CommandsTest;