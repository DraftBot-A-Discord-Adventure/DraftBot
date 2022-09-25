import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Class, Classes} from "../../core/database/game/models/Class";
import {Entity} from "../../core/database/game/models/Entity";
import {MissionsController} from "../../core/missions/MissionsController";
import {BlockingUtils, sendBlockedError} from "../../core/utils/BlockingUtils";
import {ICommand} from "../ICommand";
import {Constants} from "../../core/Constants";
import {CommandInteraction, Message, MessageReaction, User} from "discord.js";
import {sendErrorMessage} from "../../core/utils/ErrorUtils";
import {TranslationModule, Translations} from "../../core/Translations";
import Player from "../../core/database/game/models/Player";
import {SlashCommandBuilder} from "@discordjs/builders";
import {BlockingConstants} from "../../core/constants/BlockingConstants";
import {NumberChangeReason} from "../../core/database/logs/LogsDatabase";
import {draftBotInstance} from "../../core/bot";
import {EffectsConstants} from "../../core/constants/EffectsConstants";

type UserInformation = { user: User, entity: Entity }

/**
 * @param {number} price - The item price
 * @param {Players} player
 */
function canBuy(price: number, player: Player): boolean {
	return player.money >= price;
}

/**
 * @param {*} message - message where the command is from
 * @param {*} selectedClass - The selected class
 * @param userInformation
 * @param classTranslations
 * @param interaction
 */
