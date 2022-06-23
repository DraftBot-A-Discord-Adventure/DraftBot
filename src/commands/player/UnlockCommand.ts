import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Entities, Entity} from "../../core/models/Entity";

import {Maps} from "../../core/Maps";
import {BlockingUtils} from "../../core/utils/BlockingUtils";
import {ICommand} from "../ICommand";
import {Constants} from "../../core/Constants";
import {SlashCommandBuilder} from "@discordjs/builders";
import {Collection, CommandInteraction, Message, MessageReaction} from "discord.js";
import {sendBlockedErrorInteraction, sendErrorMessage} from "../../core/utils/ErrorUtils";
import {TranslationModule, Translations} from "../../core/Translations";
import {UnlockConstants} from "../../core/constants/UnlockConstants";
import {BlockingConstants} from "../../core/constants/BlockingConstants";

type EntityCouple = { unlocker: Entity, locked?: Entity }
type TextInformations = { interaction: CommandInteraction, language: string, unlockModule: TranslationModule }

/**
 * Test if both entities are eligible to the context of the unlock command
 * @param entityCouple
 * @param textInformations
 */
async function conditionAreFulfilledForUnlocking(entityCouple: EntityCouple, textInformations: TextInformations) {
	if (!entityCouple.locked) {
		sendErrorMessage(
			textInformations.interaction.user,
			textInformations.interaction.channel,
			textInformations.language,
			textInformations.unlockModule.get("cannotGetlockedUser"),
			false,
			textInformations.interaction
		);
		return false;
	}
	if (entityCouple.locked.discordUserId === entityCouple.unlocker.discordUserId) {
		sendErrorMessage(
			textInformations.interaction.user,
			textInformations.interaction.channel,
			textInformations.language,
			textInformations.unlockModule.get("unlockHimself"),
			false,
			textInformations.interaction
		);
		return false;
	}

	if (entityCouple.locked.Player.effect !== Constants.EFFECT.LOCKED) {
		sendErrorMessage(
			textInformations.interaction.user,
			textInformations.interaction.channel,
			textInformations.language,
			textInformations.unlockModule.get("userNotLocked"),
			false,
			textInformations.interaction
		);
		return false;
	}
	if (entityCouple.unlocker.Player.money < UnlockConstants.PRICE_FOR_UNLOCK) {
		sendErrorMessage(textInformations.interaction.user, textInformations.interaction.channel, textInformations.language,
			textInformations.unlockModule.format("noMoney", {
				money: UnlockConstants.PRICE_FOR_UNLOCK - entityCouple.unlocker.Player.money,
				pseudo: await entityCouple.locked.Player.getPseudo(textInformations.language)
			}),
			false,
			textInformations.interaction
		);
		return false;
	}
	return true;
}

/**
 * Creates the callback used after the unlocker reacted
 * @param entityCouple
 * @param textInformations
 */
function callbackUnlockCommand(entityCouple: EntityCouple, textInformations: TextInformations) {
	return async (reaction: Collection<string, MessageReaction>) => {
		BlockingUtils.unblockPlayer(entityCouple.unlocker.discordUserId, BlockingConstants.REASONS.UNLOCK);
		if (reaction.first()) { // a reaction exist
			const [entityToUnlock] = await Entities.getOrRegister(entityCouple.locked.discordUserId); // released entity
			const [entityUnlocker] = await Entities.getOrRegister(entityCouple.unlocker.discordUserId); // entity who unlocks
			if (reaction.first().emoji.name === Constants.MENU_REACTION.ACCEPT) {
				await Maps.removeEffect(entityToUnlock.Player);
				await entityUnlocker.Player.addMoney(entityUnlocker, -UnlockConstants.PRICE_FOR_UNLOCK, textInformations.interaction.channel, textInformations.language);
				await Promise.all([
					entityToUnlock.save(),
					entityToUnlock.Player.save(),
					entityUnlocker.save(),
					entityUnlocker.Player.save()
				]);
				// TODO REFACTOR LES LOGS
				// log(entityToUnlock.discordUserId + " has been released by" + interaction.user.id);
				const successEmbed = new DraftBotEmbed()
					.setAuthor(
						textInformations.unlockModule.format("unlockedTitle", {
							pseudo: await entityToUnlock.Player.getPseudo(textInformations.language)
						}),
						textInformations.interaction.user.displayAvatarURL()
					)
					.setDescription(textInformations.unlockModule.format("unlockSuccess", {
						pseudo: await entityToUnlock.Player.getPseudo(textInformations.language)
					}));
				return await textInformations.interaction.followUp({embeds: [successEmbed]});
			}
		}
		await sendErrorMessage(textInformations.interaction.user, textInformations.interaction.channel, textInformations.language, textInformations.unlockModule.get("unlockCanceled"), true);
	};
}

