import {CommandInteraction, HexColorString} from "discord.js";
import {DraftBotEmbed} from "./messages/DraftBotEmbed";
import {Constants} from "./Constants";
import {DraftBotErrorEmbed} from "./messages/DraftBotErrorEmbed";

const {readdir} = require("fs/promises");
const {readdirSync} = require("fs");
const {Collection} = require("discord.js");

declare function isAMention(v: any): boolean;

declare function isAnEmoji(v: any): boolean;

const typeVariableChecks = [
	{
		name: "INTEGER",
		type: "number",
		check: (v: string) => !isNaN(parseInt(v, 10))
	},
	{
		name: "MENTION",
		type: "mention",
		check: (v: string) => isAMention(v)
	},
	{
		name: "EMOJI",
		type: "emoji",
		check: (v: string) => isAnEmoji(v)
	},
	{
		name: "STRING",
		type: "string",
		check: () => false
	}
];

/**
 * @class
 */
export class CommandsTest {
	static testCommandsArray: any;

	static testCommType: string[];

	/**
	 * load all the test commands from source files
	 */
	static async init() {
		CommandsTest.testCommandsArray = new Collection();
		CommandsTest.testCommType = await readdir("src/commands/admin/testCommands");
		CommandsTest.testCommType.forEach(type => {
			const commandsFiles = readdirSync(`src/commands/admin/testCommands/${type}`).filter((command: string) => command.endsWith(".js"));
			for (const commandFile of commandsFiles) {
				const testCommand = require(`../commands/admin/testCommands/${type}/${commandFile}`);
				testCommand.commandInfo.category = type;
				CommandsTest.testCommandsArray.set(testCommand.commandInfo.name, testCommand);
			}
		});
	}

	/**
	 * Say if the given args are the args awaited for the given command
	 * @param commandTest - The command to test
	 * @param {any[]} args - The args given to the test
	 * @param interaction
	 * @return [Boolean,String] - if the test is successful or not, and if not, the reason why
	 */
	static isGoodFormat(
		commandTest: { commandInfo: { typeWaited: { [x: string]: { type: string; }; }; name: string; commandFormat: string; }; },
		args: string | string[],
		interaction: CommandInteraction): [boolean, string | DraftBotEmbed] {
		if (commandTest.commandInfo.typeWaited === undefined) {
			return args.length === 0 ? [true, ""] : [
				false,
				new DraftBotErrorEmbed(interaction.user,
					interaction,
					Constants.LANGUAGE.FRENCH,
					"❌ Mauvais format pour la commande test " + commandTest.commandInfo.name + "\n\n**Format attendu :** `test " + commandTest.commandInfo.name + "`")
			];
		}
		const commandTypeKeys = Object.keys(commandTest.commandInfo.typeWaited);
		const nbArgsWaited = commandTypeKeys.length;
		if (nbArgsWaited !== args.length) {
			return [
				false,
				new DraftBotErrorEmbed(interaction.user,
					interaction,
					Constants.LANGUAGE.FRENCH,
					"❌ Mauvais format pour la commande test " + commandTest.commandInfo.name +
					"\n\n**Format attendu :** `test " + commandTest.commandInfo.name + " " + commandTest.commandInfo.commandFormat + "`")
			];
		}
		for (let i = 0; i < nbArgsWaited; i++) {
			if (commandTest.commandInfo.typeWaited[commandTypeKeys[i]].type !== CommandsTest.getTypeOf(args[i])) {
				return [
					false,
					new DraftBotErrorEmbed(interaction.user,
						interaction,
						Constants.LANGUAGE.FRENCH,
						"❌ Mauvais argument pour la commande test " + commandTest.commandInfo.name +
						"\n\n**Format attendu** : `test " + commandTest.commandInfo.name + " " + commandTest.commandInfo.commandFormat + "`\n" +
						"**Format de l'argument** `<" + commandTypeKeys[i] + ">` : " + commandTest.commandInfo.typeWaited[commandTypeKeys[i]].type + "\n" +
						"**Format reçu** : " + CommandsTest.getTypeOf(args[i]))
				];
			}
		}
		return [true, ""];
	}

	/**
	 * Execute the test command, and alert the user about its success or its failure
	 * @param {("fr"|"en")} language - Language to use in the response
	 * @param interaction
	 * @param commandTestCurrent - the executed test command
	 * @param {any[]} args - Additional arguments sent with the test command
	 */
	static async executeAndAlertUser(
		language: string,
		interaction: CommandInteraction,
		commandTestCurrent: { execute: (arg0: any, arg1: any, arg2: any) => any; commandInfo: { name: string; commandTestShouldReply: boolean; }; },
		args: string | string[]) {
		try {

			const messageToDisplay = await commandTestCurrent.execute(language, interaction, args);
			if (!messageToDisplay || messageToDisplay === "") {
				return;
			}
			let embedTestSuccessful;
			if (typeof messageToDisplay === "string") {
				embedTestSuccessful = new DraftBotEmbed()
					.setAuthor("Commande test " + commandTestCurrent.commandInfo.name + " exécutée :", interaction.user.displayAvatarURL())
					.setDescription(messageToDisplay)
					.setColor(<HexColorString>Constants.MESSAGES.COLORS.SUCCESSFUL);
			}
			else {
				embedTestSuccessful = messageToDisplay;
			}
			if (commandTestCurrent.commandInfo.commandTestShouldReply) {
				await interaction.reply({embeds: [embedTestSuccessful]});
			}
			else {
				await interaction.channel.send({embeds: [embedTestSuccessful]});
			}
		}
		catch (e) {
			console.error(e);
			try {
				await interaction.reply({content: "**:x: Une erreur est survenue pendant la commande test " + commandTestCurrent.commandInfo.name + "** : ```" + e.stack + "```"});
			}
			catch (e2) {
				await interaction.reply({
					content:
						"**:x: Une erreur est survenue pendant la commande test "
						+ commandTestCurrent.commandInfo.name
						+ "** : (Erreur tronquée car limite de caractères atteinte) " +
						"```" + e.stack.slice(0, 1850) + "```"
				});
			}
		}
	}

	static getTypeOf(variable: any): string {
		const typeKeys: string[] = [];
		typeVariableChecks.forEach(value => typeKeys.push(value.name));
		for (const typeIn of typeKeys) {
			if (typeVariableChecks.find(value => value.name === typeIn)) {
				if (typeVariableChecks.find(value => value.name === typeIn).check(variable)) {
					return typeVariableChecks.find(value => value.name === typeIn).type;
				}
			}
		}
		return typeVariableChecks.find(value => value.name === "STRING").type;
	}

	static getTestCommand(commandName: string) {
		const commandTestCurrent = CommandsTest.testCommandsArray.get(commandName)
			|| CommandsTest.testCommandsArray.find((cmd: { commandInfo: { aliases: string | string[]; }; }) => cmd.commandInfo.aliases && cmd.commandInfo.aliases.includes(commandName));
		if (commandTestCurrent === undefined) {
			throw new Error("Commande Test non définie : " + commandName);
		}
		return commandTestCurrent;
	}

	static getAllCommandsFromCategory(category: string) {
		const tabCommandReturn: any[] = [];
		CommandsTest.testCommandsArray.forEach((command: { commandInfo: { category: string; }; }) => {
			if (command.commandInfo.category === category) {
				tabCommandReturn.push(command);
			}
		});
		return tabCommandReturn;
	}
}


module.exports = CommandsTest;
