import {GenericItem} from "../../../data/GenericItem";
import Player from "../../database/game/models/Player";
import {Maps} from "../../maps/Maps";
import {ExecuteSmallEventLike} from "../../../data/SmallEvent";
import {getItemValue, giveItemToPlayer} from "../../utils/ItemUtils";
import {EndCallback, ReactionCollectorInstance} from "../../utils/ReactionsCollector";
import {BlockingConstants} from "../../constants/BlockingConstants";
import {BlockingUtils} from "../../utils/BlockingUtils";
import {SmallEventAnyShopPacket} from "../../../../../Lib/src/packets/smallEvents/SmallEventAnyShopPacket";
import {InventorySlots} from "../../database/game/models/InventorySlot";
import {SmallEventConstants} from "../../constants/SmallEventConstants";
import {NumberChangeReason} from "../../constants/LogsConstants";
import {DraftBotPacket} from "../../../../../Lib/src/packets/DraftBotPacket";
import {ReactionCollectorMerchant, ReactionCollectorMerchantAcceptReaction} from "../../../../../Lib/src/packets/interaction/ReactionCollectorMerchant";

export abstract class Shop<T extends SmallEventAnyShopPacket> {
	canBeExecuted = Maps.isOnContinent;

	protected itemMultiplier: number;

	protected randomItem: GenericItem;

	protected itemPrice: number;

	abstract getRandomItem(): GenericItem | Promise<GenericItem>;

	abstract getPriceMultiplier(player: Player): number | Promise<number>;

	abstract getSmallEventPacket(): T;

	public executeSmallEvent: ExecuteSmallEventLike = async (context, response, player) => {
		this.itemMultiplier = await this.getPriceMultiplier(player);
		this.randomItem = await this.getRandomItem();
		this.itemPrice = Math.round(getItemValue(this.randomItem) * this.itemMultiplier);

		const collector = new ReactionCollectorMerchant({
			itemCategory: this.randomItem.getCategory(),
			itemId: this.randomItem.id,
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
			.block(player.id, BlockingConstants.REASONS.MERCHANT)
			.build();

		response.push(packet);
	};

	private callbackShopSmallEvent(player: Player): EndCallback {
		return async (collector: ReactionCollectorInstance, response: DraftBotPacket[]) => {
			BlockingUtils.unblockPlayer(player.id, BlockingConstants.REASONS.MERCHANT);
			const packet = this.getSmallEventPacket();
			const reaction = collector.getFirstReaction().reaction;
			packet.isValidated = reaction && reaction instanceof ReactionCollectorMerchantAcceptReaction;
			packet.canBuy = player.money >= this.itemPrice;
			response.push(packet);
			if (!packet.isValidated || !packet.canBuy) {
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