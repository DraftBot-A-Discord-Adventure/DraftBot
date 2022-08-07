import {
	ApplicationCommandDataResolvable,
	CacheType,
	Client,
	CommandInteraction,
	GuildChannel,
	GuildMember,
	Message,
	MessageAttachment,
	User
} from "discord.js";

import {readdir} from "fs/promises";
import {readdirSync} from "fs";
import {ICommand} from "./ICommand";
import Server from "../core/models/Server";
import {DraftBotEmbed} from "../core/messages/DraftBotEmbed";
import {botConfig, draftBotClient} from "../core/bot";
import {Constants} from "../core/Constants";
import {TranslationModule, Translations} from "../core/Translations";
import {Entities, Entity} from "../core/models/Entity";
import {Guilds} from "../core/models/Guild";
import {BlockingUtils} from "../core/utils/BlockingUtils";
import {resetIsNow} from "../core/utils/TimeUtils";
import {escapeUsername} from "../core/utils/StringUtils";
import {Data, DataModule} from "../core/Data";
import {format} from "../core/utils/StringFormatter";
import {DraftBotReactionMessageBuilder} from "../core/messages/DraftBotReactionMessage";
import {DraftBotReaction} from "../core/messages/DraftBotReaction";
import {effectsErrorTextValue, replyErrorMessage} from "../core/utils/ErrorUtils";
import {MessageError} from "../core/MessageError";
import {containsSpecificUserMention} from "../core/utils/MessageUtils";

type UserEntity = { user: User, entity: Entity };
type TextInformations = { interaction: CommandInteraction, tr: TranslationModule };
type ContextType = { mainServerId: string; dmManagerID: string; attachments: MessageAttachment[]; supportAlert: string; };

export class CommandsManager {
	static commands = new Map<string, ICommand>();

