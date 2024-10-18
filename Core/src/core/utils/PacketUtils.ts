import {DraftBotPacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {mqttClient} from "../../index";

export abstract class PacketUtils {
	static sendPackets(context: PacketContext, packets: DraftBotPacket[]): void {
		const responsePacket = {
			context: context,
			packets: packets.map((responsePacket) => ({
				name: responsePacket.constructor.name,
				packet: responsePacket
			}))
		};

		if (context.discord !== null) {
			const response = JSON.stringify(responsePacket);
			mqttClient.publish("draftbot_discord", response);
			console.log(`Sent ${response} to discord front`);
		}
		else {
			throw new Error("Unsupported platform");
		}

		// TODO other platforms
	}
}