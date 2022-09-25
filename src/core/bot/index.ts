import {DraftBot} from "./DraftBot";
import {Client, Guild, Partials, TextChannel} from "discord.js";
import {loadConfig} from "./DraftBotConfig";
import {format} from "../utils/StringFormatter";
import {Servers} from "../database/game/models/Server";
import {IPCClient} from "./ipc/IPCClient";
import {Constants} from "../Constants";
import {Translations} from "../Translations";
import {BotUtils} from "../utils/BotUtils";
import {DBL} from "../DBL";
import {BotConstants} from "../constants/BotConstants";
import {Intents} from "../intents";

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

process.on("message", async (message: { type: string, data: { shardId: number } }) => {
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

		console.log("############################################");
		const guild = await draftBotClient.guilds.cache.get(botConfig.MAIN_SERVER_ID);
		if (guild) {
			(await guild.channels.fetch(botConfig.CONSOLE_CHANNEL_ID) as TextChannel)
				.send({
					content: format(BotConstants.START_STATUS, {
						version: await BotConstants.VERSION,
						shardId
					})
				})
				.catch(console.error);
			await DBL.verifyDBLRoles();
			DBL.startDBLWebhook();
		}
		draftBotClient.user
			.setActivity(BotConstants.ACTIVITY);
	}
});

/**
 * The main function of the bot : makes the bot start
 */
async function main(): Promise<void> {
	const client = new Client(
		{
			intents: Intents.LIST,
			allowedMentions: {parse: ["users", "roles"]},
			partials: [Partials.Message, Partials.Channel],
			rest: {
				offset: 0,
				timeout: Constants.MAX_TIME_BOT_RESPONSE // allows the senddata command to succeed
			}
		}
	);

	/**
	 * Will be executed each time the bot join a new server
	 */
	async function onDiscordGuildCreate(guild: Guild): Promise<void> {
		const serv = await Servers.getOrRegister(botConfig.MAIN_SERVER_ID);
		const msg = getJoinLeaveMessage(guild, true, serv.language);
		draftBotInstance.logsDatabase.logServerJoin(guild.id).then();
		console.log(msg);
	}

	/**
	 * Will be executed each time the bot leave a server
	 */
	async function onDiscordGuildDelete(guild: Guild): Promise<void> {
		const serv = await Servers.getOrRegister(botConfig.MAIN_SERVER_ID);
		const msg = getJoinLeaveMessage(guild, false, serv.language);
		draftBotInstance.logsDatabase.logServerQuit(guild.id).then();
		console.log(msg);
	}

	/**
	 * Get the message when the bot joins or leaves a guild
	 * @param {Guild} guild
	 * @param {boolean} join
	 * @param {"fr"|"en"} language
	 * @return {string}
	 */
	function getJoinLeaveMessage(guild: Guild, join: boolean, language: string): string {
		const {validation, humans, bots, ratio} = BotUtils.getValidationInfos(guild);
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
	}

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
}

main().then();
