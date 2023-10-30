import {DraftBotPacket} from "./DraftBotPacket";

export class PacketListener {
	private packetCallbacks: Map<string, (socket: WebSocket, packet: DraftBotPacket, response: DraftBotPacket[]) => Promise<void>> = new Map<string, (socket: WebSocket, packet: DraftBotPacket, response: DraftBotPacket[]) => Promise<void>>();

	public addPacketListener<T extends DraftBotPacket>(packetName: string, callback: (socket: WebSocket, packet: T, response: DraftBotPacket[]) => Promise<void>): void {
		this.packetCallbacks.set(packetName, callback);
	}

	public getListener(packet: string) {
		return this.packetCallbacks.get(packet);
	}
}