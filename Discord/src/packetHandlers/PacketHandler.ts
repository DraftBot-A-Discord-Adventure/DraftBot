import {DiscordMQTT} from "../bot/Websocket";
import {DraftBotPacket} from "../../../Lib/src/packets/DraftBotPacket";
import {PacketListenerCallbackClient} from "../../../Lib/src/packets/PacketListener";
import {readdirSync} from "fs";

export const packetHandler = <T extends DraftBotPacket>(val: {new(): T}) =>
	<V>(target: V, prop: string, descriptor: TypedPropertyDescriptor<PacketListenerCallbackClient<T>>): void => {
		DiscordMQTT.packetListener.addPacketListener<T>(val, descriptor.value! as unknown as PacketListenerCallbackClient<T>);
		console.log(`[${val.name}] Registered packet handler (function '${prop}' in class '${target!.constructor.name}')`);
	};

export async function registerAllPacketHandlers(): Promise<void> {
	for (const file of readdirSync("dist/Discord/src/packetHandlers/handlers")) {
		if (file.endsWith(".js")) {
			await import(`./handlers/${file.substring(0, file.length - 3)}`);
		}
	}
}