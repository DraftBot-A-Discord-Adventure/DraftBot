import { expect } from "vitest";
import type { ModelStatic } from "sequelize";
import {
	CoreTestEnvironment, loadProductionModule, setupCoreForTests
} from "./_coreSetup";
import type { Player as PlayerType } from "../src/core/database/game/models/Player";
import type { InventorySlot as InventorySlotType } from "../src/core/database/game/models/InventorySlot";
import type InventoryInfoType from "../src/core/database/game/models/InventoryInfo";
import type { PlayerMissionsInfo as PlayerMissionsInfoType } from "../src/core/database/game/models/PlayerMissionsInfo";
import { ItemEnchantment } from "../../Lib/src/types/ItemEnchantment";
import { ReactionCollectorCityData } from "../../Lib/src/packets/interaction/ReactionCollectorCity";

type CityServiceModule = typeof import("../src/core/report/ReportCityService");
type EnchanterServiceModule = typeof import("../src/core/report/ReportCityEnchanterService");
type InventorySlotModule = typeof import("../src/core/database/game/models/InventorySlot");

/**
 * Live Core environment for the enchanter suites: the models a player's inventory and
 * currencies live in, and the production modules building and handling the enchanter menu.
 */
export interface EnchanterTestEnvironment {
	env: CoreTestEnvironment;
	Player: ModelStatic<PlayerType>;
	InventorySlot: ModelStatic<InventorySlotType>;
	InventoryInfo: ModelStatic<InventoryInfoType>;
	PlayerMissionsInfo: ModelStatic<PlayerMissionsInfoType>;
	cityService: CityServiceModule;
	enchanterService: EnchanterServiceModule;
	inventorySlots: InventorySlotModule;
}

export type PlayerCurrencies = {
	money: number;
	gems: number;
};

export async function setupEnchanterTests(suiteName: string): Promise<EnchanterTestEnvironment> {
	const env = await setupCoreForTests(suiteName);
	const models = env.crownicles.gameDatabase.sequelize.models;
	return {
		env,
		Player: models.Player as ModelStatic<PlayerType>,
		InventorySlot: models.InventorySlot as ModelStatic<InventorySlotType>,
		InventoryInfo: models.InventoryInfo as ModelStatic<InventoryInfoType>,
		PlayerMissionsInfo: models.PlayerMissionsInfo as ModelStatic<PlayerMissionsInfoType>,
		cityService: loadProductionModule<CityServiceModule>("core/report/ReportCityService"),
		enchanterService: loadProductionModule<EnchanterServiceModule>("core/report/ReportCityEnchanterService"),
		inventorySlots: loadProductionModule<InventorySlotModule>("core/database/game/models/InventorySlot")
	};
}

/**
 * Create a player owning the given currencies and weapon slots, without any equipment yet
 */
export async function createPlayerWithCurrencies(
	enchanterEnv: EnchanterTestEnvironment,
	params: PlayerCurrencies & {
		keycloakId: string;
		weaponSlots: number;
	}
): Promise<PlayerType> {
	const player = await enchanterEnv.Player.create({
		keycloakId: params.keycloakId,
		money: params.money
	});
	await enchanterEnv.PlayerMissionsInfo.create({
		playerId: player.id,
		gems: params.gems
	});
	await enchanterEnv.InventoryInfo.create({
		playerId: player.id,
		weaponSlots: params.weaponSlots
	});
	return player;
}

/**
 * Empty every table a test player is created in, so each test starts from a blank schema
 */
export async function truncateEnchanterTables(enchanterEnv: EnchanterTestEnvironment): Promise<void> {
	const sequelize = enchanterEnv.env.crownicles.gameDatabase.sequelize;
	await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
	try {
		for (const model of [enchanterEnv.InventorySlot, enchanterEnv.InventoryInfo, enchanterEnv.PlayerMissionsInfo, enchanterEnv.Player]) {
			await (model as ModelStatic<PlayerType>).destroy({
				truncate: true, force: true
			});
		}
	}
	finally {
		await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
	}
}

/**
 * The enchanter menu as the city sends it when the player opens it, for a non-mage player
 */
export async function buildEnchanterOpeningData(
	enchanterEnv: EnchanterTestEnvironment,
	player: PlayerType,
	enchantment: ItemEnchantment
): Promise<ReactionCollectorCityData> {
	return {
		enchanter: await enchanterEnv.cityService.buildEnchanterData({
			inventory: await enchanterEnv.inventorySlots.InventorySlots.getOfPlayer(player.id),
			player
		}, {
			enchantment,
			enchantmentId: enchantment.id,
			isPlayerMage: false
		})
	} as unknown as ReactionCollectorCityData;
}

export async function expectCurrencies(
	enchanterEnv: EnchanterTestEnvironment,
	player: PlayerType,
	expected: PlayerCurrencies
): Promise<void> {
	await player.reload();
	expect(player.money).toBe(expected.money);
	const missionsInfo = await enchanterEnv.PlayerMissionsInfo.findOne({ where: { playerId: player.id } });
	expect(missionsInfo?.gems).toBe(expected.gems);
}
