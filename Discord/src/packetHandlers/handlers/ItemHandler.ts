import {packetHandler} from "../PacketHandler";
import {ItemAcceptPacket} from "../../../../Lib/src/packets/notifications/ItemAcceptPacket";
import {WebSocket} from "ws";
import {PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {ItemFoundPacket} from "../../../../Lib/src/packets/notifications/ItemFoundPacket";
import {ItemRefusePacket} from "../../../../Lib/src/packets/notifications/ItemRefusePacket";

export default class ItemHandler {
	@packetHandler(ItemAcceptPacket)
	async itemAcceptHandler(socket: WebSocket, packet: ItemAcceptPacket, context: PacketContext): Promise<void> {
		// TODO
	}

	@packetHandler(ItemFoundPacket)
	async itemFoundHandler(socket: WebSocket, packet: ItemFoundPacket, context: PacketContext): Promise<void> {
		// TODO
	}

	@packetHandler(ItemRefusePacket)
	async itemRefuseHandler(socket: WebSocket, packet: ItemRefusePacket, context: PacketContext): Promise<void> {
		// TODO
	}
}