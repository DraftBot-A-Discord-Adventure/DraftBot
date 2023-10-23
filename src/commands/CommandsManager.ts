import {
	ApplicationCommand,
	ApplicationCommandOptionType,
	Attachment,
	AttachmentBuilder,
	ChannelType,
	Client,
	CommandInteraction,
	GuildChannel,
	GuildMember,
	GuildResolvable,
	Message,
	MessageType,
	PermissionsBitField,
	REST,
	RouteLike,
	Routes,
	Snowflake,
	User
} from "discord.js";

import {readdir} from "fs/promises";
import {readdirSync} from "fs";
import {ICommand} from "./ICommand";
import Server from "../core/database/game/models/Server";
import {DraftBotEmbed} from "../core/messages/DraftBotEmbed";
import {botConfig, draftBotClient, draftBotInstance} from "../core/bot";
import {Constants} from "../core/Constants";
import {TranslationModule, Translations} from "../core/Translations";
import {Guilds} from "../core/database/game/models/Guild";
import {BlockingUtils} from "../core/utils/BlockingUtils";
import {resetIsNow, seasonEndIsNow} from "../core/utils/TimeUtils";
import {escapeUsername} from "../core/utils/StringUtils";
import {commandsMentions, format} from "../core/utils/StringFormatter";
import {DraftBotReactionMessageBuilder} from "../core/messages/DraftBotReactionMessage";
import {DraftBotReaction} from "../core/messages/DraftBotReaction";
import {effectsErrorTextValue, replyErrorMessage} from "../core/utils/ErrorUtils";
import {MessageError} from "../core/MessageError";
import {BotConstants} from "../core/constants/BotConstants";
import Player, {Players} from "../core/database/game/models/Player";
import {GuildConstants} from "../core/constants/GuildConstants";
import {NotificationsConstants} from "../core/constants/NotificationsConstants";
import {RESTPostAPIChatInputApplicationCommandsJSONBody} from "discord-api-types/v10";
import {PVEConstants} from "../core/constants/PVEConstants";
import {Maps} from "../core/maps/Maps";

type UserPlayer = { user: User, player: Player };
type TextInformations = { interaction: CommandInteraction, tr: TranslationModule };

/**
 * The manager for creating and executing classic commands
 */
export class CommandsManager {
	static commands = new Map<string, ICommand>();

	static commandsInstances = new Map<string, ApplicationCommand>();

	/**
	 * Sends an error about a non-desired effect
	 * @param user
	 * @param tr
	 * @param interaction
	 * @param shouldReply
	 */
	static async effectError(user: User, tr: TranslationModule, interaction: CommandInteraction, shouldReply = false): Promise<void> {
		const player = await Players.getByDiscordUserId(user.id);
		const textValues = effectsErrorTextValue(interaction.user, tr.language, player);
		const embed = new DraftBotEmbed().setErrorColor()
			.formatAuthor(textValues.title, user)
			.setDescription(textValues.description);
		shouldReply ? await interaction.reply({embeds: [embed], ephemeral: true})
			: await interaction.channel.send({embeds: [embed]});
	}

