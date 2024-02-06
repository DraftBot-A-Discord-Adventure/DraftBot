import {ICommand} from "./ICommand";
import {
	ApplicationCommand,
	ApplicationCommandOptionType,
	Attachment,
	AttachmentBuilder,
	ChannelType,
	Client,
	GuildResolvable,
	Message,
	MessageType,
	PermissionsBitField,
	REST,
	RouteLike,
	Routes,
	Snowflake
} from "discord.js";
import {RESTPostAPIChatInputApplicationCommandsJSONBody} from "discord-api-types/v10";
import {discordConfig, draftBotClient, keycloakConfig} from "../bot/DraftBotShard";
import {KeycloakUser} from "../../../Lib/src/keycloak/KeycloakUser";
import {readdirSync} from "fs";
import i18n from "../translations/i18n";
import {replyErrorMessage} from "../utils/ErrorUtils";
import {Constants} from "../Constants";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {escapeUsername} from "../../../Lib/src/utils/StringUtils";
import {DraftBotReactionMessageBuilder} from "../messages/DraftBotReactionMessage";
import {DraftBotReaction} from "../messages/DraftBotReaction";
import {KeycloakUtils} from "../../../Lib/src/keycloak/KeycloakUtils";
import {DraftbotChannel, DraftbotInteraction} from "../messages/DraftbotInteraction";
import {DiscordWebSocket} from "../bot/Websocket";
import {PacketContext} from "../../../Lib/src/packets/DraftBotPacket";
import {DiscordCache} from "../bot/DiscordCache";

export class CommandsManager {
	static commands = new Map<string, ICommand>();

	static commandsInstances = new Map<string, ApplicationCommand>();

	static commandsMentions = new Map<string, string>();

	/**
	 * Register the bot at launch
	 * @param client
	 * @param isMainShard
	 */
	static async register(client: Client, isMainShard: boolean): Promise<void> {
		await this.registerAllCommands(client, isMainShard);

		this.manageInteractionCreate(client);

		this.manageMessageCreate(client);
	}

	/**
	 * Register all commands that should be registered
	 * @param clientId
	 * @param commands
	 * @param regFunc
	 */
	static async registerCommands(clientId: Snowflake, commands: RESTPostAPIChatInputApplicationCommandsJSONBody[], regFunc: (clientId: Snowflake, serverId: Snowflake) => RouteLike): Promise<void> {
		const rest = new REST({version: "10"}).setToken(discordConfig.DISCORD_CLIENT_TOKEN);
		try {
			console.log(`Started refreshing ${commands.length} application (/) commands.`);
			const data = await rest.put(
				regFunc(clientId, discordConfig.MAIN_SERVER_ID),
				{body: commands}
			);
			console.log(`Successfully reloaded ${Array.isArray(data) ? data.length : "###ERROR###"} application (/) commands.`);
		}
		catch (error) {
			// And of course, make sure you catch and log any errors!
			console.error(error);
		}
	}

	/**
	 * Register all commands at launch
	 * @param client
	 * @param isMainShard
	 */
	static async registerAllCommands(client: Client, isMainShard: boolean): Promise<void> {

		try {
			const allCommandToRegister = await this.getAllCommandsToRegister();
			if (isMainShard) {
				await CommandsManager.registerCommands(client.application!.id, allCommandToRegister[1], Routes.applicationGuildCommands);
				await CommandsManager.registerCommands(client.application!.id, allCommandToRegister[0], Routes.applicationCommands);
			}
			await this.refreshCommands(client);
		}
		catch (err) {
			console.log(err);
			// Do not start the bot if we can't register the commands
			process.exit(1);
		}
	}

	/**
	 * Execute all the important checks upon receiving a private message
	 * @param message
	 */
	static async handlePrivateMessage(message: Message | DraftbotInteraction): Promise<void> {
		const author = message instanceof DraftbotInteraction ? message.user.id : message.author.id;
		if (author === discordConfig.DM_MANAGER_ID) {
			return;
		}
		if (message instanceof Message) {
			await this.sendBackDMMessageToSupportChannel(message);
		}
		await this.sendHelperMessage(message);
	}

