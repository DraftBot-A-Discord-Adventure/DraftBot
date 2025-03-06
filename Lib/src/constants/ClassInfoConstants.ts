import {ClassConstants} from "./ClassConstants";

export abstract class ClassInfoConstants {
	static readonly LIST_EMOTE = "\uD83D\uDD16";

	// eslint-disable-next-line max-len
	static readonly STATS_DISPLAY = ":zap: {fightPoint} | :dagger: {attack} | :shield: {defense} | :rocket: {speed} | :wind_blowing_face: {baseBreath} / {maxBreath} | :lungs: {breathRegen} | :heart: {health}";

	static readonly FIELDS_VALUE = `### {name} :\n${ClassInfoConstants.STATS_DISPLAY}`;

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