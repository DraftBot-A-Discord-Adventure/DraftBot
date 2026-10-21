import {
	ExecuteTestCommandLike, ITestCommand, TypeKey
} from "../../../../core/CommandsTest";
import { PacketUtils } from "../../../../core/utils/PacketUtils";
import { makePacket } from "../../../../../../Lib/src/packets/CrowniclesPacket";
import { ReachDestinationNotificationPacket } from "../../../../../../Lib/src/packets/notifications/ReachDestinationNotificationPacket";
import { MapLocationDataController } from "../../../../data/MapLocation";
import { GuildDailyNotificationPacket } from "../../../../../../Lib/src/packets/notifications/GuildDailyNotificationPacket";
import { CommandGuildDailyRewardPacket } from "../../../../../../Lib/src/packets/commands/CommandGuildDailyPacket";
import { TopWeekRewardNotificationPacket } from "../../../../../../Lib/src/packets/notifications/TopWeekRewardNotificationPacket";
import { TopWeekRewardConstants } from "../../../../../../Lib/src/constants/TopWeekRewardConstants";

export const commandInfo: ITestCommand = {
	name: "sendnotification",
	aliases: ["sendnotif"],
	commandFormat: "<type>",
	typeWaited: { type: TypeKey.STRING },
	description: "Envoie une notification de test au joueur. Types disponibles : 'report' (destination atteinte), 'gd' (bonus de guilde), 'topweek' (récompense de fin de top week). Utile pour tester l'affichage des notifications"
};

/**
 * Send a notification of the given type
 */
const sendNotificationTestCommand: ExecuteTestCommandLike = (player, args) => {
	if (args[0] === "report") {
		const map = MapLocationDataController.instance.getRandomGotoableMap();
		PacketUtils.sendNotifications([
			makePacket(ReachDestinationNotificationPacket, {
				keycloakId: player.keycloakId,
				mapType: map.type,
				mapId: map.id
			})
		]);
	}
	else if (args[0] === "gd") {
		PacketUtils.sendNotifications([
			makePacket(GuildDailyNotificationPacket, {
				keycloakId: player.keycloakId,
				keycloakIdOfExecutor: player.keycloakId,
				reward: makePacket(CommandGuildDailyRewardPacket, {
					guildName: "Test",
					money: 666,
					personalXp: 666,
					badge: true,
					superBadge: true,
					fullHeal: true,
					heal: 666,
					alteration: { healAmount: 666 },
					guildXp: 666,
					commonFood: 666,
					pet: {
						typeId: 1, isFemale: false
					},
					advanceTime: 666
				})
			})
		]);
	}
	else if (args[0] === "topweek") {
		const tier = TopWeekRewardConstants.getTier(player.weeklyScore) ?? TopWeekRewardConstants.getTier(TopWeekRewardConstants.MIN_REWARDED_WEEKLY_SCORE)!;
		PacketUtils.sendNotifications([
			makePacket(TopWeekRewardNotificationPacket, {
				keycloakId: player.keycloakId,
				leagueId: tier.leagueId,
				weeklyScore: Math.max(player.weeklyScore, tier.minWeeklyScore),
				money: tier.money,
				gems: tier.gems
			})
		]);
	}
	else {
		throw "Type de notification inconnu";
	}

	return "Notification envoyée !";
};

commandInfo.execute = sendNotificationTestCommand;
