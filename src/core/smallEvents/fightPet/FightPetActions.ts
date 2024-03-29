import {readdirSync} from "fs";
import {FightPetAction} from "./FightPetAction";
import {RandomUtils} from "../../utils/RandomUtils";

/**
 * This allows to load and manage all FightPetActions
 */
export class FightPetActions {
	static fightPetActions: Map<string, FightPetAction> = null;

	/**
	 * Populate a map will all the FightPetActions and their ids
	 */
	static initFightPetActionsMap(): void {
		const files = readdirSync("dist/src/core/smallEvents/fightPet/interfaces");
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
	 * Allow to get a specific FightPetAction by its emoji
	 * @param emoji
	 */
	static getFightPetActionByEmoji(emoji: string): FightPetAction {
		if (!FightPetActions.fightPetActions) {
			FightPetActions.initFightPetActionsMap();
		}
		return FightPetActions.fightPetActions.get(emoji);
	}

	/**
	 * Get a random FightPetAction from all the possible one
	 * @param excludedFightPetActions the FightPetActions that should not be selected
	 */
	static getRandomFightPetAction(excludedFightPetActions: FightPetAction[]): FightPetAction {
		if (!FightPetActions.fightPetActions) {
			FightPetActions.initFightPetActionsMap();
		}
		const possibleFightPetActions = Array.from(FightPetActions.fightPetActions.values()).filter((FightPetAction) => !excludedFightPetActions.includes(FightPetAction));
		return RandomUtils.draftbotRandom.pick(possibleFightPetActions);
	}
}