import {Language} from "../../../Lib/src/Language";
import i18n from "../translations/i18n";

export class StringUtils {
	static getRandomTranslation(tr: string, lng: Language, replacements: { [key: string]: unknown } = {}): string {
		const intros: string[] = i18n.t(tr, {returnObjects: true, lng, ...replacements});
		return intros[Math.floor(Math.random() * intros.length)];
	}
}