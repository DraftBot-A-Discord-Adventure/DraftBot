import {DraftBotIcons} from "../../../Lib/src/DraftBotIcons";
import {Language} from "../../../Lib/src/Language";
import {PetConstants} from "../../../Lib/src/constants/PetConstants";
import i18n from "../translations/i18n";
import {EmoteUtils} from "./EmoteUtils";

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
	 * @param lng
	 * @param petData
	 */
	static petToString(lng: Language, petData: PetData): string {
		const sexDisplay = `${
			i18n.t(`commands:pet.sexDisplay.${
				petData.sex === PetConstants.SEX.MALE ? PetConstants.SEX.MALE_FULL : PetConstants.SEX.FEMALE_FULL
			}`, {lng})} ${
			petData.sex === PetConstants.SEX.MALE ? PetConstants.ICONS.MALE : PetConstants.ICONS.FEMALE
		}`;
		return i18n.t("commands:pet.petField", {
			lng,
			emote: PetUtils.getPetIcon(petData.petTypeId, petData.sex),
			typeName: PetUtils.getPetTypeName(lng, petData.petTypeId, petData.sex),
			nickname: PetUtils.displayNickname(lng, petData.nickname),
			rarity: PetUtils.getRarityDisplay(petData.rarity),
			sex: sexDisplay,
			loveLevel: PetUtils.getLoveLevelDisplay(petData.loveLevel, petData.sex, lng)
		});
	}

	/**
	 * Generate a short pet string containing only the pet emote and the nickname (or type name if the pet has no nickname)
	 * @param lng
	 * @param nickname - can be undefined if the pet has no nickname
	 * @param typeId
	 * @param sex
	 */
	static petToShortString(lng: Language, nickname: string | undefined, typeId: number, sex: string): string {
		return i18n.t("commands:pet.shortPetField", {
			lng,
			emote: PetUtils.getPetIcon(typeId, sex),
			name: nickname ?? PetUtils.getPetTypeName(lng, typeId, sex)
		});
	}

	/**
	 * Get the icon of a pet from its type and sex
	 * @param typeId
	 * @param sex
	 */
	static getPetIcon(typeId: number, sex: string): string {
		return EmoteUtils.translateEmojiToDiscord(sex === PetConstants.SEX.MALE ? DraftBotIcons.pets[typeId].emoteMale : DraftBotIcons.pets[typeId].emoteFemale);
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
	 * @param lng
	 * @param nickname
	 */
	static displayNickname(lng: Language, nickname: string): string {
		return nickname ? nickname : i18n.t("commands:pet.noNickname", {lng});
	}

	/**
	 * Get the name of an animal type linked to a pet in the specified language
	 * @param lng
	 * @param typeId
	 * @param sex
	 */
	static getPetTypeName(lng: Language, typeId: number, sex: string): string {
		const sexStringContext: string = sex === PetConstants.SEX.MALE ? PetConstants.SEX.MALE_FULL : PetConstants.SEX.FEMALE_FULL;
		return i18n.t(
			`models:pets:${typeId}`,
			{lng, context: sexStringContext as unknown}
		);
	}

	/**
	 * Display the adjective corresponding to the love level of a pet
	 * @param loveLevel
	 * @param sex
	 * @param lng
	 */
	static getLoveLevelDisplay(loveLevel: number, sex: string, lng: Language): string {
		const sexStringContext: string = sex === PetConstants.SEX.MALE ? PetConstants.SEX.MALE_FULL : PetConstants.SEX.FEMALE_FULL;
		return i18n.t(`commands:pet.loveLevels.${loveLevel}`, {
			context: sexStringContext as unknown,
			lng
		});
	}

}