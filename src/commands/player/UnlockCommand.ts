import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";

import {BlockingUtils, sendBlockedError} from "../../core/utils/BlockingUtils";
import {ICommand} from "../ICommand";
import {Constants} from "../../core/Constants";
import {SlashCommandBuilder} from "@discordjs/builders";
import {Collection, CommandInteraction, Message, MessageReaction} from "discord.js";
import {replyErrorMessage, sendErrorMessage} from "../../core/utils/ErrorUtils";
import {TranslationModule, Translations} from "../../core/Translations";
import {UnlockConstants} from "../../core/constants/UnlockConstants";
import {BlockingConstants} from "../../core/constants/BlockingConstants";
import {NumberChangeReason} from "../../core/database/logs/LogsDatabase";
import {draftBotInstance} from "../../core/bot";
import {EffectsConstants} from "../../core/constants/EffectsConstants";
import {log} from "console";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {TravelTime} from "../../core/maps/TravelTime";
import Player, {Players} from "../../core/database/game/models/Player";

type PlayerCouple = { unlocker: Player, locked?: Player }
type TextInformation = { interaction: CommandInteraction, language: string, unlockModule: TranslationModule }

/**
 * Test if both entities are eligible to the context of the unlock command
 * @param playerCouple
 * @param textInformation
 */
async function conditionAreFulfilledForUnlocking(playerCouple: PlayerCouple, textInformation: TextInformation): Promise<boolean> {
	if (!playerCouple.locked) {
		await replyErrorMessage(
			textInformation.interaction,
			textInformation.language,
			textInformation.unlockModule.get("cannotGetLockedUser")
		);
		return false;
	}
	if (playerCouple.locked.discordUserId === playerCouple.unlocker.discordUserId) {
		await replyErrorMessage(
			textInformation.interaction,
			textInformation.language,
			textInformation.unlockModule.get("unlockHimself")
		);
		return false;
	}

	if (playerCouple.locked.effect !== EffectsConstants.EMOJI_TEXT.LOCKED) {
		await replyErrorMessage(
			textInformation.interaction,
			textInformation.language,
			textInformation.unlockModule.get("userNotLocked")
		);
		return false;
	}
	if (playerCouple.unlocker.money < UnlockConstants.PRICE_FOR_UNLOCK) {
		await replyErrorMessage(textInformation.interaction, textInformation.language,
			textInformation.unlockModule.format("noMoney", {
				money: UnlockConstants.PRICE_FOR_UNLOCK - playerCouple.unlocker.money,
				pseudo: playerCouple.locked.getPseudo(textInformation.language)
			})
		);
		return false;
	}
	return true;
}

/**
 * Creates the callback used after the unlocker reacted
 * @param entityCouple
 * @param textInformation
 */
function callbackUnlockCommand(
	entityCouple: PlayerCouple,
	textInformation: TextInformation
): (reaction: Collection<string, MessageReaction>) => Promise<void> {
	return async (reaction: Collection<string, MessageReaction>): Promise<void> => {
		BlockingUtils.unblockPlayer(entityCouple.unlocker.discordUserId, BlockingConstants.REASONS.UNLOCK);
		if (reaction.first()) { // a reaction exist
			const [playerToUnlock] = await Players.getOrRegister(entityCouple.locked.discordUserId); // released entity
			const [playerUnlocker] = await Players.getOrRegister(entityCouple.unlocker.discordUserId); // entity who unlocks
			if (reaction.first().emoji.name === Constants.MENU_REACTION.ACCEPT) {
				await TravelTime.removeEffect(playerToUnlock, NumberChangeReason.UNLOCK);
				await playerUnlocker.addMoney({
					amount: -UnlockConstants.PRICE_FOR_UNLOCK,
					channel: textInformation.interaction.channel,
					language: textInformation.language,
					reason: NumberChangeReason.UNLOCK
				});
				await Promise.all([
					playerToUnlock.save(),
					playerUnlocker.save()
				]);
				draftBotInstance.logsDatabase.logUnlocks(playerUnlocker.discordUserId, playerToUnlock.discordUserId).then();
				const successEmbed = new DraftBotEmbed()
					.setAuthor({
						name: textInformation.unlockModule.format("unlockedTitle", {
							pseudo: playerToUnlock.getPseudo(textInformation.language)
						}),
						iconURL: textInformation.interaction.user.displayAvatarURL()
					})
					.setDescription(textInformation.unlockModule.format("unlockSuccess", {
						pseudo: playerToUnlock.getPseudo(textInformation.language)
					}));
				await textInformation.interaction.followUp({embeds: [successEmbed]});
				return;
			}
		}
		await sendErrorMessage(textInformation.interaction.user, textInformation.interaction, textInformation.language, textInformation.unlockModule.get("unlockCanceled"), true);
	};
}

