import {WitchEvent} from "../WitchEvent";
import {SmallEventConstants} from "../../constants/SmallEventConstants";

export default class Nothing extends WitchEvent {

	public constructor() {
		super("nothing");
		this.type = SmallEventConstants.WITCH.ACTION_TYPE.NOTHING;
		this.setOutcomeProbabilities(0, 0, 0, 50);
	}
}
