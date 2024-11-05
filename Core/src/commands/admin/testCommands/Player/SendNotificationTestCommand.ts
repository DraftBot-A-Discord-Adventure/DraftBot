import {ExecuteTestCommandLike, ITestCommand, TypeKey} from "../../../../core/CommandsTest";
import {PacketUtils} from "../../../../core/utils/PacketUtils";
import {makePacket} from "../../../../../../Lib/src/packets/DraftBotPacket";
import {ReachDestinationNotificationPacket} from "../../../../../../Lib/src/packets/notifications/ReachDestinationNotificationPacket";
import {MapLocationDataController} from "../../../../data/MapLocation";

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
		PacketUtils.sendNotification(makePacket(ReachDestinationNotificationPacket, {
			keycloakId: player.keycloakId,
			mapId: MapLocationDataController.instance.getRandomGotoableMap().id
		}));
	}
	else {
		throw "Type de notification inconnu";
	}

	return "Notification envoyée !";
};

commandInfo.execute = sendNotificationTestCommand;