	/**
	 * Get the list of commands to register
	 */
	public static async getAllCommandsToRegister(): Promise<RESTPostAPIChatInputApplicationCommandsJSONBody[][]> {
		const categories = readdirSync("dist/Discord/src/commands");
		const globalCommandsToRegister: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];
		const guildsCommandsToRegister: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];
		const commandsToCheck = [];
		for (const category of categories) {
			if (category.endsWith(".js") || category.endsWith(".js.map")) {
				continue;
			}
			commandsToCheck.push(this.checkCommandFromCategory(category, globalCommandsToRegister, guildsCommandsToRegister));
		}
		await Promise.all(commandsToCheck);
		return [globalCommandsToRegister, guildsCommandsToRegister];
	}

	/**
	 * Get all commands to register and store them in the relevant maps
	 * @param client
	 * @private
	 */
	private static async refreshCommands(client: Client): Promise<void> {
		console.log("Fetching and saving commands...");
		const commands = (await client.application!.commands.fetch({withLocalizations: true}))
			.concat(await (await client.guilds.fetch(discordConfig.MAIN_SERVER_ID)).commands.fetch({withLocalizations: true}));
		// Store command instances
		for (const command of commands) {
			CommandsManager.commandsInstances.set(command[1].name, command[1]);
			this.addSubCommandsToTheCommandsMentions(command);
			CommandsManager.commandsMentions.set(command[1].name, `</${command[1].name}:${command[0]}>`);
		}
	}

	/**
	 * Check if a command has subcommands and add them to the commandsMentions map
	 * @param command
	 * @private
	 */
	private static addSubCommandsToTheCommandsMentions(command: [string, ApplicationCommand<{
		guild: GuildResolvable
	}>]): void {
		if (command[1].options) {
			for (const option of command[1].options) {
				if (option.type === ApplicationCommandOptionType.Subcommand) {
					CommandsManager.commandsMentions.set(`${command[1].name} ${option.name}`, `</${command[1].name} ${option.name}:${command[0]}>`);
				}
			}
		}
	}

	/**
	 * Push the commands to check from a given category
	 * @param category
	 * @param globalCommandsToRegister
	 * @param guildsCommandsToRegister
	 * @private
	 */
	private static async checkCommandFromCategory(
		category: string,
		globalCommandsToRegister: RESTPostAPIChatInputApplicationCommandsJSONBody[],
		guildsCommandsToRegister: RESTPostAPIChatInputApplicationCommandsJSONBody[]
	): Promise<void> {
		let commandsFiles = readdirSync(`dist/Discord/src/commands/${category}`).filter(command => command.endsWith(".js"));
		if (!discordConfig.TEST_MODE) {
			commandsFiles = commandsFiles.filter(command => !command.startsWith("Test"));
		}
		for (const commandFile of commandsFiles) {
			const commandInfo = (await import(`./${category}/${commandFile}`)).commandInfo as ICommand;
			if (!commandInfo?.slashCommandBuilder) {
				console.error(`Command dist/Discord/src/commands/${category}/${commandFile} is not a slash command`);
				continue;
			}
			this.commands.set(commandInfo.slashCommandBuilder.name, commandInfo);
			if (commandInfo.mainGuildCommand || discordConfig.TEST_MODE) {
				guildsCommandsToRegister.push(commandInfo.slashCommandBuilder.toJSON());
			}
			else {
				globalCommandsToRegister.push(commandInfo.slashCommandBuilder.toJSON());
			}
		}
	}

	/**
	 * Manage the creation of a message from channels the bot have access to
	 * @param client
	 * @private
	 */
	private static manageMessageCreate(client: Client): void {
		client.on("messageCreate", async message => {
			// Ignore all bot messages and own messages
			if (this.isAMessageFromBotOrEmpty(message)) {
				return;
			}
			if (message.channel.type === ChannelType.DM) {
				await CommandsManager.handlePrivateMessage(message);
				return;
			}
			if (this.isAMessageFromMassOrMissPing(message) || !this.shouldSendHelpMessage(message, client)) {
				return;
			}
			message.channel.send({
				content: `
${i18n.t("bot:mentionHelp", {
		lang: Constants.LANGUAGE.ENGLISH,
		commandHelp: this.commandsMentions.get("help"),
		commandLanguage: this.commandsMentions.get("language")
	})}

${i18n.t("bot:mentionHelp", {
		lang: Constants.LANGUAGE.FRENCH,
		commandHelp: this.commandsMentions.get("help"),
		commandLanguage: this.commandsMentions.get("language")
	})}`
			}).then();
		});
	}

	/**
	 * Check if the bot has the right and the permissions to send messages in the channel of the received message
	 * @param message
	 * @param client
	 * @private
	 */
	private static shouldSendHelpMessage(message: Message, client: Client): boolean {
		return message.mentions.has(client.user!.id) && this.hasChannelPermission(message.channel as unknown as DraftbotChannel)[0];
	}

	/**
	 * Check if the received message is a mass ping or a miss ping from a reply
	 * @param message
	 * @private
	 */
	private static isAMessageFromMassOrMissPing(message: Message): boolean {
		return message.content.includes("@here") || message.content.includes("@everyone") || message.type === MessageType.Reply;
	}

	/**
	 * Check if the message comes from a bot (itself or another one) or if it's content is empty in case it's not a DM
	 * @param message
	 * @private
	 */
	private static isAMessageFromBotOrEmpty(message: Message): boolean {
		return message.author.bot || message.author.id === draftBotClient!.user!.id || !message.content && message.channel.type !== ChannelType.DM;
	}

	/**
	 * Manage the slash commands from where the bot is asked
	 * @param client
	 * @private
	 */
	private static manageInteractionCreate(client: Client): void {
		client.on("interactionCreate", async discordInteraction => {
			if (!discordInteraction.isCommand() || discordInteraction.user.bot || discordInteraction.user.id === draftBotClient!.user!.id) {
				return;
			}
			const user = await KeycloakUtils.getOrRegisterDiscordUser(keycloakConfig, discordInteraction.user.id, discordInteraction.user.displayName, discordInteraction.locale.substring(0, 2));
			const interaction: DraftbotInteraction = DraftbotInteraction.cast(discordInteraction);
			if (!interaction.channel) {
				replyErrorMessage(
					interaction,
					user.attributes.language,
					i18n.t("bot:noChannelAccess", {lang: user.attributes.language})
				)
					.finally(() => null);
				return;
			}
			if (!interaction.member) { // If in DM, shouldn't happen
				interaction.channel.language = user.attributes.language;
				CommandsManager.handlePrivateMessage(interaction)
					.finally(() => null);
				return;
			}
			CommandsManager.handleCommand(interaction, user)
				.then();
		});
	}

	/**
	 * Sends back a message sent in the bot DMs to the support channel
	 * @param message
	 * @private
	 */
	private static async sendBackDMMessageToSupportChannel(message: Message): Promise<void> {
		await draftBotClient!.users.fetch(discordConfig.DM_MANAGER_ID).then(async (user) => {
			const attachmentList: (Attachment | AttachmentBuilder)[] = Array.from(message.attachments.values());
			if (message.content.length > Constants.DM.MAX_MESSAGE_LENGTH_ALLOWED) {
				attachmentList.push(new AttachmentBuilder(Buffer.from(message.content)).setName(`userMessage-${message.author.id}-${message.id}.txt`));
			}
			const supportAlert = i18n.t("bot:supportAlert", {
				lang: Constants.LANGUAGE.FRENCH,
				username: escapeUsername(message.author.username),
				id: message.author.id
			}) + (message.content.length > Constants.DM.MAX_MESSAGE_LENGTH_ALLOWED
				? Constants.DM.TOO_LONG_MESSAGE
				: message.content.length === 0
					? Constants.DM.NO_MESSAGE
					: Constants.DM.COMMENT_MESSAGE_START + message.content);
			await user.send({content: supportAlert, files: attachmentList.slice(0, Constants.DM.MAX_ATTACHMENTS)});
			for (let i = 1; i < attachmentList.length / Constants.DM.MAX_ATTACHMENTS; i++) {
				await user.send({
					content: "",
					files: attachmentList.slice(i * Constants.DM.MAX_ATTACHMENTS, (i + 1) * Constants.DM.MAX_ATTACHMENTS)
				});
			}
		})
			.catch((e) => console.warn(`WARNING : could not find a place to forward the DM message: ${e}`));
	}

	/**
	 * Sends a message to someone who said something in DM to the bot
	 * @param message
	 * @private
	 */
	private static async sendHelperMessage(message: Message | DraftbotInteraction): Promise<void> {
		const author = message instanceof DraftbotInteraction ? message.user : message.author;
		const helpMessage = new DraftBotReactionMessageBuilder()
			.allowUserId(author.id)
			.addReaction(new DraftBotReaction(Constants.REACTIONS.ENGLISH_FLAG))
			.addReaction(new DraftBotReaction(Constants.REACTIONS.FRENCH_FLAG))
			.endCallback((msg) => {
				if (!msg!.getFirstReaction()) {
					return;
				}
				const language = msg!.getFirstReaction()!.emoji.name === Constants.REACTIONS.ENGLISH_FLAG ? Constants.LANGUAGE.ENGLISH : Constants.LANGUAGE.FRENCH;
				message.channel.send({
					embeds: [new DraftBotEmbed()
						.formatAuthor(i18n.t("bot:dmHelpMessageTitle", { lang: language, pseudo: escapeUsername(author.username) }), author)
						.setDescription(i18n.t("bot:dmHelpMessage", { lang: language, commandHelp: this.commandsMentions.get("help"), commandRespawn: this.commandsMentions.get("respawn") }))]
				});
			})
			.build()
			.formatAuthor(Constants.DM.TITLE_SUPPORT, author)
			.setDescription(message instanceof DraftbotInteraction ? Constants.DM.INTERACTION_SUPPORT : Constants.DM.MESSAGE_SUPPORT);
		const draftbotChannel = message.channel as unknown as DraftbotChannel;
		draftbotChannel.language = Constants.LANGUAGE.ENGLISH;
		message instanceof Message ? await helpMessage.send(draftbotChannel) : await helpMessage.reply(message);
	}

	/**
	 * Checks for the maintenance mode
	 * @param interaction the interaction to reply to
	 * @param user
	 * @private
	 */
	private static async handleCommand(interaction: DraftbotInteraction, user: KeycloakUser): Promise<void> {
		const language = user.attributes.language;

		const commandInfo = this.commands.get(interaction.commandName);

		if (!commandInfo) {
			await replyErrorMessage(interaction, Constants.LANGUAGE.ENGLISH, i18n.t("bot:command404", { lang: language }));
			console.error(`Command "${interaction.commandName}" is not registered`);
			return;
		}

		const channelAccess = this.hasChannelPermission(interaction.channel);
		if (!channelAccess[0]) {
			await replyErrorMessage(interaction, Constants.LANGUAGE.ENGLISH, i18n.t(channelAccess[1], { lang: language }));
			return;
		}

		DiscordCache.cacheInteraction(interaction);
		const packet = await commandInfo.getPacket(interaction, user);
		if (packet) {
			const context: PacketContext = {
				discord: {
					user: interaction.user.id,
					channel: interaction.channel.id,
					interaction: interaction.id
				}
			};
			DiscordWebSocket.socket!.send(JSON.stringify({
				packet: {
					name: packet.constructor.name,
					data: packet
				},
				context
			}));
		}
	}

	/**
	 * Check if the bot has every needed permission in the channel where the command is launched
	 * @param channel
	 * @private
	 */
	private static hasChannelPermission(channel: DraftbotChannel): [boolean, string] {

		if (!channel.permissionsFor(draftBotClient!.user!)?.has(PermissionsBitField.Flags.ViewChannel)) {
			console.log(`No way to access the channel where the command has been executed : ${channel.guildId}/${channel.id}`);
			return [false, "noChannelAccess"];
		}

		if (!channel.permissionsFor(draftBotClient!.user!)?.has(PermissionsBitField.Flags.SendMessages)) {
			console.log(`No perms to show i can't speak in server / channel : ${channel.guildId}/${channel.id}`);
			return [false, "noSpeakPermission"];
		}

		if (!channel.permissionsFor(draftBotClient!.user!)?.has(PermissionsBitField.Flags.SendMessagesInThreads) && channel.isThread()) {
			console.log(`No perms to show i can't speak in thread : ${channel.guildId}/${channel.id}`);
			return [false, "noSpeakInThreadPermission"];
		}

		if (!channel.permissionsFor(draftBotClient!.user!)?.has(PermissionsBitField.Flags.AddReactions)) {
			console.log(`No perms to show i can't react in server / channel : ${channel.guildId}/${channel.id}`);
			return [false, "noReacPermission"];
		}

		if (!channel.permissionsFor(draftBotClient!.user!)?.has(PermissionsBitField.Flags.EmbedLinks)) {
			console.log(`No perms to show i can't embed in server / channel : ${channel.guildId}/${channel.id}`);
			return [false, "noEmbedPermission"];
		}

		if (!channel.permissionsFor(draftBotClient!.user!)?.has(PermissionsBitField.Flags.AttachFiles)) {
			console.log(`No perms to show i can't attach files in server / channel : ${channel.guildId}/${channel.id}`);
			return [false, "noFilePermission"];
		}

		if (!channel.permissionsFor(draftBotClient!.user!)?.has(PermissionsBitField.Flags.ReadMessageHistory)) {
			console.log(`No perms to show i can't see messages history in server / channel : ${channel.guildId}/${channel.id}`);
			return [false, "noHistoryPermission"];
		}

		return [true, ""];
	}
}