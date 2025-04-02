import {
	CommandUpdatePacketReq, CommandUpdatePacketRes
} from "../../../../Lib/src/packets/commands/CommandUpdatePacket";
import {
	DraftBotPacket, makePacket
} from "../../../../Lib/src/packets/DraftBotPacket";
import {
	commandRequires, CommandUtils
} from "../../core/utils/CommandUtils";

export default class UpdateCommand {
	@commandRequires(CommandUpdatePacketReq, {
		notBlocked: false,
		whereAllowed: CommandUtils.WHERE.EVERYWHERE
	})
	execute(response: DraftBotPacket[]): void {
		response.push(makePacket(CommandUpdatePacketRes, {
			coreVersion: process.env.npm_package_version
		}));
	}
}
