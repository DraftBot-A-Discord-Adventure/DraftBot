export abstract class ClassInfoConstants {
	static readonly LIST_EMOTE = "\uD83D\uDD16";

	// eslint-disable-next-line max-len
	static readonly STATS_DISPLAY = ":zap: {fightPoint} | :dagger: {attack} | :shield: {defense} | :rocket: {speed} | :wind_blowing_face: {baseBreath} / {maxBreath} | :lungs: {breathRegen} | :heart: {health}";

	static readonly FIELDS_VALUE = `{name} :\n${ClassInfoConstants.STATS_DISPLAY}`;

	static readonly HOLY_CLASSES = [14, 15, 16, 21, 22] ;
}