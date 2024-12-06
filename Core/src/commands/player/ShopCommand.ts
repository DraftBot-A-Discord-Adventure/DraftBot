import {DraftBotPacket, makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {CommandShopPacketReq} from "../../../../Lib/src/packets/commands/CommandShopPacket";
import {BlockingUtils} from "../../core/utils/BlockingUtils";
import {Player, Players} from "../../core/database/game/models/Player";
import {LogsReadRequests} from "../../core/database/logs/LogsReadRequests";
import {ShopUtils} from "../../core/utils/ShopUtils";
import {
	CommandShopAlreadyHaveBadge,
	CommandShopBadgeBought,
	CommandShopBoughtTooMuchDailyPotions,
	CommandShopClosed,
	CommandShopFullRegen,
	CommandShopHealAlterationDone,
	CommandShopNoAlterationToHeal,
	CommandShopNoEnergyToHeal,
	CommandShopTooManyEnergyBought,
	ReactionCollectorShop,
	ShopCategory,
	ShopItem
} from "../../../../Lib/src/packets/interaction/ReactionCollectorShop";
import {ShopConstants} from "../../../../Lib/src/constants/ShopConstants";
import {getItemValue, giveItemToPlayer, giveRandomItem, toItemWithDetails} from "../../core/utils/ItemUtils";
import {draftBotInstance} from "../../index";
import {NumberChangeReason, ShopItemType} from "../../../../Lib/src/constants/LogsConstants";
import {millisecondsToMinutes} from "../../../../Lib/src/utils/TimeUtils";
import {Effect} from "../../../../Lib/src/enums/Effect";
import {TravelTime} from "../../core/maps/TravelTime";
import {MissionsController} from "../../core/missions/MissionsController";
import {EntityConstants} from "../../../../Lib/src/constants/EntityConstants";
import {Potion, PotionDataController} from "../../data/Potion";
import {Settings} from "../../core/database/game/models/Setting";
import {InventorySlots} from "../../core/database/game/models/InventorySlot";
import {InventoryInfos} from "../../core/database/game/models/InventoryInfo";
import {ItemConstants} from "../../../../Lib/src/constants/ItemConstants";
import {EndCallback, ReactionCollectorInstance} from "../../core/utils/ReactionsCollector";
import {BlockingConstants} from "../../../../Lib/src/constants/BlockingConstants";
import {
	ReactionCollectorBuyCategorySlot,
	ReactionCollectorBuyCategorySlotBuySuccess,
	ReactionCollectorBuyCategorySlotCancelReaction,
	ReactionCollectorBuyCategorySlotReaction
} from "../../../../Lib/src/packets/interaction/ReactionCollectorBuyCategorySlot";
import {DraftBotIcons} from "../../../../Lib/src/DraftBotIcons";
import {commandRequires, CommandUtils} from "../../core/utils/CommandUtils";

/**
 * Get the shop item for getting a random item
 */
function getRandomItemShopItem(): ShopItem {
	return {
		id: "randomItem",
		price: ShopConstants.RANDOM_ITEM_PRICE,
		amounts: [1],
		buyCallback: async (context, response, playerId): Promise<boolean> => {
			const player = await Players.getById(playerId);
			await giveRandomItem(context, response, player);
			draftBotInstance.logsDatabase.logClassicalShopBuyout(player.keycloakId, ShopItemType.RANDOM_ITEM).then();
			return true;
		}
	};
}

/**
 * Calculate the price for healing from an alteration
 * @param player
 */
function calculateHealAlterationPrice(player: Player): number {
	let price = ShopConstants.ALTERATION_HEAL_BASE_PRICE;
	const remainingTime = millisecondsToMinutes(player.effectRemainingTime());
	// If the remaining time is under one hour,
	// The price becomes degressive until being divided by 8 at the 15-minute marque;
	// Then it no longer decreases
	if (remainingTime < ShopConstants.MAX_REDUCTION_TIME) {
		if (remainingTime <= ShopConstants.MIN_REDUCTION_TIME) {
			price /= ShopConstants.MAX_PRICE_REDUCTION_DIVISOR;
		}
		else {
			// Calculate the price reduction based on the remaining time
			const priceDecreasePerMinute = (
				ShopConstants.ALTERATION_HEAL_BASE_PRICE - ShopConstants.ALTERATION_HEAL_BASE_PRICE / ShopConstants.MAX_PRICE_REDUCTION_DIVISOR
			) / (
				ShopConstants.MAX_REDUCTION_TIME - ShopConstants.MIN_REDUCTION_TIME
			);
			price -= priceDecreasePerMinute * (ShopConstants.MAX_REDUCTION_TIME - remainingTime);
		}
	}
	return Math.round(price);
}

/**
 * Get the shop item for healing from an alteration
 * @param player
 */
function getHealAlterationShopItem(player: Player): ShopItem {
	const price = calculateHealAlterationPrice(player);
	return {
		id: "healAlteration",
		price,
		amounts: [1],
		buyCallback: async (context, response, playerId): Promise<boolean> => {
			const player = await Players.getById(playerId);
			if (player.currentEffectFinished(new Date())) {
				response.push(makePacket(CommandShopNoAlterationToHeal, {}));
				return false;
			}
			if (player.effectId !== Effect.DEAD.id && player.effectId !== Effect.JAILED.id) {
				await TravelTime.removeEffect(player, NumberChangeReason.SHOP);
				await player.save();
			}
			await MissionsController.update(player, response, {missionId: "recoverAlteration"});
			response.push(makePacket(CommandShopHealAlterationDone, {}));
			draftBotInstance.logsDatabase.logClassicalShopBuyout(player.keycloakId, ShopItemType.ALTERATION_HEAL).then();
			return true;
		}
	};
}

/**
 * Get the shop item for recovering energy
 * @param healEnergyAlreadyPurchased
 */
function getHealEnergyShopItem(healEnergyAlreadyPurchased: number): ShopItem {
	return {
		id: "healEnergy",
		price: EntityConstants.HEAL_ENERGY_PRICE[healEnergyAlreadyPurchased > EntityConstants.HEAL_ENERGY_PRICE.length - 1 ? EntityConstants.HEAL_ENERGY_PRICE.length - 1 : healEnergyAlreadyPurchased],
		amounts: [1],
		buyCallback: async (context, response, playerId): Promise<boolean> => {
			const player = await Players.getById(playerId);
			if (healEnergyAlreadyPurchased > EntityConstants.HEAL_ENERGY_PRICE.length - 1) {
				response.push(makePacket(CommandShopTooManyEnergyBought, {}));
				return false;
			}
			if (player.fightPointsLost === 0) {
				response.push(makePacket(CommandShopNoEnergyToHeal, {}));
				return false;
			}
			player.setFightPointsLost(0, NumberChangeReason.SHOP);
			await player.save();
			draftBotInstance.logsDatabase.logClassicalShopBuyout(player.keycloakId, ShopItemType.ENERGY_HEAL).then();
			return true;
		}
	};
}

/**
 * Get the shop item for regenerating to full life
 */
function getRegenShopItem(): ShopItem {
	return {
		id: "regen",
		price: ShopConstants.FULL_REGEN_PRICE,
		amounts: [1],
		buyCallback: async (context, response, playerId): Promise<boolean> => {
			const player = await Players.getById(playerId);
			await player.addHealth(player.getMaxHealth() - player.health, response, NumberChangeReason.SHOP, {
				shouldPokeMission: true,
				overHealCountsForMission: false
			});
			await player.save();
			response.push(makePacket(CommandShopFullRegen, {}));
			draftBotInstance.logsDatabase.logClassicalShopBuyout(player.keycloakId, ShopItemType.FULL_REGEN).then();
			return true;
		}
	};
}


/**
 * Get the shop item for the money mouth badge
 */
function getBadgeShopItem(): ShopItem {
	return {
		id: "moneyMouthBadge",
		price: ShopConstants.MONEY_MOUTH_BADGE_PRICE,
		amounts: [1],
		buyCallback: async (context, response, playerId): Promise<boolean> => {
			const player = await Players.getById(playerId);
			if (player.hasBadge(DraftBotIcons.badges.richPerson)) {
				response.push(makePacket(CommandShopAlreadyHaveBadge, {}));
				return false;
			}
			player.addBadge(DraftBotIcons.badges.richPerson);
			await player.save();
			response.push(makePacket(CommandShopBadgeBought, {}));
			draftBotInstance.logsDatabase.logClassicalShopBuyout(player.keycloakId, ShopItemType.BADGE).then();
			return true;
		}
	};
}

/**
 * Get the shop item for getting the daily potion
 * @param potion
 */
function getDailyPotionShopItem(potion: Potion): ShopItem {
	return {
		id: "dailyPotion",
		price: Math.round(getItemValue(potion) * ShopConstants.DAILY_POTION_DISCOUNT_MULTIPLIER),
		amounts: [1],
		buyCallback: async (context, response, playerId): Promise<boolean> => {
			const player = await Players.getById(playerId);
			const potionAlreadyPurchased = await LogsReadRequests.getAmountOfDailyPotionsBoughtByPlayer(player.keycloakId);
			if (potionAlreadyPurchased >= ShopConstants.MAX_DAILY_POTION_BUYOUTS) {
				response.push(makePacket(CommandShopBoughtTooMuchDailyPotions, {}));
				return false;
			}
			await giveItemToPlayer(player, potion, context, response, await InventorySlots.getOfPlayer(player.id));
			draftBotInstance.logsDatabase.logClassicalShopBuyout(player.keycloakId, ShopItemType.DAILY_POTION).then();
			if (potionAlreadyPurchased === ShopConstants.MAX_DAILY_POTION_BUYOUTS - 1) {
				await MissionsController.update(player, response, {missionId: "dailyPotionsStock"});
			}
			return true;
		}
	};
}

function getBuySlotExtensionShopItemCallback(playerId: number, price: number): EndCallback {
	return async (collector, response): Promise<void> => {
		const player = await Players.getById(playerId);
		const reaction = collector.getFirstReaction();
		if (!reaction || reaction.reaction.type === ReactionCollectorBuyCategorySlotCancelReaction.name) {
			BlockingUtils.unblockPlayer(player.id, BlockingConstants.REASONS.SHOP);
			response.push(makePacket(CommandShopClosed, {}));
			return;
		}

		const invInfo = await InventoryInfos.getOfPlayer(player.id);
		const category = (reaction.reaction.data as ReactionCollectorBuyCategorySlotReaction).categoryId;

		await player.spendMoney({
			amount: price,
			response,
			reason: NumberChangeReason.SHOP
		});
		await player.save();
		invInfo.addSlotForCategory(category);
		await invInfo.save();
		response.push(makePacket(ReactionCollectorBuyCategorySlotBuySuccess, {}));

		BlockingUtils.unblockPlayer(player.id, BlockingConstants.REASONS.SHOP);
		draftBotInstance.logsDatabase.logClassicalShopBuyout(player.keycloakId, ShopItemType.SLOT_EXTENSION).then();
	};
}

/**
 * Get the shop item for extending your inventory
 * @param player
 */
async function getSlotExtensionShopItem(player: Player): Promise<ShopItem | null> {
	const invInfo = await InventoryInfos.getOfPlayer(player.id);
	const availableCategories = [0, 1, 2, 3]
		.map(itemCategory => ItemConstants.SLOTS.LIMITS[itemCategory] - invInfo.slotLimitForCategory(itemCategory));
	if (availableCategories.every(availableCategory => availableCategory <= 0)) {
		return null;
	}
	const totalSlots = invInfo.weaponSlots + invInfo.armorSlots
		+ invInfo.potionSlots + invInfo.objectSlots;
	const price = ItemConstants.SLOTS.PRICES[totalSlots - 4];
	if (!price) {
		return null;
	}
	return {
		id: "inventoryExtension",
		price,
		amounts: [1],
		buyCallback: (context, response): boolean => {
			const collector = new ReactionCollectorBuyCategorySlot(availableCategories);

			const packet = new ReactionCollectorInstance(
				collector,
				context,
				{
					allowedPlayerKeycloakIds: [player.keycloakId]
				},
				getBuySlotExtensionShopItemCallback(player.id, price)
			)
				.block(player.id, BlockingConstants.REASONS.SHOP)
				.build();

			response.push(packet);

			return false;
		}
	};
}

export default class ShopCommand {
	@commandRequires(CommandShopPacketReq, {
		notBlocked: true,
		disallowedEffects: CommandUtils.DISALLOWED_EFFECTS.NOT_STARTED_OR_DEAD_OR_JAILED
	})
	static async execute(
		response: DraftBotPacket[],
		player: Player,
		_packet: CommandShopPacketReq,
		context: PacketContext
	): Promise<void> {
		const healEnergyAlreadyPurchased = await LogsReadRequests.getAmountOfHealEnergyBoughtByPlayerThisWeek(player.keycloakId);
		const potion = PotionDataController.instance.getById(await Settings.SHOP_POTION.getValue());

		const shopCategories: ShopCategory[] = [{
			id: "permanentItem",
			items: [
				getRandomItemShopItem(),
				getHealAlterationShopItem(player),
				getHealEnergyShopItem(healEnergyAlreadyPurchased),
				getRegenShopItem(),
				getBadgeShopItem()
			]
		}, {
			id: "dailyPotion",
			items: [getDailyPotionShopItem(potion)]
		}];

		const slotExtensionItem = await getSlotExtensionShopItem(player);
		if (slotExtensionItem) {
			shopCategories.push({
				id: "slotExtension",
				items: [slotExtensionItem]
			});
		}

		ShopUtils.sendShopCollector(new ReactionCollectorShop(
			shopCategories,
			player.money,
			ShopConstants.MAX_DAILY_POTION_BUYOUTS - await LogsReadRequests.getAmountOfDailyPotionsBoughtByPlayer(player.keycloakId),
			toItemWithDetails(potion)
		), shopCategories, context, response, player);
	}
}