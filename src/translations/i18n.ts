import * as i18next from "i18next";
import * as enBot from "../../../Lang/en/bot.json";
import * as frBot from "../../../Lang/fr/bot.json";
import * as enCommands from "../../../Lang/en/commands.json";
import * as frCommands from "../../../Lang/fr/commands.json";
import * as enDiscordBuilder from "../../../Lang/en/discordBuilder.json";
import * as frDiscordBuilder from "../../../Lang/fr/discordBuilder.json";
import * as enError from "../../../Lang/en/error.json";
import * as frError from "../../../Lang/fr/error.json";
import * as enItems from "../../../Lang/en/items.json";
import * as frItems from "../../../Lang/fr/items.json";
import * as enModels from "../../../Lang/en/models.json";
import * as frModels from "../../../Lang/fr/models.json";

// todo load automatically modules

i18next.init({
	fallbackLng: "fr",
	resources: {
		en: {
			bot: enBot,
			commands: enCommands,
			discordBuilder: enDiscordBuilder,
			error: enError,
			items: enItems,
			models: enModels
		},
		fr: {
			bot: frBot,
			commands: frCommands,
			discordBuilder: frDiscordBuilder,
			error: frError,
			items: frItems,
			models: frModels
		}
	}
}).then();

const i18n = i18next;

export default i18n;