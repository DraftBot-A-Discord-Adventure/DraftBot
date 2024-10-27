import {DraftBotPacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {mqttClient} from "../../index";
import {AnnouncementPacket} from "../../../../Lib/src/packets/announcements/AnnouncementPacket";
import {MqttConstants} from "../../../../Lib/src/constants/MqttConstants";

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
			mqttClient.publish(MqttConstants.DISCORD_TOPIC, response);
			console.log(`Sent ${response} to discord front`);
		}
		else {
			throw new Error("Unsupported platform");
		}

		// TODO other platforms
	}

	static announce(announcement: AnnouncementPacket, topic: string): void {
		const json = JSON.stringify(announcement);
		// Retaining the message ensures that new subscribers will receive the announcement. So if the front is down, it will still receive the announcement when it comes back up.
		// And if the MQTT server goes down, the announcement will still be available when it comes back up.
		mqttClient.publish(topic, json, { retain: true });
		console.log(`Sent Discord announcement: ${json}`);
	}
}