import {WitchEvent} from "../WitchEvent";
import {SmallEventConstants} from "../../../constants/SmallEventConstants";

/**
 * The cobweb will hurt the player or do nothing.
 */
export default class Cobweb extends WitchEvent {

	public constructor() {
		super("cobweb");
		this.type = SmallEventConstants.WITCH.ACTION_TYPE.INGREDIENT;
		this.setOutcomeProbabilities(0, 0, 10, 40);
	}

}
