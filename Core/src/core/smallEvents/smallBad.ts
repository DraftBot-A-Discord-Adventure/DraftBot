import {SmallEventFuncs} from "../../data/SmallEvent";
import {Maps} from "../maps/Maps";
import {RandomUtils} from "../../../../Lib/src/utils/RandomUtils";
import {SmallEventConstants} from "../../../../Lib/src/constants/SmallEventConstants";
import {NumberChangeReason} from "../../../../Lib/src/constants/LogsConstants";
import {TravelTime} from "../maps/TravelTime";
import {Effect} from "../../../../Lib/src/enums/Effect";
import {makePacket} from "../../../../Lib/src/packets/DraftBotPacket";
import {SmallEventSmallBadPacket} from "../../../../Lib/src/packets/smallEvents/SmallEventSmallBadPacket";

export const smallEventFuncs: SmallEventFuncs = {
	canBeExecuted: Maps.isOnContinent,
	executeSmallEvent: async (context, response, player): Promise<void> => {
		const issue = RandomUtils.draftbotRandom.integer(0, 2);
		let healthLost = 0, moneyLost = 0, timeLost = 0;

		switch (issue) {
		case 0:
			healthLost = RandomUtils.rangedInt(SmallEventConstants.SMALL_BAD.HEALTH);
			await player.addHealth(-healthLost, response, NumberChangeReason.SMALL_EVENT);
			break;

		case 1:
			moneyLost = RandomUtils.rangedInt(SmallEventConstants.SMALL_BAD.MONEY);
			await player.addMoney({amount: -moneyLost, response, reason: NumberChangeReason.SMALL_EVENT});
			break;

		default:
			timeLost = RandomUtils.rangedInt(SmallEventConstants.SMALL_BAD.TIME) * 5;
			await TravelTime.applyEffect(player, Effect.OCCUPIED, timeLost, new Date(), NumberChangeReason.SMALL_EVENT);
			break;
		}
		response.push(makePacket(SmallEventSmallBadPacket, {moneyLost, healthLost, timeLost}));

		await player.killIfNeeded(response, NumberChangeReason.SMALL_EVENT);
		await player.save();
	}
};