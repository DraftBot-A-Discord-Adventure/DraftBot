import {ExecuteTestCommandLike, ITestCommand, TypeKey} from "../../../../core/CommandsTest";
import {PacketUtils} from "../../../../core/utils/PacketUtils";
import {makePacket} from "../../../../../../Lib/src/packets/DraftBotPacket";
import {ReachDestinationNotificationPacket} from "../../../../../../Lib/src/packets/notifications/ReachDestinationNotificationPacket";
import {MapLocationDataController} from "../../../../data/MapLocation";
import {GuildDailyNotificationPacket} from "../../../../../../Lib/src/packets/notifications/GuildDailyNotificationPacket";

export const commandInfo: ITestCommand = {
	name: "sendnotification",
	aliases: ["sendnotif"],
	commandFormat: "<type>",
	typeWaited: {
		type: TypeKey.STRING
	},
	description: "Envoie une notification de type donné"
};

/**
 * Send a notification of the given type
 */
const sendNotificationTestCommand: ExecuteTestCommandLike = (player, args) => {
	if (args[0] === "report") {
		const map = MapLocationDataController.instance.getRandomGotoableMap();
		PacketUtils.sendNotifications([makePacket(ReachDestinationNotificationPacket, {
			keycloakId: player.keycloakId,
			mapType: map.type,
			mapId: map.id
		})]);
	}
	else if (args[0] === "gd") {
		PacketUtils.sendNotifications([makePacket(GuildDailyNotificationPacket, {
			keycloakId: player.keycloakId,
			keycloakIdOfExecutor: player.keycloakId
		})]);
	}
	else {
		throw "Type de notification inconnu";
	}

	return "Notification envoyée !";
};

commandInfo.execute = sendNotificationTestCommand;
