import { DraftBotIcons } from "../../../Lib/src/DraftBotIcons";
import {Language} from "../../../Lib/src/Language";
import {PetConstants} from "../../../Lib/src/constants/PetConstants";
import i18n from "../translations/i18n";

export type PetData = {
	petTypeId: number,
	nickname: string,
	sex: string,
	rarity: number,
	loveLevel: number
};

export class PetUtils {

	/**
	 * Generate the string displaying a pet from the data of the pet
	 * @param language
	 * @param petData
	 */
	static petToString(language: Language, petData: PetData): string {
		const sexDisplay = `${
			i18n.t(`commands:pet.sexDisplay.${
				petData.sex === PetConstants.SEX.MALE ? PetConstants.SEX.MALE_FULL : PetConstants.SEX.FEMALE_FULL
			}`, {lng: language})} ${
			petData.sex === PetConstants.SEX.MALE ? PetConstants.ICONS.MALE : PetConstants.ICONS.FEMALE
		}`;
		return i18n.t("commands:pet.petField", {
			lng: language,
			emote: PetUtils.getPetIcon(petData.petTypeId, petData.sex),
			typeName: PetUtils.getPetTypeName(language, petData.petTypeId, petData.sex),
			nickname: PetUtils.displayNickname(language, petData.nickname),
			rarity: PetUtils.getRarityDisplay(petData.rarity),
			sex: sexDisplay,
			loveLevel: PetUtils.getLoveLevelDisplay(petData.loveLevel, petData.sex, language)
		});
	}

	/**
	 * Generate a short pet string containing only the pet emote and the nickname (or type name if the pet has no nickname)
	 * @param language
	 * @param nickname - can be undefined if the pet has no nickname
	 * @param typeId
	 * @param sex
	 */
	static petToShortString(language: Language, nickname: string | undefined, typeId: number, sex :string): string {
		return i18n.t("commands:pet.shortPetField", {
			lng: language,
			emote: PetUtils.getPetIcon(typeId, sex),
			name: nickname ?? PetUtils.getPetTypeName(language, typeId, sex)
		});
	}

	/**
	 * Get the icon of a pet from its type and sex
	 * @param typeId
	 * @param sex
	 */
	static getPetIcon(typeId: number, sex:string): string {
		return sex === PetConstants.SEX.MALE ? DraftBotIcons.pets[typeId].emoteMale : DraftBotIcons.pets[typeId].emoteFemale;
	}

	/**
	 * Display the stars corresponding to the rarity of a pet
	 * @param rarity
	 */
	static getRarityDisplay(rarity: number): string {
		return PetConstants.ICONS.RARITY.repeat(rarity);
	}

	/**
	 * Display the nickname of a pet or a default message if it has no nickname
	 * @param language
	 * @param nickname
	 */
	static displayNickname(language: Language, nickname: string): string {
		return nickname ? nickname : i18n.t("commands:pet.noNickname", {lng: language});
	}

	/**
	 * Get the name of an animal type linked to a pet in the specified language
	 * @param language
	 * @param typeId
	 * @param sex
	 */
	static getPetTypeName(language: Language, typeId: number, sex: string): string {
		const sexStringContext: string = sex === PetConstants.SEX.MALE ? PetConstants.SEX.MALE_FULL : PetConstants.SEX.FEMALE_FULL;
		return i18n.t(
			`models:pets:${typeId}`,
			{lng: language, context: sexStringContext as unknown}
		);
	}

	/**
	 * Display the adjective corresponding to the love level of a pet
	 * @param loveLevel
	 * @param sex
	 * @param language
	 */
	static getLoveLevelDisplay(loveLevel: number, sex: string, language: Language): string {
		const sexStringContext: string = sex === PetConstants.SEX.MALE ? PetConstants.SEX.MALE_FULL : PetConstants.SEX.FEMALE_FULL;
		return i18n.t(`commands:pet.loveLevels.${loveLevel}`, {
			context: sexStringContext as unknown,
			lng: language
		});
	}

}