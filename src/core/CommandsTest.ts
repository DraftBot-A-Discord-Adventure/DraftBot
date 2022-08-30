import {CommandInteraction, HexColorString} from "discord.js";
import {DraftBotEmbed} from "./messages/DraftBotEmbed";
import {Constants} from "./Constants";
import {DraftBotErrorEmbed} from "./messages/DraftBotErrorEmbed";
import {isAMention, isAnEmoji} from "./utils/StringUtils";

const {readdir} = require("fs/promises");
const {readdirSync} = require("fs");

const typeVariableChecks = [
	{
		name: "INTEGER",
		type: "number",
		check: (v: string): boolean => !isNaN(parseInt(v, 10))
	},
	{
		name: "MENTION",
		type: "mention",
		check: (v: string): boolean => isAMention(v)
	},
	{
		name: "EMOJI",
		type: "emoji",
		check: (v: string): boolean => isAnEmoji(v)
	},
	{
		name: "STRING",
		type: "string",
		check: (): boolean => false
	}
];

export interface ITestCommand {
	name: string,
	aliases?: string[],
	commandFormat: string,
	typeWaited?: { [argName: string]: { type: string, check: (v: string | number) => boolean } }
	messageWhenExecuted?: string,
	description: string,
	commandTestShouldReply: boolean,
	execute: (language: string, interaction: CommandInteraction, args: string[]) => Promise<string | DraftBotEmbed>,
	category?: string
}

/**
 * @class
 */
export class CommandsTest {
	static testCommandsArray: { [commandName: string]: ITestCommand };

	static testCommType: string[];

	/**
	 * load all the test commands from source files
	 */
	static async init(): Promise<void> {
		CommandsTest.testCommandsArray = {};
		CommandsTest.testCommType = await readdir("dist/src/commands/admin/testCommands");
		for (const type of CommandsTest.testCommType) {
			const commandsFiles = readdirSync(`dist/src/commands/admin/testCommands/${type}`).filter((command: string) => command.endsWith(".js"));
			for (const commandFile of commandsFiles) {
				const testCommand: ITestCommand = (await import(`../commands/admin/testCommands/${type}/${commandFile}`)).commandInfo;
				testCommand.category = type;
				CommandsTest.testCommandsArray[testCommand.name.toLowerCase()] = testCommand;
				if (testCommand.aliases) {
					for (const alias of testCommand.aliases) {
						this.testCommandsArray[alias.toLowerCase()] = testCommand;
					}
				}
			}
		}
	}

	/**
	 * Say if the given args are the args awaited for the given command
	 * @param commandTest - The command to test
	 * @param {string[]} args - The args given to the test
	 * @param interaction
	 * @return [Boolean,String] - if the test is successful or not, and if not, the reason why
	 */
	static isGoodFormat(
		commandTest: ITestCommand,
		args: string[],
		interaction: CommandInteraction): [boolean, DraftBotEmbed] {
		if (commandTest.typeWaited === undefined) {
			return args.length === 0 ? [true, new DraftBotEmbed()] : [
				false,
				new DraftBotErrorEmbed(interaction.user,
					interaction,
					Constants.LANGUAGE.FRENCH,
					`❌ Mauvais format pour la commande test ${commandTest.name}\n\n**Format attendu :** \`test ${commandTest.name}\``)
			];
		}
		const commandTypeKeys = Object.keys(commandTest.typeWaited);
		const nbArgsWaited = commandTypeKeys.length;
		if (nbArgsWaited !== args.length) {
			return [
				false,
				new DraftBotErrorEmbed(interaction.user,
					interaction,
					Constants.LANGUAGE.FRENCH,
					`❌ Mauvais format pour la commande test ${commandTest.name}\n\n**Format attendu :** \`test ${commandTest.name} ${commandTest.commandFormat}\``)
			];
		}
		for (let i = 0; i < nbArgsWaited; i++) {
			if (commandTest.typeWaited[commandTypeKeys[i]].type !== CommandsTest.getTypeOf(args[i])) {
				return [
					false,
					new DraftBotErrorEmbed(interaction.user,
						interaction,
						Constants.LANGUAGE.FRENCH,
						`❌ Mauvais argument pour la commande test ${commandTest.name}

**Format attendu** : \`test ${commandTest.name} ${commandTest.commandFormat}\`
**Format de l'argument** \`<${commandTypeKeys[i]}>\` : ${commandTest.typeWaited[commandTypeKeys[i]].type}
**Format reçu** : ${CommandsTest.getTypeOf(args[i])}`)
				];
			}
		}
		return [true, new DraftBotEmbed()];
	}

	/**
	 * Execute the test command, and alert the user about its success or its failure
	 * @param {("fr"|"en")} language - Language to use in the response
	 * @param interaction
	 * @param testCommand - the executed test command
	 * @param {string[]} args - Additional arguments sent with the test command
	 */
	static async executeAndAlertUser(
		language: string,
		interaction: CommandInteraction,
		testCommand: ITestCommand,
		args: string[]): Promise<void> {
		try {

			const messageToDisplay = await testCommand.execute(language, interaction, args);
			if (!messageToDisplay || messageToDisplay === "") {
				return;
			}
			let embedTestSuccessful;
			if (typeof messageToDisplay === "string") {
				embedTestSuccessful = new DraftBotEmbed()
					.setAuthor({
						name: `Commande test ${testCommand.name} exécutée :`,
						iconURL: interaction.user.displayAvatarURL()
					})
					.setDescription(messageToDisplay)
					.setColor(<HexColorString>Constants.MESSAGES.COLORS.SUCCESSFUL);
			}
			else {
				embedTestSuccessful = messageToDisplay;
			}
			if (testCommand.commandTestShouldReply) {
				await interaction.reply({embeds: [embedTestSuccessful]});
			}
			else {
				await interaction.channel.send({embeds: [embedTestSuccessful]});
			}
		}
		catch (e) {
			console.error(e);
			try {
				await interaction.reply({content: `**:x: Une erreur est survenue pendant la commande test ${testCommand.name}** : \`\`\`${e.stack}\`\`\``});
			}
			catch (e2) {
				await interaction.reply({
					content:
						`**:x: Une erreur est survenue pendant la commande test ${testCommand.name}** : (Erreur tronquée car limite de caractères atteinte) \`\`\`${e.stack.slice(0, 1850)}\`\`\``
				});
			}
		}
	}

	static getTypeOf(variable: string): string {
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

	static getTestCommand(commandName: string): ITestCommand {
		const commandTestCurrent = CommandsTest.testCommandsArray[commandName.toLowerCase()];
		if (commandTestCurrent === undefined) {
			throw new Error(`Commande Test non définie : ${commandName}`);
		}
		return commandTestCurrent;
	}

	static getAllCommandsFromCategory(category: string): ITestCommand[] {
		const tabCommandReturn: ITestCommand[] = [];
		for (const testCommand of Object.values(CommandsTest.testCommandsArray)) {
			if (testCommand.category === category) {
				tabCommandReturn.push(testCommand);
			}
		}
		// Remove duplicates
		return tabCommandReturn.filter(function(elem, pos) {
			return tabCommandReturn.indexOf(elem) === pos;
		});
	}
}
