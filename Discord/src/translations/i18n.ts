import * as i18next from "i18next";
import * as enBot from "../../../Lang/en/bot.json";
import * as frBot from "../../../Lang/fr/bot.json";
import * as deBot from "../../../Lang/de/bot.json";
import * as esBot from "../../../Lang/es/bot.json";
import * as ptBot from "../../../Lang/pt/bot.json";
import * as itBot from "../../../Lang/it/bot.json";
import * as enCommands from "../../../Lang/en/commands.json";
import * as frCommands from "../../../Lang/fr/commands.json";
import * as deCommands from "../../../Lang/de/commands.json";
import * as esCommands from "../../../Lang/es/commands.json";
import * as ptCommands from "../../../Lang/pt/commands.json";
import * as itCommands from "../../../Lang/it/commands.json";
import * as deDiscordBuilder from "../../../Lang/de/discordBuilder.json";
import * as esDiscordBuilder from "../../../Lang/es/discordBuilder.json";
import * as ptDiscordBuilder from "../../../Lang/pt/discordBuilder.json";
import * as itDiscordBuilder from "../../../Lang/it/discordBuilder.json";
import * as enDiscordBuilder from "../../../Lang/en/discordBuilder.json";
import * as frDiscordBuilder from "../../../Lang/fr/discordBuilder.json";
import * as enError from "../../../Lang/en/error.json";
import * as frError from "../../../Lang/fr/error.json";
import * as deError from "../../../Lang/de/error.json";
import * as esError from "../../../Lang/es/error.json";
import * as ptError from "../../../Lang/pt/error.json";
import * as itError from "../../../Lang/it/error.json";
import * as deItems from "../../../Lang/de/items.json";
import * as esItems from "../../../Lang/es/items.json";
import * as ptItems from "../../../Lang/pt/items.json";
import * as itItems from "../../../Lang/it/items.json";
import * as enItems from "../../../Lang/en/items.json";
import * as frItems from "../../../Lang/fr/items.json";
import * as enModels from "../../../Lang/en/models.json";
import * as esModels from "../../../Lang/es/models.json";
import * as frModels from "../../../Lang/fr/models.json";
import * as ptModels from "../../../Lang/pt/models.json";
import * as itModels from "../../../Lang/it/models.json";
import * as deModels from "../../../Lang/de/models.json";
import * as enEvents from "../../../Lang/en/events.json";
import * as frEvents from "../../../Lang/fr/events.json";
import * as deEvents from "../../../Lang/de/events.json";
import * as esEvents from "../../../Lang/es/events.json";
import * as ptEvents from "../../../Lang/pt/events.json";
import * as itEvents from "../../../Lang/it/events.json";
import * as enAdvices from "../../../Lang/en/advices.json";
import * as frAdvices from "../../../Lang/fr/advices.json";
import * as deAdvices from "../../../Lang/de/advices.json";
import * as esAdvices from "../../../Lang/es/advices.json";
import * as ptAdvices from "../../../Lang/pt/advices.json";
import * as itAdvices from "../../../Lang/it/advices.json";
import * as enSmallEvents from "../../../Lang/en/smallEvents.json";
import * as frSmallEvents from "../../../Lang/fr/smallEvents.json";
import * as deSmallEvents from "../../../Lang/de/smallEvents.json";
import * as esSmallEvents from "../../../Lang/es/smallEvents.json";
import * as ptSmallEvents from "../../../Lang/pt/smallEvents.json";
import * as itSmallEvents from "../../../Lang/it/smallEvents.json";
import {LANGUAGE} from "../../../Lib/src/Language";

// Todo load automatically modules

i18next.init({
	fallbackLng: LANGUAGE.DEFAULT_LANGUAGE,
	resources: {
		en: {
			bot: enBot,
			commands: enCommands,
			discordBuilder: enDiscordBuilder,
			error: enError,
			items: enItems,
			models: enModels,
			events: enEvents,
			advices: enAdvices,
			smallEvents: enSmallEvents
		},
		fr: {
			bot: frBot,
			commands: frCommands,
			discordBuilder: frDiscordBuilder,
			error: frError,
			items: frItems,
			models: frModels,
			events: frEvents,
			advices: frAdvices,
			smallEvents: frSmallEvents
		},
		de: {
			bot: deBot,
			commands: deCommands,
			discordBuilder: deDiscordBuilder,
			error: deError,
			items: deItems,
			models: deModels,
			events: deEvents,
			advices: deAdvices,
			smallEvents: deSmallEvents
		},
		es: {
			bot: esBot,
			commands: esCommands,
			discordBuilder: esDiscordBuilder,
			error: esError,
			items: esItems,
			models: esModels,
			events: esEvents,
			advices: esAdvices,
			smallEvents: esSmallEvents
		},
		pt: {
			bot: ptBot,
			commands: ptCommands,
			discordBuilder: ptDiscordBuilder,
			error: ptError,
			items: ptItems,
			models: ptModels,
			events: ptEvents,
			advices: ptAdvices,
			smallEvents: ptSmallEvents
		},
		it: {
			bot: itBot,
			commands: itCommands,
			discordBuilder: itDiscordBuilder,
			error: itError,
			items: itItems,
			models: itModels,
			events: itEvents,
			advices: itAdvices,
			smallEvents: itSmallEvents
		}
	}
}).then();

const i18n = i18next;

export default i18n;