import * as i18next from "i18next";
import * as enBot from "../../../Lang/en/bot.json";
import * as frBot from "../../../Lang/fr/bot.json";

i18next.init({
	fallbackLng: "en",
	resources: {
		en: {
			bot: enBot
		},
		fr: {
			bot: frBot
		}
	}
}).then();

const i18n = i18next;

export default i18n;