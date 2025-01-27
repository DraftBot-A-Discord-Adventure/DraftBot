import {packetHandler} from "../PacketHandler";
import {FightIntroductionPacket} from "../../../../Lib/src/packets/fights/FightIntroductionPacket";
import {PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";

export default class FightHandler {
	@packetHandler(FightIntroductionPacket)
	async fightIntroduction(_context: PacketContext, _packet: FightIntroductionPacket): Promise<void> {
		// TODO
	}
}