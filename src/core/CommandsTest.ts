import {readdir} from "fs/promises";
import {readdirSync} from "fs";
import {isAMention, isAnEmoji} from "../../../Lib/src/utils/StringUtils";
import {DraftBotPacket, makePacket} from "../../../Lib/src/packets/DraftBotPacket";
import Player, {Players} from "./database/game/models/Player";
import {Client} from "../../../Lib/src/instances/Client";
import {CommandTestPacketRes} from "../../../Lib/src/packets/commands/CommandTestPacket";

type Checker = {
	check: (v: string) => boolean
	type: TypeKey
};

enum TypeKey {
	INTEGER = "INTEGER",
	MENTION = "MENTION",
	EMOJI = "EMOJI",
	STRING = "STRING"
}

const typeVariableChecks: Map<TypeKey, Checker> = new Map<TypeKey, Checker>([
	[TypeKey.INTEGER, {
		type: TypeKey.INTEGER,
		check: (v: string): boolean => !isNaN(parseInt(v, 10))
	}],
	[TypeKey.MENTION, {
		type: TypeKey.MENTION,
		check: (v: string): boolean => isAMention(v)
	}],
	[TypeKey.EMOJI, {
		type: TypeKey.EMOJI,
		check: (v: string): boolean => isAnEmoji(v)
	}],
	[TypeKey.STRING, {
		type: TypeKey.STRING,
		check: (): boolean => false
	}]
]);

export interface ITestCommand {
	name: string,
	aliases?: string[],
	commandFormat: string,
	typeWaited?: { [argName: string]: Checker }
	description: string,
	execute?: ExecuteTestCommandLike,
	category?: string
}

export type ExecuteTestCommandLike = (player: Player, args: string[], response: DraftBotPacket[], client: Client) => string | Promise<string>;

/**
 * @class
 */
export class CommandsTest {
	static testCommandsArray: { [commandName: string]: ITestCommand };

	static testCommType: string[];

	/**
	 * Load all the test commands from source files
	 */
	static async init(): Promise<void> {
		CommandsTest.testCommandsArray = {};
		CommandsTest.testCommType = await readdir("dist/src/commands/admin/testCommands");
		for (const type of CommandsTest.testCommType) {
			const commandsFiles = readdirSync(`dist/src/commands/admin/testCommands/${type}`).filter((command: string) => command.endsWith(".js"));
			for (const commandFile of commandsFiles) {
				this.initCommandTestFromCommandFile(type, commandFile);
			}
		}
	}

	/**
	 * Say if the given args are the args awaited for the given command
	 * @param commandTest - The command to test
	 * @param {string[]} args - The args given to the test
	 * @return {boolean, string} - {true, ""} if the args are good, {false, "error message"} if not
	 */
	static isGoodFormat(
		commandTest: ITestCommand,
		args: string[]): { good: boolean, description: string } {
		const ret = {
			good: true,
			description: ""
		};
		if (!commandTest.typeWaited) {
			ret.good = args.length === 0;
			ret.description = ret.good ? "" : `❌ Mauvais format pour la commande test ${commandTest.name}\n\n**Format attendu :** \`test ${commandTest.name}\``;
			return ret;
		}
		const commandTypeKeys = Object.keys(commandTest.typeWaited);
		const nbArgsWaited = commandTypeKeys.length;
		if (nbArgsWaited !== args.length) {
			return {
				good: false,
				description: `❌ Mauvais nombre d'arguments pour la commande test ${commandTest.name}\n\n**Format attendu :** \`test ${commandTest.name} ${commandTest.commandFormat}\``
			};
		}
		for (let i = 0; i < nbArgsWaited; i++) {
			if (commandTest.typeWaited[commandTypeKeys[i]].type !== CommandsTest.getTypeOf(args[i])) {
				return {
					good: false,
					description: `❌ Mauvais argument pour la commande test ${commandTest.name}

**Format attendu** : \`test ${commandTest.name} ${commandTest.commandFormat}\`
**Format de l'argument** \`<${commandTypeKeys[i]}>\` : ${commandTest.typeWaited[commandTypeKeys[i]].type}
**Format reçu** : ${CommandsTest.getTypeOf(args[i])}`
				};
			}
		}
		return ret;
	}

	/**
	 * Execute the test command, and alert the user about its success or its failure
	 * @param testCommand - the executed test command
	 * @param {string[]} args - Additional arguments sent with the test command
	 * @param response
	 * @param client
	 */
	static async executeAndAlertUser(
		testCommand: ITestCommand,
		args: string[],
		response: DraftBotPacket[],
		client: Client): Promise<void> {
		const player = await Players.getById(1); // TODO replace with the right one
		try {
			const messageToDisplay = await testCommand.execute(player, args, response, client);
			if (!messageToDisplay || messageToDisplay === "") {
				return;
			}
			response.push(makePacket(CommandTestPacketRes, {
				result: messageToDisplay,
				isError: false
			}));
		}
		catch (e) {
			console.error(e);
			response.push(makePacket(CommandTestPacketRes, {
				result: `:x: | Une erreur est survenue pendant la commande test ${testCommand.name} : \`\`\`${e.stack}\`\`\``,
				isError: true
			}));
		}
	}

	static getTypeOf(variable: string): TypeKey {
		for (const typeIn of typeVariableChecks.keys()) {
			if (typeVariableChecks.get(typeIn).check(variable)) {
				return typeIn;
			}
		}
		return TypeKey.STRING;
	}

	static getTestCommand(commandName: string): ITestCommand {
		const commandTestCurrent = CommandsTest.testCommandsArray[commandName.toLowerCase()];
		if (!commandTestCurrent) {
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
		return tabCommandReturn.filter((elem, pos) => tabCommandReturn.indexOf(elem) === pos);
	}

	/**
	 * Initialize a test command from its file
	 * @param type
	 * @param commandFile
	 * @private
	 */
	private static initCommandTestFromCommandFile(type: string, commandFile: string): void {
		const testCommand: ITestCommand = require(`dist/src/commands/admin/testCommands/${type}/${commandFile}`).default;
		testCommand.category = type;
		CommandsTest.testCommandsArray[testCommand.name.toLowerCase()] = testCommand;
		if (testCommand.aliases) {
			for (const alias of testCommand.aliases) {
				this.testCommandsArray[alias.toLowerCase()] = testCommand;
			}
		}
	}
}
