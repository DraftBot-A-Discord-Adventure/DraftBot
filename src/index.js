require("colors");
require("./core/Constant");
require("./core/MessageError");
require("./core/Tools");
const Draftbot = require("./core/DraftBot");

process.on("unhandledRejection", function(err) {
	console.log(err.stack);
	process.exit(1);
});

(async (Drafbot) => {
	await Drafbot.init();

	/**
	 * Will be executed whenever the bot has started
	 * @return {Promise<void>}
	 */
	const onDiscordReady = async () => {
		require("figlet")(JsonReader.bot.reboot, (err, data) => {
			console.log(data.red);
			console.log(JsonReader.bot.br.grey);
		});

		await client.guilds.cache.get(JsonReader.app.MAIN_SERVER_ID)
			.channels
			.cache
			.get(JsonReader.app.CONSOLE_CHANNEL_ID)
			.send(JsonReader.bot.startStatus + JsonReader.package.version)
			.catch(console.error);

		await client.user
			.setActivity(JsonReader.bot.activity)
			.catch(console.error);

		await require("./core/DBL").verifyDBLRoles();
	};

	/**
	 * Will be executed each time the bot join a new server
	 */
	const onDiscordGuildCreate = async (guild) => {
		const [serv] = await Servers.getOrRegister(JsonReader.app.MAIN_SERVER_ID);
		const msg = getJoinLeaveMessage(guild, true, serv.language);
		(await client.channels.fetch(JsonReader.app.CONSOLE_CHANNEL_ID)).send(msg);
		console.log(msg);
	};

	/**
	 * Will be executed each time the bot leave a server
	 */
	const onDiscordGuildDelete = async (guild) => {
		const [serv] = await Servers.getOrRegister(JsonReader.app.MAIN_SERVER_ID);
		const msg = getJoinLeaveMessage(guild, false, serv.language);
		(await client.channels.fetch(JsonReader.app.CONSOLE_CHANNEL_ID)).send(msg);
		console.log(msg);
	};

	/**
	 * Get the message when the bot joins or leaves a guild
	 * @param {module:"discord.js".Guild} guild
	 * @param {boolean} join
	 * @param {"fr"|"en"} language
	 * @return {string}
	 */
	const getJoinLeaveMessage = (guild, join, language) => {
		const {validation, humans, bots, ratio} = getValidationInfos(guild);
		return format(
			join
				? JsonReader.bot.getTranslation(language).joinGuild
				: JsonReader.bot.getTranslation(language).leaveGuild,
			{
				guild: guild,
				humans: humans,
				robots: bots,
				ratio: ratio,
				validation: validation
			});
	};

	/**
	 * Will be executed each time the bot see a message
	 * @param {module:"discord.js".Message} message
	 * @return {Promise<void>}
	 */
	const onDiscordMessage = async (message) => {
		if (message.author.bot) {
			return;
		}
		if (message.channel.type === "dm") {
			await handlePrivateMessage(message);
		}
		else {
			await handleMessage(message);
		}
	};

	client.on("ready", onDiscordReady);
	client.on("guildCreate", onDiscordGuildCreate);
	client.on("guildDelete", onDiscordGuildDelete);
	client.on("message", onDiscordMessage);

	await client.login(JsonReader.app.DISCORD_CLIENT_TOKEN);
})(Draftbot);


