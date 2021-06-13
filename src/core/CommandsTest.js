const {readdir} = require("fs/promises");
const {readdirSync} = require("fs");

const {Collection} = require("discord.js");

global.typeVariable = {
	INTEGER: {
		type: "number",
		check: (v) => !isNaN(v)
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
		check: () => false
	}
};

/**
 * @class
 */
class CommandsTest {
	/**
	 * load all the test commands from source files
	 */
	static async init() {
		CommandsTest.testCommandsArray = new Collection();
		CommandsTest.testCommType = await readdir("src/commands/admin/testCommands");
		CommandsTest.testCommType.forEach(type => {
			const commandsFiles = readdirSync(`src/commands/admin/testCommands/${type}`).filter(command => command.endsWith(".js"));
			for (const commandFile of commandsFiles) {
				const testCommand = require(`../commands/admin/testCommands/${type}/${commandFile}`);
				testCommand.infos.category = type;
				CommandsTest.testCommandsArray.set(testCommand.infos.name, testCommand);
			}
		});
	}

	/**
	 * Say if the given args are the args awaited for the given command
	 * @param commandTest - The command to test
	 * @param {any[]} args - The args given to the test
	 * @return [Boolean,String] - if the test is successful or not, and if not, the reason why
	 */
	static isGoodFormat(commandTest, args, message) {
		if (commandTest.infos.typeWaited === undefined) {
			return args.length === 0 ? [true, ""] : [
				false,
				new discord.MessageEmbed()
					.setAuthor("❌ Mauvais format pour la commande test " + commandTest.infos.name, message.author.displayAvatarURL())
					.setDescription(
						"**Format attendu :** `test " + commandTest.infos.name + "`"
					)
					.setColor(TEST_EMBED_COLOR.ERROR)
			];
		}
		const commandTypeKeys = Object.keys(commandTest.infos.typeWaited);
		const nbArgsWaited = commandTypeKeys.length;
		if (nbArgsWaited !== args.length) {
			return [
				false,
				new discord.MessageEmbed()
					.setAuthor("❌ Mauvais format pour la commande test " + commandTest.infos.name, message.author.displayAvatarURL())
					.setDescription(
						"**Format attendu :** `test " + commandTest.infos.name + " " + commandTest.infos.commandFormat + "`"
					)
					.setColor(TEST_EMBED_COLOR.ERROR)
			];
		}
		for (let i = 0; i < nbArgsWaited; i++) {
			if (commandTest.infos.typeWaited[commandTypeKeys[i]].type !== CommandsTest.getTypeOf(args[i])) {
				return [
					false,
					new discord.MessageEmbed()
						.setAuthor("❌ Mauvais argument pour la commande test " + commandTest.infos.name, message.author.displayAvatarURL())
						.setDescription(
							"**Format attendu** : `test " + commandTest.infos.name + " " + commandTest.infos.commandFormat + "`\n" +
							"**Format de l'argument** `<" + commandTypeKeys[i] + ">` : " + commandTest.infos.typeWaited[commandTypeKeys[i]].type + "\n" +
							"**Format reçu** : " + CommandsTest.getTypeOf(args[i])
						)
						.setColor(TEST_EMBED_COLOR.ERROR)
				];
			}
		}
		return [true, ""];
	}

	/**
	 * Execute the test command, and alert the user about its success or its failure
	 * @param {("fr"|"en")} language - Language to use in the response
	 * @param {module:"discord.js".Message} message - Message from the discord server
	 * @param commandTestCurrent - the executed test command
	 * @param {any[]} args - Additional arguments sent with the test command
	 */
	static async executeAndAlertUser(language, message, commandTestCurrent, args) {
		try {

			const messageToDisplay = await commandTestCurrent.execute(language, message, args);
			let embedTestSuccessful;
			if (typeof messageToDisplay === "string") {
				embedTestSuccessful = new discord.MessageEmbed()
					.setAuthor("Commande test " + commandTestCurrent.infos.name + " exécutée :", message.author.displayAvatarURL())
					.setDescription(messageToDisplay)
					.setColor(TEST_EMBED_COLOR.SUCCESSFUL);
			}
			else {
				embedTestSuccessful = messageToDisplay;
			}
			await message.channel.send(embedTestSuccessful);
		}
		catch (e) {
			console.error(e);
			await message.channel.send("**:x: Une erreur est survenue pendant la commande test " + commandTestCurrent.infos.name + "** : ```" + e.stack + "```");
		}
	}

	static getTypeOf(variable) {
		const typeKeys = Object.keys(typeVariable);
		for (const typeIn of typeKeys) {
			if (typeVariable[typeIn].check(variable)) {
				return typeVariable[typeIn].type;
			}
		}
		return typeVariable.STRING.type;
	}

	static getTestCommand(commandName) {
		const commandTestCurrent = CommandsTest.testCommandsArray.get(commandName)
			|| CommandsTest.testCommandsArray.find(cmd => cmd.infos.aliases && cmd.infos.aliases.includes(commandName));
		if (commandTestCurrent === undefined) {
			throw new Error("Commande Test non définie : " + commandName);
		}
		return commandTestCurrent;
	}

	static getAllCommandsFromCategory(category) {
		const tabCommandReturn = [];
		CommandsTest.testCommandsArray.forEach(command => {
			if (command.infos.category === category) {
				tabCommandReturn.push(command);
			}
		});
		return tabCommandReturn;
	}
}


module.exports = CommandsTest;