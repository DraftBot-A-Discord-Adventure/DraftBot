import {
	ReactionCollector,
	ReactionCollectorCreationPacket,
	ReactionCollectorData,
	ReactionCollectorReaction
} from "./ReactionCollectorPacket";

export class ReactionCollectorLotteryEasyReaction extends ReactionCollectorReaction {

}

export class ReactionCollectorLotteryMediumReaction extends ReactionCollectorReaction {

}

export class ReactionCollectorLotteryHardReaction extends ReactionCollectorReaction {

}

export class ReactionCollectorLotteryData extends ReactionCollectorData {

}

export class ReactionCollectorLottery extends ReactionCollector {
	creationPacket(id: string, endTime: number): ReactionCollectorCreationPacket {
		return {
			id,
			endTime,
			reactions: [
				this.buildReaction(ReactionCollectorLotteryEasyReaction, {}),
				this.buildReaction(ReactionCollectorLotteryMediumReaction, {}),
				this.buildReaction(ReactionCollectorLotteryHardReaction, {})
			],
			data: this.buildData(ReactionCollectorLotteryData, {})
		};
	}
}
