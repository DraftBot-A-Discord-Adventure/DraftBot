import * as i18next from "i18next";
import {Language, LANGUAGE} from "../../../Lib/src/Language";
import {readdirSync} from "fs";
import {resolve} from "path";
import {BotUtils} from "../utils/BotUtils";

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

i18next.init(getI18nOptions()).then();

export class I18n {

	/**
	 * Translate the given key with the given options and returns all the objects found
	 * @param key
	 * @param options
	 */
	static t(key: string, options: {
		lng: Language,
		returnObjects: true
	} & i18next.TOptions): string[];

	/**
	 * Translate the given key with the given options
	 * @param key
	 * @param options
	 */
	static t(key: string, options: {
		lng: Language,
		returnObjects?: false
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
	static t(key: string, options: {
		lng: Language
	} & i18next.TOptions): string | string[] {
		const value: string | string[] = i18next.t(key, options);
		if (Array.isArray(value)) {
			return (value as string[]).map(convertCommandFormat);
		}
		return convertCommandFormat(value);
	}
}

const i18n = I18n;

export default i18n;
