import { ClassConstants } from "./ClassConstants";

export abstract class ClassInfoConstants {
	static readonly HOLY_CLASSES = [
		ClassConstants.CLASSES_ID.PIKEMAN,
		ClassConstants.CLASSES_ID.KNIGHT,
		ClassConstants.CLASSES_ID.PALADIN,
		ClassConstants.CLASSES_ID.VALIANT_KNIGHT,
		ClassConstants.CLASSES_ID.LUMINOUS_PALADIN
	];

	static CLASSES_WITH_BONUS_ACTION =
		[
			ClassConstants.CLASSES_ID.POWERFUL_INFANTRYMAN,
			ClassConstants.CLASSES_ID.INFANTRYMAN
		];

	static readonly MENU_IDS = {
		CLASS_SELECTION: "classSelectionMenu",
		LIST_OPTION: "listOption"
	};
}
