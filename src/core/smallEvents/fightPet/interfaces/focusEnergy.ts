import {FightPetAction} from "../FightPetAction";
import Player from "../../../database/game/models/Player";
import {FeralPet} from "../../../database/game/models/FeralPet";
import {TranslationModule} from "../../../Translations";
import {RandomUtils} from "../../../utils/RandomUtils";

export default class FocusEnergy extends FightPetAction {

	public async applyOutcome(player: Player, feralPet: FeralPet, translationModule: TranslationModule): Promise<string> {
		// Chances of success is the ratio of remaining energy on total energy minus the rarity of the pet x 0,05
		if (RandomUtils.draftbotRandom.realZeroToOneInclusive() <= await player.getCumulativeFightPoint() / await player.getMaxCumulativeFightPoint() - feralPet.originalPet.rarity * 0.05) {
			return translationModule.get(`fightPetActions.${this.name}.success`);
		}

		return translationModule.get(`fightPetActions.${this.name}.failure`);
	}
}