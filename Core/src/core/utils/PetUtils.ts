import { PetConstants } from "../../../../Lib/src/constants/PetConstants";

export abstract class PetUtils {
	/**
 * Get age context depending on the id of the pet
 * @param age - the id of the pet
 * @returns a string context that can be used to get more precise translations
 */
	static getAgeCategory(age: number): string {
		return age <= PetConstants.PET_AGE_GROUPS_THRESHOLDS.ANCESTOR
			? PetConstants.PET_AGE_GROUP_NAMES.ANCESTOR
			: age <= PetConstants.PET_AGE_GROUPS_THRESHOLDS.VERY_OLD
				? PetConstants.PET_AGE_GROUP_NAMES.VERY_OLD
				: age <= PetConstants.PET_AGE_GROUPS_THRESHOLDS.OLD
					? PetConstants.PET_AGE_GROUP_NAMES.OLD
					: age <= PetConstants.PET_AGE_GROUPS_THRESHOLDS.ADULT
						? PetConstants.PET_AGE_GROUP_NAMES.ADULT
						: PetConstants.PET_AGE_GROUP_NAMES.OTHER;
	}
}
