import {
	beforeEach, describe, expect, it, vi
} from "vitest";

vi.mock("../../../../src/core/missions/MissionsController", () => ({
	MissionsController: { update: vi.fn() }
}));
vi.mock("../../../../src/core/database/game/models/InventorySlot", () => ({
	InventorySlots: {
		getPlayerActiveObjects: vi.fn(),
		getMainSlotsItems: vi.fn(),
		countObjectsOfPlayer: vi.fn().mockResolvedValue(0)
	}
}));
vi.mock("../../../../src/data/FightAction", async importOriginal => ({
	...await importOriginal<typeof import("../../../../src/data/FightAction")>(),
	FightActionDataController: {
		instance: {
			getListById: vi.fn().mockReturnValue([]),
			getById: vi.fn().mockImplementation((id: string) => ({ id }))
		}
	}
}));
vi.mock("../../../../src/core/maps/Maps", () => ({
	Maps: {
		isOnPveIsland: vi.fn(),
		getGuildMembersOnPveIsland: vi.fn()
	}
}));

import { PlayerFighter } from "../../../../src/core/fights/fighter/PlayerFighter";
import { MissionsController } from "../../../../src/core/missions/MissionsController";
import { InventorySlots } from "../../../../src/core/database/game/models/InventorySlot";
import Player from "../../../../src/core/database/game/models/Player";
import { Class } from "../../../../src/data/Class";
import { Maps } from "../../../../src/core/maps/Maps";
import { FightView } from "../../../../src/core/fights/FightView";
import { FightAction } from "../../../../src/data/FightAction";
import { RandomUtils } from "../../../../../Lib/src/utils/RandomUtils";

const GUILD_ATTACK_ID = "guildAttack";

function buildPlayer(): Player {
	return {
		id: 1,
		level: 20,
		petId: null,
		reload: vi.fn(),
		save: vi.fn(),
		setEnergyLost: vi.fn(),
		getMaxCumulativeEnergy: vi.fn().mockReturnValue(500),
		getCumulativeEnergy: vi.fn().mockReturnValue(120),
		getCumulativeAttack: vi.fn().mockReturnValue(10),
		getCumulativeDefense: vi.fn().mockReturnValue(10),
		getCumulativeSpeed: vi.fn().mockReturnValue(10),
		getBaseBreath: vi.fn().mockReturnValue(2),
		getMaxBreath: vi.fn().mockReturnValue(6),
		getBreathRegen: vi.fn().mockReturnValue(2)
	} as unknown as Player;
}

const playerClass = { fightActionsIds: [] } as unknown as Class;

const activeObjects = {
	weapon: {
		item: {}, itemLevel: 0, itemEnchantmentId: null
	},
	armor: {
		item: {}, itemLevel: 0, itemEnchantmentId: null
	},
	potion: { item: {} },
	object: { item: {} }
};

describe("PlayerFighter without consequences", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(InventorySlots.getPlayerActiveObjects).mockResolvedValue(activeObjects as never);
	});

	it("fights with full energy whatever the current energy of the player", async () => {
		const fighter = new PlayerFighter(buildPlayer(), playerClass, { withoutConsequences: true });

		await fighter.loadStats();

		expect(fighter.getEnergy()).toBe(500);
	});

	it("does not persist energy loss nor progress missions at the end of the fight", async () => {
		const player = buildPlayer();
		const fighter = new PlayerFighter(player, playerClass, { withoutConsequences: true });
		await fighter.loadStats();
		fighter.damage(200);

		await fighter.endFight(true, [], false, 5);

		expect(player.setEnergyLost).not.toHaveBeenCalled();
		expect(player.save).not.toHaveBeenCalled();
		expect(MissionsController.update).not.toHaveBeenCalled();
	});

	it("keeps applying consequences to regular fights", async () => {
		const player = buildPlayer();
		const fighter = new PlayerFighter(player, playerClass);
		await fighter.loadStats();

		expect(fighter.getEnergy()).toBe(120);
	});
});

describe("PlayerFighter guild attack on the PvE island", () => {
	let displayedActions: Map<string, FightAction> | undefined;

	const fightView = {
		displayFightActionMenu: vi.fn((_response: unknown, _fighter: unknown, actions: Map<string, FightAction>) => {
			displayedActions = actions;
		})
	} as unknown as FightView;

	beforeEach(() => {
		vi.clearAllMocks();
		displayedActions = undefined;
		vi.mocked(Maps.isOnPveIsland).mockReturnValue(true);
		vi.mocked(Maps.getGuildMembersOnPveIsland).mockResolvedValue([buildPlayer()]);
		vi.mocked(InventorySlots.getMainSlotsItems).mockResolvedValue(activeObjects as never);
		vi.spyOn(RandomUtils.crowniclesRandom, "realZeroToOneInclusive").mockReturnValue(0);
	});

	it("offers the guild attack to a regular fighter on the island with guild members", async () => {
		const fighter = new PlayerFighter(buildPlayer(), playerClass);

		await fighter.chooseAction(fightView, []);

		expect(displayedActions?.has(GUILD_ATTACK_ID)).toBe(true);
		expect(fighter.getPveMembersOnIsland()).toHaveLength(1);
	});

	it("never loads nor offers the guild attack in a fight without consequences", async () => {
		const fighter = new PlayerFighter(buildPlayer(), playerClass, { withoutConsequences: true });

		await fighter.chooseAction(fightView, []);

		expect(displayedActions?.has(GUILD_ATTACK_ID)).toBe(false);
		expect(Maps.getGuildMembersOnPveIsland).not.toHaveBeenCalled();
		expect(fighter.getPveMembersOnIsland()).toHaveLength(0);
	});
});
