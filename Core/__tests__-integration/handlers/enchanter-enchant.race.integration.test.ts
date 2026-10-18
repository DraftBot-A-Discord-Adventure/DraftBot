import {
	afterAll, beforeAll, beforeEach, describe, expect, it
} from "vitest";
import { loadProductionModule } from "../_coreSetup";
import { waitFor } from "../_setup";
import {
	buildEnchanterOpeningData, createPlayerWithCurrencies, EnchanterTestEnvironment, expectCurrencies, setupEnchanterTests, truncateEnchanterTables
} from "../_enchanterSetup";
import type { Player as PlayerType } from "../../src/core/database/game/models/Player";
import type { InventorySlot as InventorySlotType } from "../../src/core/database/game/models/InventorySlot";
import { ItemCategory } from "../../../Lib/src/constants/ItemConstants";
import { ItemEnchantment } from "../../../Lib/src/types/ItemEnchantment";
import { CrowniclesPacket } from "../../../Lib/src/packets/CrowniclesPacket";
import { ReactionCollectorCityData } from "../../../Lib/src/packets/interaction/ReactionCollectorCity";

type PlayerModule = typeof import("../../src/core/database/game/models/Player");
type LocksModule = typeof import("../../../Lib/src/locks/withLockedEntities");

const KEYCLOAK_ID = "enchanter-enchant";
const PLAYER_MONEY = 10_000;
const PLAYER_GEMS = 10;
const CONCURRENT_REQUESTS = 5;
const LOCK_WAIT_TIMEOUT_MS = 5_000;

const SABRE_ID = 2;
const EPIC_WEAPON_ID = 1;

// Default enchantment of the day (Settings.ENCHANTER_ENCHANTMENT_ID)
const ENCHANTMENT_OF_THE_DAY = ItemEnchantment.PVP_ATTACK_1;
const PRICE = ENCHANTMENT_OF_THE_DAY.getEnchantmentCost(false);

// Enchantment of the equipment that replaces the listed one, e.g. a league reward
const SWAPPED_ENCHANTMENT = ItemEnchantment.ALL_ATTACK_1;

/**
 * Issue #4983: the paid enchantment must check the listed equipment against the locked inventory,
 * not against a slot read before the lock was taken.
 */
