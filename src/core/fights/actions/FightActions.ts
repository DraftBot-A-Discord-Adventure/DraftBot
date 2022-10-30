import {FightAction} from "./FightAction";
import {readdirSync} from "fs";
import Class from "../../database/game/models/Class";

export class FightActions {
	static fightActions: Map<string, FightAction> = null;

	static initFightActionsMap(): void {
		const files = readdirSync("dist/src/core/fights/actions/interfaces");
		FightActions.fightActions = new Map();
		for (const file of files) {
			if (file.endsWith(".js")) {
				const DefaultClass = require(`./interfaces/${file}`).default;
				if (!DefaultClass) {
					console.warn(`${file} doesn't have a default export`);
					return;
				}

				const fightActionName = file.substring(0, file.length - 3);
				const fightActionInstance = new DefaultClass(fightActionName);
				if (!(fightActionInstance instanceof FightAction)) {
					console.warn(`${file} initialized instance is incorrect`);
					return;
				}

				FightActions.fightActions.set(fightActionName, fightActionInstance);
			}
		}
	}

	static getFightActionById(id: string): FightAction | null {
		if (!FightActions.fightActions) {
			FightActions.initFightActionsMap();
		}
		return FightActions.fightActions.get(id);
	}

	/**
	 * list all fight actions for a class
	 * @param playerClass
	 */
	static listFightActionsFromClass(playerClass: Class): FightAction[] {
		const listActions: FightAction[] = [];
		for (const action of playerClass.getFightActions()) {
			listActions.push(FightActions.getFightActionById(action));
		}
		return listActions;
	}

	/**
	 * Get fight action where the fighter does nothing
	 */
	static getNoAttack(): FightAction {
		return FightActions.fightActions.get("none");
	}
}