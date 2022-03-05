import {IMission} from "../IMission";
import {Translations} from "../../Translations";
import {Constants} from "../../Constants";

export const missionInterface: IMission = {
	areParamsMatchingVariantAndSave(variant: number, params: { [key: string]: any }): boolean {
		return params.attackType === variant;
	},

	getVariantFormatVariable(variant: number, objective: number, language: string): Promise<string> {
		return Promise.resolve(Translations.getModule("commands.fight", language).get("actions.attacks." + actionToName(variant) + (objective > 1 ? ".namePlural" : ".name")));
	},

	generateRandomVariant(): Promise<number> {
		return Promise.resolve(0);
	},

	initialNumberDone(): Promise<number> {
		return Promise.resolve(0);
	},

	updateSaveBlob(): Promise<Buffer> {
		return Promise.resolve(null);
	}
};
// TODO UTILISER CELLE DE FIGHT QUAND REFACTOR
function actionToName(action: number) {
	switch (action) {
	case Constants.FIGHT.ACTION.SIMPLE_ATTACK:
		return "simple";
	case Constants.FIGHT.ACTION.QUICK_ATTACK:
		return "quick";
	case Constants.FIGHT.ACTION.ULTIMATE_ATTACK:
		return "ultimate";
	case Constants.FIGHT.ACTION.POWERFUL_ATTACK:
		return "powerful";
	case Constants.FIGHT.ACTION.BULK_ATTACK:
		return "bulk";
	default:
		return "unknown";
	}
}