import {
	PetAssistanceResult, PetAssistanceState
} from "../../../../../../../Lib/src/types/PetAssistanceResult";
import { PetAssistanceFunc } from "../../../../../data/PetAssistance";
import { FightStatBuffed } from "../../../../../../../Lib/src/types/FightActionResult";
import { RandomUtils } from "../../../../../../../Lib/src/utils/RandomUtils";
import { RealPlayerFighter } from "../../../fighter/RealPlayerFighter";
import { AiPlayerFighter } from "../../../fighter/AiPlayerFighter";
import { applyGearRemovalBuffs } from "../../GearStatRemoval";

const use: PetAssistanceFunc = async (_fighter, opponent, turn, _fightController): Promise<PetAssistanceResult | null> => {
	// Execute at the start of the fight
	if (turn > 2) {
		return null;
	}
	let weaponDamages = 0;
	let weaponDefense = 0;
	let weaponSpeed = 0;

	// Check if the opponent is a player or an AI player
	if (opponent instanceof RealPlayerFighter || opponent instanceof AiPlayerFighter) {
		const memberActiveObjects = await opponent.getMainActiveObjects();
		weaponDamages = memberActiveObjects.weapon.item.getAttack(memberActiveObjects.weapon.itemLevel);
		weaponDefense = memberActiveObjects.weapon.item.getDefense(memberActiveObjects.weapon.itemLevel);
		weaponSpeed = memberActiveObjects.weapon.item.getSpeed(memberActiveObjects.weapon.itemLevel);
	}

	// 10% chance to fail to steal the weapon
	if (RandomUtils.crowniclesRandom.bool(0.1) || weaponDamages === 0) {
		return Promise.resolve({
			assistanceStatus: PetAssistanceState.FAILURE
		});
	}

	const result: PetAssistanceResult = {
		assistanceStatus: PetAssistanceState.SUCCESS
	};

	// Lower the opponent's stats by the share its weapon was providing
	applyGearRemovalBuffs(result, opponent, [
		{
			stat: FightStatBuffed.ATTACK, total: opponent.getAttack(), gear: weaponDamages
		},
		{
			stat: FightStatBuffed.DEFENSE, total: opponent.getDefense(), gear: weaponDefense
		},
		{
			stat: FightStatBuffed.SPEED, total: opponent.getSpeed(), gear: weaponSpeed
		}
	]);

	return Promise.resolve(result);
};

export default use;
