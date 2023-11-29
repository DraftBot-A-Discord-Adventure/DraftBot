import {GenericItem} from "../../../data/GenericItem";
import Player from "../../database/game/models/Player";
import {Maps} from "../../maps/Maps";
import {ExecuteSmallEventLike} from "../../../data/SmallEvent";
import {getItemValue, giveItemToPlayer} from "../../utils/ItemUtils";
import {EndCallback, ValidationReactionCollector} from "../../utils/ReactionsCollector";
import {ReactionCollectorType} from "../../../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {BlockingConstants} from "../../constants/BlockingConstants";
import {BlockingUtils} from "../../utils/BlockingUtils";
import {SmallEventAnyShopPacket} from "../../../../../Lib/src/packets/smallEvents/SmallEventAnyShopPacket";
import {InventorySlots} from "../../database/game/models/InventorySlot";
import {SmallEventConstants} from "../../constants/SmallEventConstants";
import {NumberChangeReason} from "../../constants/LogsConstants";

export abstract class Shop<T extends SmallEventAnyShopPacket> {
	canBeExecuted = Maps.isOnContinent;

	protected itemMultiplier: number;

	protected randomItem: GenericItem;

	protected itemPrice: number;

	abstract getRandomItem(): GenericItem | Promise<GenericItem>;

	abstract getPriceMultiplier(player: Player): number | Promise<number>;

	abstract getCollectorType(): ReactionCollectorType;

	abstract getSmallEventPacket(): T;

	public executeSmallEvent: ExecuteSmallEventLike = async (response, player) => {
		this.itemMultiplier = await this.getPriceMultiplier(player);
		this.randomItem = await this.getRandomItem();
		this.itemPrice = Math.round(getItemValue(this.randomItem) * this.itemMultiplier);
		response.push(ValidationReactionCollector.create(
			response[0], // TODO : replace with the right one
			{
				allowedPlayerIds: [player.id],
				collectorType: this.getCollectorType()
			},
			this.callbackShopSmallEvent(player))
			.block(player.id, BlockingConstants.REASONS.MERCHANT)
			.getPacket());
	};

	private callbackShopSmallEvent(player: Player): EndCallback {
		return async (collector: ValidationReactionCollector, response) => {
			BlockingUtils.unblockPlayer(player.id, BlockingConstants.REASONS.MERCHANT);
			const packet = this.getSmallEventPacket();
			packet.isValidated = collector.isValidated();
			packet.canBuy = player.money >= this.itemPrice;
			response.push(packet);
			if (!packet.isValidated || !packet.canBuy) {
				return;
			}
			await giveItemToPlayer(player, this.randomItem, response[0], // TODO : replace with the right one
				response, await InventorySlots.getOfPlayer(player.id), SmallEventConstants.SHOP.RESALE_MULTIPLIER);
			await player.spendMoney({
				amount: this.itemPrice,
				response,
				reason: NumberChangeReason.SMALL_EVENT
			});
			await player.save();
		};
	}
}