import { GenericItem } from "../../../data/GenericItem";
import Player from "../../database/game/models/Player";
import { Maps } from "../../maps/Maps";
import { ExecuteSmallEventLike } from "../../../data/SmallEvent";
import {
	getItemValue, giveItemToPlayer, toItemWithDetails
} from "../../utils/ItemUtils";
import {
	EndCallback, ReactionCollectorInstance
} from "../../utils/ReactionsCollector";
import { BlockingConstants } from "../../../../../Lib/src/constants/BlockingConstants";
import { BlockingUtils } from "../../utils/BlockingUtils";
import {
	SmallEventAnyShopAcceptedPacket,
	SmallEventAnyShopCannotBuyPacket,
	SmallEventAnyShopRefusedPacket
} from "../../../../../Lib/src/packets/smallEvents/SmallEventAnyShopPacket";
import { InventorySlots } from "../../database/game/models/InventorySlot";
import { SmallEventConstants } from "../../../../../Lib/src/constants/SmallEventConstants";
import { NumberChangeReason } from "../../../../../Lib/src/constants/LogsConstants";
import { DraftBotPacket } from "../../../../../Lib/src/packets/DraftBotPacket";
import {
	ReactionCollector,
	ReactionCollectorAcceptReaction
} from "../../../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import { ReactionCollectorAnyShopSmallEventData } from "../../../../../Lib/src/packets/interaction/ReactionCollectorAnyShopSmallEvent";

export abstract class Shop<
	Accept extends SmallEventAnyShopAcceptedPacket,
	Refuse extends SmallEventAnyShopRefusedPacket,
	CannotBuy extends SmallEventAnyShopCannotBuyPacket,
	Collector extends ReactionCollector
> {
	canBeExecuted = Maps.isOnContinent;

	protected itemMultiplier: number;

	protected randomItem: GenericItem;

	protected itemPrice: number;

	abstract getRandomItem(): GenericItem | Promise<GenericItem>;

	abstract getPriceMultiplier(player: Player): number | Promise<number>;

	abstract getAcceptPacket(): Accept;

	abstract getRefusePacket(): Refuse;

	abstract getCannotBuyPacket(): CannotBuy;

	abstract getPopulatedReactionCollector(basePacket: ReactionCollectorAnyShopSmallEventData): Collector;

	public executeSmallEvent: ExecuteSmallEventLike = async (response, player, context) => {
		this.itemMultiplier = await this.getPriceMultiplier(player);
		this.randomItem = await this.getRandomItem();
		this.itemPrice = Math.round(getItemValue(this.randomItem) * this.itemMultiplier);

		const collector = this.getPopulatedReactionCollector({
			item: toItemWithDetails(this.randomItem),
			price: this.itemPrice
		});

		const packet = new ReactionCollectorInstance(
			collector,
			context,
			{
				allowedPlayerKeycloakIds: [player.keycloakId]
			},
			this.callbackShopSmallEvent(player)
		)
			.block(player.keycloakId, BlockingConstants.REASONS.MERCHANT)
			.build();

		response.push(packet);
	};

	private callbackShopSmallEvent(player: Player): EndCallback {
		return async (collector: ReactionCollectorInstance, response: DraftBotPacket[]) => {
			BlockingUtils.unblockPlayer(player.keycloakId, BlockingConstants.REASONS.MERCHANT);
			const reaction = collector.getFirstReaction();
			const isValidated = reaction && reaction.reaction.type === ReactionCollectorAcceptReaction.name;
			const canBuy = player.money >= this.itemPrice;
			response.push(!isValidated ? this.getRefusePacket() : !canBuy ? this.getCannotBuyPacket() : this.getAcceptPacket());
			if (!isValidated || !canBuy) {
				return;
			}
			await giveItemToPlayer(
				player,
				this.randomItem,
				collector.context,
				response,
				await InventorySlots.getOfPlayer(player.id),
				SmallEventConstants.SHOP.RESALE_MULTIPLIER
			);
			await player.spendMoney({
				amount: this.itemPrice,
				response,
				reason: NumberChangeReason.SMALL_EVENT
			});
			await player.save();
		};
	}
}
