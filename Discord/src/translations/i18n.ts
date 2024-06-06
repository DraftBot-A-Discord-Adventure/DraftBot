import * as i18next from "i18next";
import {LANGUAGE} from "../../../Lib/src/Language";
import {readdirSync} from "fs";
import {resolve} from "path";

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

i18next.init(getI18nOptions()).then();

const i18n = i18next;

export default i18n;