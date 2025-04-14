import { Database } from "../../../../Lib/src/database/Database";
import { getDatabaseConfiguration } from "../../config/DiscordConfig";
import { discordConfig } from "../../bot/DraftBotShard";

export class DiscordDatabase extends Database {
	constructor() {
		super(getDatabaseConfiguration(discordConfig, "discord"), `${__dirname}/models`, `${__dirname}/migrations`);
	}
}
