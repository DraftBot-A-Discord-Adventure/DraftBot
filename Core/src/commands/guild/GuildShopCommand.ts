import {packetHandler} from "../../core/packetHandlers/PacketHandler";
import {DraftBotPacket, makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {
	CommandGuildShopEmpty, CommandGuildShopGiveXp,
	CommandGuildShopNoFoodStorageSpace,
	CommandGuildShopPacketReq
} from "../../../../Lib/src/packets/commands/CommandGuildShopPacket";
import {Players} from "../../core/database/game/models/Player";
import {CommandUtils} from "../../core/utils/CommandUtils";
import {Effect} from "../../../../Lib/src/enums/Effect";
import {BlockingUtils} from "../../core/utils/BlockingUtils";
import {
	ReactionCollectorShop,
	ShopCategory,
	ShopItem
} from "../../../../Lib/src/packets/interaction/ReactionCollectorShop";
import {GuildShopConstants} from "../../../../Lib/src/constants/GuildShopConstants";
import {Guilds} from "../../core/database/game/models/Guild";
import {GuildUtils} from "../../core/utils/GuildUtils";
import {NumberChangeReason, ShopItemType} from "../../../../Lib/src/constants/LogsConstants";
import {draftBotInstance} from "../../index";
import {getFoodIndexOf, giveFoodToGuild} from "../../core/utils/FoodUtils";
import {MissionsController} from "../../core/missions/MissionsController";
import {GuildConstants} from "../../../../Lib/src/constants/GuildConstants";
import {ShopUtils} from "../../core/utils/ShopUtils";
import {PetConstants} from "../../../../Lib/src/constants/PetConstants";

async function giveGuildXp(response: DraftBotPacket[], playerId: number, price: number): Promise<boolean> {
	const player = await Players.getById(playerId);
	const guild = await Guilds.getById(player.guildId);

	const xpToAdd = GuildUtils.calculateAmountOfXPToAdd(price);
	await guild.addExperience(xpToAdd, response, NumberChangeReason.SHOP);
	await guild.save();

	response.push(makePacket(CommandGuildShopGiveXp, {xp: xpToAdd}));

	draftBotInstance.logsDatabase.logGuildShopBuyout(player.keycloakId, ShopItemType.GUILD_XP).then();

	return true;
}

/**
 * Get the shop item for winning xp
 */
function getGuildXPShopItem(): ShopItem {
	return {
		id: "smallGuildXp",
		price: GuildShopConstants.PRICES.XP,
		amounts: [1],
		buyCallback: async (context: PacketContext, response: DraftBotPacket[], playerId: number): Promise<boolean> => await giveGuildXp(response, playerId, GuildShopConstants.PRICES.XP)
	};
}

/**
 * Get the shop item for winning xp
 */
function getBigGuildXPShopItem(): ShopItem {
	return {
		id: "bigGuildXp",
		price: GuildShopConstants.PRICES.BIG_XP,
		amounts: [1],
		buyCallback: async (context: PacketContext, response: DraftBotPacket[], playerId: number): Promise<boolean> => await giveGuildXp(response, playerId, GuildShopConstants.PRICES.BIG_XP)
	};
}

/**
 * Get the shop item for buying a given amount of a given food
 * @param name
 * @param amounts
 */
function getFoodShopItem(name: string, amounts: number[]): ShopItem {
	const indexFood = getFoodIndexOf(name);
	return {
		id: name,
		price: GuildShopConstants.PRICES.FOOD[indexFood],
		amounts,
		buyCallback: async (context: PacketContext, response: DraftBotPacket[], playerId: number, amount: number): Promise<boolean> => {
			const player = await Players.getById(playerId);
			const guild = await Guilds.getById(player.guildId);

			if (guild.isStorageFullFor(name, amount)) {
				response.push(makePacket(CommandGuildShopNoFoodStorageSpace, {}));
				return false;
			}

			await giveFoodToGuild(response, player, name, amount, NumberChangeReason.SHOP);

			if (name === PetConstants.PET_FOOD.ULTIMATE_FOOD) {
				await MissionsController.update(player, response, {
					missionId: "buyUltimateSoups",
					count: amount
				});
			}

			draftBotInstance.logsDatabase.logFoodGuildShopBuyout(player.keycloakId, name, amount).then();
			return true;
		}
	};
}


export default class GuildShopCommand {
	@packetHandler(CommandGuildShopPacketReq)
	static async execute(
		packet: CommandGuildShopPacketReq,
		context: PacketContext,
		response: DraftBotPacket[]
	): Promise<void> {
		const player = await Players.getOrRegister(context.keycloakId);

		if (BlockingUtils.appendBlockedPacket(player, response)) {
			return;
		}

		if (!await CommandUtils.verifyCommandRequirements(player, context, response, {
			disallowedEffects: [Effect.NOT_STARTED, Effect.DEAD, Effect.JAILED],
			guildNeeded: true
		})) {
			return;
		}

		const shopCategories: ShopCategory[] = [];

		const guild = await Guilds.getById(player.guildId);
		const commonFoodRemainingSlots = GuildConstants.MAX_COMMON_PET_FOOD - guild.commonFood;
		const herbivorousFoodRemainingSlots = GuildConstants.MAX_HERBIVOROUS_PET_FOOD - guild.herbivorousFood;
		const carnivorousFoodRemainingSlots = GuildConstants.MAX_CARNIVOROUS_PET_FOOD - guild.carnivorousFood;
		const ultimateFoodRemainingSlots = GuildConstants.MAX_ULTIMATE_PET_FOOD - guild.ultimateFood;

		if (!guild.isAtMaxLevel()) {
			shopCategories.push({
				id: "guildXp",
				items: [getGuildXPShopItem(), getBigGuildXPShopItem()]
			});
		}

		const foodItems: ShopItem[] = [];

		if (commonFoodRemainingSlots > 0) {
			const amounts: number[] = [1, Math.min(5, commonFoodRemainingSlots), Math.min(10, commonFoodRemainingSlots)];
			foodItems.push(getFoodShopItem(PetConstants.PET_FOOD.COMMON_FOOD, [...new Set(amounts)])); // Remove duplicates
		}

		if (herbivorousFoodRemainingSlots > 0) {
			const amounts: number[] = [1, Math.min(5, herbivorousFoodRemainingSlots), Math.min(10, herbivorousFoodRemainingSlots)];
			foodItems.push(getFoodShopItem(PetConstants.PET_FOOD.HERBIVOROUS_FOOD, [...new Set(amounts)])); // Remove duplicates
		}

		if (carnivorousFoodRemainingSlots > 0) {
			const amounts: number[] = [1, Math.min(5, carnivorousFoodRemainingSlots), Math.min(10, carnivorousFoodRemainingSlots)];
			foodItems.push(getFoodShopItem(PetConstants.PET_FOOD.CARNIVOROUS_FOOD, [...new Set(amounts)])); // Remove duplicates
		}

		if (ultimateFoodRemainingSlots > 0) {
			const amounts: number[] = [1, Math.min(5, ultimateFoodRemainingSlots), Math.min(10, ultimateFoodRemainingSlots)];
			foodItems.push(getFoodShopItem(PetConstants.PET_FOOD.ULTIMATE_FOOD, [...new Set(amounts)])); // Remove duplicates
		}

		if (foodItems.length > 0) {
			shopCategories.push({
				id: "food",
				items: foodItems
			});
		}

		if (shopCategories.length === 0) {
			response.push(makePacket(CommandGuildShopEmpty, {}));
			return;
		}

		ShopUtils.sendShopCollector(new ReactionCollectorShop(
			shopCategories,
			player.money,
			undefined,
			undefined
		), shopCategories, context, response, player);
	}
}