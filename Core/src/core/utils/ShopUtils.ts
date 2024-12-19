import {
	CommandShopClosed,
	CommandShopNotEnoughCurrency,
	ReactionCollectorShop,
	ReactionCollectorShopCloseReaction,
	ReactionCollectorShopItemReaction,
	ShopCategory
} from "../../../../Lib/src/packets/interaction/ReactionCollectorShop";
import {DraftBotPacket, makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {EndCallback, ReactionCollectorInstance} from "./ReactionsCollector";
import {BlockingConstants} from "../../../../Lib/src/constants/BlockingConstants";
import {BlockingUtils} from "./BlockingUtils";
import Player from "../database/game/models/Player";
import {NumberChangeReason} from "../../../../Lib/src/constants/LogsConstants";
import {ShopCurrency} from "../../../../Lib/src/constants/ShopConstants";
import PlayerMissionsInfo, {PlayerMissionsInfos} from "../database/game/models/PlayerMissionsInfo";

export class ShopUtils {
	public static sendShopCollector(
		collectorShop: ReactionCollectorShop,
		shopCategories: ShopCategory[],
		context: PacketContext,
		response: DraftBotPacket[],
		player: Player
	): void {
		const endCallback: EndCallback = async (collector, response) => {
			const reaction = collector.getFirstReaction();

			if (!reaction || reaction.reaction.type === ReactionCollectorShopCloseReaction.name) {
				BlockingUtils.unblockPlayer(player.id, BlockingConstants.REASONS.SHOP);
				response.push(makePacket(CommandShopClosed, {}));
				return;
			}
			const reactionInstance = reaction.reaction.data as ReactionCollectorShopItemReaction;
			const interestingPlayerInfo = collectorShop.currency === ShopCurrency.MONEY ? player : await PlayerMissionsInfos.getOfPlayer(player.id);
			if (!this.canBuyItem(interestingPlayerInfo, reactionInstance, collectorShop.currency, response)) {
				return;
			}
			const buyResult = await shopCategories
				.find(category => category.id === reactionInstance.shopCategoryId).items
				.find(item => item.id === reactionInstance.shopItemId).buyCallback(context, response, player.id, reactionInstance.amount);
			if (buyResult) {
				await this.manageCurrencySpending(interestingPlayerInfo, reactionInstance, collectorShop.currency, response);
			}
		};

		const packet = new ReactionCollectorInstance(
			collectorShop,
			context,
			{
				allowedPlayerKeycloakIds: [player.keycloakId]
			},
			endCallback
		)
			.block(player.id, BlockingConstants.REASONS.SHOP)
			.build();

		response.push(packet);
	}

	private static canBuyItem<T extends ShopCurrency>(player: T extends ShopCurrency.MONEY ? Player : PlayerMissionsInfo, reactionInstance: ReactionCollectorShopItemReaction, currency: T, response: DraftBotPacket[]): boolean {
		const valueToCheck = player instanceof Player ? player.money : player.gems;
		if (valueToCheck < reactionInstance.price) {
			response.push(makePacket(CommandShopNotEnoughCurrency, {
				missingCurrency: reactionInstance.price - valueToCheck,
				currency
			}));
			return false;
		}
		return true;
	}

	private static async manageCurrencySpending<T extends ShopCurrency>(player: T extends ShopCurrency.MONEY ? Player : PlayerMissionsInfo, reactionInstance: ReactionCollectorShopItemReaction, currency: T, response: DraftBotPacket[]): Promise<void> {
		if (player instanceof Player) {
			await player.spendMoney({
				amount: reactionInstance.price,
				reason: NumberChangeReason.SHOP,
				response
			});
		}
		else {
			player.gems -= reactionInstance.price;
		}
		await player.save();
	}
}