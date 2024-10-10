import {
	ReactionCollector,
	ReactionCollectorCreationPacket,
	ReactionCollectorData,
	ReactionCollectorReaction
} from "./ReactionCollectorPacket";
import {DraftBotPacket, PacketDirection, sendablePacket} from "../DraftBotPacket";
import {ItemCategory} from "../../constants/ItemConstants";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class ReactionCollectorBuyCategorySlotBuySuccess extends DraftBotPacket {
}

export class ReactionCollectorBuyCategorySlotData extends ReactionCollectorData {
	price!: number;
}

export class ReactionCollectorBuyCategorySlotReaction extends ReactionCollectorReaction {
	categoryId!: ItemCategory;
}

export class ReactionCollectorBuyCategorySlotCancelReaction extends ReactionCollectorData {
}

export class ReactionCollectorBuyCategorySlot extends ReactionCollector {
	private readonly availableCategories!: number[];

	private readonly price!: number;

	constructor(availableCategories: number[], price: number) {
		super();
		this.availableCategories = availableCategories;
		this.price = price;
	}

	creationPacket(id: string, endTime: number): ReactionCollectorCreationPacket {
		const reactions = [];
		const categoriesCount = Object.keys(ItemCategory).length;
		for (let i = 0; i < categoriesCount; ++i) {
			if (this.availableCategories.includes(i)) {
				reactions.push(this.buildReaction(ReactionCollectorBuyCategorySlotReaction, {
					categoryId: i
				}));
			}
		}
		reactions.push(this.buildReaction(ReactionCollectorBuyCategorySlotCancelReaction, {}));

		return {
			id,
			endTime,
			reactions,
			data: this.buildData(ReactionCollectorBuyCategorySlotData, {
				price: this.price
			})
		};
	}
}