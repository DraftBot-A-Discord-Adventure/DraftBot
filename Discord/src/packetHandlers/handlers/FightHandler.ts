import {packetHandler} from "../PacketHandler";
import {FightIntroductionPacket} from "../../../../Lib/src/packets/fights/FightIntroductionPacket";
import {PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";

export default class FightHandler {
	@packetHandler(FightIntroductionPacket)
	async fightIntroduction(packet: FightIntroductionPacket, context: PacketContext): Promise<void> {
		// TODO
	}
}