import {SmallEventDataController, SmallEventFuncs} from "../../data/SmallEvent";
import {MapConstants} from "../constants/MapConstants";
import {Maps} from "../maps/Maps";
import {GenericReactionCollector} from "../utils/ReactionsCollector";
import {ReactionCollectorType} from "../../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {BlockingConstants} from "../constants/BlockingConstants";
import Player from "../database/game/models/Player";
import {SmallEventConstants} from "../constants/SmallEventConstants";
import {RandomUtils} from "../utils/RandomUtils";
import {BlockingUtils} from "../utils/BlockingUtils";
import {DraftBotPacket, makePacket} from "../../../../Lib/src/packets/DraftBotPacket";
import {NumberChangeReason} from "../constants/LogsConstants";
import {TravelTime} from "../maps/TravelTime";
import {EffectsConstants} from "../constants/EffectsConstants";
import {SmallEventGobletsGamePacket} from "../../../../Lib/src/packets/smallEvents/SmallEventGobletsGamePacket";

type GobletsGameProperties = {
	"goblets": {
		"metal": string,
		"biggest": string,
		"sparkling": string
	},
	"malusTypes": string[]
}
const properties = SmallEventDataController.instance.getById("gobletsGame").getProperties<GobletsGameProperties>();
async function applyMalus(response: DraftBotPacket[], player: Player, reaction: string): Promise<void> {
	const malus = !reaction ? "end" : RandomUtils.draftbotRandom.pick(properties.malusTypes);
	const packet = makePacket<SmallEventGobletsGamePacket>({
		malus,
		goblet: reaction,
		value: 0
	});
	switch (malus) {
	case "life":
	case "end":
		packet.value = Math.round(player.level * SmallEventConstants.GOBLETS_GAME.HEALTH_LOST.END_LEVEL_MULTIPLIER) + SmallEventConstants.GOBLETS_GAME.HEALTH_LOST.BASE
			+ RandomUtils.variationInt(SmallEventConstants.GOBLETS_GAME.HEALTH_LOST.VARIATION);
		await player.addHealth(-packet.value, response, NumberChangeReason.SMALL_EVENT);
		break;
	case "time":
		packet.value = Math.round(player.level * SmallEventConstants.GOBLETS_GAME.TIME_LOST.LEVEL_MULTIPLIER) + SmallEventConstants.GOBLETS_GAME.TIME_LOST.BASE
			+ RandomUtils.variationInt(SmallEventConstants.GOBLETS_GAME.TIME_LOST.VARIATION);
		await TravelTime.applyEffect(player, EffectsConstants.EMOJI_TEXT.OCCUPIED, packet.value, new Date(), NumberChangeReason.SMALL_EVENT);
		break;
	case "nothing":
		break;
	default:
		throw new Error("reward type not found");
	}
	await player.killIfNeeded(response, NumberChangeReason.SMALL_EVENT);
	await player.save();
	response.push(packet);
}

export const smallEventFuncs: SmallEventFuncs = {
	canBeExecuted: (player) => {
		const destination = player.getDestination();
		const origin = player.getPreviousMap();
		return Maps.isOnContinent(player) &&
			!(destination.id === MapConstants.LOCATIONS_IDS.ROAD_OF_WONDERS
				|| destination.id === MapConstants.LOCATIONS_IDS.MARSHY_ROAD
				|| origin.id === MapConstants.LOCATIONS_IDS.ROAD_OF_WONDERS
				|| origin.id === MapConstants.LOCATIONS_IDS.MARSHY_ROAD
			);
	},
	executeSmallEvent: (response, player) => {
		response.push(GenericReactionCollector.create(
			response[0], // TODO : replace with the right one
			{
				collectorType: ReactionCollectorType.GOBLET_CHOOSE,
				reactions: Object.values(properties.goblets),
				allowedPlayerIds: [player.id]
			},
			{
				end: async (collector, response) => {
					await applyMalus(response, player, collector.getFirstReaction().emoji);
					BlockingUtils.unblockPlayer(player.id, BlockingConstants.REASONS.GOBLET_CHOOSE);
				}
			})
			.block(player.id, BlockingConstants.REASONS.GOBLET_CHOOSE)
			.getPacket());
	}
};