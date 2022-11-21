import {WitchEvent} from "../WitchEvent";
import Player from "../../database/game/models/Player";
import {TravelTime} from "../../maps/TravelTime";
import {EffectsConstants} from "../../constants/EffectsConstants";
import {NumberChangeReason} from "../../constants/LogsConstants";
import {SmallEventConstants} from "../../constants/SmallEventConstants";
import {TranslationModule} from "../../Translations";
import {format} from "../../utils/StringFormatter";

export default class Beer extends WitchEvent {

	public constructor() {
		super("beer");
		this.type = SmallEventConstants.WITCH.ACTION_TYPE.INGREDIENT;
		this.setOutcomeProbabilities(0, 25, 0, 25);
	}

	/**
	 * The beer can make the player drunk
	 * @param player
	 */
	async giveEffect(player: Player): Promise<void> {
		await TravelTime.applyEffect(
			player,
			EffectsConstants.EMOJI_TEXT.DRUNK,
			this.timePenalty,
			new Date(),
			NumberChangeReason.SMALL_EVENT
		);
	}

	/**
	 * return a string describing the outcome of the witch event
	 * @param outcome what will happen to the player
	 * @param translationModule
	 */
	public generateResultString(outcome: number, translationModule: TranslationModule): string {
		const outcomeString = outcome === SmallEventConstants.WITCH.OUTCOME_TYPE.EFFECT ? `witchEventResults.outcomes.${outcome}.drunk` : `witchEventResults.outcomes.${outcome}`;
		return format(translationModule.getRandom("witchEventResults.adviceIntros"),
			{
				witchEvent: this.toString(translationModule.language, true).toLowerCase()
			}) + " " + format(translationModule.getRandom(outcomeString),
			{
				lifeLoss: this.getLifePointsRemovedAmount()
			});
	}

}
