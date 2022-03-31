import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Class, Classes} from "../../core/models/Class";
import {Entity} from "../../core/models/Entity";
import {MissionsController} from "../../core/missions/MissionsController";
import {BlockingUtils} from "../../core/utils/BlockingUtils";
import {ICommand} from "../ICommand";
import {Constants} from "../../core/Constants";
import {CommandInteraction, Message, MessageReaction, User} from "discord.js";
import {sendBlockedErrorInteraction, sendErrorMessage} from "../../core/utils/ErrorUtils";
import {TranslationModule, Translations} from "../../core/Translations";
import Player from "../../core/models/Player";
import {SlashCommandBuilder} from "@discordjs/builders";

/**
 * Select a class
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param entity
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity): Promise<void> {
	if (await sendBlockedErrorInteraction(interaction, language)) {
		return;
	}
	const classTranslations = Translations.getModule("commands.class", language);
	const allClasses = await Classes.getByGroupId(entity.Player.getClassGroup());
	const embedClassMessage = new DraftBotEmbed()
		.setTitle(classTranslations.get("title"))
		.setDescription(classTranslations.get("desc"));

	for (let k = 0; k < allClasses.length; k++) {
		embedClassMessage.addField(allClasses[k].getName(language),
			classTranslations.format("classMainDisplay",
				{
					description: allClasses[k].getDescription(language),
					price: allClasses[k].price
				}
			), false
		);
	}

	embedClassMessage.addField(
		classTranslations.get("moneyQuantityTitle"),
		classTranslations.format("moneyQuantity", {
			money: entity.Player.money
		}));
	// Creating class message
	const classMessage = <Message> await interaction.reply({embeds: [embedClassMessage], fetchReply: true});

	const filterConfirm = (reaction: MessageReaction, user: User) => user.id === entity.discordUserId && reaction.me;

	const collector = classMessage.createReactionCollector({
		filter: filterConfirm,
		time: Constants.MESSAGES.COLLECTOR_TIME,
		max: 1
	});

	BlockingUtils.blockPlayerWithCollector(entity.discordUserId, "class", collector);

	// Fetch the choice from the user
	collector.on("end", async (reaction) => {
		if (!reaction.first()) { // the user is afk
			BlockingUtils.unblockPlayer(entity.discordUserId);
			return;
		}
		if (reaction.first().emoji.name === Constants.MENU_REACTION.DENY) {
			BlockingUtils.unblockPlayer(entity.discordUserId);
			sendErrorMessage(interaction.user, interaction.channel, language, classTranslations.get("error.leaveClass"), true);
			return;
		}

		const selectedClass = await Classes.getByEmoji(reaction.first().emoji.name);
		await confirmPurchase(classMessage, language, selectedClass, entity, classTranslations);
	});

	// Adding reactions
	const classEmojis = new Map();
	for (let k = 0; k < allClasses.length; k++) {
		await classMessage.react(allClasses[k].emoji);
		classEmojis.set(allClasses[k].emoji, k);
	}
	classMessage.react(Constants.MENU_REACTION.DENY);
}

/**
 * @param {*} message - message where the command is from
 * @param {("fr"|"en")} language - the language that has to be used
 * @param {*} selectedClass - The selected class
 * @param {Entities} entity - The entity that is playing
 * @param classTranslations
 */
async function confirmPurchase(message: Message, language: string, selectedClass: Class, entity: Entity, classTranslations: TranslationModule) {

	const confirmEmbed = new DraftBotEmbed()
		.formatAuthor(classTranslations.get("confirm"), message.author)
		.setDescription(
			"\n\u200b\n" +
			classTranslations.format("display", {
				name: selectedClass.toString(language, entity.Player.level),
				price: selectedClass.price,
				description: selectedClass.getDescription(language)
			})
		);

	const confirmMessage = <Message> await message.channel.send({embeds: [confirmEmbed]});
	const filterConfirm = (reaction: MessageReaction, user: User) =>
		(
			reaction.emoji.name === Constants.MENU_REACTION.ACCEPT
			|| reaction.emoji.name === Constants.MENU_REACTION.DENY
		)
		&& user.id === entity.discordUserId;

	const collector = confirmMessage.createReactionCollector({
		filter: filterConfirm,
		time: Constants.MESSAGES.COLLECTOR_TIME,
		max: 1
	});

	collector.on("end", async (reaction) => {
		const playerClass = await Classes.getById(entity.Player.class);
		BlockingUtils.unblockPlayer(entity.discordUserId);
		if (reaction.first()) {
			if (reaction.first().emoji.name === Constants.MENU_REACTION.ACCEPT) {
				if (!canBuy(selectedClass.price, entity.Player)) {
					return sendErrorMessage(message.author, message.channel, language,
						classTranslations.format("error.cannotBuy",
							{
								missingMoney: selectedClass.price - entity.Player.money
							}
						));
				}
				if (selectedClass.id === playerClass.id) {
					return sendErrorMessage(message.author, message.channel, language, classTranslations.get("error.sameClass"));
				}
				await reaction.first().message.delete();
				entity.Player.class = selectedClass.id;
				const newClass = await Classes.getById(entity.Player.class);
				await entity.setHealth(Math.round(
					entity.health / playerClass.getMaxHealthValue(entity.Player.level) * newClass.getMaxHealthValue(entity.Player.level)
				), message.channel, language, false);
				await entity.Player.addMoney(entity, -selectedClass.price, message.channel, language);
				await MissionsController.update(entity.discordUserId, message.channel, language, "chooseClass");
				await MissionsController.update(entity.discordUserId, message.channel, language, "chooseClassTier", 1, {tier: selectedClass.classgroup});
				await Promise.all([
					entity.save(),
					entity.Player.save()
				]);
				// TODO REFACTOR LOGS
				// log(entity.discordUserId + " bought the class " + newClass.en);
				return message.channel.send({
					embeds: [
						new DraftBotEmbed()
							.formatAuthor(classTranslations.get("success"), message.author)
							.setDescription(classTranslations.get("newClass") + selectedClass.getName(language))
					]
				});
			}
		}
		sendErrorMessage(message.author, message.channel, language, classTranslations.get("error.canceledPurchase"), true);
	});

	await Promise.all([
		confirmMessage.react(Constants.MENU_REACTION.ACCEPT),
		confirmMessage.react(Constants.MENU_REACTION.DENY)
	]);
}

/**
 * @param {number} price - The item price
 * @param {Players} player
 */
const canBuy = function(price: number, player: Player) {
	return player.money >= price;
};

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("class")
		.setDescription("Allows you to swap your class with another one"),
	executeCommand,
	requirements: {
		allowEffects: [Constants.EFFECT.SMILEY],
		requiredLevel: Constants.CLASS.REQUIRED_LEVEL,
		disallowEffects: null,
		guildPermissions: null,
		guildRequired: null,
		userPermission: null
	},
	mainGuildCommand: false,
	slashCommandPermissions: null
};