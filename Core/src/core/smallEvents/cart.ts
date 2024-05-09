import {SmallEventFuncs} from "../../data/SmallEvent";
import {Maps} from "../maps/Maps";
import {BlockingConstants} from "../../../../Lib/src/constants/BlockingConstants";
import Player from "../database/game/models/Player";
import {SmallEventConstants} from "../../../../Lib/src/constants/SmallEventConstants";
import {RandomUtils} from "../utils/RandomUtils";
import {BlockingUtils} from "../utils/BlockingUtils";
import {MapLink, MapLinkDataController} from "../../data/MapLink";
import {EndCallback, ReactionCollectorInstance} from "../utils/ReactionsCollector";
import {
	ReactionCollectorCart,
	ReactionCollectorCartValidate
} from "../../../../Lib/src/packets/interaction/ReactionCollectorCart";
import {Constants} from "../../../../Lib/src/constants/Constants";
import {NumberChangeReason} from "../../../../Lib/src/constants/LogsConstants";
import {DraftBotPacket, makePacket} from "../../../../Lib/src/packets/DraftBotPacket";
import {draftBotInstance} from "../../index";
import {SmallEventCartPacket} from "../../../../Lib/src/packets/smallEvents/SmallEventCartPacket";

type CartObject = { player: Player, destination: MapLink, price: number, displayedDestination: MapLink };

//
// type GobletsGameProperties = {
//     "malusTypes": string[]
// }
// const properties = SmallEventDataController.instance.getById("gobletsGame").getProperties<GobletsGameProperties>();
//
// async function applyMalus(response: DraftBotPacket[], player: Player, reaction: ReactionCollectorReaction): Promise<void> {
//     const malus = !reaction ? "end" : RandomUtils.draftbotRandom.pick(properties.malusTypes);
//     const packet = makePacket(SmallEventGobletsGamePacket, {
//         malus,
//         goblet: reaction.constructor.name,
//         value: 0
//     });
//     switch (malus) {
//         case "life":
//         case "end":
//             packet.value = Math.round(player.level * SmallEventConstants.GOBLETS_GAME.HEALTH_LOST.END_LEVEL_MULTIPLIER) + SmallEventConstants.GOBLETS_GAME.HEALTH_LOST.BASE
//                 + RandomUtils.variationInt(SmallEventConstants.GOBLETS_GAME.HEALTH_LOST.VARIATION);
//             await player.addHealth(-packet.value, response, NumberChangeReason.SMALL_EVENT);
//             break;
//         case "time":
//             packet.value = Math.round(player.level * SmallEventConstants.GOBLETS_GAME.TIME_LOST.LEVEL_MULTIPLIER) + SmallEventConstants.GOBLETS_GAME.TIME_LOST.BASE
//                 + RandomUtils.variationInt(SmallEventConstants.GOBLETS_GAME.TIME_LOST.VARIATION);
//             await TravelTime.applyEffect(player, Effect.OCCUPIED, packet.value, new Date(), NumberChangeReason.SMALL_EVENT);
//             break;
//         case "nothing":
//             break;
//         default:
//             throw new Error("reward type not found");
//     }
//     await player.killIfNeeded(response, NumberChangeReason.SMALL_EVENT);
//     await player.save();
//     response.push(packet);
// }

/**
 * Manage the teleportation of the player
 * @param response
 * @param cartObject
 * @param reactionEmoji
 */
async function manageTeleportation(response: DraftBotPacket[], cartObject: CartObject, reactionEmoji: string): Promise<string> {
    if (reactionEmoji !== SmallEventConstants.CART.REACTIONS.ACCEPT) {
        return SmallEventConstants.CART.RESULT_KEYS.REFUSED;
    }

    if (cartObject.player.money < cartObject.price) {
        return SmallEventConstants.CART.RESULT_KEYS.NOT_ENOUGH_MONEY;
    }

    await cartObject.player.spendMoney({
        amount: cartObject.price,
        response,
        reason: NumberChangeReason.SMALL_EVENT
    });
    draftBotInstance.logsDatabase.logTeleportation(cartObject.player.keycloakId, cartObject.player.mapLinkId, cartObject.destination.id).then(async () => {
        cartObject.player.mapLinkId = cartObject.destination.id;
        await cartObject.player.save();
    });

    if (!cartObject.displayedDestination) {
        return SmallEventConstants.CART.RESULT_KEYS.UNKNOWN_DESTINATION;
    }
    return cartObject.destination.id !== cartObject.displayedDestination.id
        ? SmallEventConstants.CART.RESULT_KEYS.SCAM
        : SmallEventConstants.CART.RESULT_KEYS.NORMAL;
}