describe("Enchanter paid enchantment under lock (issue #4983)", () => {
	let enchanterEnv: EnchanterTestEnvironment;
	let playerModule: PlayerModule;
	let locks: LocksModule;

	async function setupPlayer(): Promise<PlayerType> {
		const player = await createPlayerWithCurrencies(enchanterEnv, {
			keycloakId: KEYCLOAK_ID,
			money: PLAYER_MONEY,
			gems: PLAYER_GEMS,
			weaponSlots: 1
		});
		await enchanterEnv.InventorySlot.create({
			playerId: player.id,
			slot: 0,
			itemCategory: ItemCategory.WEAPON,
			itemId: SABRE_ID,
			itemLevel: 0,
			itemEnchantmentId: null
		});
		return player;
	}

	async function buildOpeningData(player: PlayerType): Promise<ReactionCollectorCityData> {
		const openingData = await buildEnchanterOpeningData(enchanterEnv, player, ENCHANTMENT_OF_THE_DAY);
		expect(openingData.enchanter!.enchantableItems.map(item => item.slot)).toEqual([0]);
		return openingData;
	}

	async function enchant(player: PlayerType, openingData: ReactionCollectorCityData): Promise<string[]> {
		const response: CrowniclesPacket[] = [];
		await enchanterEnv.enchanterService.handleEnchantReaction(player, {
			slot: 0,
			itemCategory: ItemCategory.WEAPON
		}, openingData, response);
		return response.map(packet => packet.constructor.name);
	}

	async function getWeaponSlot(playerId: number): Promise<InventorySlotType | null> {
		return await enchanterEnv.InventorySlot.findOne({
			where: {
				playerId,
				slot: 0,
				itemCategory: ItemCategory.WEAPON
			}
		});
	}

	/**
	 * Whether another connection of the test user waits on a `SELECT … FOR UPDATE`
	 */
	async function hasPendingRowLock(): Promise<boolean> {
		const [rows] = await enchanterEnv.env.crownicles.gameDatabase.sequelize.query(
			"SELECT COUNT(*) AS pending FROM information_schema.PROCESSLIST WHERE ID <> CONNECTION_ID() AND INFO LIKE '%FOR UPDATE%'"
		);
		return Number((rows as { pending: number | bigint }[])[0].pending) > 0;
	}

	beforeAll(async () => {
		enchanterEnv = await setupEnchanterTests("enchanterenchant");
		playerModule = loadProductionModule<PlayerModule>("core/database/game/models/Player");
		locks = loadProductionModule<LocksModule>("../../Lib/src/locks/withLockedEntities");
	});

	afterAll(async () => {
		await enchanterEnv?.env.teardown();
	});

	beforeEach(async () => {
		await truncateEnchanterTables(enchanterEnv);
	});

	it("enchants the listed weapon and charges the price", async () => {
		const player = await setupPlayer();
		const openingData = await buildOpeningData(player);

		expect(await enchant(player, openingData)).toContain("CommandReportItemEnchantedRes");

		expect((await getWeaponSlot(player.id))?.itemEnchantmentId).toBe(ENCHANTMENT_OF_THE_DAY.id);
		await expectCurrencies(enchanterEnv, player, {
			money: PLAYER_MONEY - PRICE.money,
			gems: PLAYER_GEMS - PRICE.gems
		});
	});

	it("refuses to enchant the weapon a chest action wrote into the slot while the confirmation waited for the lock", async () => {
		const player = await setupPlayer();
		const openingData = await buildOpeningData(player);

		// A chest action holds the player lock, then rewrites the slot in place before committing
		let releaseChestAction!: () => void;
		const chestActionMayFinish = new Promise<void>(resolve => {
			releaseChestAction = resolve;
		});
		let chestActionLocked = false;
		const chestAction = locks.withLockedEntities([playerModule.Player.lockKey(player.id)] as const, async () => {
			chestActionLocked = true;
			await chestActionMayFinish;
			await enchanterEnv.InventorySlot.update({
				itemId: EPIC_WEAPON_ID,
				itemEnchantmentId: SWAPPED_ENCHANTMENT.id
			}, {
				where: {
					playerId: player.id,
					slot: 0,
					itemCategory: ItemCategory.WEAPON
				}
			});
		});
		await waitFor(() => chestActionLocked);

		const confirmation = enchant(player, openingData);
		await waitFor(hasPendingRowLock, { timeoutMs: LOCK_WAIT_TIMEOUT_MS });
		releaseChestAction();
		await chestAction;

		expect(await confirmation).toEqual(["CommandReportEquipmentChangedRes"]);
		const swappedSlot = await getWeaponSlot(player.id);
		expect(swappedSlot?.itemId).toBe(EPIC_WEAPON_ID);
		expect(swappedSlot?.itemEnchantmentId).toBe(SWAPPED_ENCHANTMENT.id);
		await expectCurrencies(enchanterEnv, player, {
			money: PLAYER_MONEY,
			gems: PLAYER_GEMS
		});
	});

	it("enchants and charges exactly once under concurrent confirmations", async () => {
		const player = await setupPlayer();
		const openingData = await buildOpeningData(player);

		const results = await Promise.all(Array.from({ length: CONCURRENT_REQUESTS }, () => enchant(player, openingData)));

		expect(results.filter(packets => packets.includes("CommandReportItemEnchantedRes"))).toHaveLength(1);
		expect(results.filter(packets => packets.includes("CommandReportEquipmentChangedRes"))).toHaveLength(CONCURRENT_REQUESTS - 1);
		expect((await getWeaponSlot(player.id))?.itemEnchantmentId).toBe(ENCHANTMENT_OF_THE_DAY.id);
		await expectCurrencies(enchanterEnv, player, {
			money: PLAYER_MONEY - PRICE.money,
			gems: PLAYER_GEMS - PRICE.gems
		});
	});
});
