import {IMission} from "../IMission";
import {Translations} from "../../Translations";
import {FightActionController} from "../../fightActions/FightActionController";
import {RandomUtils} from "../../utils/RandomUtils";
import {Classes} from "../../database/game/models/Class";

export const missionInterface: IMission = {
	areParamsMatchingVariantAndSave(variant: number, params: { [key: string]: unknown }): boolean {
		return params.lastAttack === FightActionController.variantToFightActionId(variant);
	},

	getVariantFormatVariable(variant: number, objective: number, language: string): Promise<string> {
		return Promise.resolve(
			Translations.getModule(`fightactions.${FightActionController.variantToFightActionId(variant)}`, language)
				.get(objective > 1 ? "namePlural" : "name")
				.toLowerCase()
		);
	},

	async generateRandomVariant(difficulty, player): Promise<number> {
		return FightActionController.fightActionIdToVariant(RandomUtils.draftbotRandom.pick((await Classes.getById(player.class)).getFightActions()));
	},

	initialNumberDone(): Promise<number> {
		return Promise.resolve(0);
	},

	updateSaveBlob(): Promise<Buffer> {
		return Promise.resolve(null);
	}
};