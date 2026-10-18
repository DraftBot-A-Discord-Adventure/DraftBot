import {
	beforeEach, describe, expect, it, vi
} from "vitest";
import stealWeapon from "../../../../../src/core/fights/actions/interfaces/pets/stealWeapon";
import { RealPlayerFighter } from "../../../../../src/core/fights/fighter/RealPlayerFighter";
import { InventorySlots } from "../../../../../src/core/database/game/models/InventorySlot";
import { RandomUtils } from "../../../../../../Lib/src/utils/RandomUtils";
import { PetAssistanceState } from "../../../../../../Lib/src/types/PetAssistanceResult";
import type { FightController } from "../../../../../src/core/fights/FightController";
import type { Fighter } from "../../../../../src/core/fights/fighter/Fighter";

type WeaponStats = {
	attack: number;
	defense: number;
	speed: number;
};

function buildOpponent(stats: WeaponStats): RealPlayerFighter {
	return Object.assign(Object.create(RealPlayerFighter.prototype) as RealPlayerFighter, {
		player: { id: 1 },
		stats: { ...stats },
		attackModifiers: [],
		defenseModifiers: [],
		speedModifiers: []
	});
}

function mockWeapon(weapon: WeaponStats): void {
	vi.spyOn(InventorySlots, "getMainSlotsItems").mockResolvedValue({
		weapon: {
			itemLevel: 0,
			item: {
				getAttack: () => weapon.attack,
				getDefense: () => weapon.defense,
				getSpeed: () => weapon.speed
			}
		}
	} as never);
}

describe("stealWeapon pet assistance", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		vi.spyOn(RandomUtils.crowniclesRandom, "bool").mockReturnValue(false);
	});

	it("removes the weapon share of every stat it impacts", async () => {
		const opponent = buildOpponent({
			attack: 300, defense: 200, speed: 100
		});
		mockWeapon({
			attack: 150, defense: 50, speed: 25
		});

		const result = await stealWeapon({} as Fighter, opponent, 1, {} as FightController);

		expect(result?.assistanceStatus).toBe(PetAssistanceState.SUCCESS);
		expect(opponent.getAttack()).toBe(150);
		expect(opponent.getDefense()).toBe(150);
		expect(opponent.getSpeed()).toBe(75);
	});

	it("keeps the stats usable when the opponent has no speed left (#4982)", async () => {
		const opponent = buildOpponent({
			attack: 300, defense: 250, speed: 0
		});
		mockWeapon({
			attack: 120, defense: -50, speed: 15
		});

		const result = await stealWeapon({} as Fighter, opponent, 1, {} as FightController);

		expect(result?.assistanceStatus).toBe(PetAssistanceState.SUCCESS);
		expect(opponent.getSpeed()).toBe(0);
		expect(opponent.getAttack()).toBe(180);
		expect(opponent.getDefense()).toBe(300);
	});

	it("never turns a stat negative when the weapon share exceeds the current stat", async () => {
		const opponent = buildOpponent({
			attack: 100, defense: 300, speed: 50
		});
		mockWeapon({
			attack: 150, defense: 0, speed: 80
		});

		await stealWeapon({} as Fighter, opponent, 1, {} as FightController);

		expect(opponent.getAttack()).toBe(0);
		expect(opponent.getSpeed()).toBe(0);
		expect(opponent.getDefense()).toBe(300);
	});
});
