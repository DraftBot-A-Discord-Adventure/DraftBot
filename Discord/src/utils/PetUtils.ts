import { Language } from "../../../Lib/src/Language";
import { PetConstants, PetDiet } from "../../../Lib/src/constants/PetConstants";
import i18n from "../translations/i18n";
import { SexTypeShort } from "../../../Lib/src/constants/StringConstants";
import { finishInTimeDisplay } from "../../../Lib/src/utils/TimeUtils";
import { DisplayUtils } from "./DisplayUtils";

export class PetUtils {
	/**
	 * Generate a short pet string containing only the pet emote and the nickname (or type name if the pet has no nickname)
	 * @param lng
	 * @param nickname - can be undefined if the pet has no nickname
	 * @param typeId
	 * @param sex
	 */
	static petToShortString(lng: Language, nickname: string | undefined, typeId: number, sex: SexTypeShort): string {
		return i18n.t("commands:pet.shortPetField", {
			lng,
			emote: DisplayUtils.getPetIcon(typeId, sex),
			name: nickname ?? DisplayUtils.getPetTypeName(lng, typeId, sex)
		});
	}

	static getDietDisplay(diet: PetDiet | undefined, lng: Language): string {
		return i18n.t("models:diet", {
			lng, context: diet ?? PetDiet.OMNIVOROUS
		});
	}

	/**
	 * Get age context depending on the id of the pet
	 * @param age - the id of the pet
	 * @returns a string context that can be used to get more precise translations
	 */
	static getAgeCategory(age: number): string {
		return age <= PetConstants.PET_AGE_GROUPS_THRESHOLDS.ANCESTOR ?
			PetConstants.PET_AGE_GROUP_NAMES.ANCESTOR
			: age <= PetConstants.PET_AGE_GROUPS_THRESHOLDS.VERY_OLD ?
				PetConstants.PET_AGE_GROUP_NAMES.VERY_OLD
				: age <= PetConstants.PET_AGE_GROUPS_THRESHOLDS.OLD ?
					PetConstants.PET_AGE_GROUP_NAMES.OLD
					: PetConstants.PET_AGE_GROUP_NAMES.ADULT
	};

	static getFeedCooldownDisplay(nextFeed: number, lng: Language): string {
		return nextFeed <= 0
			? i18n.t("commands:shop.shopItems.lovePointsValue.petIsHungry", { lng })
			: finishInTimeDisplay(new Date(new Date().valueOf() + nextFeed));
	}
}
