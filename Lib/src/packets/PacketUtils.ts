import {DraftBotPacket, PacketContext} from "./DraftBotPacket";
import {WebSocket} from "ws";

export function sendPacket(client: WebSocket, packet: DraftBotPacket | DraftBotPacket[]): void {
	client.send(JSON.stringify(packet));
}

export function sendPacketsToContext(context: PacketContext, packets: DraftBotPacket[]): void {
	// TODO send
}

export function pushPacket(playerId: number, packet: DraftBotPacket): void {
	// TODO
}