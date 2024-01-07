import * as i18next from "i18next";
import * as enBot from "../../../Lang/en/bot.json";
import * as frBot from "../../../Lang/fr/bot.json";
import * as enCommands from "../../../Lang/en/commands.json";
import * as frCommands from "../../../Lang/fr/commands.json";
import * as enDiscordBuilder from "../../../Lang/en/discordBuilder.json";
import * as frDiscordBuilder from "../../../Lang/fr/discordBuilder.json";

i18next.init({
	fallbackLng: "en",
	resources: {
		en: {
			bot: enBot,
			commands: enCommands,
			discordBuilder: enDiscordBuilder
		},
		fr: {
			bot: frBot,
			commands: frCommands,
			discordBuilder: frDiscordBuilder
		}
	}
}).then();

const i18n = i18next;

export default i18n;