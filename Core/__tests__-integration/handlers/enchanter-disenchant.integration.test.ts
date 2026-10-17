import {
	afterAll, beforeAll, beforeEach, describe, expect, it
} from "vitest";
import {
	buildEnchanterOpeningData, createPlayerWithCurrencies, EnchanterTestEnvironment, expectCurrencies, setupEnchanterTests, truncateEnchanterTables
} from "../_enchanterSetup";
import type { Player as PlayerType } from "../../src/core/database/game/models/Player";
import { ItemCategory } from "../../../Lib/src/constants/ItemConstants";
import { ItemEnchantment } from "../../../Lib/src/types/ItemEnchantment";
import { CrowniclesPacket } from "../../../Lib/src/packets/CrowniclesPacket";
import { ReactionCollectorCityData } from "../../../Lib/src/packets/interaction/ReactionCollectorCity";


const KEYCLOAK_ID = "enchanter-disenchant";
const PLAYER_MONEY = 1_000;
const PLAYER_GEMS = 10;
const RESERVE_SLOT = 1;
const CONCURRENT_REQUESTS = 5;

const SABRE_ID = 2;
const SWORD_ID = 9;

const ENCHANTMENT_OF_THE_DAY = ItemEnchantment.PVP_ATTACK_1;
const EQUIPPED_ENCHANTMENT = ItemEnchantment.PVE_ATTACK_1;
const RESERVE_ENCHANTMENT = ItemEnchantment.ALL_ATTACK_1;

/**
 * Issue #4960: the enchanter removes enchantments for free
 */
describe("Enchanter free disenchant (issue #4960)", () => {
	let enchanterEnv: EnchanterTestEnvironment;

	async function setupPlayer(): Promise<PlayerType> {
		const player = await createPlayerWithCurrencies(enchanterEnv, {
			keycloakId: KEYCLOAK_ID,
			money: PLAYER_MONEY,
			gems: PLAYER_GEMS,
			weaponSlots: RESERVE_SLOT + 1
		});
		await enchanterEnv.InventorySlot.create({
			playerId: player.id,
			slot: 0,
			itemCategory: ItemCategory.WEAPON,
			itemId: SABRE_ID,
			itemLevel: 0,
			itemEnchantmentId: EQUIPPED_ENCHANTMENT.id
		});
		await enchanterEnv.InventorySlot.create({
			playerId: player.id,
			slot: RESERVE_SLOT,
			itemCategory: ItemCategory.WEAPON,
			itemId: SWORD_ID,
			itemLevel: 0,
			itemEnchantmentId: RESERVE_ENCHANTMENT.id
		});
		return player;
	}

	async function disenchant(player: PlayerType, slot: number, openingData: ReactionCollectorCityData): Promise<string[]> {
		const response: CrowniclesPacket[] = [];
		await enchanterEnv.enchanterService.handleEnchanterDisenchantReaction(player, {
			slot,
			itemCategory: ItemCategory.WEAPON
		}, openingData, response);
		return response.map(packet => packet.constructor.name);
	}

	async function getWeaponEnchantment(playerId: number, slot: number): Promise<string | null | undefined> {
		const inventorySlot = await enchanterEnv.InventorySlot.findOne({
			where: {
				playerId,
				slot,
				itemCategory: ItemCategory.WEAPON
			}
		});
		return inventorySlot?.itemEnchantmentId;
	}

	async function expectCurrenciesUntouched(player: PlayerType): Promise<void> {
		await expectCurrencies(enchanterEnv, player, {
			money: PLAYER_MONEY,
			gems: PLAYER_GEMS
		});
	}

	beforeAll(async () => {
		enchanterEnv = await setupEnchanterTests("enchanterdisenchant");
	});

	afterAll(async () => {
		await enchanterEnv?.env.teardown();
	});

	beforeEach(async () => {
		await truncateEnchanterTables(enchanterEnv);
	});

	it("lists every enchanted weapon, equipped or in reserve", async () => {
		const player = await setupPlayer();
		const openingData = await buildEnchanterOpeningData(enchanterEnv, player, ENCHANTMENT_OF_THE_DAY);

		expect(openingData.enchanter!.disenchantableItems.map(item => [item.slot, item.enchantmentId])).toEqual([
			[0, EQUIPPED_ENCHANTMENT.id],
			[RESERVE_SLOT, RESERVE_ENCHANTMENT.id]
		]);
	});

	it("removes the enchantment of a reserve weapon without charging anything", async () => {
		const player = await setupPlayer();
		const openingData = await buildEnchanterOpeningData(enchanterEnv, player, ENCHANTMENT_OF_THE_DAY);

		expect(await disenchant(player, RESERVE_SLOT, openingData)).toEqual(["CommandReportEnchanterDisenchantRes"]);

		expect(await getWeaponEnchantment(player.id, RESERVE_SLOT)).toBeNull();
		expect(await getWeaponEnchantment(player.id, 0)).toBe(EQUIPPED_ENCHANTMENT.id);
		await expectCurrenciesUntouched(player);
	});

	it("refuses to disenchant a weapon whose enchantment changed since the menu was opened", async () => {
		const player = await setupPlayer();
		const openingData = await buildEnchanterOpeningData(enchanterEnv, player, ENCHANTMENT_OF_THE_DAY);
		await enchanterEnv.InventorySlot.update({ itemEnchantmentId: ENCHANTMENT_OF_THE_DAY.id }, {
			where: {
				playerId: player.id,
				slot: 0,
				itemCategory: ItemCategory.WEAPON
			}
		});

		expect(await disenchant(player, 0, openingData)).toEqual(["CommandReportEquipmentChangedRes"]);

		expect(await getWeaponEnchantment(player.id, 0)).toBe(ENCHANTMENT_OF_THE_DAY.id);
	});

	it("disenchants exactly once under concurrent confirmations", async () => {
		const player = await setupPlayer();
		const openingData = await buildEnchanterOpeningData(enchanterEnv, player, ENCHANTMENT_OF_THE_DAY);

		const results = await Promise.all(Array.from({ length: CONCURRENT_REQUESTS }, () => disenchant(player, 0, openingData)));

		expect(results.filter(packets => packets.includes("CommandReportEnchanterDisenchantRes"))).toHaveLength(1);
		expect(results.filter(packets => packets.includes("CommandReportEquipmentChangedRes"))).toHaveLength(CONCURRENT_REQUESTS - 1);
		expect(await getWeaponEnchantment(player.id, 0)).toBeNull();
		await expectCurrenciesUntouched(player);
	});
});
