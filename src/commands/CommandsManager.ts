import {
	Attachment,
	ChannelType,
	Client,
	CommandInteraction,
	GuildChannel,
	GuildMember,
	Message,
	MessageType, PermissionsBitField,
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
import {Entities, Entity} from "../core/database/game/models/Entity";
import {Guilds} from "../core/database/game/models/Guild";
import {BlockingUtils} from "../core/utils/BlockingUtils";
import {resetIsNow} from "../core/utils/TimeUtils";
import {escapeUsername} from "../core/utils/StringUtils";
import {format} from "../core/utils/StringFormatter";
import {DraftBotReactionMessageBuilder} from "../core/messages/DraftBotReactionMessage";
import {DraftBotReaction} from "../core/messages/DraftBotReaction";
import {effectsErrorTextValue, replyErrorMessage} from "../core/utils/ErrorUtils";
import {MessageError} from "../core/MessageError";
import {BotConstants} from "../core/constants/BotConstants";
import {RegisteredCommands} from "../core/database/game/models/RegisteredCommands";
import {createHash} from "crypto";

type UserEntity = { user: User, entity: Entity };
type TextInformations = { interaction: CommandInteraction, tr: TranslationModule };
type ContextType = { mainServerId: string; dmManagerID: string; attachments: Attachment[]; supportAlert: string; };

/**
 * The manager for creating and executing classic commands
 */
export class CommandsManager {
	static commands = new Map<string, ICommand>();

	/**
	 * Sends an error about a non-desired effect
	 * @param user
	 * @param tr
	 * @param interaction
	 * @param shouldReply
	 */
	static async effectError(user: User, tr: TranslationModule, interaction: CommandInteraction, shouldReply = false): Promise<void> {
		const entity = await Entities.getByDiscordUserId(user.id);
		const textValues = await effectsErrorTextValue(interaction.user, tr.language, entity);
		const embed = new DraftBotEmbed().setErrorColor()
			.formatAuthor(textValues.title, user)
			.setDescription(textValues.description);
		shouldReply ? await interaction.reply({embeds: [embed], ephemeral: true})
			: await interaction.channel.send({embeds: [embed]});
	}

	/**
	 * Check if the given entity can perform the command in commandInfo
	 * @param commandInfo
	 * @param entity
	 * @param TextInformations
	 * @param shouldReply
	 */
	static async userCanPerformCommand(commandInfo: ICommand, entity: Entity, {
		interaction,
		tr
	}: TextInformations, shouldReply = false): Promise<boolean> {
		const user = entity.discordUserId === interaction.user.id ? interaction.user : interaction.options.getUser("user");
		const userEntity = {user, entity};
		if (commandInfo.requirements.requiredLevel && entity.Player.getLevel() < commandInfo.requirements.requiredLevel) {
			await replyErrorMessage(
				interaction,
				tr.language,
				Translations.getModule("error", tr.language).format("levelTooLow", {
					level: commandInfo.requirements.requiredLevel
				})
			);
			return false;
		}

		if (this.effectRequirementsFailed(commandInfo, userEntity, {interaction, tr}, shouldReply)) {
			return false;
		}

		if (await MessageError.canPerformCommand(interaction.member as GuildMember, interaction, tr.language, commandInfo.requirements.userPermission) !== true) {
			return false;
		}

		if (commandInfo.requirements.guildRequired) {
			if (!await this.missingRequirementsForGuild(commandInfo, {user, entity}, interaction, tr)) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Register the bot at launch
	 * @param client
	 */
	static async register(client: Client): Promise<void> {
		await this.registerAllCommands(client);

		this.manageInteractionCreate(client);

		this.manageMessageCreate(client);
	}

	/**
	 * Register all commands at launch
	 * @param client
	 */
	static async registerAllCommands(client: Client): Promise<void> {
		try {
			const commandsToRegister = await this.getAllCommandsToRegister();

			for (const commandInfo of commandsToRegister) {
				// Set parameters
				commandInfo.slashCommandBuilder.setDMPermission(false);
				if ((commandInfo.slashCommandPermissions || commandInfo.requirements.userPermission) && commandInfo.requirements.userPermission !== Constants.ROLES.USER.ADMINISTRATOR) {
					commandInfo.slashCommandBuilder.setDefaultPermission(false);
				}

				// Calculate variables
				const registeredCommand = await RegisteredCommands.getCommand(commandInfo.slashCommandBuilder.name);
				const json = commandInfo.slashCommandBuilder.toJSON();
				const hash = createHash("sha1")
					.update(JSON.stringify(json)) // Add the json to the hash
					.digest("hex"); // Calculate the digest as hex
				const guildCommand = commandInfo.mainGuildCommand || botConfig.TEST_MODE;

				if (hash !== registeredCommand.jsonHash || registeredCommand.guildCommand !== guildCommand) {
					// Create command
					if (guildCommand) {
						await client.application.commands.create(json, botConfig.MAIN_SERVER_ID);
					}
					else {
						await client.application.commands.create(json);
					}
					console.log(`Created or modified command "${commandInfo.slashCommandBuilder.name}"`);

					// Save in database
					registeredCommand.jsonHash = hash;
					registeredCommand.guildCommand = guildCommand;
					await registeredCommand.save();
				}

				// Add to global command mapping
				CommandsManager.commands.set(commandInfo.slashCommandBuilder.name, commandInfo);
			}

			// Check deleted commands
			const registeredCommands = await RegisteredCommands.getAll();
			for (const registeredCommand of registeredCommands) {
				if (!CommandsManager.commands.has(registeredCommand.commandName)) {
					console.log(`Deleted command "${registeredCommand.commandName}"`);
					await client.application.commands.delete(registeredCommand.commandName);
					await RegisteredCommands.deleteCommand(registeredCommand.commandName);
				}
			}
		}
		catch (err) {
			console.log(err);
			process.exit(1);
		}
	}

	/**
	 * Execute a command from the player
	 * @param commandName
	 * @param interaction
	 * @param language
	 * @param entity
	 * @param argsOfCommand
	 */
	static async executeCommandWithParameters(commandName: string, interaction: CommandInteraction, language: string, entity: Entity, ...argsOfCommand: unknown[]): Promise<void> {
		await CommandsManager.commands.get(commandName).executeCommand(interaction, language, entity, ...argsOfCommand);
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
		for (const category of categories) {
			if (category.endsWith(".js") || category.endsWith(".js.map")) {
				continue;
			}
			await this.checkCommandFromCategory(category, commandsToRegister);
		}
		return commandsToRegister;
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
						Translations.getModule("bot", server.language).get("mentionHelp")
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
			void CommandsManager.handleCommand(interaction as CommandInteraction);
		});
	}

	/**
	 * Sends back a message sent in the bot DMs to the support channel
	 * @param message
	 * @param author
	 * @private
	 */
	private static async sendBackDMMessageToSupportChannel(message: Message, author: string): Promise<void> {
		const [entity] = await Entities.getOrRegister(author);
		await draftBotClient.shard.broadcastEval((client: Client, context: ContextType) => {
			if (client.guilds.cache.get(context.mainServerId)) {
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
			}
		}, {
			context: {
				mainServerId: botConfig.MAIN_SERVER_ID,
				dmManagerID: botConfig.DM_MANAGER_ID,
				attachments: Array.from(message.attachments.values()),
				supportAlert: format(BotConstants.DM.SUPPORT_ALERT, {
					username: escapeUsername(message.author.username),
					alertIcon: entity.Player.dmNotification ? "" : BotConstants.DM.ALERT_ICON,
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
	 * @param entity
	 * @param interaction
	 * @param tr
	 */
	private static async missingRequirementsForGuild(commandInfo: ICommand, {
		entity
	}: UserEntity, interaction: CommandInteraction, tr: TranslationModule): Promise<boolean> {
		let guild;
		try {
			guild = await Guilds.getById(entity.Player.guildId);
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

		if (entity.id === guild.getElderId()) {
			userPermissionsLevel = Constants.GUILD.PERMISSION_LEVEL.ELDER;
		}
		if (entity.id === guild.getChiefId()) {
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
	 * @param entity
	 * @param interaction
	 * @param tr
	 * @param shouldReply
	 * @private
	 */
	private static effectRequirementsFailed(
		commandInfo: ICommand,
		{user, entity}: UserEntity,
		{interaction, tr}: TextInformations,
		shouldReply: boolean): boolean {
		if (!entity.Player.currentEffectFinished() &&
			(commandInfo.requirements.disallowEffects && commandInfo.requirements.disallowEffects.includes(entity.Player.effect) ||
				commandInfo.requirements.allowEffects && !commandInfo.requirements.allowEffects.includes(entity.Player.effect))) {
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
			console.error("Command \"" + interaction.commandName + "\" is not registered");
			return;
		}

		if (!await this.hasChannelPermission(interaction, tr)) {
			return;
		}


		const [entity] = await Entities.getOrRegister(interaction.user.id);
		if (!await this.userCanPerformCommand(commandInfo, entity, {interaction, tr}, true)) {
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
		await commandInfo.executeCommand(interaction, tr.language, entity);
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
