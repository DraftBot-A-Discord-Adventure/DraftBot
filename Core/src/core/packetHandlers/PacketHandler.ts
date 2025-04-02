import {readdirSync} from "fs";
import {PacketListenerCallbackServer} from "../../../../Lib/src/packets/PacketListener";
import {DraftBotPacket, PacketLike} from "../../../../Lib/src/packets/DraftBotPacket";
import {draftBotInstance} from "../../index";

export const packetHandler = <T extends DraftBotPacket>(val: PacketLike<T>) =>
	<V>(target: V, prop: string, descriptor: TypedPropertyDescriptor<PacketListenerCallbackServer<T>>): void => {
		draftBotInstance.packetListener.addPacketListener<T>(val, descriptor.value! as unknown as PacketListenerCallbackServer<T>);
		console.log(`[${val.name}] Registered packet handler (function '${prop}' in class '${target!.constructor.name}')`);
	};

export async function registerAllPacketHandlers(): Promise<void> {
	for (const file of readdirSync("dist/Core/src/core/packetHandlers/handlers")) {
		if (file.endsWith(".js")) {
			await import(`./handlers/${file.substring(0, file.length - 3)}`);
		}
	}

	for (const file of readdirSync("dist/Core/src/commands/", {
		recursive: true,
		withFileTypes: true
	})) {
		if (file.isFile() && file.name.endsWith(".js")) {
			await import(`../../../../../${file.parentPath}/${file.name.substring(0, file.name.length - 3)}`);
		}
	}
}