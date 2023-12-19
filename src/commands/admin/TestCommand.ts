import {PacketListenerCallbackServer} from "../../../../Lib/src/packets/PacketListener";
import {botConfig} from "../../index";
import {CommandTestPacketReq, CommandTestPacketRes} from "../../../../Lib/src/packets/commands/CommandTestPacket";
import {makePacket} from "../../../../Lib/src/packets/DraftBotPacket";
import {CommandsTest} from "../../core/CommandsTest";

const command: PacketListenerCallbackServer<CommandTestPacketReq> = async (socket, packet, context, response) => {
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
				result: `:x: | Commande test ${testCommand} inexistante : \`\`\`${e.stack}\`\`\``,
				isError: true
			}));
			continue;
		}

		// Third, we check if the test command has the good arguments
		const testGoodFormat = CommandsTest.isGoodFormat(commandTestCurrent, argsTest);
		if (!testGoodFormat.good) {
			response.push(makePacket(CommandTestPacketRes, {
				result: testGoodFormat.description,
				isError: true
			}));
		}
		else {
			// Last, we execute the test command
			response.push(makePacket(CommandTestPacketRes, {
				result: argsTest.join(" ") + commandTestCurrent,
				isError: false
			}));
			await CommandsTest.executeAndAlertUser(commandTestCurrent, argsTest, response, socket);
		}
	}
};

export default command;