import {IMission} from "../IMission";
import {Translations} from "../../Translations";
import {RandomUtils} from "../../utils/RandomUtils";
import {FightActionController} from "../../attacks/FightActionController";
import {Classes} from "../../models/Class";


function fightActionIdToVariant(idFightAction: string): number {
	return FightActionController.getAllFightActionsIds().indexOf(idFightAction);
}

function variantToFightActionId(variant: number): string {
	return FightActionController.getAllFightActionsIds()[variant];
}

// TODO update la mission de campagne sur les attaques rapides
export const missionInterface: IMission = {
	areParamsMatchingVariantAndSave(variant: number, params: { [key: string]: any }): boolean {
		return params.attackType === variantToFightActionId(variant);
	},

	getVariantFormatVariable(variant: number, objective: number, language: string): Promise<string> {
		return Promise.resolve(
			Translations.getModule(`fightactions.${variantToFightActionId(variant)}`, language)
				.get(objective > 1 ? "namePlural" : "name")
		);
	},

	async generateRandomVariant(difficulty, player): Promise<number> {
		return fightActionIdToVariant(RandomUtils.draftbotRandom.pick((await Classes.getById(player.class)).getFightActions()));
	},

	initialNumberDone(): Promise<number> {
		return Promise.resolve(0);
	},

	updateSaveBlob(): Promise<Buffer> {
		return Promise.resolve(null);
	}
};