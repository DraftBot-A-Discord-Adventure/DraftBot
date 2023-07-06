import {FightPetAction} from "../FightPetAction";
import Player from "../../../database/game/models/Player";
import {FeralPet} from "../../../database/game/models/FeralPet";

/**
 *  Scream
 */
export default class Scream extends FightPetAction {
	// eslint-disable-next-line require-await
	public async applyOutcome(player: Player, feralPet: FeralPet): Promise<boolean> {
		// Réussis 6/10 si le pet est masculin, 4/10 si le pet est féminin
		return Math.random() > (feralPet.isFemale ? 0.4 : 0.6);
	}
}