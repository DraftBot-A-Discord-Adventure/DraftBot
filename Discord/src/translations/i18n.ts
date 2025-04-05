import * as i18next from "i18next";
import {
	Language, LANGUAGE
} from "../../../Lib/src/Language";
import { readdirSync } from "fs";
import { resolve } from "path";
import { BotUtils } from "../utils/BotUtils";
import { EmoteUtils } from "../utils/EmoteUtils";
import { DraftBotIcons } from "../../../Lib/src/DraftBotIcons";
import { DraftBotLogger } from "../../../Lib/src/logs/Logger";

function getI18nOptions(): i18next.InitOptions<unknown> {
	const resources: i18next.Resource = {};
	for (const language of LANGUAGE.LANGUAGES) {
		const resourceFiles: i18next.ResourceLanguage = {};
		const dirPath = `../../../Lang/${language}`;
		for (const file of readdirSync(resolve(__dirname, dirPath))) {
			if (file.endsWith(".json")) {
				console.log(`Loading i18next resource ${dirPath}/${file}`);
				resourceFiles[file.substring(0, file.length - 5)] = require(`${dirPath}/${file}`);
			}
		}
		resources[language] = resourceFiles;
	}

	return {
		fallbackLng: LANGUAGE.DEFAULT_LANGUAGE,
		resources
	};
}


/**
 * Replace in the given string all occurences of "{command:...}" by the corresponding discord command name
 * @param str
 */
function convertCommandFormat(str: string): string {
	return str.replace(/{command:(.*?)}/g, (_match, command) => BotUtils.commandsMentions.get(command) ?? `\`COMMAND NOT FOUND : ${command}\``);
}

/**
 * Replace in the given string all occurences of "{emote:...}" by the corresponding discord emote
 * @param str
 */
function convertEmoteFormat(str: string): string {
	return str.replace(/{emote:(.*?)}/g, (_match, emote) => EmoteUtils.translateEmojiToDiscord(getEmote(emote) ?? `EMOTE NOT FOUND : ${emote}`));
}

type EmotePathFolder = Record<string, unknown> | string[];
type EmotePath = EmotePathFolder | string;

export type TranslationOption = {
	lng: Language;
} & i18next.TOptions;

/**
 * Get the corresponding to emote for the given emote name
 * @param emote
 */
function getEmote(emote: string): string | null {
	try {
		let basePath: EmotePath = DraftBotIcons as EmotePathFolder;
		const emotePath = emote.split(".");
		for (const path of emotePath) {
			if (typeof basePath === "string") {
				return null;
			}
			basePath = Array.isArray(basePath) ? basePath[parseInt(path)] : basePath[path] as EmotePath;
		}
		return typeof basePath === "string" ? basePath : null;
	}
	catch (e) {
		DraftBotLogger.get().error(`Error while getting emote ${emote}`, e);
		return null;
	}
}

/**
 * Apply all the draftbot formatting to the given string
 * @param str
 */
function draftbotFormat(str: string): string {
	return convertCommandFormat(convertEmoteFormat(str));
}

i18next.init(getI18nOptions())
	.then();

export class I18nDraftbot {
	/**
	 * Translate the given key with the given options and returns all the objects found
	 * @param key
	 * @param options
	 */
	static t(key: string | string[], options: {
		lng: Language;
		returnObjects: true;
	} & i18next.TOptions): string[];

	/**
	 * Translate the given key with the given options
	 * @param key
	 * @param options
	 */
	static t(key: string | string[], options: {
		lng: Language;
		returnObjects?: false;
	} & i18next.TOptions): string;

	/**
	 * Translate the given key with the given options
	 * Override of the i18next.t function to allow the following :
	 * - replace the "{command:...}" format by the corresponding discord command
	 * - force lng to be a Language value and being required
	 * - force the return type to be a string (and not a never)
	 * @param key
	 * @param options
	 */
	static t(key: string | string[], options: TranslationOption): string | string[] {
		const value: string | string[] = i18next.t(key, options);
		if (Array.isArray(value)) {
			return (value as string[]).map(draftbotFormat);
		}
		return draftbotFormat(value);
	}
}

const i18n = I18nDraftbot;

export default i18n;