	/**
	 * Sends an error about a non-desired effect
	 * @param user
	 * @param tr
	 * @param interaction
	 * @param shouldReply
	 */
	static async effectError(user: User, tr: TranslationModule, interaction: CommandInteraction, shouldReply = false) {
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
	}: TextInformations, shouldReply = false) {
		const user = entity.discordUserId === interaction.user.id ? interaction.user : interaction.options.getUser("user");
		const userEntity = {user, entity};
		if (commandInfo.requirements.requiredLevel && entity.Player.getLevel() < commandInfo.requirements.requiredLevel) {
			replyErrorMessage(
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
			if (await this.missingRequirementsForGuild(commandInfo, {user, entity}, interaction, tr)) {
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
	static async registerAllCommands(client: Client) {
		const commandsToRegister = await this.getAllCommandsToRegister();

		const commandsToSetGlobal: ApplicationCommandDataResolvable[] = [];
		const commandsToSetGuild: ApplicationCommandDataResolvable[] = [];
		for (const commandInfo of commandsToRegister) {
			if ((commandInfo.slashCommandPermissions || commandInfo.requirements.userPermission) && commandInfo.requirements.userPermission !== Constants.ROLES.USER.ADMINISTRATOR) {
				commandInfo.slashCommandBuilder.setDefaultPermission(false);
			}
			if (commandInfo.mainGuildCommand || botConfig.TEST_MODE) {
				commandsToSetGuild.push(commandInfo.slashCommandBuilder.toJSON());
			}
			else {
				commandsToSetGlobal.push(commandInfo.slashCommandBuilder.toJSON());
			}
			CommandsManager.commands.set(commandInfo.slashCommandBuilder.name, commandInfo);
		}
		const setCommands = await client.application.commands.set(commandsToSetGuild, botConfig.MAIN_SERVER_ID);
		setCommands.concat(await client.application.commands.set(commandsToSetGlobal));
	}

		client.on("interactionCreate", async interaction => {
			if (!interaction.isCommand()) {
				return;
			}
			if (!interaction.inGuild()) {
				// TODO when discord adds user's language in interaction: replace "en"
				await interaction.reply(Translations.getModule("error", "en").get("notInDM"));
			}

			void CommandsManager.handleCommand(interaction as CommandInteraction);
		});

		client.on("messageCreate", async message => {

			// ignore all bot messages and own messages
			if (message.author.bot || message.author.id === draftBotClient.user.id) {
				return;
			}

			if (message.channel.type === "DM") {
				await CommandsManager.handlePrivateMessage(message);
			}
			else {
				const [server] = await Server.findOrCreate({
					where: {
						discordGuildId: message.guild.id
					}
				});

				if (containsSpecificUserMention(message, draftBotClient.user)) {
					message.channel.send({
						content:
							Translations.getModule("bot", server.language).get("mentionHelp")
					}).then();
				}
			}
		});
	}

	/**
	 * Execute a command from the player
	 * @param commandName
	 * @param interaction
	 * @param language
	 * @param entity
	 * @param argsOfCommand
	 */
	static async executeCommandWithParameters(commandName: string, interaction: CommandInteraction, language: string, entity: Entity, ...argsOfCommand: any) {
		await CommandsManager.commands.get(commandName).executeCommand(interaction, language, entity, ...argsOfCommand);
	}

	/**
	 * execute all the important checks upon receiving a private message
	 * @param message
	 */
	static async handlePrivateMessage(message: Message) {
		if (message.author.id === botConfig.DM_MANAGER_ID) {
			return;
		}
		const [entity] = await Entities.getOrRegister(message.author.id);
		const dataModule = Data.getModule("bot");
		let icon = "";
		if (!entity.Player.dmNotification) {
			icon = dataModule.getString("dm.alertIcon");
		}
		await this.sendBackDMMessageToSupportChannel(message, dataModule, icon);

		await this.sendHelperMessage(message, dataModule);
	}

	/**
	 * Push the commands to check from a given category
	 * @param category
	 * @param commandsToRegister
	 * @private
	 */
	private static async checkCommandFromCategory(category: string, commandsToRegister: ICommand[]) {
		let commandsFiles = readdirSync(`dist/src/commands/${category}`).filter(command => command.endsWith(".js"));
		if (!botConfig.TEST_MODE) {
			commandsFiles = commandsFiles.filter(command => !command.startsWith("Test"));
		}
		for (const commandFile of commandsFiles) {
			const commandInfo = (await import(`./${category + "/" + commandFile}`)).commandInfo as ICommand;
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
	private static manageMessageCreate(client: Client) {
		client.on("messageCreate", async message => {
			// ignore all bot messages and own messages
			if (message.author.bot || message.author.id === draftBotClient.user.id) {
				return;
			}
			if (message.channel.type === "DM") {
				await CommandsManager.handlePrivateMessage(message);
				return;
			}
			const [server] = await Server.findOrCreate({
				where: {
					discordGuildId: message.guild.id
				}
			});
			if (message.mentions.has(client.user)) {
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
	private static manageInteractionCreate(client: Client) {
		client.on("interactionCreate", interaction => {
			if (!interaction.isCommand() || !interaction.inGuild()) {
				return;
			}
			void CommandsManager.handleCommand(interaction as CommandInteraction);
		});
	}

	/**
	 * Sends back a message sent in the bot DMs to the support channel
	 * @param message
	 * @param dataModule
	 * @param icon
	 * @private
	 */
	private static async sendBackDMMessageToSupportChannel(message: Message, dataModule: DataModule, icon: string) {
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
				supportAlert: format(dataModule.getString("dm.supportAlert"), {
					username: escapeUsername(message.author.username),
					alertIcon: icon,
					id: message.author.id
				}) + message.content
			}
		});
	}

	/**
	 * Sends a message to someone who said something in DM to the bot
	 * @param message
	 * @param dataModule
	 * @private
	 */
	private static async sendHelperMessage(message: Message, dataModule: DataModule) {
		await new DraftBotReactionMessageBuilder()
			.allowUserId(message.author.id)
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
						.formatAuthor(tr.format("dmHelpMessageTitle", {pseudo: escapeUsername(message.author.username)}), message.author)
						.setDescription(tr.get("dmHelpMessage"))]
				});
			})
			.build()
			.formatAuthor(dataModule.getString("dm.titleSupport"), message.author)
			.setDescription(dataModule.getString("dm.messageSupport"))
			.send(message.channel);
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
	}: UserEntity, interaction: CommandInteraction, tr: TranslationModule) {
		let guild;
		try {
			guild = await Guilds.getById(entity.Player.guildId);
		}
		catch (error) {
			guild = null;
		}

		if (guild === null) {
			// not in a guild
			replyErrorMessage(
				interaction,
				tr.language,
				tr.get("notInAGuild")
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
			replyErrorMessage(
				interaction,
				tr.language,
				tr.get("notAuthorizedError")
			);
			return false;
		}
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
		shouldReply: boolean) {
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
	private static async handleCommand(interaction: CommandInteraction) {
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

		if (!interaction.command) {
			return;
		}
		const commandInfo = this.commands.get(interaction.command.name);

		if (!commandInfo) {
			await replyErrorMessage(
				interaction,
				tr.language,
				tr.get("command404")
			);
			console.error("Command \"" + interaction.command.name + "\" is not registered");
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
			replyErrorMessage(
				interaction,
				tr.language,
				Translations.getModule("error", tr.language).get("blockedContext.cooldown")
			);
			return;
		}

		BlockingUtils.spamBlockPlayer(interaction.user.id);

		console.log(interaction.user.id + " executed in server " + interaction.guild.id + ": " + interaction.command.name);
		await commandInfo.executeCommand(interaction, tr.language, entity);
	}

	/**
	 * Check if the bot has every needed permission in the channel where the command is launched
	 * @param interaction - Command interaction that has to be launched
	 * @param tr - Translation module
	 * @private
	 */
	private static async hasChannelPermission(interaction: CommandInteraction<CacheType>, tr: TranslationModule) {
		const channel = interaction.channel as GuildChannel;

		if (!channel.permissionsFor(draftBotClient.user).serialize().VIEW_CHANNEL) {
			await replyErrorMessage(
				interaction,
				tr.language,
				tr.get("noChannelAccess")
			);
			console.log("No way to access the channel where the command has been executed : " + interaction.guild.id + "/" + channel.id);
			return false;
		}

		if (!channel.permissionsFor(draftBotClient.user).serialize().SEND_MESSAGES) {
			await replyErrorMessage(
				interaction,
				tr.language,
				tr.get("noSpeakPermission")
			);
			console.log("No perms to show i can't speak in server / channel : " + interaction.guild.id + "/" + channel.id);
			return false;
		}

		if (!channel.permissionsFor(draftBotClient.user).serialize().ADD_REACTIONS) {
			await replyErrorMessage(
				interaction,
				tr.language,
				tr.get("noReacPermission")
			);
			console.log("No perms to show i can't react in server / channel : " + interaction.guild.id + "/" + channel.id);
			return false;
		}

		if (!channel.permissionsFor(draftBotClient.user).serialize().EMBED_LINKS) {
			await replyErrorMessage(
				interaction,
				tr.language,
				tr.get("noEmbedPermission")
			);
			console.log("No perms to show i can't embed in server / channel : " + interaction.guild.id + "/" + channel.id);
			return false;
		}

		if (!channel.permissionsFor(draftBotClient.user).serialize().ATTACH_FILES) {
			await replyErrorMessage(
				interaction,
				tr.language,
				tr.get("noFilePermission")
			);
			console.log("No perms to show i can't attach files in server / channel : " + interaction.guild.id + "/" + channel.id);
			return false;
		}
		return true;
	}
}