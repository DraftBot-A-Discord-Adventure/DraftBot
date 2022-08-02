import {DraftBot} from "./DraftBot";
import {Client, Guild, Intents, TextChannel} from "discord.js";
import {loadConfig} from "./DraftBotConfig";
import {format} from "../utils/StringFormatter";
import {Servers} from "../database/game/models/Server";
import {IPCClient} from "./ipc/IPCClient";
import {Constants} from "../Constants";
import {Data} from "../Data";
import {Translations} from "../Translations";

// TODO change
declare const getValidationInfos: any;

export let draftBotInstance: DraftBot = null;
export let draftBotClient: Client = null;
export let shardId = -1;
export const botConfig = loadConfig();

process.on("uncaughtException", function(error) {
	console.log(error.stack);
});

process.on("unhandledRejection", function(err: Error) {
	console.log(err.stack);
	// process.exit(1);
});

process.on("message", async (message: any) => {
	if (!message.type) {
		return false;
	}

	if (message.type === "shardId") {
		shardId = message.data.shardId;
		IPCClient.connectToIPCServer(shardId);
		const mainShard = shardId === 0;
		const draftBot = new DraftBot(draftBotClient, botConfig, mainShard);
		draftBotInstance = draftBot;
		await draftBot.init();
		if (mainShard) {
			console.log("Launched main shard");
		}

		const botDataModule = Data.getModule("bot");
		require("figlet")(botDataModule.getString("reboot"), (err: any, data: any) => {
			if (data) {
				console.log(data.red);
				console.log(botDataModule.getString("br"));
			}
		});

		const guild = await draftBotClient.guilds.cache.get(botConfig.MAIN_SERVER_ID);
		if (guild) {
			(await guild.channels.fetch(botConfig.CONSOLE_CHANNEL_ID) as TextChannel)
				.send({
					content: format(botDataModule.getString("startStatus"), {
						version: Data.getModule("package").getString("version"),
						shardId
					})
				})
				.catch(console.error);
			const dbl = await require("../DBL");
			dbl.verifyDBLRoles();
			dbl.startDBLWebhook();
		}
		draftBotClient.user
			.setActivity(botDataModule.getString("activity"));
	}
});

const main = async function() {
	const client = new Client(
		{
			restTimeOffset: 0,
			intents: [
				Intents.FLAGS.GUILDS, // We need it for roles
				Intents.FLAGS.GUILD_MEMBERS, // For tops
				// Intents.FLAGS.GUILD_BANS We don't need to ban or unban
				// Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS We don't need to create emojis or stickers
				Intents.FLAGS.GUILD_INTEGRATIONS,
				// Intents.FLAGS.GUILD_WEBHOOKS We don't need to create webhooks
				// Intents.FLAGS.GUILD_INVITES We don't need to create or delete invites
				// Intents.FLAGS.GUILD_VOICE_STATES We don't use voice
				// Intents.FLAGS.GUILD_PRESENCES // Needed to update the bot presence
				Intents.FLAGS.GUILD_MESSAGES, // We need to receive, send, update and delete messages
				Intents.FLAGS.GUILD_MESSAGE_REACTIONS, // We need to add reactions
				// Intents.FLAGS.GUILD_MESSAGE_TYPING We don't need to know this
				Intents.FLAGS.DIRECT_MESSAGES, // We need to send and receive direct messages
				Intents.FLAGS.DIRECT_MESSAGE_REACTIONS // We maybe need to receive direct messages reaction
				// Intents.FLAGS.DIRECT_MESSAGE_TYPING We don't need to know this
			],
			restRequestTimeout: Constants.MAX_TIME_BOT_RESPONSE, // allows the senddata command to succeed
			allowedMentions: {parse: ["users", "roles"]},
			partials: ["MESSAGE", "CHANNEL"]
		}
	);

	/**
	 * Will be executed each time the bot join a new server
	 */
	const onDiscordGuildCreate = async (guild: Guild) => {
		const [serv] = await Servers.getOrRegister(botConfig.MAIN_SERVER_ID);
		const msg = getJoinLeaveMessage(guild, true, serv.language);
		console.log(msg);
	};

	/**
	 * Will be executed each time the bot leave a server
	 */
	const onDiscordGuildDelete = async (guild: Guild) => {
		const [serv] = await Servers.getOrRegister(botConfig.MAIN_SERVER_ID);
		const msg = getJoinLeaveMessage(guild, false, serv.language);
		console.log(msg);
	};

	/**
	 * Get the message when the bot joins or leaves a guild
	 * @param {Guild} guild
	 * @param {boolean} join
	 * @param {"fr"|"en"} language
	 * @return {string}
	 */
	const getJoinLeaveMessage = (guild: Guild, join: boolean, language: string) => {
		const {validation, humans, bots, ratio} = getValidationInfos(guild);
		return format(
			join
				? Translations.getModule("bot", language).get("joinGuild")
				: Translations.getModule("bot", language).get("leaveGuild"),
			{
				guild: guild,
				humans: humans,
				robots: bots,
				ratio: ratio,
				validation: validation
			});
	};

	client.on("ready", () => console.log("Client ready"));
	client.on("guildCreate", onDiscordGuildCreate);
	client.on("guildDelete", onDiscordGuildDelete);

	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	global.client = client;
	draftBotClient = client;
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	global.discord = require("discord.js");
	await client.login(botConfig.DISCORD_CLIENT_TOKEN);
};

main().then();
