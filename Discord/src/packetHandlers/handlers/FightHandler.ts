import {packetHandler} from "../PacketHandler";
import {FightIntroductionPacket} from "../../../../Lib/src/packets/fights/FightIntroductionPacket";
import {PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {WebSocket} from "ws";

export default class FightHandler {
	@packetHandler(FightIntroductionPacket)
	async fightIntroduction(socket: WebSocket, packet: FightIntroductionPacket, context: PacketContext): Promise<void> {
		// TODO
	}
}