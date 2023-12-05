import {SmallEventFuncs} from "../../data/SmallEvent";
import {Maps} from "../maps/Maps";
import {EndCallback, GenericReactionCollector} from "../utils/ReactionsCollector";
import {ReactionCollectorType} from "../../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {DraftBotPacket, makePacket} from "../../../../Lib/src/packets/DraftBotPacket";
import {WitchAction, WitchActionDataController, WitchActionOutcomeType} from "../../data/WitchAction";
import {Constants} from "../Constants";
import {SmallEventConstants} from "../constants/SmallEventConstants";
import {BlockingUtils} from "../utils/BlockingUtils";
import {BlockingConstants} from "../constants/BlockingConstants";
import {RandomUtils} from "../utils/RandomUtils";
import {SmallEventWitchCollectorCreationPacket, SmallEventWitchResultPacket} from "../../../../Lib/src/packets/smallEvents/SmallEventWitchPacket";
import {generateRandomItem, giveItemToPlayer} from "../utils/ItemUtils";
import {ItemCategory, ItemNature, ItemRarity} from "../constants/ItemConstants";
import Player from "../database/game/models/Player";
import {GenericItem} from "../../data/GenericItem";
import {InventorySlots} from "../database/game/models/InventorySlot";
import {NumberChangeReason} from "../constants/LogsConstants";


type WitchEventSelection = {
	randomAdvice: WitchAction,
	randomIngredient: WitchAction,
	fullRandom: WitchAction,
	optional?: WitchAction
};

/**
 * Returns an object composed of three random witch events
 * @param isMage true if the player is a mage
 */
function getRandomWitchEvents(isMage: boolean): WitchEventSelection {
	const randomAdvice = WitchActionDataController.instance.getRandomWitchEventByType(false);
	const randomIngredient = WitchActionDataController.instance.getRandomWitchEventByType(true);
	const fullRandom = WitchActionDataController.instance.getRandomWitchAction([randomAdvice, randomIngredient]);
	if (isMage) {
		// A mage can get an additional random event
		const optional = WitchActionDataController.instance.getRandomWitchAction(
			[randomAdvice,
				randomIngredient,
				fullRandom,
				WitchActionDataController.instance.getDoNothing()]);
		return {randomAdvice, randomIngredient, optional, fullRandom};
	}
	return {randomAdvice, randomIngredient, fullRandom};
}


/**
 * Give a specific potion to a player
 * @param player
 * @param potionToGive
 * @param response
 */
async function givePotion(player: Player, potionToGive: GenericItem, response: DraftBotPacket[]): Promise<void> {
	await giveItemToPlayer(
		player,
		potionToGive,
		response[0], // TODO : replace with the right one
		response,
		await InventorySlots.getOfPlayer(player.id)
	);
}

/**
 * Execute the relevant action for the selected event and outcome
 * @param outcome
 * @param selectedEvent
 * @param player
 * @param response
 */
async function applyOutcome(outcome: WitchActionOutcomeType, selectedEvent: WitchAction, player: Player, response: DraftBotPacket[]): Promise<void> {
	if (selectedEvent.forceEffect || outcome === WitchActionOutcomeType.EFFECT) {
		await selectedEvent.giveEffect(player);
	}
	else if (outcome === WitchActionOutcomeType.LIFE_LOSS) {
		await player.addHealth(
			-SmallEventConstants.WITCH.BASE_LIFE_POINTS_REMOVED_AMOUNT,
			response,
			NumberChangeReason.SMALL_EVENT
		);
	}
	else if (outcome === WitchActionOutcomeType.POTION) {
		const potionToGive = selectedEvent.generatePotionWitchAction() ?? {
			minRarity: ItemRarity.COMMON,
			maxRarity: ItemRarity.MYTHICAL,
			nature: null
		};
		await givePotion(player, generateRandomItem(
			ItemCategory.POTION,
			potionToGive.minRarity,
			potionToGive.maxRarity,
			potionToGive.nature
		), response);
	}
	await player.save();
}

/**
 * Get the selected event from the user's choice
 * @param witchCollector
 */
function retrieveSelectedEvent(witchCollector: GenericReactionCollector): WitchAction {
	const reaction = witchCollector.getFirstReaction();
	// If the player did not react, we use the nothing happen event with the menu reaction deny
	const reactionEmoji = reaction ? reaction.emoji : Constants.REACTIONS.NOT_REPLIED_REACTION;
	return WitchActionDataController.instance.getWitchActionByEmoji(reactionEmoji);
}

function getEndCallback(player: Player): EndCallback {
	return async (collector, response) => {
		const selectedEvent = retrieveSelectedEvent(collector);
		const outcome = selectedEvent.generateOutcome();
		BlockingUtils.unblockPlayer(player.id, BlockingConstants.REASONS.WITCH_CHOOSE);

		const resultPacket = makePacket<SmallEventWitchResultPacket>({
			outcome: Object.values(WitchActionOutcomeType).indexOf(outcome)
		});

		// There is a chance that the player will get a no effect potion, no matter what he chose
		if (RandomUtils.draftbotRandom.bool(SmallEventConstants.WITCH.NO_EFFECT_CHANCE)) {
			if (selectedEvent.forceEffect) {
				await selectedEvent.giveEffect(player);
			}
			resultPacket.outcome = Object.values(WitchActionOutcomeType).indexOf(WitchActionOutcomeType.POTION);
			const potionToGive = generateRandomItem(
				ItemCategory.POTION,
				ItemRarity.COMMON,
				ItemRarity.MYTHICAL,
				ItemNature.NONE
			);
			await givePotion(player, potionToGive, response);
			return;
		}

		await applyOutcome(outcome, selectedEvent, player, response);

		await player.killIfNeeded(response, NumberChangeReason.SMALL_EVENT);

		await selectedEvent.checkMissionsWitchAction(player, outcome, response);
	};
}

export const smallEventFuncs: SmallEventFuncs = {
	canBeExecuted: Maps.isOnContinent,

	executeSmallEvent: (response, player) => {
		const events = getRandomWitchEvents(player.class === Constants.CLASSES.MYSTIC_MAGE);
		response.push(
			makePacket<SmallEventWitchCollectorCreationPacket>(
				GenericReactionCollector.create(
					response[0], // TODO : replace with the right one
					{
						collectorType: ReactionCollectorType.WITCH_SMALL_EVENT,
						allowedPlayerIds: [player.id],
						reactions: Object.values(events).map((event) => event.emoji)
					},
					{
						end: getEndCallback(player)
					}).allowEndReaction()
					.block(player.id, BlockingConstants.REASONS.WITCH_CHOOSE)
					.getPacket()
			));
	}
};