	/**
	 * Check if the given player can perform the command in commandInfo
	 * @param commandInfo
	 * @param player
	 * @param TextInformations
	 * @param shouldReply
	 */
	static async userCanPerformCommand(commandInfo: ICommand, player: Player, {
		interaction,
		tr
	}: TextInformations, shouldReply = false): Promise<boolean> {
		const user = player.discordUserId === interaction.user.id ? interaction.user : interaction.options.getUser("user");
		const userPlayer = {user, player};
		if (this.effectRequirementsFailed(commandInfo, userPlayer, {interaction, tr}, shouldReply)) {

			return false;
		}
		if (commandInfo.requirements.requiredLevel && player.getLevel() < commandInfo.requirements.requiredLevel) {
			await replyErrorMessage(
				interaction,
				tr.language,
				Translations.getModule("error", tr.language).format("levelTooLow", {
					level: commandInfo.requirements.requiredLevel
				})
			);
			return false;
		}

		if (await MessageError.canPerformCommand(interaction.member as GuildMember, interaction, tr.language, commandInfo.requirements.userPermission) !== true) {
			return false;
		}

		if (commandInfo.requirements.guildRequired) {
			if (!await this.missingRequirementsForGuild(commandInfo, {user, player}, interaction, tr)) {
				return false;
			}
		}
		return true;
	}

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
	static async registerCommands(clientId: Snowflake, commands: RESTPostAPIChatInputApplicationCommandsJSONBody[], regFunc: (clientId: Snowflake, serverId?: Snowflake) => RouteLike): Promise<void> {
		const rest = new REST({version: "10"}).setToken(botConfig.DISCORD_CLIENT_TOKEN);
		try {
			console.log(`Started refreshing ${commands.length} application (/) commands.`);
			const data = await rest.put(
				regFunc(clientId, botConfig.MAIN_SERVER_ID),
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
				await CommandsManager.registerCommands(client.application.id, allCommandToRegister[1], Routes.applicationGuildCommands);
				await CommandsManager.registerCommands(client.application.id, allCommandToRegister[0], Routes.applicationCommands);
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
	 * Execute a command from the player
	 * @param commandName
	 * @param interaction
	 * @param language
	 * @param player
	 * @param argsOfCommand
	 */
	static async executeCommandWithParameters(commandName: string, interaction: CommandInteraction, language: string, player: Player, ...argsOfCommand: unknown[]): Promise<void> {
		await CommandsManager.commands.get(commandName).executeCommand(interaction, language, player, ...argsOfCommand);
	}

	/**
	 * Execute all the important checks upon receiving a private message
	 * @param message
	 */
	static async handlePrivateMessage(message: Message | CommandInteraction): Promise<void> {
		const author = message instanceof CommandInteraction ? message.user.id : message.author.id;
		if (author === botConfig.DM_MANAGER_ID) {
			return;
		}
		if (message instanceof Message) {
			await this.sendBackDMMessageToSupportChannel(message, author);
		}
		await this.sendHelperMessage(message);
	}

	/**
	 * Get the list of commands to register
	 */
	public static async getAllCommandsToRegister(): Promise<RESTPostAPIChatInputApplicationCommandsJSONBody[][]> {
		const categories = await readdir("dist/src/commands");
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
		const commands = (await client.application.commands.fetch({withLocalizations: true}))
			.concat(await (await client.guilds.fetch(botConfig.MAIN_SERVER_ID)).commands.fetch({withLocalizations: true}));
		// Store command instances
		for (const command of commands) {
			CommandsManager.commandsInstances.set(command[1].name, command[1]);
			this.addSubCommandsToTheCommandsMentions(command);
			commandsMentions.set(command[1].name, `</${command[1].name}:${command[0]}>`);
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
					commandsMentions.set(`${command[1].name} ${option.name}`, `</${command[1].name} ${option.name}:${command[0]}>`);
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
		let commandsFiles = readdirSync(`dist/src/commands/${category}`).filter(command => command.endsWith(".js"));
		if (!botConfig.TEST_MODE) {
			commandsFiles = commandsFiles.filter(command => !command.startsWith("Test"));
		}
		for (const commandFile of commandsFiles) {
			const commandInfo = (await import(`./${category}/${commandFile}`)).commandInfo as ICommand;
			if (!commandInfo?.slashCommandBuilder) {
				console.error(`Command dist/src/commands/${category}/${commandFile} is not a slash command`);
				continue;
			}
			this.commands.set(commandInfo.slashCommandBuilder.name, commandInfo);
			if (commandInfo.mainGuildCommand || botConfig.TEST_MODE) {
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
				content:
					Translations.getModule("bot", (await Server.findOrCreate({
						where: {
							discordGuildId: message.guild.id
						}
					}))[0].language).format("mentionHelp", {})
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
		return message.mentions.has(client.user.id) && this.hasChannelPermission(message.channel as GuildChannel)[0];
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
		return message.author.bot || message.author.id === draftBotClient.user.id || !message.content && message.channel.type !== ChannelType.DM;
	}

	/**
	 * Manage the slash commands from where the bot is asked
	 * @param client
	 * @private
	 */
	private static manageInteractionCreate(client: Client): void {
		client.on("interactionCreate", interaction => {
			if (!interaction.isCommand() || interaction.user.bot || interaction.user.id === draftBotClient.user.id) {
				return;
			}
			if (!interaction.channel) {
				Server.findOrCreate({
					where: {
						discordGuildId: interaction.guild.id
					}
				}).then(serverAnswer => {
					const server = serverAnswer[0];
					replyErrorMessage(
						interaction,
						server.language,
						Translations.getModule("bot", server.language).get("noChannelAccess")
					).finally(() => null);
				});
				return;
			}
			if (!interaction.member) { // If in DM, shouldn't happen
				CommandsManager.handlePrivateMessage(interaction as CommandInteraction).finally(() => null);
				return;
			}
			CommandsManager.handleCommand(interaction as CommandInteraction).then();
		});
	}

	/**
	 * Sends back a message sent in the bot DMs to the support channel
	 * @param message
	 * @param author
	 * @private
	 */
	private static async sendBackDMMessageToSupportChannel(message: Message, author: string): Promise<void> {
		const [player] = await Players.getOrRegister(author);
		await draftBotClient.users.fetch(botConfig.DM_MANAGER_ID).then(async (user) => {
			const attachmentList: (Attachment | AttachmentBuilder)[] = Array.from(message.attachments.values());
			if (message.content.length > 1900) {
				attachmentList.push(new AttachmentBuilder(Buffer.from(message.content)).setName(`userMessage-${message.author.id}-${message.id}.txt`));
			}
			const supportAlert = format(BotConstants.DM.SUPPORT_ALERT, {
				username: escapeUsername(message.author.username),
				alertIcon: player.notifications === NotificationsConstants.DM_VALUE ? BotConstants.DM.ALERT_ICON : "",
				id: message.author.id
			}) + (message.content.length > 1900
				? BotConstants.DM.TOO_LONG_MESSAGE
				: message.content.length === 0
					? BotConstants.DM.NO_MESSAGE
					: BotConstants.DM.COMMENT_MESSAGE_START + message.content);
			await user.send({content: supportAlert, files: attachmentList.slice(0, BotConstants.DM.MAX_ATTACHMENTS)});
			for (let i = 1; i < attachmentList.length / BotConstants.DM.MAX_ATTACHMENTS; i++) {
				await user.send({
					content: "",
					files: attachmentList.slice(i * BotConstants.DM.MAX_ATTACHMENTS, (i + 1) * BotConstants.DM.MAX_ATTACHMENTS)
				});
			}
		})
			.catch((e) => console.warn(e));
	}

	/**
	 * Sends a message to someone who said something in DM to the bot
	 * @param message
	 * @private
	 */
	private static async sendHelperMessage(message: Message | CommandInteraction): Promise<void> {
		const author = message instanceof CommandInteraction ? message.user : message.author;
		const helpMessage = new DraftBotReactionMessageBuilder()
			.allowUserId(author.id)
			.addReaction(new DraftBotReaction(Constants.REACTIONS.ENGLISH_FLAG))
			.addReaction(new DraftBotReaction(Constants.REACTIONS.FRENCH_FLAG))
			.endCallback((msg) => {
				if (!msg.getFirstReaction()) {
					return;
				}
				const language = msg.getFirstReaction().emoji.name === Constants.REACTIONS.ENGLISH_FLAG ? Constants.LANGUAGE.ENGLISH : Constants.LANGUAGE.FRENCH;
				const tr = Translations.getModule("bot", language);
				message.channel.send({
					embeds: [new DraftBotEmbed()
						.formatAuthor(tr.format("dmHelpMessageTitle", {pseudo: escapeUsername(author.username)}), author)
						.setDescription(tr.format("dmHelpMessage", {}))]
				});
			})
			.build()
			.formatAuthor(BotConstants.DM.TITLE_SUPPORT, author)
			.setDescription(message instanceof CommandInteraction ? BotConstants.DM.INTERACTION_SUPPORT : BotConstants.DM.MESSAGE_SUPPORT);
		message instanceof Message ? await helpMessage.send(message.channel) : await helpMessage.reply(message);
	}

	/**
	 * Check if the guild's requirements are fulfilled for this command
	 * @param commandInfo
	 * @param user
	 * @param interaction
	 * @param tr
	 */
	private static async missingRequirementsForGuild(commandInfo: ICommand, {
		player
	}: UserPlayer, interaction: CommandInteraction, tr: TranslationModule): Promise<boolean> {
		let guild;
		try {
			guild = await Guilds.getById(player.guildId);
		}
		catch (error) {
			guild = null;
		}

		if (guild === null) {
			// Not in a guild
			await replyErrorMessage(
				interaction,
				tr.language,
				Translations.getModule("bot", tr.language).get("notInAGuild")
			);
			return false;
		}

		let userPermissionsLevel = GuildConstants.PERMISSION_LEVEL.MEMBER;

		if (player.id === guild.getElderId()) {
			userPermissionsLevel = GuildConstants.PERMISSION_LEVEL.ELDER;
		}
		if (player.id === guild.getChiefId()) {
			userPermissionsLevel = GuildConstants.PERMISSION_LEVEL.CHIEF;
		}

		if (userPermissionsLevel < commandInfo.requirements.guildPermissions) {
			await replyErrorMessage(
				interaction,
				tr.language,
				tr.get("notAuthorizedError")
			);
			return false;
		}
		return true;
	}

	/**
	 * Check if the effect is authorized for this commandInfo
	 * @param commandInfo
	 * @param user
	 * @param player
	 * @param interaction
	 * @param tr
	 * @param shouldReply
	 * @private
	 */
	private static effectRequirementsFailed(
		commandInfo: ICommand,
		{user, player}: UserPlayer,
		{interaction, tr}: TextInformations,
		shouldReply: boolean): boolean {
		if (!player.currentEffectFinished(new Date()) &&
			(commandInfo.requirements.disallowEffects?.includes(player.effect) ||
				commandInfo.requirements.allowEffects && !commandInfo.requirements.allowEffects.includes(player.effect))) {
			CommandsManager.effectError(user, tr, interaction, shouldReply).finally(() => null);
			return true;
		}
		return false;
	}

	/**
	 * Checks for the maintenance mode
	 * @param interaction the interaction to reply to
	 * @private
	 */
	private static async handleCommand(interaction: CommandInteraction): Promise<void> {
		const [server] = await Server.findOrCreate({
			where: {
				discordGuildId: interaction.guild.id
			}
		});

		let language = server.language;
		if (interaction.channel.id === botConfig.ENGLISH_CHANNEL_ID) {
			language = Constants.LANGUAGE.ENGLISH;
		}

		const tr = Translations.getModule("bot", language);

		// Check maintenance mode
		if (interaction.user.id !== botConfig.BOT_OWNER_ID &&
			botConfig.MODE_MAINTENANCE &&
			interaction.commandName !== Translations.getModule("commands.maintenance", Constants.LANGUAGE.ENGLISH).get("commandName")
		) {
			interaction.reply({
				embeds: [
					new DraftBotEmbed()
						.setDescription(tr.get("maintenance"))
						.setTitle(":x: **Maintenance**")
						.setErrorColor()
				]
			}).then();
			return;
		}

		await CommandsManager.launchCommand(tr, interaction);
	}

	/**
	 * Launch a command
	 * @param tr - Translation module
	 * @param interaction - Command interaction that has to be launched
	 * @private
	 */
	private static async launchCommand(tr: TranslationModule, interaction: CommandInteraction): Promise<void> {
		if (resetIsNow()) {
			replyErrorMessage(
				interaction,
				tr.language,
				tr.get("resetIsNow")
			).then();
			return;
		}

		if (seasonEndIsNow()) {
			replyErrorMessage(
				interaction,
				tr.language,
				tr.get("seasonEndIsNow")
			).then();
			return;
		}

		if (!interaction.commandName) {
			return;
		}

		const commandInfo = this.commands.get(interaction.commandName);

		if (!commandInfo) {
			await replyErrorMessage(
				interaction,
				tr.language,
				tr.get("command404")
			);
			console.error(`Command "${interaction.commandName}" is not registered`);
			return;
		}

		const channelAccess = this.hasChannelPermission(interaction.channel as GuildChannel);
		if (!channelAccess[0]) {
			await replyErrorMessage(
				interaction,
				tr.language,
				tr.get(channelAccess[1])
			);
			return;
		}


		const [player] = await Players.getOrRegister(interaction.user.id);
		if (!await this.userCanPerformCommand(commandInfo, player, {interaction, tr}, true)) {
			return;
		}

		if (await BlockingUtils.isPlayerSpamming(interaction.user.id)) {
			await replyErrorMessage(
				interaction,
				tr.language,
				Translations.getModule("error", tr.language).get("blockedContext.cooldown")
			);
			return;
		}

		BlockingUtils.spamBlockPlayer(interaction.user.id);

		// Block not allowed commands on pve island but allow commands with permissions (admin, contributors...)
		if (this.checkCommandDisallowedOnPveIsland(player, interaction, commandInfo)) {
			await replyErrorMessage(
				interaction,
				tr.language,
				Translations.getModule("error", tr.language).get("pveIslandBlocking")
			);
			return;
		}

		draftBotInstance.logsDatabase.logCommandUsage(interaction.user.id, interaction.guild.id, interaction.commandName).then();
		await commandInfo.executeCommand(interaction, tr.language, player);
	}

	/**
	 * Check if a command is disallowed on the pve island
	 * @param player
	 * @param interaction
	 * @param commandInfo
	 * @private
	 */
	private static checkCommandDisallowedOnPveIsland(player: Player, interaction: CommandInteraction, commandInfo: ICommand): boolean {
		return (Maps.isOnPveIsland(player) || Maps.isOnBoat(player)) && !PVEConstants.ALLOWED_COMMANDS.includes(interaction.commandName) && !commandInfo.requirements.userPermission;
	}

	/**
	 * Check if the bot has every needed permission in the channel where the command is launched
	 * @param channel
	 * @private
	 */
	private static hasChannelPermission(channel: GuildChannel): [boolean, string] {

		if (!channel.permissionsFor(draftBotClient.user).has(PermissionsBitField.Flags.ViewChannel)) {
			console.log(`No way to access the channel where the command has been executed : ${channel.guildId}/${channel.id}`);
			return [false, "noChannelAccess"];
		}

		if (!channel.permissionsFor(draftBotClient.user).has(PermissionsBitField.Flags.SendMessages)) {
			console.log(`No perms to show i can't speak in server / channel : ${channel.guildId}/${channel.id}`);
			return [false, "noSpeakPermission"];
		}

		if (!channel.permissionsFor(draftBotClient.user).has(PermissionsBitField.Flags.SendMessagesInThreads) && channel.isThread()) {
			console.log(`No perms to show i can't speak in thread : ${channel.guildId}/${channel.id}`);
			return [false, "noSpeakInThreadPermission"];
		}

		if (!channel.permissionsFor(draftBotClient.user).has(PermissionsBitField.Flags.AddReactions)) {
			console.log(`No perms to show i can't react in server / channel : ${channel.guildId}/${channel.id}`);
			return [false, "noReacPermission"];
		}

		if (!channel.permissionsFor(draftBotClient.user).has(PermissionsBitField.Flags.EmbedLinks)) {
			console.log(`No perms to show i can't embed in server / channel : ${channel.guildId}/${channel.id}`);
			return [false, "noEmbedPermission"];
		}

		if (!channel.permissionsFor(draftBotClient.user).has(PermissionsBitField.Flags.AttachFiles)) {
			console.log(`No perms to show i can't attach files in server / channel : ${channel.guildId}/${channel.id}`);
			return [false, "noFilePermission"];
		}
		return [true, ""];
	}
}