async function confirmPurchase(message: Message, selectedClass: Class, userInformation: UserInformation, classTranslations: TranslationModule, interaction: CommandInteraction): Promise<void> {
	const confirmEmbed = new DraftBotEmbed()
		.formatAuthor(classTranslations.get("confirm"), userInformation.user)
		.setDescription(
			`\n\u200b\n${classTranslations.format("display", {
				name: selectedClass.toString(classTranslations.language, userInformation.entity.Player.level),
				price: selectedClass.price,
				description: selectedClass.getDescription(classTranslations.language)
			})}`
		);

	const confirmMessage = await message.channel.send({embeds: [confirmEmbed]}) as Message;

	const collector = confirmMessage.createReactionCollector({
		filter: (reaction: MessageReaction, user: User) => (
			reaction.emoji.name === Constants.MENU_REACTION.ACCEPT ||
			reaction.emoji.name === Constants.MENU_REACTION.DENY
		) && user.id === userInformation.entity.discordUserId,
		time: Constants.MESSAGES.COLLECTOR_TIME,
		max: 1
	});
	BlockingUtils.blockPlayerWithCollector(userInformation.entity.discordUserId, BlockingConstants.REASONS.CLASS, collector);

	collector.on("end", async (reaction) => {
		const playerClass = await Classes.getById(userInformation.entity.Player.class);
		BlockingUtils.unblockPlayer(userInformation.entity.discordUserId, BlockingConstants.REASONS.CLASS);
		if (reaction.first()) {
			if (reaction.first().emoji.name === Constants.MENU_REACTION.ACCEPT) {
				if (!canBuy(selectedClass.price, userInformation.entity.Player)) {
					return await sendErrorMessage(userInformation.user, interaction, classTranslations.language,
						classTranslations.format("error.cannotBuy",
							{
								missingMoney: selectedClass.price - userInformation.entity.Player.money
							}
						));
				}
				if (selectedClass.id === playerClass.id) {
					return await sendErrorMessage(userInformation.user, interaction, classTranslations.language, classTranslations.get("error.sameClass"));
				}
				userInformation.entity.Player.class = selectedClass.id;
				const newClass = await Classes.getById(userInformation.entity.Player.class);
				await userInformation.entity.addHealth(Math.round(
					userInformation.entity.health / playerClass.getMaxHealthValue(userInformation.entity.Player.level) * newClass.getMaxHealthValue(userInformation.entity.Player.level)
				) - userInformation.entity.health, message.channel, classTranslations.language, NumberChangeReason.CLASS, {
					shouldPokeMission: false,
					overHealCountsForMission: false
				});
				await userInformation.entity.Player.addMoney({
					entity: userInformation.entity,
					amount: -selectedClass.price,
					channel: message.channel,
					language: classTranslations.language,
					reason: NumberChangeReason.CLASS
				});
				await MissionsController.update(userInformation.entity, message.channel, classTranslations.language, {missionId: "chooseClass"});
				await MissionsController.update(userInformation.entity, message.channel, classTranslations.language, {
					missionId: "chooseClassTier",
					params: {tier: selectedClass.classGroup}
				});
				await Promise.all([
					userInformation.entity.save(),
					userInformation.entity.Player.save()
				]);
				draftBotInstance.logsDatabase.logPlayerClassChange(userInformation.entity.discordUserId, newClass.id).then();
				return message.channel.send({
					embeds: [
						new DraftBotEmbed()
							.formatAuthor(classTranslations.get("success"), userInformation.user)
							.setDescription(classTranslations.get("newClass") + selectedClass.getName(classTranslations.language))
					]
				});
			}
		}
		await sendErrorMessage(userInformation.user, interaction, classTranslations.language, classTranslations.get("error.canceledPurchase"), true);
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
async function createDisplayClassEmbedAndSendIt(classTranslations: TranslationModule, allClasses: Class[], language: string, entity: Entity, interaction: CommandInteraction): Promise<Message> {
	const embedClassMessage = new DraftBotEmbed()
		.setTitle(classTranslations.get("title"))
		.setDescription(classTranslations.get("desc"));

	for (let k = 0; k < allClasses.length; k++) {
		embedClassMessage.addFields({
			name: allClasses[k].getName(language),
			value: classTranslations.format("classMainDisplay",
				{
					description: allClasses[k].getDescription(language),
					price: allClasses[k].price
				}
			)
		});
	}

	embedClassMessage.addFields({
		name: classTranslations.get("moneyQuantityTitle"),
		value: classTranslations.format("moneyQuantity", {
			money: entity.Player.money
		})
	});
	// Creating class message
	return await interaction.reply({embeds: [embedClassMessage], fetchReply: true}) as Message;
}

/**
 * Creates the collector to allow the class switching
 * @param classMessage
 * @param userInformation
 * @param interaction
 * @param classTranslations
 */
function createClassCollectorAndManageIt(
	classMessage: Message,
	userInformation: UserInformation,
	interaction: CommandInteraction,
	classTranslations: TranslationModule): void {
	const collector = classMessage.createReactionCollector({
		filter: (reaction: MessageReaction, user: User) => user.id === userInformation.entity.discordUserId && reaction.me,
		time: Constants.MESSAGES.COLLECTOR_TIME,
		max: 1
	});

	BlockingUtils.blockPlayerWithCollector(userInformation.entity.discordUserId, BlockingConstants.REASONS.CLASS, collector);

	// Fetch the choice from the user
	collector.on("collect", async (reaction) => {
		collector.stop();
		if (reaction.emoji.name === Constants.MENU_REACTION.DENY) {
			await sendErrorMessage(interaction.user, interaction, classTranslations.language, classTranslations.get("error.leaveClass"), true);
			return;
		}
		await confirmPurchase(
			classMessage,
			await Classes.getByEmoji(reaction.emoji.name),
			userInformation,
			classTranslations,
			interaction);
	});
	collector.on("end", () => {
		BlockingUtils.unblockPlayer(userInformation.entity.discordUserId, BlockingConstants.REASONS.CLASS);
	});
}

/**
 * Add all reactions to the class embed corresponding to the possible class choices
 * @param allClasses
 * @param classMessage
 */
async function addClassEmbedReactions(allClasses: Class[], classMessage: Message): Promise<void> {
	const classEmojis = new Map();
	for (let k = 0; k < allClasses.length; k++) {
		await classMessage.react(allClasses[k].emoji);
		classEmojis.set(allClasses[k].emoji, k);
	}
	await classMessage.react(Constants.MENU_REACTION.DENY);
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

const currentCommandFrenchTranslations = Translations.getModule("commands.class", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.class", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName(currentCommandEnglishTranslations.get("commandName"))
		.setNameLocalizations({
			fr: currentCommandFrenchTranslations.get("commandName")
		})
		.setDescription(currentCommandEnglishTranslations.get("commandDescription"))
		.setDescriptionLocalizations({
			fr: currentCommandFrenchTranslations.get("commandDescription")
		}),
	executeCommand,
	requirements: {
		allowEffects: [EffectsConstants.EMOJI_TEXT.SMILEY],
		requiredLevel: Constants.CLASS.REQUIRED_LEVEL
	},
	mainGuildCommand: false
};