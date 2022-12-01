import {IMission} from "../IMission";
import {Translations} from "../../Translations";
import {Language} from "../../constants/TypeConstants";

export const missionInterface: IMission = {
	generateRandomVariant: () => Promise.resolve(0),

	areParamsMatchingVariantAndSave: (variant: number, params: { [key: string]: unknown }) => params.rarity >= variant,

	getVariantFormatVariable: (variant: number, objective: number, language: Language) => Promise.resolve(Translations.getModule("items", language).getFromArray("rarities", variant)),

	initialNumberDone: () => Promise.resolve(0),

	updateSaveBlob(): Promise<Buffer> {
		return Promise.resolve(null);
	}
};