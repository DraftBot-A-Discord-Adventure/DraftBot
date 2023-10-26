import {DataController} from "./DataController";
import {Data} from "./Data";
import {FightActionType} from "@Lib/src/interfaces/FightActionType";
import {Fighter} from "../core/fights/fighter/Fighter";
import {readdirSync} from "fs";
import {FightController} from "../core/fights/FightController";
import {FightActionResult} from "@Lib/src/interfaces/FightActionResult";

export class FightAction extends Data<string> {
	public readonly emote: string;

	public readonly breath: number;

	public readonly missionVariant: number;

	public readonly type: FightActionType;


	public use(fight: FightController, sender: Fighter, receiver: Fighter, turn: number): FightActionResult {
		const result = FightActionDataController.getFightActionFunction(this.id)(fight, this, sender, receiver, turn);
		receiver.damage(result.damages);
		return result;
	}
}

export type FightActionFunc = (fight: FightController, fightAction: FightAction, sender: Fighter, receiver: Fighter, turn: number) => FightActionResult;


export class FightActionDataController extends DataController<string, FightAction> {
	static readonly instance: FightActionDataController = new FightActionDataController("fightactions");

	private static fightActionsFunctionsCache: Map<string, FightActionFunc>;

	public static getFightActionFunction(id: string): FightActionFunc {
		if (FightActionDataController.fightActionsFunctionsCache == null) {
			FightActionDataController.fightActionsFunctionsCache = new Map<string, FightActionFunc>();
			FightActionDataController.loadFightActionsFromFolder("dist/src/core/fights/actions/interfaces/players", "./interfaces/players");
			FightActionDataController.loadFightActionsFromFolder("dist/src/core/fights/actions/interfaces/monsters", "./interfaces/monsters");
		}

		return FightActionDataController.fightActionsFunctionsCache.get(id);
	}

	private static loadFightActionsFromFolder(path: string, relativePath: string): void {
		const files = readdirSync(path);
		for (const file of files) {
			if (file.endsWith(".js")) {
				const defaultFunc = require(`${relativePath}/${file.substring(0, file.length - 3)}`).default;
				const fightActionName = file.substring(0, file.length - 3);
				FightActionDataController.fightActionsFunctionsCache.set(fightActionName, defaultFunc);
			}
		}
	}

	newInstance(): FightAction {
		return new FightAction();
	}
}