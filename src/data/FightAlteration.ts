import {DataController} from "./DataController";
import {readdirSync} from "fs";
import {FightAction} from "./FightAction";
import {FightController} from "../core/fights/FightController";
import {Fighter} from "../core/fights/fighter/Fighter";
import {FightAlterationResult} from "../../../Lib/src/interfaces/FightAlterationResult";

export class FightAlteration extends FightAction {
	public happen(affected: Fighter, opponent: Fighter, turn: number, fight: FightController): FightAlterationResult {
		affected.alterationTurn++;
		const result = FightAlterationDataController.getFightAlterationFunction(this.id)(affected, this, opponent, turn, fight);
		affected.damage(result.damages);
		return result;
	}
}

export type FightAlterationFunc = (affected: Fighter, fightAlteration: FightAlteration, opponent: Fighter, turn: number, fight: FightController) => FightAlterationResult;

export class FightAlterationDataController extends DataController<string, FightAlteration> {
	static readonly instance: FightAlterationDataController = new FightAlterationDataController("fightactions");

	private static fightAlterationsFunctionsCache: Map<string, FightAlterationFunc>;

	public static getFightAlterationFunction(id: string): FightAlterationFunc {
		if (FightAlterationDataController.fightAlterationsFunctionsCache === null) {
			FightAlterationDataController.fightAlterationsFunctionsCache = new Map<string, FightAlterationFunc>();
			FightAlterationDataController.loadFightAlterationsFromFolder("dist/src/core/fights/actions/interfaces/alterations", "TODO replace with the right one");
		}

		return FightAlterationDataController.fightAlterationsFunctionsCache.get(id);
	}

	private static loadFightAlterationsFromFolder(path: string, relativePath: string): void {
		const files = readdirSync(path);
		for (const file of files) {
			if (file.endsWith(".js")) {
				const defaultFunc = require(`${relativePath}/${file.substring(0, file.length - 3)}`).default;
				const fightAlterationName = file.substring(0, file.length - 3);
				FightAlterationDataController.fightAlterationsFunctionsCache.set(fightAlterationName, defaultFunc);
			}
		}
	}

	newInstance(): FightAlteration {
		return new FightAlteration();
	}
}