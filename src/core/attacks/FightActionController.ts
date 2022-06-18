import {IFightAction} from "./IFightAction";
import Class from "../models/Class";

export class FightActionController {
	static getFightActionInterface(fightActionId: string): IFightAction {
		return <IFightAction>(require("./interfaces/" + fightActionId).fightActionInterface);
	}

	static listFightActionsFromClass(playerClass: Class): Map<string, IFightAction> {
		const listActions = new Map<string, IFightAction>();
		for (const action of playerClass.getFightActions()) {
			listActions.set(action, this.getFightActionInterface(action));
		}
		return listActions;
	}
}