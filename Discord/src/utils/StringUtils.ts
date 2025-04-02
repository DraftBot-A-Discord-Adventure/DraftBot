import { Language } from "../../../Lib/src/Language";
import i18n from "../translations/i18n";

export class StringUtils {
	static getRandomTranslation(tr: string, lng: Language, replacements: { [key: string]: unknown } = {}): string {
		const intros: string[] = i18n.t(tr, {
			returnObjects: true,
			lng,
			...replacements
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
}
