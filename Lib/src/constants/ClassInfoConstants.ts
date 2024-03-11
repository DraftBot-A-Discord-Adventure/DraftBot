import {Constants} from "./Constants";

export abstract class ClassInfoConstants {
	static readonly LIST_EMOTE = "\uD83D\uDD16";

	// eslint-disable-next-line max-len
	static readonly STATS_DISPLAY = ":zap: {fightPoint} | :dagger: {attack} | :shield: {defense} | :rocket: {speed} | :wind_blowing_face: {baseBreath} / {maxBreath} | :lungs: {breathRegen} | :heart: {health}";

	static readonly FIELDS_VALUE = `{name} :\n${ClassInfoConstants.STATS_DISPLAY}`;

	static readonly HOLY_CLASSES = [
		Constants.CLASSES.PIKEMAN,
		Constants.CLASSES.KNIGHT,
		Constants.CLASSES.PALADIN,
		Constants.CLASSES.VALIANT_KNIGHT,
		Constants.CLASSES.LUMINOUS_PALADIN
	];

	static CLASSES_WITH_BONUS_ACTION =
		[
			Constants.CLASSES.POWERFUL_INFANTRYMAN,
			Constants.CLASSES.INFANTRYMAN
		];
}