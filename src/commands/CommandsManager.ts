import {
	ApplicationCommand,
	ApplicationCommandDataResolvable,
	ApplicationCommandPermissionData,
	Client,
	CommandInteraction,
	GuildChannel,
	GuildMember,
	GuildResolvable,
	Message,
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
import {DraftBotErrorEmbed} from "../core/messages/DraftBotErrorEmbed";
import {escapeUsername} from "../core/utils/StringUtils";
import {Data} from "../core/Data";
import {format} from "../core/utils/StringFormatter";
import {DraftBotReactionMessageBuilder} from "../core/messages/DraftBotReactionMessage";
import {DraftBotReaction} from "../core/messages/DraftBotReaction";
import {effectsErrorTextValue} from "../core/utils/ErrorUtils";

declare const canPerformCommand: (member: GuildMember, interaction: CommandInteraction, language: string, permission: string) => Promise<boolean>;

type UserEntity = { user: User, entity: Entity };
type TextInformations = { interaction: CommandInteraction, tr: TranslationModule };

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
	 * @param interaction
	 * @param tr
	 * @param shouldReply
	 */
	static async userCanPerformCommand(commandInfo: ICommand, entity: Entity, {
		interaction,
		tr
	}: TextInformations, shouldReply = false) {
		const user = entity.discordUserId === interaction.user.id ? interaction.user : interaction.options.getUser("user");
		const userEntity = {user, entity};
		if (commandInfo.requirements.requiredLevel && entity.Player.getLevel() < commandInfo.requirements.requiredLevel) {
			interaction.reply({
				embeds: [new DraftBotErrorEmbed(
					user,
					tr.language,
					Translations.getModule("error", tr.language).format("levelTooLow", {
						level: commandInfo.requirements.requiredLevel
					})
				)]
			}).then();
			return false;
		}

		if (this.effectRequirementsFailed(commandInfo, userEntity, {interaction, tr}, shouldReply)) {
			return false;
		}

		if (await canPerformCommand(interaction.member as GuildMember, interaction, tr.language, commandInfo.requirements.userPermission) !== true) {
			return false;
		}

		if (commandInfo.requirements.guildRequired) {
			if (await this.missingRequirementsForGuild(commandInfo, {user, entity}, interaction, tr)) {
				return false;
			}
		}
		return true;
	}

	static async register(client: Client): Promise<void> {
		const categories = await readdir("dist/src/commands");
		const commandsToRegister: ICommand[] = [];
		for (const category of categories) {
			if (category.endsWith(".js") || category.endsWith(".js.map")) {
				continue;
			}
			const commandsFiles = readdirSync(`dist/src/commands/${category}`).filter(command => command.endsWith(".js"));
			for (const commandFile of commandsFiles) {
				const commandInfo = require(`./${category + "/" + commandFile}`).commandInfo as ICommand;
				if (!commandInfo || !commandInfo.slashCommandBuilder) {
					console.error(`Command dist/src/commands/${category + "/" + commandFile} is not a slash command`);
					continue;
				}
				if (commandFile === "TestCommand.ts" && !botConfig.TEST_MODE) {
					continue;
				}
				commandsToRegister.push(commandInfo);
			}
		}

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

		await client.application.commands.set([]);
		const setCommands = await client.application.commands.set(commandsToSetGuild, botConfig.MAIN_SERVER_ID);
		setCommands.concat(await client.application.commands.set(commandsToSetGlobal));

		for (const cmd of setCommands.values()) {
			this.enforcePermission(this.commands.get(cmd.name), cmd).then(() => console.log("Permissions of command " + cmd.name + " set"));
		}

		client.on("interactionCreate", interaction => {
			if (!interaction.isCommand() || !interaction.inGuild()) {
				return;
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

				if (message.mentions.has(client.user)) {
					message.channel.send({
						content:
							Translations.getModule("bot", server.language).get("mentionHelp")
					}).then();
				}
			}
		});
	}

	static async executeCommandWithParameters(commandName: string, interaction: CommandInteraction, language: string, entity: Entity, ...argsOfCommand: any) {
		await CommandsManager.commands.get(commandName).executeCommand(interaction, language, entity, ...argsOfCommand);
	}

	static async handlePrivateMessage(message: Message) {
		const [entity] = await Entities.getOrRegister(message.author.id);
		const dataModule = Data.getModule("bot");
		let icon = "";
		if (!entity.Player.dmNotification) {
			icon = dataModule.getString("dm.alertIcon");
		}
		await draftBotClient.shard.broadcastEval((client, context) => {
			const mainServer = client.guilds.cache.get(context.mainServerId);
			if (mainServer) {
				const dmChannel = client.users.cache.get(context.dmChannelId);
				if (context.attachments.length > 0) {
					for (const attachment of context.attachments) {
						dmChannel.send({
							files: [{
								// eslint-disable-next-line @typescript-eslint/ban-ts-comment
								// @ts-ignore
								attachment: attachment.url,
								// eslint-disable-next-line @typescript-eslint/ban-ts-comment
								// @ts-ignore
								name: attachment.filename
							}]
						});
					}
				}
				dmChannel.send({content: context.supportAlert});
			}
		}, {
			context: {
				mainServerId: botConfig.MAIN_SERVER_ID,
				dmChannelId: botConfig.SUPPORT_CHANNEL_ID,
				attachments: Array.from(message.attachments.values()),
				supportAlert: format(dataModule.getString("dm.supportAlert"), {
					username: escapeUsername(message.author.username),
					alertIcon: icon,
					id: message.author.id
				}) + message.content
			}
		});

		const reactionMessage = new DraftBotReactionMessageBuilder()
			.allowUserId(message.author.id)
			.addReaction(new DraftBotReaction(Constants.MENU_REACTION.ENGLISH_FLAG))
			.addReaction(new DraftBotReaction(Constants.MENU_REACTION.FRENCH_FLAG))
			.endCallback((msg) => {
				const language = msg.getFirstReaction().emoji.name === Constants.MENU_REACTION.ENGLISH_FLAG ? Constants.LANGUAGE.ENGLISH : Constants.LANGUAGE.FRENCH;
				const tr = Translations.getModule("bot", language);
				message.channel.send({
					embeds: [new DraftBotEmbed()
						.formatAuthor(tr.format("dmHelpMessageTitle", {pseudo: escapeUsername(message.author.username)}), message.author)
						.setDescription(tr.get("dmHelpMessage"))]
				});
			})
			.build();
		reactionMessage.formatAuthor(dataModule.getString("dm.titleSupport"), message.author);
		reactionMessage.setDescription(dataModule.getString("dm.messageSupport"));
		await reactionMessage.send(message.channel);
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
		user,
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
			interaction.reply({
				embeds: [new DraftBotErrorEmbed(
					interaction.user,
					tr.language,
					tr.get("notInAGuild")
				)]
			}).then();
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
			interaction.reply({
				embeds: [
					new DraftBotErrorEmbed(
						user,
						tr.language,
						tr.get("notAuthorizedError")
					)
				]
			}).then();
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
	 * Link permission to the command
	 * @param commandInfo
	 * @param cmd
	 * @private
	 */
	private static async enforcePermission(commandInfo: ICommand, cmd: ApplicationCommand<{ guild: GuildResolvable }>) {
		const perms: ApplicationCommandPermissionData[] = [];
		if (commandInfo.slashCommandPermissions) {
			commandInfo.slashCommandPermissions.forEach(value => perms.push(value));
		}
		if (commandInfo.requirements.userPermission) {
			this.setCommandPermissions(commandInfo, perms);
		}
		if (perms.length !== 0) {
			await cmd.permissions.add({
				guild: botConfig.MAIN_SERVER_ID,
				permissions: perms
			});
		}
	}

	private static setCommandPermissions(commandInfo: ICommand, perms: ApplicationCommandPermissionData[]) {
		switch (commandInfo.requirements.userPermission) {
		case Constants.ROLES.USER.CONTRIBUTORS:
			perms.push({
				id: botConfig.CONTRIBUTOR_ROLE,
				type: "ROLE",
				permission: true
			} as ApplicationCommandPermissionData);
			perms.push({
				id: botConfig.BOT_OWNER_ID,
				type: "USER",
				permission: true
			} as ApplicationCommandPermissionData);
			break;
		case Constants.ROLES.USER.BADGE_MANAGER:
			perms.push({
				id: botConfig.BADGE_MANAGER_ROLE,
				type: "ROLE",
				permission: true
			} as ApplicationCommandPermissionData);
			perms.push({
				id: botConfig.BOT_OWNER_ID,
				type: "USER",
				permission: true
			} as ApplicationCommandPermissionData);
			break;
		case Constants.ROLES.USER.BOT_OWNER:
			perms.push({
				id: botConfig.BOT_OWNER_ID,
				type: "USER",
				permission: true
			} as ApplicationCommandPermissionData);
			break;
		case Constants.ROLES.USER.ADMINISTRATOR:
			// Administrator role is filtered when a user enters the command
			break;
		default:
			break;
		}
	}

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

	private static async launchCommand(tr: TranslationModule, interaction: CommandInteraction): Promise<void> {
		if (resetIsNow()) {
			interaction.reply({
				embeds: [new DraftBotErrorEmbed(
					interaction.user,
					tr.language,
					tr.get("resetIsNow")
				)]
			}).then();
			return;
		}

		if (!interaction.command) {
			return;
		}
		const commandInfo = this.commands.get(interaction.command.name);

		if (!commandInfo) {
			interaction.reply({
				content: "It seems that this command doesn't exist in the bot... Please report it to the DraftBot's staff"
			}).then();
			console.error("Command \"" + interaction.command.name + "\" is not registered");
			return;
		}

		const channel = interaction.channel as GuildChannel;

		if (!channel.permissionsFor(draftBotClient.user).serialize().SEND_MESSAGES) {
			try {
				interaction.user.send({
					content:
						tr.get("noSpeakPermission")
				}).then();
			}
			catch (err) {
				console.log("No perms to show i can't react in server / channel : " + interaction.guild.id + "/" + channel.id);
			}
			return;
		}

		if (!channel.permissionsFor(draftBotClient.user).serialize().ADD_REACTIONS) {
			try {
				interaction.user.send({
					content: tr.get("noReacPermission")
				}).then();
			}
			catch (err) {
				interaction.channel.send({
					content: tr.get("noReacPermission")
				}).then();
			}
			return;
		}

		if (!channel.permissionsFor(draftBotClient.user).serialize().EMBED_LINKS) {
			try {
				interaction.user.send({
					content: tr.get("noEmbedPermission")
				}).then();
			}
			catch (err) {
				interaction.channel.send({
					content: tr.get("noEmbedPermission")
				}).then();
			}
			return;
		}

		if (!channel.permissionsFor(draftBotClient.user).serialize().ATTACH_FILES) {
			try {
				interaction.user.send({
					content: tr.get("noFilePermission")
				}).then();
			}
			catch (err) {
				interaction.channel.send({
					content: tr.get("noFilePermission")
				}).then();
			}
			return;
		}

		const [entity] = await Entities.getOrRegister(interaction.user.id);
		if (!await this.userCanPerformCommand(commandInfo, entity, {interaction, tr}, true)) {
			return;
		}

		if (await BlockingUtils.isPlayerSpamming(interaction.user.id)) {
			interaction.reply({
				embeds: [
					new DraftBotErrorEmbed(
						interaction.user,
						tr.language,
						Translations.getModule("error", tr.language).get("blockedContext.cooldown")
					)
				]
			}).then();
			return;
		}

		BlockingUtils.spamBlockPlayer(interaction.user.id);

		// TODO: REFAIRE LES LOGS
		console.log(interaction.user.id + " executed in server " + interaction.guild.id + ": " + interaction.command.name);
		await commandInfo.executeCommand(interaction, tr.language, entity);
	}
}