import {FightPetAction} from "../FightPetAction";
import Player from "../../../database/game/models/Player";
import {FeralPet} from "../../../database/game/models/FeralPet";
import {TranslationModule} from "../../../Translations";
import {RandomUtils} from "../../../utils/RandomUtils";

export default class FocusEnergy extends FightPetAction {

	public applyOutcome(player: Player, feralPet: FeralPet, translationModule: TranslationModule): Promise<string> {
		// Chances of success is the level of the player minus 5 x pet rarity divided by 100
		if (RandomUtils.draftbotRandom.realZeroToOneInclusive() <= (player.level - feralPet.originalPet.rarity * 5) / 100) {
			return Promise.resolve(translationModule.get(`fightPetActions.${this.name}.success`));
		}

		return Promise.resolve(translationModule.get(`fightPetActions.${this.name}.failure`));
	}
}