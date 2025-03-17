import {LANGUAGE, Language} from "../../../Lib/src/Language";
import i18n from "../translations/i18n";

export class StringUtils {
	static getRandomTranslation(tr: string, lng: Language, replacements: { [key: string]: unknown } = {}): string {
		const intros: string[] = i18n.t(tr, {
			returnObjects: true,
			lng, ...replacements
		});
		return intros[Math.floor(Math.random() * intros.length)];
	}

	static capitalizeFirstLetter(str: string): string {
		if (str.length === 0) {
			return "";
		}

		if (str.length === 1) {
			return str.toUpperCase();
		}

		return str.charAt(0)
			.toUpperCase() + str.slice(1);
	}

	/**
	 * Get the ordinal of the given number in the given language
	 * @param toOrdinal
	 * @param language
	 * @param modifier - Optional modifier for the ordinal (only used in French when the number is 1 and the modifier is "f")
	 */
	static getOrdinal(toOrdinal: number, language: Language, modifier?: string): string {
		switch (language) {
		case LANGUAGE.FRENCH:
			if (toOrdinal === 1) {
				if (modifier && modifier === "f") {
					return "1ère";
				}
				return "1er";
			}
			return `${toOrdinal}ème`;
		case LANGUAGE.GERMAN:
			return `${toOrdinal}.`;
		case LANGUAGE.SPANISH:
			if (toOrdinal === 2) {
				return `${toOrdinal}do`;
			}
			if ([1, 3].includes(toOrdinal)) {
				return `${toOrdinal}ro`;
			}
			return `${toOrdinal}°`;
		case LANGUAGE.ITALIAN:
		case LANGUAGE.PORTUGUESE:
			if (toOrdinal === 1) {
				return `${toOrdinal}˚`;
			}
			return `${toOrdinal}°`;
		default: // English
			if (toOrdinal % 100 >= 10 && toOrdinal % 100 <= 20) {
				return `${toOrdinal}th`;
			}
			return toOrdinal + (["th", "st", "nd", "rd"][toOrdinal % 10] || "th");
		}
	}
}