/**
 * Adds the "accept and deny" reactions to the message
 * @param unlockMessage
 */
async function addReactionsToMessage(unlockMessage: Message): Promise<void> {
	try {
		await Promise.all([
			unlockMessage.react(Constants.MENU_REACTION.ACCEPT),
			unlockMessage.react(Constants.MENU_REACTION.DENY)
		]);
	}
	catch (e) {
		log(`Error while reaction to unlock message: ${e}`);
	}
}

/**
 * Sends and manage the "unlock" message
 * @param entityCouple
 * @param textInformation
 * @param embed
 */
async function sendAndManageUnlockMessage(
	entityCouple: PlayerCouple,
	textInformation: TextInformation,
	embed: DraftBotEmbed
): Promise<void> {
	const unlockMessage = await textInformation.interaction.reply({embeds: [embed], fetchReply: true}) as Message;

	const collector = unlockMessage.createReactionCollector({
		filter: (reaction, user) => [Constants.MENU_REACTION.ACCEPT, Constants.MENU_REACTION.DENY].indexOf(reaction.emoji.name) !== -1 && user.id === textInformation.interaction.user.id,
		time: UnlockConstants.COLLECTOR_TIME_FOR_UNLOCK_COLLECTOR,
		max: UnlockConstants.MAX_ACCEPTED_REACTION
	});

	BlockingUtils.blockPlayerWithCollector(entityCouple.unlocker.discordUserId, BlockingConstants.REASONS.UNLOCK, collector);

	collector.on("end", callbackUnlockCommand(entityCouple, textInformation));

	await addReactionsToMessage(unlockMessage);
}

/**
 * Allow to free someone from the lock effect
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param player
 */
async function executeCommand(interaction: CommandInteraction, language: string, player: Player): Promise<void> {
	if (await sendBlockedError(interaction, language)) {
		return;
	}

	const unlockModule = Translations.getModule("commands.unlock", language);

	const lockedPlayer = await Players.getByOptions(interaction);
	const playerCouple = {unlocker: player, locked: lockedPlayer};
	const textInformation = {interaction: interaction, language: language, unlockModule: unlockModule};
	if (!await conditionAreFulfilledForUnlocking(playerCouple, textInformation)) {
		return;
	}

	const embed = new DraftBotEmbed()
		.formatAuthor(unlockModule.get("unlockTitle"), interaction.user)
		.setDescription(unlockModule.format("confirmUnlock", {
			pseudo: lockedPlayer.getPseudo(language),
			price: UnlockConstants.PRICE_FOR_UNLOCK
		}));

	await sendAndManageUnlockMessage(playerCouple, textInformation, embed);
}

const currentCommandFrenchTranslations = Translations.getModule("commands.unlock", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.unlock", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations, currentCommandEnglishTranslations)
		.addUserOption(option =>
			SlashCommandBuilderGenerator.generateUserOption(
				currentCommandFrenchTranslations, currentCommandEnglishTranslations, option
			).setRequired(false)
		)
		.addIntegerOption(option =>
			SlashCommandBuilderGenerator.generateRankOption(
				currentCommandFrenchTranslations, currentCommandEnglishTranslations, option
			).setRequired(false)
		) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		allowEffects: [EffectsConstants.EMOJI_TEXT.SMILEY]
	},
	mainGuildCommand: false
};
