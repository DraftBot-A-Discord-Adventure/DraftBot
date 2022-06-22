import {IMission} from "../IMission";
import {Translations} from "../../Translations";

export const missionInterface: IMission = {
	generateRandomVariant: () => Promise.resolve(0),

	areParamsMatchingVariantAndSave: (variant: number, params: { [key: string]: any }) => params.rarity >= variant,

	getVariantFormatVariable: (variant: number, objective: number, language: string) => Promise.resolve(Translations.getModule("items", language).getFromArray("rarities", variant)),

	initialNumberDone: () => Promise.resolve(0),

	updateSaveBlob(): Promise<Buffer> {
		return Promise.resolve(null);
	}
};