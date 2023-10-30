import {DraftBotPacket} from "./DraftBotPacket";

export class PacketListener {
	private packetCallbacks: Map<string, PacketListenerCallback<DraftBotPacket>> = new Map<string, PacketListenerCallback<DraftBotPacket>>();

	public addPacketListener<T extends DraftBotPacket>(packetName: string, callback: PacketListenerCallback<T>): void {
		this.packetCallbacks.set(packetName, callback);
	}

	public getListener(packet: string): PacketListenerCallback<DraftBotPacket> {
		return this.packetCallbacks.get(packet);
	}
}

export type PacketListenerCallback<T extends DraftBotPacket> = (socket: WebSocket, packet: T, response: DraftBotPacket[]) => void | Promise<void>;