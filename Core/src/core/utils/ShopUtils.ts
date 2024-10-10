import {
	CommandShopClosed, CommandShopNotEnoughMoney,
	ReactionCollectorShop,
	ReactionCollectorShopCloseReaction,
	ReactionCollectorShopItemReaction,
	ShopCategory
} from "../../../../Lib/src/packets/interaction/ReactionCollectorShop";
import {DraftBotPacket, makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {EndCallback, ReactionCollectorInstance} from "./ReactionsCollector";
import {BlockingConstants} from "../../../../Lib/src/constants/BlockingConstants";
import {BlockingUtils} from "./BlockingUtils";
import Player, {Players} from "../database/game/models/Player";
import {NumberChangeReason} from "../../../../Lib/src/constants/LogsConstants";

export class ShopUtils {
	public static sendShopCollector(
		collector: ReactionCollectorShop,
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
			}
			else {
				const reactionInstance = reaction.reaction.data as ReactionCollectorShopItemReaction;
				const buyResult = await shopCategories
					.find(category => category.id === reactionInstance.shopCategoryId).items
					.find(item => item.id === reactionInstance.shopItemId).buyCallback(context, response, player.id, reactionInstance.amount);
				if (buyResult) {
					const player = await Players.getByKeycloakId(reaction.keycloakId);
					if (player.money < reactionInstance.price) {
						response.push(makePacket(CommandShopNotEnoughMoney, {
							missingMoney: reactionInstance.price - player.money
						}));
					}
					else {
						await player.spendMoney({
							amount: reactionInstance.price,
							reason: NumberChangeReason.SHOP,
							response
						});
					}
				}
			}
		};

		const packet = new ReactionCollectorInstance(
			collector,
			context,
			{
				allowedPlayerKeycloakIds: [player.keycloakId]
			},
			endCallback
		)
			.block(player.id, BlockingConstants.REASONS.REPORT)
			.build();

		response.push(packet);
	}
}