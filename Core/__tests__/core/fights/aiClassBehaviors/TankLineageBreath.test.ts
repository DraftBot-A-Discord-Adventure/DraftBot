import {
	beforeEach, describe, expect, it, vi
} from "vitest";
import { FightActionDataController } from "../../../../src/data/FightAction";
import { RandomUtils } from "../../../../../Lib/src/utils/RandomUtils";
import { FightConstants } from "../../../../../Lib/src/constants/FightConstants";
import { ClassConstants } from "../../../../../Lib/src/constants/ClassConstants";
import TankFightBehavior from "../../../../src/core/fights/aiClassBehaviors/TankFightBehavior";
import { intenseOrSimpleAttack } from "../../../../src/core/fights/aiClassBehaviors/GlovedFightBehavior";
import { AiPlayerFighter } from "../../../../src/core/fights/fighter/AiPlayerFighter";
import { FightView } from "../../../../src/core/fights/FightView";

const BREATH_COSTS: Record<string, number> = {
	[FightConstants.FIGHT_ACTIONS.PLAYER.SIMPLE_ATTACK]: 2,
	[FightConstants.FIGHT_ACTIONS.PLAYER.INTENSE_ATTACK]: 4,
	[FightConstants.FIGHT_ACTIONS.PLAYER.COUNTER_ATTACK]: 5,
	[FightConstants.FIGHT_ACTIONS.PLAYER.SHIELD_ATTACK]: 6,
	[FightConstants.FIGHT_ACTIONS.PLAYER.PIERCING_ATTACK]: 5
};

type FighterState = {
	breath: number;
	energy: number;
	maxEnergy: number;
	lastActionId?: string;
};

/**
 * Minimal fighter exposing only what the tank and gloved behaviors read
 */
function fighter(state: FighterState): AiPlayerFighter {
	return {
		// Knights skip the opening defense buff branch of the tank
		player: { class: ClassConstants.CLASSES_ID.KNIGHT },
		getBreath: () => state.breath,
		getMaxBreath: () => 20,
		getEnergy: () => state.energy,
		getMaxEnergy: () => state.maxEnergy,
		getDefense: () => 1000,
		getLastFightActionUsed: () => state.lastActionId
			? {
				id: state.lastActionId,
				breath: BREATH_COSTS[state.lastActionId]
			}
			: null
	} as unknown as AiPlayerFighter;
}

/**
 * Fight view whose defending fighter is the given opponent
 */
function fightView(opponent: AiPlayerFighter, turn: number): FightView {
	return {
		fightController: {
			getDefendingFighter: () => opponent,
			turn
		}
	} as unknown as FightView;
}

describe("Tank lineage AI breath checks", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		vi.spyOn(RandomUtils.crowniclesRandom, "bool").mockReturnValue(true);
		vi.spyOn(FightActionDataController, "getFightActionBreathCost").mockImplementation(id => BREATH_COSTS[id]);
		vi.spyOn(FightActionDataController.instance, "getById").mockImplementation(id => ({ id }) as never);
	});

	describe("intenseOrSimpleAttack", () => {
		const opponent = fighter({
			breath: 0,
			energy: 1000,
			maxEnergy: 1000
		});

		it("uses an intense attack when the breath allows it", () => {
			const me = fighter({
				breath: 4,
				energy: 500,
				maxEnergy: 1000
			});

			expect(intenseOrSimpleAttack(me, opponent).id).toBe(FightConstants.FIGHT_ACTIONS.PLAYER.INTENSE_ATTACK);
		});

		it("falls back to a simple attack instead of running out of breath", () => {
			const me = fighter({
				breath: 3,
				energy: 500,
				maxEnergy: 1000
			});

			expect(intenseOrSimpleAttack(me, opponent).id).toBe(FightConstants.FIGHT_ACTIONS.PLAYER.SIMPLE_ATTACK);
		});
	});

	describe("TankFightBehavior counter attack", () => {
		const opponent = fighter({
			breath: 0,
			energy: 500,
			maxEnergy: 1000,
			lastActionId: FightConstants.FIGHT_ACTIONS.PLAYER.PIERCING_ATTACK
		});

		it("counters a costly attack when the breath allows it", () => {
			const me = fighter({
				breath: 5,
				energy: 1000,
				maxEnergy: 1000
			});

			expect(new TankFightBehavior().chooseAction(me, fightView(opponent, 5)).id)
				.toBe(FightConstants.FIGHT_ACTIONS.PLAYER.COUNTER_ATTACK);
		});

		it("does not counter without enough breath", () => {
			const me = fighter({
				breath: 4,
				energy: 1000,
				maxEnergy: 1000
			});

			expect(new TankFightBehavior().chooseAction(me, fightView(opponent, 5)).id)
				.not.toBe(FightConstants.FIGHT_ACTIONS.PLAYER.COUNTER_ATTACK);
		});
	});
});
