import {Client, CommandInteraction, GuildChannel, GuildMember, Message, TextBasedChannel, User} from "discord.js";
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

declare const effectsErrorMe: (user: User, channel: TextBasedChannel, language: string, entity: Entity, effect: string) => Promise<void>;
declare const canPerformCommand: (member: GuildMember, channel: TextBasedChannel, language: string, permission: string) => Promise<boolean>;

export class CommandsManager {
	static commands = new Map<string, ICommand>();

	static async clear(client: Client): Promise<void> {
		await client.application.commands.set([]);
	}

	static async register(client: Client): Promise<void> {
		const categories = await readdir("dist/src/commands");

		for (const category of categories) {
			if (category.endsWith(".js") || category.endsWith(".js.map")) {
				continue;
			}
			const commandsFiles = readdirSync(`dist/src/commands/${category}`).filter(command => command.endsWith(".js"));
			for (const commandFile of commandsFiles) {
				const command = require(`./${category}/${commandFile}`);
				const commandInfo = command.commandInfo as ICommand;
				if (!commandInfo || !commandInfo.slashCommandBuilder) {
					console.error(`Command dist/src/commands/${category}/${commandFile} is not a slash command`);
					continue;
				}
				if (commandInfo.mainGuildCommand || botConfig.TEST_MODE) {
					const cmd = await client.application.commands.create(commandInfo.slashCommandBuilder.toJSON(), botConfig.MAIN_SERVER_ID);
					if (commandInfo.slashCommandPermissions) {
						await cmd.permissions.add({
							guild: botConfig.MAIN_SERVER_ID,
							permissions: commandInfo.slashCommandPermissions
						});
					}
				}
				else {
					await client.application.commands.create(commandInfo.slashCommandBuilder.toJSON());
				}
				CommandsManager.commands.set(commandInfo.slashCommandBuilder.name, commandInfo);
			}
		}

		client.on("interactionCreate", interaction => {
			if (!interaction.isCommand() || !interaction.inGuild()) {
				return;
			}

			CommandsManager.handleCommand(interaction as CommandInteraction);
		});

		client.on("messageCreate", async message => {
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
							Translations.getModule("bot", server.language).format("mentionHelp", {
								prefix: server.prefix
							})
					}).then();
				}
			}
		});
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
		if (commandInfo.requirements.requiredLevel && entity.Player.getLevel() < commandInfo.requirements.requiredLevel) {
			interaction.reply({
				embeds: [new DraftBotErrorEmbed(
					interaction.user,
					tr.language,
					Translations.getModule("error", tr.language).get("levelTooLow")
				)]
			}).then();
			return;
		}

		if (commandInfo.requirements.disallowEffects && commandInfo.requirements.disallowEffects.includes(entity.Player.effect) && !entity.Player.currentEffectFinished()) {
			effectsErrorMe(interaction.user, interaction.channel, tr.language, entity, entity.Player.effect).then();
			return;
		}

		if (commandInfo.requirements.allowEffects && !commandInfo.requirements.allowEffects.includes(entity.Player.effect) && !entity.Player.currentEffectFinished()) {
			effectsErrorMe(interaction.user, interaction.channel, tr.language, entity, entity.Player.effect).then();
			return;
		}

		if (await canPerformCommand(interaction.member as GuildMember, interaction.channel, tr.language, commandInfo.requirements.userPermission) !== true) {
			return;
		}

		if (commandInfo.requirements.guildRequired) {
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
				return;
			}

			let userPermissionsLevel = 1;

			if (entity.id === guild.getElderId()) {
				userPermissionsLevel = 2;
			}
			if (entity.id === guild.getChiefId()) {
				userPermissionsLevel = 3;
			}

			if (userPermissionsLevel < commandInfo.requirements.guildPermissions) {
				interaction.reply({
					embeds: [
						new DraftBotErrorEmbed(
							interaction.user,
							tr.language,
							tr.get("notAuthorizedError")
						)
					]
				}).then();
				return;
			}
		}

		if (await BlockingUtils.isPlayerSpamming(interaction.user.id)) {
			interaction.reply({
				embeds: [
					new DraftBotErrorEmbed(
						interaction.user,
						tr.language,
						tr.get("blockedContext.cooldown")
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
}