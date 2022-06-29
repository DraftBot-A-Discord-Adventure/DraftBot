import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Class, Classes} from "../../core/models/Class";
import {Entity} from "../../core/models/Entity";
import {MissionsController} from "../../core/missions/MissionsController";
import {BlockingUtils, sendBlockedError} from "../../core/utils/BlockingUtils";
import {ICommand} from "../ICommand";
import {Constants} from "../../core/Constants";
import {CommandInteraction, Message, MessageReaction, User} from "discord.js";
import {sendErrorMessage} from "../../core/utils/ErrorUtils";
import {TranslationModule, Translations} from "../../core/Translations";
import Player from "../../core/models/Player";
import {SlashCommandBuilder} from "@discordjs/builders";
import {BlockingConstants} from "../../core/constants/BlockingConstants";

type UserInformations = { user: User, entity: Entity }

/**
 * @param {number} price - The item price
 * @param {Players} player
 */
const canBuy = function(price: number, player: Player) {
	return player.money >= price;
};

/**
 * @param {*} message - message where the command is from
 * @param {*} selectedClass - The selected class
 * @param userInformations
 * @param classTranslations
 * @param interaction
 */
async function confirmPurchase(message: Message, selectedClass: Class, userInformations: UserInformations, classTranslations: TranslationModule, interaction: CommandInteraction) {
	const confirmEmbed = new DraftBotEmbed()
		.formatAuthor(classTranslations.get("confirm"), userInformations.user)
		.setDescription(
			"\n\u200b\n" +
			classTranslations.format("display", {
				name: selectedClass.toString(classTranslations.language, userInformations.entity.Player.level),
				price: selectedClass.price,
				description: selectedClass.getDescription(classTranslations.language)
			})
		);

	const confirmMessage = await message.channel.send({embeds: [confirmEmbed]}) as Message;
	const filterConfirm = (reaction: MessageReaction, user: User) =>
		(
			reaction.emoji.name === Constants.MENU_REACTION.ACCEPT
			|| reaction.emoji.name === Constants.MENU_REACTION.DENY
		)
		&& user.id === userInformations.entity.discordUserId;

	const collector = confirmMessage.createReactionCollector({
		filter: filterConfirm,
		time: Constants.MESSAGES.COLLECTOR_TIME,
		max: 1
	});
	BlockingUtils.blockPlayerWithCollector(userInformations.entity.discordUserId, BlockingConstants.REASONS.CLASS, collector);

	collector.on("end", async (reaction) => {
		const playerClass = await Classes.getById(userInformations.entity.Player.class);
		BlockingUtils.unblockPlayer(userInformations.entity.discordUserId, BlockingConstants.REASONS.CLASS);
		if (reaction.first()) {
			if (reaction.first().emoji.name === Constants.MENU_REACTION.ACCEPT) {
				if (!canBuy(selectedClass.price, userInformations.entity.Player)) {
					return sendErrorMessage(userInformations.user, interaction, classTranslations.language,
						classTranslations.format("error.cannotBuy",
							{
								missingMoney: selectedClass.price - userInformations.entity.Player.money
							}
						));
				}
				if (selectedClass.id === playerClass.id) {
					return sendErrorMessage(userInformations.user, interaction, classTranslations.language, classTranslations.get("error.sameClass"));
				}
				userInformations.entity.Player.class = selectedClass.id;
				const newClass = await Classes.getById(userInformations.entity.Player.class);
				await userInformations.entity.setHealth(Math.round(
					userInformations.entity.health / playerClass.getMaxHealthValue(userInformations.entity.Player.level) * newClass.getMaxHealthValue(userInformations.entity.Player.level)
				), message.channel, classTranslations.language, {
					shouldPokeMission: false,
					overHealCountsForMission: false
				});
				await userInformations.entity.Player.addMoney(userInformations.entity, -selectedClass.price, message.channel, classTranslations.language);
				await MissionsController.update(userInformations.entity, message.channel, classTranslations.language, {missionId: "chooseClass"});
				await MissionsController.update(userInformations.entity, message.channel, classTranslations.language, {
					missionId: "chooseClassTier",
					params: {tier: selectedClass.classGroup}
				});
				await Promise.all([
					userInformations.entity.save(),
					userInformations.entity.Player.save()
				]);
				// TODO REFACTOR LOGS
				// log(entity.discordUserId + " bought the class " + newClass.en);
				return message.channel.send({
					embeds: [
						new DraftBotEmbed()
							.formatAuthor(classTranslations.get("success"), userInformations.user)
							.setDescription(classTranslations.get("newClass") + selectedClass.getName(classTranslations.language))
					]
				});
			}
		}
		sendErrorMessage(userInformations.user, interaction, classTranslations.language, classTranslations.get("error.canceledPurchase"), true);
	});

	await Promise.all([
		confirmMessage.react(Constants.MENU_REACTION.ACCEPT),
		confirmMessage.react(Constants.MENU_REACTION.DENY)
	]);
}

