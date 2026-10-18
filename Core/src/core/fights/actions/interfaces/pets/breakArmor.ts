import {
	PetAssistanceResult, PetAssistanceState
} from "../../../../../../../Lib/src/types/PetAssistanceResult";
import { PetAssistanceFunc } from "../../../../../data/PetAssistance";
import { FightStatBuffed } from "../../../../../../../Lib/src/types/FightActionResult";
import { RandomUtils } from "../../../../../../../Lib/src/utils/RandomUtils";
import { PlayerFighter } from "../../../fighter/PlayerFighter";
import { AiPlayerFighter } from "../../../fighter/AiPlayerFighter";
import { applyGearRemovalBuffs } from "../../GearStatRemoval";

const use: PetAssistanceFunc = async (_fighter, opponent, turn, _fightController): Promise<PetAssistanceResult | null> => {
	// Execute at the start of the fight
	if (turn > 2) {
		return null;
	}
	let armorDamages = 0;
	let armorDefense = 0;
	let armorSpeed = 0;

	// Check if the opponent is a player or an AI player
	if (opponent instanceof PlayerFighter || opponent instanceof AiPlayerFighter) {
		const memberActiveObjects = await opponent.getMainActiveObjects();
		armorDamages = memberActiveObjects.armor.item.getAttack(memberActiveObjects.armor.itemLevel);
		armorDefense = memberActiveObjects.armor.item.getDefense(memberActiveObjects.armor.itemLevel);
		armorSpeed = memberActiveObjects.armor.item.getSpeed(memberActiveObjects.armor.itemLevel);
	}

	// 15% chance to fail to break the armor
	if (RandomUtils.crowniclesRandom.bool(0.15) || armorDefense === 0) {
		return Promise.resolve({
			assistanceStatus: PetAssistanceState.FAILURE
		});
	}

	const result: PetAssistanceResult = {
		assistanceStatus: PetAssistanceState.SUCCESS
	};

	// Lower the opponent's stats by the share its armor was providing
	applyGearRemovalBuffs(result, opponent, [
		{
			stat: FightStatBuffed.DEFENSE, total: opponent.getDefense(), gear: armorDefense
		},
		{
			stat: FightStatBuffed.ATTACK, total: opponent.getAttack(), gear: armorDamages
		},
		{
			stat: FightStatBuffed.SPEED, total: opponent.getSpeed(), gear: armorSpeed
		}
	]);

	return Promise.resolve(result);
};

export default use;
