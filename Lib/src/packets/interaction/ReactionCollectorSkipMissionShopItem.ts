import {
	ReactionCollector,
	ReactionCollectorCreationPacket,
	ReactionCollectorData,
	ReactionCollectorReaction
} from "./ReactionCollectorPacket";
import { BaseMission } from "../../types/CompletedMission";

export class ReactionCollectorSkipMissionShopItemData extends ReactionCollectorData {
}

export class ReactionCollectorSkipMissionShopItemReaction extends ReactionCollectorReaction {
	missionIndex!: number;

	mission!: BaseMission;
}

export class ReactionCollectorSkipMissionShopItemCloseReaction extends ReactionCollectorReaction {
}

export class ReactionCollectorSkipMissionShopItem extends ReactionCollector {
	private readonly missionList: BaseMission[];

	constructor(missionList: BaseMission[]) {
		super();
		this.missionList = missionList;
	}

	creationPacket(id: string, endTime: number): ReactionCollectorCreationPacket {
		const reactions: {
			type: string;
			data: ReactionCollectorReaction;
		}[] = this.missionList.map((mission, missionIndex) => this.buildReaction(ReactionCollectorSkipMissionShopItemReaction, {
			mission,
			missionIndex
		}));

		reactions.push(this.buildReaction(ReactionCollectorSkipMissionShopItemCloseReaction, {}));

		return {
			id,
			endTime,
			reactions,
			data: this.buildData(ReactionCollectorSkipMissionShopItemData, {})
		};
	}
}
