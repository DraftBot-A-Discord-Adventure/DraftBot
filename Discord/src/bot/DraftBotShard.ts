import {
	Client, Guild, IntentsBitField, Partials, TextChannel
} from "discord.js";
import { Constants } from "../../../Lib/src/constants/Constants";
import { loadConfig } from "../config/DiscordConfig";
import i18n from "../translations/i18n";
import { BotUtils } from "../utils/BotUtils";
import { KeycloakConfig } from "../../../Lib/src/keycloak/KeycloakConfig";
import { CommandsManager } from "../commands/CommandsManager";
import { DiscordMQTT } from "./DiscordMQTT";
import {
	LANGUAGE, Language
} from "../../../Lib/src/Language";
import { DiscordDatabase } from "../database/discord/DiscordDatabase";
import { DraftBotDiscordWebServer } from "./DraftBotDiscordWebServer";
import { DraftBotLogger } from "../../../Lib/src/logs/Logger";

process.on("uncaughtException", function(error) {
	if (DraftBotLogger.isInitialized()) {
		DraftBotLogger.get().error("Uncaught exception", error);
	}
	else {
		console.error("Uncaught exception", error);
	}
});

process.on("unhandledRejection", function(error: Error) {
	if (DraftBotLogger.isInitialized()) {
		DraftBotLogger.get().error("Unhandled rejection", error);
	}
	else {
		console.error("Unhandled rejection", error);
	}
});

export let draftBotClient!: Client;
export const discordConfig = loadConfig();
export const keycloakConfig: KeycloakConfig = {
	realm: discordConfig.KEYCLOAK_REALM,
	url: discordConfig.KEYCLOAK_URL,
	clientId: discordConfig.KEYCLOAK_CLIENT_ID,
	clientSecret: discordConfig.KEYCLOAK_CLIENT_SECRET
};
export let shardId = -1;
export const discordDatabase = new DiscordDatabase();

process.on("message", async (message: {
	type: string; data: { shardId: number };
}) => {
	if (!message.type) {
		return false;
	}

	if (message.type === "shardId") {
		shardId = message.data.shardId;
		DraftBotLogger.init(discordConfig.LOGGER_LEVEL, discordConfig.LOGGER_LOCATIONS, `Shard ${shardId}`);
		DraftBotDiscordWebServer.start(shardId);
		const isMainShard = shardId === 0;
		await CommandsManager.register(draftBotClient, isMainShard);
		await DiscordMQTT.init(isMainShard);
		await discordDatabase.init(isMainShard);
	}

	const guild = draftBotClient?.guilds.cache.get(discordConfig.MAIN_SERVER_ID);
	if (guild?.shard) {
		(await guild.channels.fetch(discordConfig.CONSOLE_CHANNEL_ID) as TextChannel)
			.send(`:robot: **DraftBot** - v${process.env.npm_package_version} - Shard ${shardId}`)
			.catch(e => {
				DraftBotLogger.get().error("Error while sending message to console channel", e);
			});
	}
	return true;
});

export abstract class Intents {
	static readonly LIST =
		[
			IntentsBitField.Flags.Guilds, // We need it for roles
			IntentsBitField.Flags.GuildMembers, // For tops
			/*
			 * IntentsBitField.Flags.GuildBans, // We do not need to ban anyone
			 * IntentsBitField.Flags.GuildEmojisAndStickers, // We do not need to manage emojis nor stickers
			 * IntentsBitField.Flags.GuildIntegrations, // we do not need to manage integrations
			 * IntentsBitField.Flags.GuildWebhooks, // We do not need webhook
			 * IntentsBitField.Flags.GuildInvites, // We do not need to manage guild invites
			 * IntentsBitField.Flags.GuildVoiceStates, // We do not need to manage voice channels
			 * IntentsBitField.Flags.GuildPresences, // We do not need to manage presences
			 */
			IntentsBitField.Flags.GuildMessages, // We need to receive, send, update and delete messages
			IntentsBitField.Flags.GuildMessageReactions, // We need to add reactions
			// IntentsBitField.Flags.GuildMessageTyping, // We do not need to see who's typing
			IntentsBitField.Flags.DirectMessages, // We need to send and receive direct messages
			IntentsBitField.Flags.DirectMessageReactions // We need to receive direct messages reaction
			/*
			 * IntentsBitField.Flags.DirectMessageTyping, // We do not need to see who is currently writing to the bots dms
			 * IntentsBitField.Flags.MessageContent, // We do not need to manage other's message content
			 * IntentsBitField.Flags.GuildScheduledEvents // We do not need to see a guild's events
			 */
		];
}

/**
 * The main function of the bot : makes the bot start
 */
async function main(): Promise<void> {
	require("source-map-support").install();
	const client = new Client(
		{
			intents: Intents.LIST,
			allowedMentions: { parse: ["users", "roles"] },
			partials: [Partials.Message, Partials.Channel],
			rest: {
				offset: 0,
				timeout: Constants.MAX_TIME_BOT_RESPONSE
			}
		}
	);

	/**
	 * Get the message when the bot joins or leaves a guild
	 * @param guild
	 * @param join
	 * @param lng
	 * @returns
	 */
	function getJoinLeaveMessage(guild: Guild, join: boolean, lng: Language): string {
		const {
			validation, humans, bots, ratio
		} = BotUtils.getValidationInfos(guild);
		return i18n.t(join ? "bot:joinGuild" : "bot:leaveGuild", {
			guild: guild.name,
			humans,
			robots: bots,
			ratio,
			validation,
			lng
		});
	}

	/**
	 * Will be executed each time the bot join a new server
	 * @param guild
	 */
	function onDiscordGuildCreate(guild: Guild): void {
		const msg = getJoinLeaveMessage(guild, true, LANGUAGE.ENGLISH);
		DraftBotLogger.get().info(msg);
	}

	/**
	 * Will be executed each time the bot leave a server
	 * @param guild
	 */
	function onDiscordGuildDelete(guild: Guild): void {
		const msg = getJoinLeaveMessage(guild, false, LANGUAGE.ENGLISH);
		DraftBotLogger.get().info(msg);
	}

	client.on("ready", () => console.log("Bot is ready"));
	client.on("guildCreate", onDiscordGuildCreate);
	client.on("guildDelete", onDiscordGuildDelete);

	draftBotClient = client;

	await client.login(discordConfig.DISCORD_CLIENT_TOKEN);
}

main().then();
