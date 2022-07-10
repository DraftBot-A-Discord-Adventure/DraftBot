import {IMission} from "../IMission";
import {Translations} from "../../Translations";
import {RandomUtils} from "../../utils/RandomUtils";
import {FightActionController} from "../../attacks/FightActionController";
import {Classes} from "../../models/Class";
import { Data } from "../../Data";

// TODO update la mission de campagne sur les attaques rapides
export const missionInterface: IMission = {
	areParamsMatchingVariantAndSave(variant: number, params: { [key: string]: any }): boolean {
		return params.attackType === FightActionController.variantToFightActionId(variant);
	},

	getVariantFormatVariable(variant: number, objective: number, language: string): Promise<string> {
		return Promise.resolve(
			Data.getModule(`fightactions.${FightActionController.variantToFightActionId(variant)}`)
				.getString("emote") + " "
				+ Translations.getModule(`fightactions.${FightActionController.variantToFightActionId(variant)}`, language)
					.get(objective > 1 ? "namePlural" : "name")
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