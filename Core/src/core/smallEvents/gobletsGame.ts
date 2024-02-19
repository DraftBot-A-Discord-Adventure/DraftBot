import {SmallEventDataController, SmallEventFuncs} from "../../data/SmallEvent";
import {MapConstants} from "../constants/MapConstants";
import {Maps} from "../maps/Maps";
import {BlockingConstants} from "../constants/BlockingConstants";
import Player from "../database/game/models/Player";
import {SmallEventConstants} from "../constants/SmallEventConstants";
import {RandomUtils} from "../utils/RandomUtils";
import {BlockingUtils} from "../utils/BlockingUtils";
import {DraftBotPacket, makePacket} from "../../../../Lib/src/packets/DraftBotPacket";
import {NumberChangeReason} from "../constants/LogsConstants";
import {TravelTime} from "../maps/TravelTime";
import {EffectsConstants} from "../../../../Lib/src/constants/EffectsConstants";
import {SmallEventGobletsGamePacket} from "../../../../Lib/src/packets/smallEvents/SmallEventGobletsGamePacket";
import {EndCallback, ReactionCollectorInstance} from "../utils/ReactionsCollector";
import {ReactionCollectorGobletsGame} from "../../../../Lib/src/packets/interaction/ReactionCollectorGobletsGame";
import {ReactionCollectorReaction} from "../../../../Lib/src/packets/interaction/ReactionCollectorPacket";

type GobletsGameProperties = {
	"malusTypes": string[]
}
const properties = SmallEventDataController.instance.getById("gobletsGame").getProperties<GobletsGameProperties>();
async function applyMalus(response: DraftBotPacket[], player: Player, reaction: ReactionCollectorReaction): Promise<void> {
	const malus = !reaction ? "end" : RandomUtils.draftbotRandom.pick(properties.malusTypes);
	const packet = makePacket(SmallEventGobletsGamePacket,{
		malus,
		goblet: reaction.constructor.name,
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
	executeSmallEvent: (context, response, player) => {
		const collector = new ReactionCollectorGobletsGame();

		const endCallback: EndCallback = async (collector, response) => {
			await applyMalus(response, player, collector.getFirstReaction().reaction);
			BlockingUtils.unblockPlayer(player.id, BlockingConstants.REASONS.GOBLET_CHOOSE);
		};

		const packet = new ReactionCollectorInstance(
			collector,
			context,
			{
				allowedPlayerIds: [player.id],
				reactionLimit: 1
			},
			endCallback
		)
			.block(player.id, BlockingConstants.REASONS.GOBLET_CHOOSE)
			.build();

		response.push(packet);
	}
};