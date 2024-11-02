import {
	ReactionCollector,
	ReactionCollectorCreationPacket,
	ReactionCollectorData,
	ReactionCollectorReaction
} from "./ReactionCollectorPacket";
import {DraftBotPacket, PacketContext, PacketDirection, sendablePacket} from "../DraftBotPacket";
import {ItemWithDetails} from "../../interfaces/ItemWithDetails";

export interface ShopItem {
	id: string;

	price: number;

	amounts: number[];

	buyCallback: (context: PacketContext, response: DraftBotPacket[], playerId: number, amount: number) => boolean | Promise<boolean>;
}

export interface ShopCategory {
	id: string;

	items: ShopItem[];
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandShopClosed extends DraftBotPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandShopNoAlterationToHeal extends DraftBotPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandShopHealAlterationDone extends DraftBotPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandShopTooManyEnergyBought extends DraftBotPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandShopNoEnergyToHeal extends DraftBotPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandShopFullRegen extends DraftBotPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandShopAlreadyHaveBadge extends DraftBotPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandShopBadgeBought extends DraftBotPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandShopBoughtTooMuchDailyPotions extends DraftBotPacket {
}

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class CommandShopNotEnoughMoney extends DraftBotPacket {
	missingMoney!: number;
}

export class ReactionCollectorShopData extends ReactionCollectorData {
	availableMoney!: number;

	remainingPotions?: number;

	dailyPotion?: ItemWithDetails;
}

export class ReactionCollectorShopItemReaction extends ReactionCollectorReaction {
	shopCategoryId!: string;

	shopItemId!: string;

	price!: number;

	amount!: number;
}

export class ReactionCollectorShopCloseReaction extends ReactionCollectorReaction {

}

export class ReactionCollectorShop extends ReactionCollector {
	private readonly shopCategories!: ShopCategory[];

	private readonly availableMoney!: number;

	private readonly remainingPotions?: number;

	private readonly dailyPotion?: ItemWithDetails;

	constructor(shopCategories: ShopCategory[], availableMoney: number, remainingPotions: number | undefined, dailyPotion: ItemWithDetails | undefined) {
		super();
		this.shopCategories = shopCategories;
		this.availableMoney = availableMoney;
		this.remainingPotions = remainingPotions;
		this.dailyPotion = dailyPotion;
	}

	creationPacket(id: string, endTime: number): ReactionCollectorCreationPacket {
		const reactions = [];
		for (const shopCategory of this.shopCategories) {
			for (const shopItem of shopCategory.items) {
				for (const amount of shopItem.amounts) {
					reactions.push(this.buildReaction(ReactionCollectorShopItemReaction, {
						shopCategoryId: shopCategory.id,
						shopItemId: shopItem.id,
						price: shopItem.price * amount,
						amount: amount
					}));
				}
			}
		}

		reactions.push(this.buildReaction(ReactionCollectorShopCloseReaction, {}));

		return {
			id,
			endTime,
			reactions,
			data: this.buildData(ReactionCollectorShopData, {
				availableMoney: this.availableMoney,
				remainingPotions: this.remainingPotions,
				dailyPotion: this.dailyPotion
			})
		};
	}
}