/**
 * Adds the "accept and deny" reactions to the message
 * @param unlockMessage
 */
async function addReactionsToMessage(unlockMessage: Message) {
	try {
		await Promise.all([
			unlockMessage.react(Constants.MENU_REACTION.ACCEPT),
			unlockMessage.react(Constants.MENU_REACTION.DENY)
		]);
	}
	catch (e) {
		// TODO REFACTOR LES LOGS
		// log("Error while reaction to unlock message: " + e);
	}
}

/**
 * Sends and manage the "unlock" message
 * @param entityCouple
 * @param textInformations
 * @param embed
 */
async function sendAndManageUnlockMessage(entityCouple: EntityCouple, textInformations: TextInformations, embed: DraftBotEmbed) {
	const unlockMessage = await textInformations.interaction.reply({embeds: [embed], fetchReply: true}) as Message;

	const collector = unlockMessage.createReactionCollector({
		filter: (reaction, user) => [Constants.MENU_REACTION.ACCEPT, Constants.MENU_REACTION.DENY].indexOf(reaction.emoji.name) !== -1 && user.id === textInformations.interaction.user.id,
		time: UnlockConstants.COLLECTOR_TIME_FOR_UNLOCK_COLLECTOR,
		max: UnlockConstants.MAX_ACCEPTED_REACTION
	});

	BlockingUtils.blockPlayerWithCollector(entityCouple.unlocker.discordUserId, BlockingConstants.REASONS.UNLOCK, collector);

	collector.on("end", callbackUnlockCommand(entityCouple, textInformations));

	await addReactionsToMessage(unlockMessage);
}

/**
 * Allow to free someone from the lock effect
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param entity
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity) {
	if (await sendBlockedErrorInteraction(interaction, language)) {
		return;
	}

	const unlockModule = Translations.getModule("commands.unlock", language);

	const lockedEntity = await Entities.getByOptions(interaction);
	const entityCouple = {unlocker: entity, locked: lockedEntity};
	const textInformations = {interaction: interaction, language: language, unlockModule: unlockModule};
	if (!await conditionAreFulfilledForUnlocking(entityCouple, textInformations)) {
		return;
	}

	const embed = new DraftBotEmbed()
		.formatAuthor(unlockModule.get("unlockTitle"), interaction.user)
		.setDescription(unlockModule.format("confirmUnlock", {
			pseudo: await lockedEntity.Player.getPseudo(language),
			price: UnlockConstants.PRICE_FOR_UNLOCK
		}));

	await sendAndManageUnlockMessage(entityCouple, textInformations, embed);
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("unlock")
		.setDescription("Allows you to free someone from the lock effect")
		.addUserOption(option => option.setName("user")
			.setDescription("The user you want to unlock")
			.setRequired(false)
		)
		.addNumberOption(option => option.setName("rank")
			.setDescription("The rank of the player you want to unlock")
			.setRequired(false)
		) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		allowEffects: [Constants.EFFECT.SMILEY]
	},
	mainGuildCommand: false
};