/**
 * Creates the main class display and sends it
 * @param classTranslations
 * @param allClasses
 * @param language
 * @param entity
 * @param interaction
 */
async function createDisplayClassEmbedAndSendIt(classTranslations: TranslationModule, allClasses: Class[], language: string, entity: Entity, interaction: CommandInteraction) {
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
	return await interaction.reply({embeds: [embedClassMessage], fetchReply: true}) as Message;
}

/**
 * Creates the collector to allow the class changement
 * @param classMessage
 * @param userInformations
 * @param interaction
 * @param classTranslations
 */
function createClassCollectorAndManageIt(
	classMessage: Message,
	userInformations: UserInformations,
	interaction: CommandInteraction,
	classTranslations: TranslationModule) {
	const collector = classMessage.createReactionCollector({
		filter: (reaction: MessageReaction, user: User) => user.id === userInformations.entity.discordUserId && reaction.me,
		time: Constants.MESSAGES.COLLECTOR_TIME,
		max: 1
	});

	BlockingUtils.blockPlayerWithCollector(userInformations.entity.discordUserId, BlockingConstants.REASONS.CLASS, collector);

	// Fetch the choice from the user
	collector.on("collect", async (reaction) => {
		collector.stop();
		if (reaction.emoji.name === Constants.MENU_REACTION.DENY) {
			sendErrorMessage(interaction.user, interaction, classTranslations.language, classTranslations.get("error.leaveClass"), true);
			return;
		}
		await confirmPurchase(
			classMessage,
			await Classes.getByEmoji(reaction.emoji.name),
			userInformations,
			classTranslations,
			interaction);
	});
	collector.on("end", () => {
		BlockingUtils.unblockPlayer(userInformations.entity.discordUserId, BlockingConstants.REASONS.CLASS);
	});
}

/**
 * Add all reactions to the class embed corresponding to the possible class choices
 * @param allClasses
 * @param classMessage
 */
async function addClassEmbedReactions(allClasses: Class[], classMessage: Message) {
	const classEmojis = new Map();
	for (let k = 0; k < allClasses.length; k++) {
		await classMessage.react(allClasses[k].emoji);
		classEmojis.set(allClasses[k].emoji, k);
	}
	classMessage.react(Constants.MENU_REACTION.DENY);
}

/**
 * Select a class
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param entity
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity): Promise<void> {
	if (await sendBlockedError(interaction, language)) {
		return;
	}
	const classTranslations = Translations.getModule("commands.class", language);
	const allClasses = await Classes.getByGroupId(entity.Player.getClassGroup());
	const classMessage = await createDisplayClassEmbedAndSendIt(classTranslations, allClasses, language, entity, interaction);

	createClassCollectorAndManageIt(classMessage, {
		user: interaction.user,
		entity: entity
	}, interaction, classTranslations);

	// Adding reactions
	await addClassEmbedReactions(allClasses, classMessage);
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("class")
		.setDescription("Allows you to swap your class with another one"),
	executeCommand,
	requirements: {
		allowEffects: [Constants.EFFECT.SMILEY],
		requiredLevel: Constants.CLASS.REQUIRED_LEVEL
	},
	mainGuildCommand: false
};