import {SmallEventDataController, SmallEventFuncs} from "../../data/SmallEvent";
import {SmallEventConstants} from "../constants/SmallEventConstants";
import {RandomUtils} from "../utils/RandomUtils";
import {NumberChangeReason} from "../constants/LogsConstants";
import {TravelTime} from "../maps/TravelTime";
import {MissionsController} from "../missions/MissionsController";

type BigBadProperties = {
	"alterationStories": {
		[key: string]: {
			"alte": string,
			"tags"?: string[]
		}
	}
}

export const smallEventFuncs: SmallEventFuncs = {
	canBeExecuted: SmallEventConstants.DEFAULT_FUNCTIONS.CAN_BE_EXECUTED.CONTINENT,
	executeSmallEvent: async (response, player): Promise<void> => {
		const outRand = RandomUtils.draftbotRandom.integer(0, 2);
		let lifeLoss, seFallen, moneyLoss;
		const bigBadProperties = SmallEventDataController.instance.getById("bigBadEvent").getProperties<BigBadProperties>();
		switch (outRand) {
		case 0:
			lifeLoss = RandomUtils.rangedInt(SmallEventConstants.BIG_BAD.HEALTH);
			await player.addHealth(-lifeLoss, response, NumberChangeReason.SMALL_EVENT);
			break;
		case 1:
			seFallen = RandomUtils.draftbotRandom.pick(Object.keys(bigBadProperties.alterationStories));
			await TravelTime.applyEffect(player, bigBadProperties.alterationStories[seFallen].alte, 0, new Date(), NumberChangeReason.SMALL_EVENT);
			if (bigBadProperties.alterationStories[seFallen].tags) {
				for (const tag of bigBadProperties.alterationStories[seFallen].tags) {
					await MissionsController.update(player, response, {
						missionId: tag,
						params: {tags: bigBadProperties.alterationStories[seFallen].tags}
					});
				}
			}
			break;
		default:
			moneyLoss = RandomUtils.rangedInt(SmallEventConstants.BIG_BAD.MONEY);
			await player.addMoney({
				amount: -moneyLoss,
				response,
				reason: NumberChangeReason.SMALL_EVENT
			});
			break;
		}
		await player.killIfNeeded(response, NumberChangeReason.SMALL_EVENT);
		await player.save();
	}
};