import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Class, Classes} from "../../core/database/game/models/Class";
import {MissionsController} from "../../core/missions/MissionsController";
import {BlockingUtils, sendBlockedError} from "../../core/utils/BlockingUtils";
import {ICommand} from "../ICommand";
import {Constants} from "../../core/Constants";
import {CommandInteraction, Message, MessageReaction, User} from "discord.js";
import {sendErrorMessage} from "../../core/utils/ErrorUtils";
import {TranslationModule, Translations} from "../../core/Translations";
import Player from "../../core/database/game/models/Player";
import {BlockingConstants} from "../../core/constants/BlockingConstants";
import {NumberChangeReason} from "../../core/constants/LogsConstants";
import {draftBotInstance} from "../../core/bot";
import {EffectsConstants} from "../../core/constants/EffectsConstants";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";

type UserInformation = { user: User, player: Player }

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
				name: selectedClass.toString(classTranslations.language, userInformation.player.level),
				price: selectedClass.price,
				description: selectedClass.getDescription(classTranslations.language)
			})}`
		);

	const confirmMessage = await message.channel.send({embeds: [confirmEmbed]}) as Message;

	const collector = confirmMessage.createReactionCollector({
		filter: (reaction: MessageReaction, user: User) => (
			reaction.emoji.name === Constants.MENU_REACTION.ACCEPT ||
			reaction.emoji.name === Constants.MENU_REACTION.DENY
		) && user.id === userInformation.player.discordUserId,
		time: Constants.MESSAGES.COLLECTOR_TIME,
		max: 1
	});
	BlockingUtils.blockPlayerWithCollector(userInformation.player.discordUserId, BlockingConstants.REASONS.CLASS, collector);

	collector.on("end", async (reaction) => {
		const playerClass = await Classes.getById(userInformation.player.class);
		BlockingUtils.unblockPlayer(userInformation.player.discordUserId, BlockingConstants.REASONS.CLASS);
		if (reaction.first()) {
			if (reaction.first().emoji.name === Constants.MENU_REACTION.ACCEPT) {
				if (!canBuy(selectedClass.price, userInformation.player)) {
					return await sendErrorMessage(userInformation.user, interaction, classTranslations.language,
						classTranslations.format("error.cannotBuy",
							{
								missingMoney: selectedClass.price - userInformation.player.money
							}
						));
				}
				if (selectedClass.id === playerClass.id) {
					return await sendErrorMessage(userInformation.user, interaction, classTranslations.language, classTranslations.get("error.sameClass"));
				}
				userInformation.player.class = selectedClass.id;
				const newClass = await Classes.getById(userInformation.player.class);
				await userInformation.player.addHealth(Math.round(
					userInformation.player.health / playerClass.getMaxHealthValue(userInformation.player.level) * newClass.getMaxHealthValue(userInformation.player.level)
				) - userInformation.player.health, message.channel, classTranslations.language, NumberChangeReason.CLASS, {
					shouldPokeMission: false,
					overHealCountsForMission: false
				});
				await userInformation.player.addMoney({
					amount: -selectedClass.price,
					channel: message.channel,
					language: classTranslations.language,
					reason: NumberChangeReason.CLASS
				});
				await MissionsController.update(userInformation.player, message.channel, classTranslations.language, {missionId: "chooseClass"});
				await MissionsController.update(userInformation.player, message.channel, classTranslations.language, {
					missionId: "chooseClassTier",
					params: {tier: selectedClass.classGroup}
				});
				await userInformation.player.save();
				draftBotInstance.logsDatabase.logPlayerClassChange(userInformation.player.discordUserId, newClass.id).then();
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
 * @param player
 * @param interaction
 */
async function createDisplayClassEmbedAndSendIt(classTranslations: TranslationModule, allClasses: Class[], language: string, player: Player, interaction: CommandInteraction): Promise<Message> {
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
			money: player.money
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
		filter: (reaction: MessageReaction, user: User) => user.id === userInformation.player.discordUserId && reaction.me,
		time: Constants.MESSAGES.COLLECTOR_TIME,
		max: 1
	});

	BlockingUtils.blockPlayerWithCollector(userInformation.player.discordUserId, BlockingConstants.REASONS.CLASS, collector);

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
		BlockingUtils.unblockPlayer(userInformation.player.discordUserId, BlockingConstants.REASONS.CLASS);
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
 * @param player
 */
async function executeCommand(interaction: CommandInteraction, language: string, player: Player): Promise<void> {
	if (await sendBlockedError(interaction, language)) {
		return;
	}
	const classTranslations = Translations.getModule("commands.class", language);
	const allClasses = await Classes.getByGroupId(player.getClassGroup());
	const classMessage = await createDisplayClassEmbedAndSendIt(classTranslations, allClasses, language, player, interaction);

	createClassCollectorAndManageIt(classMessage, {
		user: interaction.user,
		player
	}, interaction, classTranslations);

	// Adding reactions
	await addClassEmbedReactions(allClasses, classMessage);
}

const currentCommandFrenchTranslations = Translations.getModule("commands.class", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.class", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations, currentCommandEnglishTranslations),
	executeCommand,
	requirements: {
		allowEffects: [EffectsConstants.EMOJI_TEXT.SMILEY],
		requiredLevel: Constants.CLASS.REQUIRED_LEVEL
	},
	mainGuildCommand: false
};