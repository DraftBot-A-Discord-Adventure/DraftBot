export type Language = "fr" | "en" | "it" | "es" | "de" | "pt";

export class LANGUAGE {
	static readonly FRENCH: Language = "fr";

	static readonly ENGLISH: Language = "en";

	static readonly ITALIAN: Language = "it";

	static readonly SPANISH: Language = "es";

	static readonly PORTUGUESE: Language = "pt";

	static readonly GERMAN: Language = "de";

	static get LANGUAGES(): Language[] {
		return Object.values(LANGUAGE);
	}

	static get DEFAULT_LANGUAGE(): Language {
		return LANGUAGE.ENGLISH;
	}

	/**
	 * Supported language matching a locale such as Discord's "fr" or "en-US", or the default language
	 */
	static fromLocale(locale: string): Language {
		const language = locale.substring(0, 2);
		return (LANGUAGE.LANGUAGES as string[]).includes(language) ? language as Language : LANGUAGE.DEFAULT_LANGUAGE;
	}
}
