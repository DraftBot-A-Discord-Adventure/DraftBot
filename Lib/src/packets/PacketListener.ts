import {DraftBotPacket, PacketContext, PacketLike} from "./DraftBotPacket";

export class PacketListenerServer {
	private packetCallbacks: Map<string, PacketListenerCallbackServer<DraftBotPacket>> = new Map<string, PacketListenerCallbackServer<DraftBotPacket>>();

	public addPacketListener<T extends DraftBotPacket>(cls: PacketLike<T>, callback: PacketListenerCallbackServer<T>): void {
		// eslint-disable-next-line new-cap
		const instance = new cls();
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		this.packetCallbacks.set(instance.constructor.name, async (response, packet: T, context): Promise<void> => {
			try {
				await callback(response, packet, context);
			}
			catch (e) {
				console.error(`${PacketListenerServer.name} : Error while handling packet ${instance.constructor.name}: ${(e as Error).stack}`);
				throw e;
			}
		});
	}

	public getListener(packet: string): PacketListenerCallbackServer<DraftBotPacket> {
		return this.packetCallbacks.get(packet)!;
	}

	public getImplementedPackets(): string[] {
		return Array.from(this.packetCallbacks.keys());
	}
}

export type PacketListenerCallbackServer<T extends DraftBotPacket> = (response: DraftBotPacket[], packet: T, context: PacketContext) => void | Promise<void>;

export class PacketListenerClient {
	private packetCallbacks: Map<string, PacketListenerCallbackClient<DraftBotPacket>> = new Map<string, PacketListenerCallbackClient<DraftBotPacket>>();

	public addPacketListener<T extends DraftBotPacket>(cls: PacketLike<T>, callback: PacketListenerCallbackClient<T>): void {
		// eslint-disable-next-line new-cap
		const instance = new cls();
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		this.packetCallbacks.set(instance.constructor.name, async (packet: V, context: PacketContext) => {
			try {
				await callback(packet, context);
			}
			catch (e) {
				console.error(`${PacketListenerClient.name} : Error while handling packet ${instance.constructor.name}: ${(e as Error).stack}`);
				throw e;
			}
		});
	}

	public getListener(packet: string): PacketListenerCallbackClient<DraftBotPacket> | undefined {
		return this.packetCallbacks.get(packet);
	}

	public getImplementedPackets(): string[] {
		return Array.from(this.packetCallbacks.keys());
	}
}

export type PacketListenerCallbackClient<T extends DraftBotPacket> = (packet: T, context: PacketContext) => Promise<void>;