import { adminCommand } from "../../core/utils/CommandUtils";
import { DraftBotPacket } from "../../../../Lib/src/packets/DraftBotPacket";
import { CommandFightCancelPacketReq } from "../../../../Lib/src/packets/commands/CommandFightCancelPacket";
import { FightsManager } from "../../core/fights/FightsManager";

export default class FightCancelCommand {
	@adminCommand(CommandFightCancelPacketReq, (): boolean => true)
	async execute(response: DraftBotPacket[], packet: CommandFightCancelPacketReq): Promise<void> {
		const fight = FightsManager.getFight(packet.fightId);

		if (fight) {
			await fight.endBugFight(response);
		}
	}
}
