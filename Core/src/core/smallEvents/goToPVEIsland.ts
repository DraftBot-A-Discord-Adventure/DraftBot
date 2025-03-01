import {SmallEventFuncs} from "../../data/SmallEvent";
import Player from "../database/game/models/Player";
import {PlayerMissionsInfos} from "../database/game/models/PlayerMissionsInfo";
import {DraftBotPacket, makePacket} from "../../../../Lib/src/packets/DraftBotPacket";
import {
	SmallEventGoToPVEIslandAcceptPacket,
	SmallEventGoToPVEIslandNotEnoughGemsPacket, SmallEventGoToPVEIslandRefusePacket
} from "../../../../Lib/src/packets/smallEvents/SmallEventGoToPVEIslandPacket";
import {TravelTime} from "../maps/TravelTime";
import {NumberChangeReason} from "../../../../Lib/src/constants/LogsConstants";
import {Maps} from "../maps/Maps";
import {MapLinkDataController} from "../../data/MapLink";
import {Settings} from "../database/game/models/Setting";
import {PVEConstants} from "../../../../Lib/src/constants/PVEConstants";
import {MissionsController} from "../missions/MissionsController";
import {PlayerSmallEvents} from "../database/game/models/PlayerSmallEvent";
import {LogsReadRequests} from "../database/logs/LogsReadRequests";
import {EndCallback, ReactionCollectorInstance} from "../utils/ReactionsCollector";
import {BlockingUtils} from "../utils/BlockingUtils";
import {BlockingConstants} from "../../../../Lib/src/constants/BlockingConstants";
import { ReactionCollectorGoToPVEIsland } from "../../../../Lib/src/packets/interaction/ReactionCollectorGoToPVEIsland";
import {ReactionCollectorAcceptReaction} from "../../../../Lib/src/packets/interaction/ReactionCollectorPacket";

async function startBoatTravel(player: Player, price: number, anotherMemberOnBoat: Player | null, startTravelTimestamp: number, response: DraftBotPacket[]): Promise<boolean> {
	const missionInfo = await PlayerMissionsInfos.getOfPlayer(player.id);
	if (missionInfo.gems < price) {
		response.push(makePacket(SmallEventGoToPVEIslandNotEnoughGemsPacket, {}));
		return false;
	}

	await TravelTime.removeEffect(player, NumberChangeReason.SMALL_EVENT);
	await Maps.startTravel(
		player,
		MapLinkDataController.instance.getById(await Settings.PVE_ISLAND.getValue()),
		anotherMemberOnBoat ? anotherMemberOnBoat.startTravelDate.valueOf() : startTravelTimestamp
	);
	await missionInfo.addGems(-price, player.keycloakId, NumberChangeReason.SMALL_EVENT);
	await missionInfo.save();
	if (price === PVEConstants.TRAVEL_COST[PVEConstants.TRAVEL_COST.length - 1]) {
		await MissionsController.update(player, response, {
			missionId: "wealthyPayForPVEIsland"
		});
	}

	response.push(makePacket(SmallEventGoToPVEIslandAcceptPacket, { alone: !anotherMemberOnBoat }));
	return true;
}

export const smallEventFuncs: SmallEventFuncs = {
	async canBeExecuted(player: Player): Promise<boolean> {
		return player.level >= PVEConstants.MIN_LEVEL &&
			Maps.isNearWater(player) &&
			player.hasEnoughEnergyToJoinTheIsland() &&
			await PlayerSmallEvents.playerSmallEventCount(player.id, "goToPVEIsland") === 0 &&
			await LogsReadRequests.getCountPVEIslandThisWeek(player.keycloakId, player.guildId) < PVEConstants.TRAVEL_COST.length;
	},

	async executeSmallEvent(response, player, context): Promise<void> {
		const price = await player.getTravelCostThisWeek();
		const anotherMemberOnBoat = await Maps.getGuildMembersOnBoat(player);
		const travelTimestamp = Date.now();

		const collector = new ReactionCollectorGoToPVEIsland(
			price,
			player.getCumulativeEnergy(),
			player.getMaxCumulativeEnergy()
		);

		const endCallback: EndCallback = async (collector: ReactionCollectorInstance, response: DraftBotPacket[]): Promise<void> => {
			const reaction = collector.getFirstReaction();

			if (reaction && reaction.reaction.type === ReactionCollectorAcceptReaction.name) {
				const isGoneOnIsland = await startBoatTravel(player, price, anotherMemberOnBoat[0], travelTimestamp, response);
				if (isGoneOnIsland) {
					await MissionsController.update(player, response, {
						missionId: "joinPVEIsland",
						set: true
					});
				}
			}
			else {
				response.push(makePacket(SmallEventGoToPVEIslandRefusePacket, {}));
			}

			BlockingUtils.unblockPlayer(player.id, BlockingConstants.REASONS.PVE_ISLAND);
		};

		const packet = new ReactionCollectorInstance(
			collector,
			context,
			{
				allowedPlayerKeycloakIds: [player.keycloakId],
				reactionLimit: 1
			},
			endCallback
		)
			.block(player.id, BlockingConstants.REASONS.PVE_ISLAND)
			.build();

		response.push(packet);
	}
};