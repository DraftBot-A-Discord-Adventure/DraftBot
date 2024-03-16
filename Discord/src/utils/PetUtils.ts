import {Language} from "../../../Lib/src/Language";
import {PetConstants} from "../../../Lib/src/constants/PetConstants";
import i18n from "../translations/i18n";

export type PetData = {
	emote: string,
	typeId: number,
	nickname: string,
	sex: string,
	rarity: number,
	loveLevel: number
};

export class PetUtils {

	static petToString(language: Language, petData: PetData): string {
		const sexDisplay = `${
			i18n.t(`commands:pet.sexDisplay.${
				petData.sex === PetConstants.SEX.MALE ? PetConstants.SEX.MALE_FULL : PetConstants.SEX.FEMALE_FULL
			}`, {lng: language})} ${
			petData.sex === PetConstants.SEX.MALE ? PetConstants.ICONS.MALE : PetConstants.ICONS.FEMALE
		}`;
		return i18n.t("commands:pet.petField", {
			lng: language,
			emote: petData.emote,
			type: PetUtils.getPetTypeName(language, petData.typeId, petData.sex),
			nickname: PetUtils.displayNickname(language, petData.nickname),
			rarity: PetUtils.getRarityDisplay(petData.rarity),
			sex: sexDisplay,
			loveLevel: petData.loveLevel
		});
	}

	static getRarityDisplay(rarity: number): string {
		return PetConstants.ICONS.RARITY.repeat(rarity);
	}

	static displayNickname(language: Language, nickname: string): string {
		return nickname ? nickname : i18n.t("commands:pet.noNickname", {lng: language});
	}

	static getPetTypeName(language: Language, typeId: number, sex: string): string {
		return i18n.t(
			`models:pets:${typeId}.${
				sex === PetConstants.SEX.MALE ?
					PetConstants.SEX.MALE_FULL :
					PetConstants.SEX.FEMALE_FULL}`,
			{lng: language}
		);
	}

	static getLoveLevelDisplay(loveLevel: number, sex: string, language: Language): string {
		const sexStringContext :string = sex === PetConstants.SEX.MALE ? PetConstants.SEX.MALE_FULL : PetConstants.SEX.FEMALE_FULL;
		return i18n.t("commands:pet.loveLevels.0.0", {context: sexStringContext, lng: language});
	}
}