export const smallEventFuncs: SmallEventFuncs = {
    canBeExecuted: Maps.isOnContinent,
    executeSmallEvent: (context, response, player) => {
        const chance = RandomUtils.draftbotRandom.realZeroToOneInclusive();

        const destination = MapLinkDataController.instance.getRandomExcept(player.mapLinkId);
        let price: number, displayedDestination: MapLink;

        if (chance <= SmallEventConstants.CART.TRANSPARENT_TP_THRESHOLD) {
            // The player knows where they will be teleported
            price = SmallEventConstants.CART.TRANSPARENT_TP_PRICE;
            displayedDestination = destination;
        } else if (chance <= SmallEventConstants.CART.HIDDEN_TP_THRESHOLD) {
            // The player doesn't know where they will be teleported
            displayedDestination = null;
            price = SmallEventConstants.CART.HIDDEN_TP_PRICE;
        } else if (chance <= SmallEventConstants.CART.SCAM_THRESHOLD) {
            // The NPC lied about the destination but offers the trip for cheap
            displayedDestination = MapLinkDataController.instance.getRandomExcept(player.mapLinkId);
            price = SmallEventConstants.CART.SCAM_TP_PRICE;
        } else {
            // The trip is just cheap
            displayedDestination = destination;
            price = SmallEventConstants.CART.SCAM_TP_PRICE;
        }

        // Apply the RANDOM_PRICE_BONUS
        price = Math.round(price * (1 + RandomUtils.draftbotRandom.realZeroToOneInclusive() * SmallEventConstants.CART.RANDOM_PRICE_BONUS));
        const cartObject = {player, destination, price, displayedDestination};
        const collector = new ReactionCollectorCart(
            displayedDestination ? displayedDestination.id : -1,
            price
        );
        const endCallback: EndCallback = async (collector, response) => {
            BlockingUtils.unblockPlayer(player.id, BlockingConstants.REASONS.CART_CHOOSE);
            const reaction = collector.getFirstReaction().reaction;

            const reactionEmoji = !reaction
                ? Constants.REACTIONS.NOT_REPLIED_REACTION
                : reaction instanceof ReactionCollectorCartValidate
                    ? SmallEventConstants.CART.REACTIONS.ACCEPT
                    : SmallEventConstants.CART.REACTIONS.REFUSE;

            const descriptionKey = await manageTeleportation(response, cartObject, reactionEmoji);
            const packet = makePacket(SmallEventCartPacket, {
                value: descriptionKey,
            });
            response.push(packet);
        }

        const packet = new ReactionCollectorInstance(
            collector,
            context,
            {
                allowedPlayerKeycloakIds: [player.keycloakId]
            },
            endCallback
        )
            .block(player.id, BlockingConstants.REASONS.CART_CHOOSE)
            .build();
        response.push(packet);
    }
    // 	const collector = new ReactionCollectorGobletsGame();
    //
    // 	const endCallback: EndCallback = async (collector, response) => {
    // 		await applyMalus(response, player, collector.getFirstReaction().reaction);
    // 		BlockingUtils.unblockPlayer(player.id, BlockingConstants.REASONS.GOBLET_CHOOSE);
    // 	};
    //
    // 	const packet = new ReactionCollectorInstance(
    // 		collector,
    // 		context,
    // 		{
    // 			allowedPlayerKeycloakIds: [player.keycloakId]
    // 		},
    // 		endCallback
    // 	)
    // 		.block(player.id, BlockingConstants.REASONS.GOBLET_CHOOSE)
    // 		.build();
    //
    // 	response.push(packet);
    // }
};