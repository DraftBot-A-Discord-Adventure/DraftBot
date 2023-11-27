import {Client, Guild, IntentsBitField, Partials, TextChannel} from "discord.js";
import {Constants} from "../Constants";
import {loadConfig} from "../config/DiscordConfig";
import i18n from "../translations/i18n";
import {BotUtils} from "../utils/BotUtils";

process.on("uncaughtException", function(error) {
	console.log(error);
	console.log(error.stack);
});

process.on("unhandledRejection", function(err: Error) {
	console.log(err);
	console.log(err.stack);
});

export let draftBotClient: Client | null = null;
export const discordConfig = loadConfig();
export let shardId = -1;

process.on("message", async (message: { type: string, data: { shardId: number } }) => {
	if (!message.type) {
		return false;
	}

	if (message.type === "shardId") {
		shardId = message.data.shardId;
	}

	const guild = draftBotClient?.guilds.cache.get(discordConfig.MAIN_SERVER_ID);
	if (guild?.shard) {
		(await guild.channels.fetch(discordConfig.CONSOLE_CHANNEL_ID) as TextChannel)
			.send(`:robot: **DraftBot** - v${await Constants.VERSION} - Shard ${shardId}`)
			.catch(console.error);
	}
});

export abstract class Intents {
	static readonly LIST =
		[
			IntentsBitField.Flags.Guilds, // We need it for roles
			IntentsBitField.Flags.GuildMembers, // For tops
			// IntentsBitField.Flags.GuildBans, // We do not need to ban anyone
			// IntentsBitField.Flags.GuildEmojisAndStickers, // We do not need to manage emojis nor stickers
			// IntentsBitField.Flags.GuildIntegrations, // we do not need to manage integrations
			// IntentsBitField.Flags.GuildWebhooks, // We do not need webhook
			// IntentsBitField.Flags.GuildInvites, // We do not need to manage guild invites
			// IntentsBitField.Flags.GuildVoiceStates, // We do not need to manage voice channels
			// IntentsBitField.Flags.GuildPresences, // We do not need to manage presences
			IntentsBitField.Flags.GuildMessages, // We need to receive, send, update and delete messages
			IntentsBitField.Flags.GuildMessageReactions, // We need to add reactions
			// IntentsBitField.Flags.GuildMessageTyping, // We do not need to see who's typing
			IntentsBitField.Flags.DirectMessages, // We need to send and receive direct messages
			IntentsBitField.Flags.DirectMessageReactions // We need to receive direct messages reaction
			// IntentsBitField.Flags.DirectMessageTyping, // We do not need to see who is currently writing to the bots dms
			// IntentsBitField.Flags.MessageContent, // We do not need to manage other's message content
			// IntentsBitField.Flags.GuildScheduledEvents // We do not need to see a guild's events
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
			allowedMentions: {parse: ["users", "roles"]},
			partials: [Partials.Message, Partials.Channel],
			rest: {
				offset: 0,
				timeout: Constants.MAX_TIME_BOT_RESPONSE
			}
		}
	);

	/**
	 * Get the message when the bot joins or leaves a guild
	 * @param {Guild} guild
	 * @param {boolean} join
	 * @param {"fr"|"en"} language
	 * @return {string}
	 */
	function getJoinLeaveMessage(guild: Guild, join: boolean, language: string): string {
		const {validation, humans, bots, ratio} = BotUtils.getValidationInfos(guild);
		return i18n.t(join ? "bot:joinGuild" : "bot:leaveGuild", {
			guild: guild.name,
			humans,
			robots: bots,
			ratio,
			validation,
			lng: language
		});
	}

	/**
	 * Will be executed each time the bot join a new server
	 */
	async function onDiscordGuildCreate(guild: Guild): Promise<void> {
		// TODO
		//const serv = await Servers.getOrRegister(botConfig.MAIN_SERVER_ID);
		const msg = getJoinLeaveMessage(guild, true, "en");
		//draftBotInstance.logsDatabase.logServerJoin(guild.id).then();
		console.log(msg);
	}

	/**
	 * Will be executed each time the bot leave a server
	 */
	async function onDiscordGuildDelete(guild: Guild): Promise<void> {
		// TODO
		//const serv = await Servers.getOrRegister(botConfig.MAIN_SERVER_ID);
		const msg = getJoinLeaveMessage(guild, false, "en");
		//draftBotInstance.logsDatabase.logServerQuit(guild.id).then();
		console.log(msg);
	}

	client.on("ready", () => console.log("Client ready"));
	client.on("guildCreate", onDiscordGuildCreate);
	client.on("guildDelete", onDiscordGuildDelete);

	draftBotClient = client;

	await client.login(discordConfig.DISCORD_CLIENT_TOKEN);
}

main().then();