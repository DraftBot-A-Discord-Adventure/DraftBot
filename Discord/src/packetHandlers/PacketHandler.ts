import {
	DraftBotPacket, PacketLike
} from "../../../Lib/src/packets/DraftBotPacket";
import { PacketListenerCallbackClient } from "../../../Lib/src/packets/PacketListener";
import { readdirSync } from "fs";
import { DiscordMQTT } from "../bot/DiscordMQTT";
import { DraftBotLogger } from "../../../Lib/src/logs/Logger";

export const packetHandler = <T extends DraftBotPacket>(val: PacketLike<T>) =>
	<V>(target: V, prop: string, descriptor: TypedPropertyDescriptor<PacketListenerCallbackClient<T>>): void => {
		DiscordMQTT.packetListener.addPacketListener<T>(val, descriptor.value! as unknown as PacketListenerCallbackClient<T>);
		DraftBotLogger.info(`[${val.name}] Registered packet handler (function '${prop}' in class '${target!.constructor.name}')`);
	};

export async function registerAllPacketHandlers(): Promise<void> {
	for (const file of readdirSync("dist/Discord/src/packetHandlers/handlers", {
		recursive: true
	})) {
		if (file.toString().endsWith(".js")) {
			await import(`./handlers/${file.toString().substring(0, file.length - 3)}`);
		}
	}
}
