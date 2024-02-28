import {Language} from "../Language";

export class StringConstants {
	static readonly PROGRESS_BAR_SIZE = 20;

	static readonly LANGUAGE: {
		FRENCH: Language,
		ENGLISH: Language,
		ITALIAN: Language,
		SPANISH: Language,
		PORTUGUESE: Language,
		GERMAN: Language
	}
		= {
		FRENCH: "fr",
		ENGLISH: "en",
		ITALIAN: "it",
		SPANISH: "es",
		PORTUGUESE: "pt",
		GERMAN: "de"
	};

	static readonly DEFAULT_LANGUAGE: Language = StringConstants.LANGUAGE.FRENCH

}