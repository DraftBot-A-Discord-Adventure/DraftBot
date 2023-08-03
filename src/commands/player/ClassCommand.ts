import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Class, Classes} from "../../core/database/game/models/Class";
import {MissionsController} from "../../core/missions/MissionsController";
import {BlockingUtils, sendBlockedError} from "../../core/utils/BlockingUtils";
import {ICommand} from "../ICommand";
import {Constants} from "../../core/Constants";
import {CommandInteraction, Message, MessageReaction, User} from "discord.js";
import {replyErrorMessage, sendErrorMessage} from "../../core/utils/ErrorUtils";
import {TranslationModule, Translations} from "../../core/Translations";
import Player from "../../core/database/game/models/Player";
import {BlockingConstants} from "../../core/constants/BlockingConstants";
import {NumberChangeReason} from "../../core/constants/LogsConstants";
import {draftBotInstance} from "../../core/bot";
import {EffectsConstants} from "../../core/constants/EffectsConstants";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {LogsReadRequests} from "../../core/database/logs/LogsReadRequests";
import {dateDisplay, finishInTimeDisplay, millisecondsToSeconds} from "../../core/utils/TimeUtils";

type UserInformation = { user: User, player: Player }

/**
 * @param {*} message - message where the command is from
 * @param {*} selectedClass - The selected class
 * @param userInformation
 * @param classTranslations
 * @param interaction
 */
async function confirmPurchase(message: Message, selectedClass: Class, userInformation: UserInformation, classTranslations: TranslationModule, interaction: CommandInteraction): Promise<void> {
	const playerClass = await Classes.getById(userInformation.player.class);
	if (selectedClass.id === playerClass.id) {
		await sendErrorMessage(userInformation.user, interaction, classTranslations.language, classTranslations.get("error.sameClass"));
		return;
	}
	const confirmEmbed = new DraftBotEmbed()
		.formatAuthor(classTranslations.get("confirm"), userInformation.user)
		.setDescription(
			`\n\u200b\n${classTranslations.format("display", {
				name: selectedClass.toString(classTranslations.language, userInformation.player.level),
				description: selectedClass.getDescription(classTranslations.language),
				time: dateDisplay(new Date(Date.now() + Constants.CLASS.TIME_BEFORE_CHANGE_CLASS[selectedClass.classGroup] * 1000))
			})}`
		);

	const confirmMessage = await message.channel.send({embeds: [confirmEmbed]}) as Message;

	const collector = confirmMessage.createReactionCollector({
		filter: (reaction: MessageReaction, user: User) => (
			reaction.emoji.name === Constants.REACTIONS.VALIDATE_REACTION ||
			reaction.emoji.name === Constants.REACTIONS.REFUSE_REACTION
		) && user.id === userInformation.player.discordUserId,
		time: Constants.MESSAGES.COLLECTOR_TIME,
		max: 1
	});
	BlockingUtils.blockPlayerWithCollector(userInformation.player.discordUserId, BlockingConstants.REASONS.CLASS, collector);

	collector.on("end", async (reaction) => {
		BlockingUtils.unblockPlayer(userInformation.player.discordUserId, BlockingConstants.REASONS.CLASS);
		if (reaction.first() && reaction.first().emoji.name === Constants.REACTIONS.VALIDATE_REACTION) {
			userInformation.player.class = selectedClass.id;
			const newClass = await Classes.getById(userInformation.player.class);
			const level = userInformation.player.level;
			await userInformation.player.addHealth(Math.ceil(
				userInformation.player.health / playerClass.getMaxHealthValue(level) * newClass.getMaxHealthValue(level)
			) - userInformation.player.health, message.channel, classTranslations.language, NumberChangeReason.CLASS, {
				shouldPokeMission: false,
				overHealCountsForMission: false
			});
			userInformation.player.setFightPointsLost(Math.ceil(
				userInformation.player.fightPointsLost / playerClass.getMaxCumulativeFightPointValue(level) * newClass.getMaxCumulativeFightPointValue(level)
			), NumberChangeReason.CLASS);
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
		await replyErrorMessage(interaction, classTranslations.language, classTranslations.get("error.canceledPurchase"));
	});

	await Promise.all([
		confirmMessage.react(Constants.REACTIONS.VALIDATE_REACTION),
		confirmMessage.react(Constants.REACTIONS.REFUSE_REACTION)
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

	for (const classe of allClasses) {
		embedClassMessage.addFields({
			name: classe.getName(language),
			value: classe.getDescription(language)
		});
	}

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
		if (reaction.emoji.name === Constants.REACTIONS.REFUSE_REACTION) {
			await sendErrorMessage(interaction.user, interaction, classTranslations.language, classTranslations.get("error.leaveClass"), true);
			return;
		}
		await confirmPurchase(
			classMessage,
			await Classes.getByEmoji(reaction.emoji.name, userInformation.player.getClassGroup()),
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
	await classMessage.react(Constants.REACTIONS.REFUSE_REACTION);
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
	const currentClassGroup = (await Classes.getById(player.class)).classGroup;
	const lastTimeThePlayerHasEditedHisClass = await LogsReadRequests.getLastTimeThePlayerHasEditedHisClass(player.discordUserId);
	if (millisecondsToSeconds(Date.now()) - lastTimeThePlayerHasEditedHisClass.getTime() < Constants.CLASS.TIME_BEFORE_CHANGE_CLASS[currentClassGroup]) {
		await replyErrorMessage(interaction, classTranslations.language, classTranslations.format("error.changeClassTooEarly", {
			time: finishInTimeDisplay(new Date((lastTimeThePlayerHasEditedHisClass.getTime() + Constants.CLASS.TIME_BEFORE_CHANGE_CLASS[currentClassGroup]) * 1000))
		}));
		return;
	}
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