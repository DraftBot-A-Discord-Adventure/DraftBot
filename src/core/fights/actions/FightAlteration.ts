import {FightAction} from "./FightAction";

export abstract class FightAlteration extends FightAction {

	constructor(name: string) {
		super(name);
		this.isAlteration = true;
	}
}
