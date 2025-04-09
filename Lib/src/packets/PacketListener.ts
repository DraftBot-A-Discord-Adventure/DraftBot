import {
	DraftBotPacket, PacketContext, PacketLike
} from "./DraftBotPacket";
import { DraftBotLogger } from "../logs/Logger";

export class PacketListenerServer {
	private packetCallbacks: Map<string, PacketListenerCallbackServer<DraftBotPacket>> = new Map<string, PacketListenerCallbackServer<DraftBotPacket>>();

	public addPacketListener<T extends DraftBotPacket>(PacketInstance: PacketLike<T>, callback: PacketListenerCallbackServer<T>): void {
		const instance = new PacketInstance();

		// TODO, when going to strict mode in Core, replace ts-ignore by ts-expect-error
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore Even if its always instanciated with subtypes, we don't depend on specifics of subtypes, so its okay
		this.packetCallbacks.set(instance.constructor.name, async (response, context, packet: T): Promise<void> => {
			try {
				await callback(response, context, packet);
			}
			catch (e) {
				DraftBotLogger.errorWithObj(`${PacketListenerServer.name} : Error while handling packet ${instance.constructor.name}`, e);
				throw e;
			}
		});
	}

	public getListener(packet: string): PacketListenerCallbackServer<DraftBotPacket> {
		return this.packetCallbacks.get(packet)!;
	}
}

export type PacketListenerCallbackServer<T extends DraftBotPacket> = (response: DraftBotPacket[], context: PacketContext, packet: T) => void | Promise<void>;

export class PacketListenerClient {
	private packetCallbacks: Map<string, PacketListenerCallbackClient<DraftBotPacket>> = new Map<string, PacketListenerCallbackClient<DraftBotPacket>>();

	public addPacketListener<T extends DraftBotPacket>(PacketInstance: PacketLike<T>, callback: PacketListenerCallbackClient<T>): void {
		const instance = new PacketInstance();

		// TODO, when going to strict mode in Core, replace ts-ignore by ts-expect-error
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore Even if its always instanciated with subtypes, we don't depend on specifics of subtypes, so its okay
		this.packetCallbacks.set(instance.constructor.name, async (context: PacketContext, packet: T) => {
			try {
				await callback(context, packet);
			}
			catch (e) {
				DraftBotLogger.errorWithObj(`${PacketListenerClient.name} : Error while handling packet ${instance.constructor.name}`, e);
				throw e;
			}
		});
	}

	public getListener(packet: string): PacketListenerCallbackClient<DraftBotPacket> | undefined {
		return this.packetCallbacks.get(packet);
	}
}

export type PacketListenerCallbackClient<T extends DraftBotPacket> = (context: PacketContext, packet: T) => Promise<void>;
