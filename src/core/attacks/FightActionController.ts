import {IFightAction} from "./IFightAction";
import Class from "../models/Class";

declare const JsonReader: any;

export class FightActionController {

	/**
	 * get the fight action interface from a fight action id
	 * @param fightActionId
	 */
	static getFightActionInterface(fightActionId: string): IFightAction {
		return <IFightAction>(require("./interfaces/" + fightActionId).fightActionInterface);
	}

	/**
	 * list all fight actions for a class
	 * @param playerClass
	 */
	static listFightActionsFromClass(playerClass: Class): Map<string, IFightAction> {
		const listActions = new Map<string, IFightAction>();
		for (const action of playerClass.getFightActions()) {
			listActions.set(action, this.getFightActionInterface(action));
		}
		return listActions;
	}

	/**
	 * get all fight actions ids
	 * @returns string[]
	 */
	static getAllFightActionsIds(): string[] {
		return Object.keys(JsonReader.fightactions);
	}
}