import {readdirSync} from "fs";
import {FightPetAction} from "./FightPetAction";
import {RandomUtils} from "../utils/RandomUtils";
import {Constants} from "../Constants";
import {SmallEventConstants} from "../constants/SmallEventConstants";

/**
 * This allows to load and manage all the witch events
 */
export class FightPetActions {
	static fightPetActions: Map<string, FightPetAction> = null;

	/**
	 * populate a map will all the FightPetActions and their ids
	 */
	static initFightPetActionsMap(): void {
		const files = readdirSync("dist/src/core/witch/interfaces");
		FightPetActions.fightPetActions = new Map();
		for (const file of files) {
			if (file.endsWith(".js")) {
				const DefaultClass = require(`./interfaces/${file}`).default;
				if (!DefaultClass) {
					console.warn(`${file} doesn't have a default export`);
					return;
				}
				const FightPetActionName = file.substring(0, file.length - 3);
				const FightPetActionInstance = new DefaultClass(FightPetActionName);
				if (!(FightPetActionInstance instanceof FightPetAction)) {
					console.warn(`${file} initialized instance is incorrect`);
					return;
				}
				FightPetActions.fightPetActions.set(FightPetActionInstance.getEmoji(), FightPetActionInstance);
			}
		}
	}

	/**
	 * allow to get a specific witch event
	 * @param emoji
	 */
	static getFightPetActionByEmoji(emoji: string): FightPetAction | null {
		if (!FightPetActions.fightPetActions) {
			FightPetActions.initFightPetActionsMap();
		}
		if (emoji === Constants.REACTIONS.NOT_REPLIED_REACTION) {
			return FightPetActions.getRandomFightPetActionByType(SmallEventConstants.WITCH.ACTION_TYPE.NOTHING);
		}
		return FightPetActions.fightPetActions.get(emoji);
	}

	/**
	 * Get a random FightPetAction from all the possible one given a type of FightPetAction (ingredient or actions)
	 * @param type
	 */
	static getRandomFightPetActionByType(type: number): FightPetAction | null {
		if (!FightPetActions.fightPetActions) {
			FightPetActions.initFightPetActionsMap();
		}
		const possibleFightPetActions = Array.from(FightPetActions.fightPetActions.values()).filter((FightPetAction) => FightPetAction.type === type);

		return RandomUtils.draftbotRandom.pick(possibleFightPetActions);
	}

	/**
	 * Get a random FightPetAction from all the possible one
	 * @param excludedFightPetActions the FightPetActions that should not be selected
	 */
	static getRandomFightPetAction(excludedFightPetActions: FightPetAction[]): FightPetAction | null {
		if (!FightPetActions.fightPetActions) {
			FightPetActions.initFightPetActionsMap();
		}
		const possibleFightPetActions = Array.from(FightPetActions.fightPetActions.values()).filter((FightPetAction) => !excludedFightPetActions.includes(FightPetAction));
		return RandomUtils.draftbotRandom.pick(possibleFightPetActions);
	}
}