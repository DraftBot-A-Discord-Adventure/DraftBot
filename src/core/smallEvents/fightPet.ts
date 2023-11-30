import Player from "../database/game/models/Player";
import {SmallEventConstants} from "../constants/SmallEventConstants";
import {ClassInfoConstants} from "../constants/ClassInfoConstants";
import {FightPetAction, FightPetActionDataController} from "../../data/FightPetAction";
import {Constants} from "../Constants";
import {GenericReactionCollector, ReactionCollector} from "../utils/ReactionsCollector";
import {Maps} from "../maps/Maps";
import {SmallEventFuncs} from "../../data/SmallEvent";
import {PetDataController} from "../../data/Pet";
import {ReactionCollectorType} from "../../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {BlockingUtils} from "../utils/BlockingUtils";
import {makePacket} from "../../../../Lib/src/packets/DraftBotPacket";
import {BlockingConstants} from "../constants/BlockingConstants";
import {SmallEventFightPetCollectorCreationPacket, SmallEventFightPetPacket} from "../../../../Lib/src/packets/smallEvents/SmallEventFightPetPacket";
import {NumberChangeReason} from "../constants/LogsConstants";
import {RandomUtils} from "../utils/RandomUtils";

/**
 * Returns an object composed of three random witch events
 * @param player all the information about the player
 */
function getRandomFightPetActions(player: Player): FightPetAction[] {
	let amountOfActions = SmallEventConstants.FIGHT_PET.BASE_ACTION_AMOUNT;

	// Higher level players get more actions
	if (player.level > SmallEventConstants.FIGHT_PET.LEVEL_TO_UNLOCK_NEW_ACTION) {
		amountOfActions++;
	}

	// Some classes get a bonus action
	if (player.class in ClassInfoConstants.CLASSES_WITH_BONUS_ACTION) {
		amountOfActions++;
	}

	// Get random actions
	const actions: FightPetAction[] = [];
	for (let i = 0; i < amountOfActions; ++i) {
		actions.push(FightPetActionDataController.instance.getRandomFightPetAction(actions));
	}

	return actions;
}

/**
 * Get the selected event from the user's choice
 * @param collector
 */
function retrieveSelectedEvent(collector: ReactionCollector): FightPetAction {
	const reaction = collector.getFirstReaction();
	// If the player did not react, we use the nothing happen event with the menu reaction deny
	const reactionEmoji = reaction ? reaction.emoji : Constants.REACTIONS.NOT_REPLIED_REACTION;
	if (reactionEmoji === Constants.REACTIONS.NOT_REPLIED_REACTION) {
		return FightPetActionDataController.instance.getNothing();
	}
	return FightPetActionDataController.instance.getFightPetActionByEmoji(reactionEmoji);
}

export const smallEventFuncs: SmallEventFuncs = {
	canBeExecuted: Maps.isOnPveIsland,
	executeSmallEvent: (response, player) => {
		const pet = PetDataController.instance.getRandom();
		const isFemale = RandomUtils.draftbotRandom.bool();
		response.push(makePacket<SmallEventFightPetCollectorCreationPacket>({
			petId: pet.id,
			isFemale,
			...GenericReactionCollector.create(
				response[0], // TODO: replace with the right one
				{
					allowedPlayerIds: [player.id],
					collectorType: ReactionCollectorType.FIGHT_PET,
					reactions: getRandomFightPetActions(player)
						.map((fightPetAction) => fightPetAction.emoji)
				},
				{
					end: async (collector, response) => {
						const selectedFightPetAction = retrieveSelectedEvent(collector);
						BlockingUtils.unblockPlayer(player.id, BlockingConstants.REASONS.FIGHT_PET_CHOOSE);
						const outcomeIsSuccess = await selectedFightPetAction.applyOutcomeFightPetAction(player, pet, isFemale);
						await player.addRage(outcomeIsSuccess ? 1 : 0, NumberChangeReason.FIGHT_PET_SMALL_EVENT);
						await player.save();
						response.push(makePacket<SmallEventFightPetPacket>({
							outcomeIsSuccess,
							petId: pet.id,
							fightPetActionId: selectedFightPetAction.id
						}));
					}
				})
				.block(player.id, BlockingConstants.REASONS.FIGHT_PET_CHOOSE)
				.allowEndReaction()
				.getPacket()
		}));
	}
};