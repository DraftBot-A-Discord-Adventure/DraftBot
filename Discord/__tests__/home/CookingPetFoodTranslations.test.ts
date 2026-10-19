import {
	describe, expect, it
} from "vitest";
import i18n from "../../src/translations/i18n";
import { LANGUAGE } from "../../../Lib/src/Language";
import { PetConstants } from "../../../Lib/src/constants/PetConstants";

function renderPetFoodStored(foodType: string, count: number): string {
	return i18n.t("commands:report.city.homes.cooking.petFoodStored", {
		lng: LANGUAGE.FRENCH,
		count,
		food: i18n.t(`models:foods.${foodType}`, {
			lng: LANGUAGE.FRENCH,
			count
		})
	});
}

describe("Cooking pet food stored message (fr)", () => {
	it.each(PetConstants.PET_FOOD_BY_ID)("agrees with a single %s", foodType => {
		const message = renderPetFoodStored(foodType, 1);

		expect(message).toContain(`**1 ${i18n.t(`models:foods.${foodType}`, {
			lng: LANGUAGE.FRENCH,
			count: 1
		})}** a été ajoutée`);
	});

	it.each(PetConstants.PET_FOOD_BY_ID)("agrees with several %s", foodType => {
		const message = renderPetFoodStored(foodType, 3);

		expect(message).toContain(`**3 ${i18n.t(`models:foods.${foodType}`, {
			lng: LANGUAGE.FRENCH,
			count: 3
		})}** ont été ajoutées`);
	});
});
