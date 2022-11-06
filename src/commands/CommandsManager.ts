import {
	ApplicationCommand,
	ApplicationCommandOption,
	ApplicationCommandOptionBase,
	Attachment,
	ChannelType,
	Client,
	CommandInteraction,
	GuildChannel,
	GuildMember,
	Message,
	MessageType,
	PermissionsBitField,
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
import {resetIsNow} from "../core/utils/TimeUtils";
import {escapeUsername} from "../core/utils/StringUtils";
import {commandsMentions, format} from "../core/utils/StringFormatter";
import {DraftBotReactionMessageBuilder} from "../core/messages/DraftBotReactionMessage";
import {DraftBotReaction} from "../core/messages/DraftBotReaction";
import {effectsErrorTextValue, replyErrorMessage} from "../core/utils/ErrorUtils";
import {MessageError} from "../core/MessageError";
import {BotConstants} from "../core/constants/BotConstants";
import Player, {Players} from "../core/database/game/models/Player";

type UserPlayer = { user: User, player: Player };
type TextInformations = { interaction: CommandInteraction, tr: TranslationModule };
type ContextType = { mainServerId: string; dmManagerID: string; attachments: Attachment[]; supportAlert: string; };

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
		const userPlayer = {user, player: player};
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
			if (!await this.missingRequirementsForGuild(commandInfo, {user, player: player}, interaction, tr)) {
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
	 * Register all commands at launch
	 * @param client
	 * @param isMainShard
	 */
	static async registerAllCommands(client: Client, isMainShard: boolean): Promise<void> {
		try {
			const commands = (await client.application.commands.fetch({withLocalizations: true}))
				.concat(await (await client.guilds.fetch(botConfig.MAIN_SERVER_ID)).commands.fetch({withLocalizations: true}));
			const commandsToRegister = await this.getAllCommandsToRegister();

			// Store command instances
			for (const command of commands) {
				CommandsManager.commandsInstances.set(command[1].name, command[1]);
				commandsMentions.set(command[1].name, `</${command[1].name}:${command[0]}>`);
			}

			// Commands to register
			const commandsToCheck = [];
			for (const commandInfo of commandsToRegister) {
				this.setCommandDefaultParameters(commandInfo);
				if (isMainShard) {
					commandsToCheck.push(this.createOrUpdateCommand(client, CommandsManager.commandsInstances.get(commandInfo.slashCommandBuilder.name), commandInfo));
				}
				CommandsManager.commands.set(commandInfo.slashCommandBuilder.name, commandInfo);
			}
			if (isMainShard) {
				await Promise.all(commandsToCheck);

				// Delete removed commands, we do it after because CommandsManager.commands is populated
				await this.deleteCommands(client);
			}
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
	public static async getAllCommandsToRegister(): Promise<ICommand[]> {
		const categories = await readdir("dist/src/commands");
		const commandsToRegister: ICommand[] = [];
		const commandsToCheck = [];
		for (const category of categories) {
			if (category.endsWith(".js") || category.endsWith(".js.map")) {
				continue;
			}
			commandsToCheck.push(this.checkCommandFromCategory(category, commandsToRegister));
		}
		await Promise.all(commandsToCheck);
		return commandsToRegister;
	}

	/**
	 * Check if an option has changed. Returns two booleans, the first one indicates a change breaking the command and
	 * the second a change not breaking the game (localizations for instance)
	 * @param commandInfoOption
	 * @param commandOption
	 * @private
	 */
	private static hasOptionChanged(commandInfoOption: ApplicationCommandOptionBase, commandOption: ApplicationCommandOption): [boolean, boolean] {
		// See https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-option-structure
		let breakingChange = false;
		let softChange = false;

		// Name localizations
		if (!commandOption.nameLocalizations && commandInfoOption.name_localizations) {
			softChange = true;
		}
		else if (commandInfoOption.name_localizations) {
			for (const nameLocalization of Object.keys(commandOption.nameLocalizations)) {
				if (commandInfoOption.name_localizations[nameLocalization as keyof typeof commandInfoOption.name_localizations] !==
					commandOption.nameLocalizations[nameLocalization as keyof typeof commandOption.nameLocalizations]
				) {
					softChange = true;
				}
			}
		}

		// Description
		softChange ||= commandInfoOption.description !== commandOption.description;

		// Description localizations
		if (!commandOption.descriptionLocalizations && commandInfoOption.description_localizations) {
			softChange = true;
		}
		else if (commandInfoOption.description_localizations) {
			for (const descLocalization of Object.keys(commandOption.descriptionLocalizations)) {
				if (commandInfoOption.description_localizations[descLocalization as keyof typeof commandInfoOption.description_localizations] !==
					commandOption.descriptionLocalizations[descLocalization as keyof typeof commandOption.descriptionLocalizations]
				) {
					softChange = true;
				}
			}
		}

		// Option type
		breakingChange ||= commandOption.type !== commandInfoOption.type;

		// Required. We can cast because we know that required is defined
		breakingChange ||= (commandOption as ApplicationCommandOptionBase).required !== commandInfoOption.required;

		return [breakingChange, softChange];
	}

	/**
	 * Check if a command has changed. Returns two booleans, the first one indicates a change breaking the command and
	 * the second a change not breaking the game (localizations for instance)
	 * @param commandInfo
	 * @param command
	 * @private
	 */
	private static hasCommandChanged(commandInfo: ICommand, command: ApplicationCommand): [boolean, boolean] {
		// See https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-structure

		let breakingChange = false;
		let softChange = false;

		// Guild command now global
		breakingChange ||= command.guildId && !(commandInfo.mainGuildCommand || botConfig.TEST_MODE);

		// Global command now guild only
		breakingChange ||= !command.guildId && (commandInfo.mainGuildCommand || botConfig.TEST_MODE);

		// Name localizations
		if (!command.nameLocalizations && commandInfo.slashCommandBuilder.name_localizations) {
			softChange = true;
		}
		else if (commandInfo.slashCommandBuilder.name_localizations) {
			for (const nameLocalization of Object.keys(command.nameLocalizations)) {
				if (commandInfo.slashCommandBuilder.name_localizations[nameLocalization as keyof typeof commandInfo.slashCommandBuilder.name_localizations] !==
					command.nameLocalizations[nameLocalization as keyof typeof command.nameLocalizations]
				) {
					softChange = true;
				}
			}
		}

		// Description
		softChange ||= command.description !== commandInfo.slashCommandBuilder.description;

		// Description localizations
		if (!command.descriptionLocalizations && commandInfo.slashCommandBuilder.description_localizations) {
			softChange = true;
		}
		else if (commandInfo.slashCommandBuilder.description_localizations) {
			for (const descLocalization of Object.keys(command.descriptionLocalizations)) {
				if (commandInfo.slashCommandBuilder.description_localizations[descLocalization as keyof typeof commandInfo.slashCommandBuilder.description_localizations] !==
					command.descriptionLocalizations[descLocalization as keyof typeof command.descriptionLocalizations]
				) {
					softChange = true;
				}
			}
		}

		// Options
		if (command.options.length !== commandInfo.slashCommandBuilder.options.length) {
			breakingChange = true;
		}
		else {
			for (let i = 0; i < commandInfo.slashCommandBuilder.options.length; ++i) {
				const commandInfoOption: ApplicationCommandOptionBase = commandInfo.slashCommandBuilder.options[i] as ApplicationCommandOptionBase;
				let commandOption: ApplicationCommandOption;
				for (let j = 0; j < command.options.length; ++j) {
					if (command.options[j].name === commandInfoOption.name) {
						commandOption = command.options[j];
						break;
					}
				}
				if (!commandOption) {
					breakingChange = true;
					break;
				}
				const [optionBroke, optionSoftBroke] = this.hasOptionChanged(commandInfoOption, commandOption);
				breakingChange ||= optionBroke;
				softChange ||= optionSoftBroke;
			}
		}

		return [breakingChange, softChange];
	}

	/**
	 * delete all commands from the bot if they do not exist anymore
	 * @param client
	 * @private
	 */
	private static async deleteCommands(client: Client): Promise<void> {
		for (const command of CommandsManager.commandsInstances.values()) {
			if (!CommandsManager.commands.has(command.name)) {
				console.log(`Deleted command "${command.name}"`);
				await client.application.commands.delete(command.id, command.guildId);
			}
		}
	}

	/**
	 * Create or update a bot command if needed
	 * @param client
	 * @param command
	 * @param commandInfo
	 * @private
	 */
	private static async createOrUpdateCommand(client: Client, command: ApplicationCommand, commandInfo: ICommand): Promise<void> {
		const [breakingChange, softChange] = command ? CommandsManager.hasCommandChanged(commandInfo, command) : [true, true];

		try {
			if (breakingChange || softChange) {
				const guildCommand = commandInfo.mainGuildCommand || botConfig.TEST_MODE;

				if (command) {
					if (guildCommand) {
						if (!command.guildId) {
							await client.application.commands.delete(command.id);
							await client.application.commands.create(commandInfo.slashCommandBuilder.toJSON(), botConfig.MAIN_SERVER_ID);
							console.log(`Deleted global command and created guild command "${commandInfo.slashCommandBuilder.name}"`);
						}
						else {
							await client.application.commands.edit(command.id, commandInfo.slashCommandBuilder.toJSON(), botConfig.MAIN_SERVER_ID);
							console.log(`Modified guild command "${commandInfo.slashCommandBuilder.name}"`);
						}
					}
					else if (command.guildId) {
						await client.application.commands.delete(command.id, botConfig.MAIN_SERVER_ID);
						await client.application.commands.create(commandInfo.slashCommandBuilder.toJSON());
						console.log(`Deleted guild command and created global command "${commandInfo.slashCommandBuilder.name}"`);
					}
					else {
						await client.application.commands.edit(command.id, commandInfo.slashCommandBuilder.toJSON());
						console.log(`Modified global command "${commandInfo.slashCommandBuilder.name}"`);
					}
				}
				else if (guildCommand) {
					await client.application.commands.create(commandInfo.slashCommandBuilder.toJSON(), botConfig.MAIN_SERVER_ID);
					console.log(`Created guild command "${commandInfo.slashCommandBuilder.name}"`);
				}
				else {
					await client.application.commands.create(commandInfo.slashCommandBuilder.toJSON());
					console.log(`Created global command "${commandInfo.slashCommandBuilder.name}"`);
				}
			}
		}
		catch (err) {
			console.log(err);
			if (breakingChange) {
				// Do not start the bot if we can't register the commands
				process.exit(1);
			}
		}
	}

	/**
	 * Populate a command builder with default parameters
	 * @param commandInfo
	 * @private
	 */
	private static setCommandDefaultParameters(commandInfo: ICommand): void {
		commandInfo.slashCommandBuilder.setDMPermission(false);
		if ((commandInfo.slashCommandPermissions || commandInfo.requirements.userPermission) && commandInfo.requirements.userPermission !== Constants.ROLES.USER.ADMINISTRATOR) {
			commandInfo.slashCommandBuilder.setDefaultPermission(false);
		}
	}

	/**
	 * Push the commands to check from a given category
	 * @param category
	 * @param commandsToRegister
	 * @private
	 */
	private static async checkCommandFromCategory(category: string, commandsToRegister: ICommand[]): Promise<void> {
		let commandsFiles = readdirSync(`dist/src/commands/${category}`).filter(command => command.endsWith(".js"));
		if (!botConfig.TEST_MODE) {
			commandsFiles = commandsFiles.filter(command => !command.startsWith("Test"));
		}
		for (const commandFile of commandsFiles) {
			const commandInfo = (await import(`./${category}/${commandFile}`)).commandInfo as ICommand;
			if (!commandInfo || !commandInfo.slashCommandBuilder) {
				console.error(`Command dist/src/commands/${category}/${commandFile} is not a slash command`);
				continue;
			}
			commandsToRegister.push(commandInfo);
		}
	}

	/**
	 * Manage the creation of a message from channels the bot have access to
	 * @param client
	 * @private
	 */
	private static manageMessageCreate(client: Client): void {
		client.on("messageCreate", async message => {
			// ignore all bot messages and own messages
			if (message.author.bot || message.author.id === draftBotClient.user.id || !message.content) {
				return;
			}
			if (message.channel.type === ChannelType.DM) {
				await CommandsManager.handlePrivateMessage(message);
				return;
			}
			const [server] = await Server.findOrCreate({
				where: {
					discordGuildId: message.guild.id
				}
			});
			if (message.content.includes("@here") || message.content.includes("@everyone") || message.type === MessageType.Reply) {
				return;
			}
			if (message.mentions.has(client.user.id)) {
				message.channel.send({
					content:
						Translations.getModule("bot", server.language).format("mentionHelp",{})
				}).then();
			}
		});
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
		await draftBotClient.shard.broadcastEval((client: Client, context: ContextType) => {
			const dmChannel = client.users.cache.get(context.dmManagerID);
			if (!dmChannel) {
				console.warn("WARNING : could not find a place to forward the DM message.");
				return;
			}
			for (const attachment of context.attachments) {
				dmChannel.send({
					files: [{
						attachment: attachment.url,
						name: attachment.name
					}]
				});
			}
			dmChannel.send({content: context.supportAlert});
		}, {
			context: {
				mainServerId: botConfig.MAIN_SERVER_ID,
				dmManagerID: botConfig.DM_MANAGER_ID,
				attachments: Array.from(message.attachments.values()),
				supportAlert: format(BotConstants.DM.SUPPORT_ALERT, {
					username: escapeUsername(message.author.username),
					alertIcon: player.dmNotification ? "" : BotConstants.DM.ALERT_ICON,
					id: message.author.id
				}) + message.content
			}
		});
	}

	/**
	 * Sends a message to someone who said something in DM to the bot
	 * @param message
	 * @private
	 */
	private static async sendHelperMessage(message: Message | CommandInteraction): Promise<void> {
		const author = message instanceof CommandInteraction ? message.user : message.author;
		const helpMessage = await new DraftBotReactionMessageBuilder()
			.allowUserId(author.id)
			.addReaction(new DraftBotReaction(Constants.MENU_REACTION.ENGLISH_FLAG))
			.addReaction(new DraftBotReaction(Constants.MENU_REACTION.FRENCH_FLAG))
			.endCallback((msg) => {
				if (!msg.getFirstReaction()) {
					return;
				}
				const language = msg.getFirstReaction().emoji.name === Constants.MENU_REACTION.ENGLISH_FLAG ? Constants.LANGUAGE.ENGLISH : Constants.LANGUAGE.FRENCH;
				const tr = Translations.getModule("bot", language);
				message.channel.send({
					embeds: [new DraftBotEmbed()
						.formatAuthor(tr.format("dmHelpMessageTitle", {pseudo: escapeUsername(author.username)}), author)
						.setDescription(tr.get("dmHelpMessage"))]
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
			// not in a guild
			await replyErrorMessage(
				interaction,
				tr.language,
				Translations.getModule("bot", tr.language).get("notInAGuild")
			);
			return false;
		}

		let userPermissionsLevel = Constants.GUILD.PERMISSION_LEVEL.MEMBER;

		if (player.id === guild.getElderId()) {
			userPermissionsLevel = Constants.GUILD.PERMISSION_LEVEL.ELDER;
		}
		if (player.id === guild.getChiefId()) {
			userPermissionsLevel = Constants.GUILD.PERMISSION_LEVEL.CHIEF;
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
			(commandInfo.requirements.disallowEffects && commandInfo.requirements.disallowEffects.includes(player.effect) ||
				commandInfo.requirements.allowEffects && !commandInfo.requirements.allowEffects.includes(player.effect))) {
			CommandsManager.effectError(user, tr, interaction, shouldReply).finally(() => null);
			return true;
		}
		return false;
	}

	/**
	 * checks for the maintenance mode
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

		// check maintenance mode
		if (interaction.user.id !== botConfig.BOT_OWNER_ID && botConfig.MODE_MAINTENANCE) {
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

		if (!await this.hasChannelPermission(interaction, tr)) {
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

		draftBotInstance.logsDatabase.logCommandUsage(interaction.user.id, interaction.guild.id, interaction.commandName).then();
		await commandInfo.executeCommand(interaction, tr.language, player);
	}

	/**
	 * Check if the bot has every needed permission in the channel where the command is launched
	 * @param interaction - Command interaction that has to be launched
	 * @param tr - Translation module
	 * @private
	 */
	private static async hasChannelPermission(interaction: CommandInteraction, tr: TranslationModule): Promise<boolean> {
		const channel = interaction.channel as GuildChannel;

		if (!channel.permissionsFor(draftBotClient.user).has(PermissionsBitField.Flags.ViewChannel)) {
			await replyErrorMessage(
				interaction,
				tr.language,
				tr.get("noChannelAccess")
			);
			console.log(`No way to access the channel where the command has been executed : ${interaction.guild.id}/${channel.id}`);
			return false;
		}

		if (!channel.permissionsFor(draftBotClient.user).has(PermissionsBitField.Flags.SendMessages)) {
			await replyErrorMessage(
				interaction,
				tr.language,
				tr.get("noSpeakPermission")
			);
			console.log(`No perms to show i can't speak in server / channel : ${interaction.guild.id}/${channel.id}`);
			return false;
		}

		if (!channel.permissionsFor(draftBotClient.user).has(PermissionsBitField.Flags.AddReactions)) {
			await replyErrorMessage(
				interaction,
				tr.language,
				tr.get("noReacPermission")
			);
			console.log(`No perms to show i can't react in server / channel : ${interaction.guild.id}/${channel.id}`);
			return false;
		}

		if (!channel.permissionsFor(draftBotClient.user).has(PermissionsBitField.Flags.EmbedLinks)) {
			await replyErrorMessage(
				interaction,
				tr.language,
				tr.get("noEmbedPermission")
			);
			console.log(`No perms to show i can't embed in server / channel : ${interaction.guild.id}/${channel.id}`);
			return false;
		}

		if (!channel.permissionsFor(draftBotClient.user).has(PermissionsBitField.Flags.AttachFiles)) {
			await replyErrorMessage(
				interaction,
				tr.language,
				tr.get("noFilePermission")
			);
			console.log(`No perms to show i can't attach files in server / channel : ${interaction.guild.id}/${channel.id}`);
			return false;
		}
		return true;
	}
}
