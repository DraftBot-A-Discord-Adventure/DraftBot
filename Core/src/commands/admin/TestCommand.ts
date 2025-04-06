import { botConfig } from "../../index";
import {
	CommandTestPacketReq, CommandTestPacketRes
} from "../../../../Lib/src/packets/commands/CommandTestPacket";
import {
	DraftBotPacket, makePacket, PacketContext
} from "../../../../Lib/src/packets/DraftBotPacket";
import { CommandsTest } from "../../core/CommandsTest";
import { Player } from "../../core/database/game/models/Player";
import {
	commandRequires, CommandUtils
} from "../../core/utils/CommandUtils";
import { DraftBotLogger } from "../../../../Lib/src/logs/Logger";

export default class TestCommand {
	@commandRequires(CommandTestPacketReq, {
		notBlocked: false,
		whereAllowed: CommandUtils.WHERE.EVERYWHERE
	})
	async execute(response: DraftBotPacket[], player: Player, packet: CommandTestPacketReq, context: PacketContext): Promise<void> {
		if (!botConfig.TEST_MODE) {
			return;
		}
		let testCommands: string[];
		try {
			testCommands = packet.command.split(" && ");
		}
		catch {
			testCommands = ["list"];
		}
		for (let testCommand of testCommands) {
			let argsTest: string[];
			try {
				argsTest = testCommand.split(" ")
					.slice(1);
			}
			catch { /* Case no args given */
			}

			testCommand = testCommand.split(" ")[0];

			let commandTestCurrent;
			try {
				commandTestCurrent = CommandsTest.getTestCommand(testCommand);
			}
			catch (e) {
				response.push(makePacket(CommandTestPacketRes, {
					commandName: testCommand,
					result: `:x: | Commande test ${testCommand} inexistante : \`\`\`${e.stack}\`\`\``,
					isError: true
				}));
				continue;
			}

			// Third, we check if the test command has the good arguments
			const testGoodFormat = CommandsTest.isGoodFormat(commandTestCurrent, argsTest);
			if (!testGoodFormat.good) {
				response.push(makePacket(CommandTestPacketRes, {
					commandName: testCommand,
					result: testGoodFormat.description,
					isError: true
				}));
			}
			else {
				// Last, we execute the test command
				try {
					const messageToDisplay = await commandTestCurrent.execute(player, argsTest, response, context);

					response.push(makePacket(CommandTestPacketRes, {
						commandName: testCommand,
						result: messageToDisplay,
						isError: false
					}));
				}
				catch (e) {
					DraftBotLogger.error(`Error while executing test command ${testCommand}`, { error: e });
					response.push(makePacket(CommandTestPacketRes, {
						commandName: testCommand,
						result: `:x: | Une erreur est survenue pendant la commande test ${testCommand} : \`\`\`${e.stack}\`\`\``,
						isError: true
					}));
				}
			}
		}
	}
}
