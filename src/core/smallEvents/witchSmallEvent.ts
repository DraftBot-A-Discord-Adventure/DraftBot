import {CommandInteraction} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import Player from "../database/game/models/Player";
import {TranslationModule, Translations} from "../Translations";
import {SmallEvent} from "./SmallEvent";
import {DraftBotReactionMessage, DraftBotReactionMessageBuilder} from "../messages/DraftBotReactionMessage";
import {DraftBotReaction} from "../messages/DraftBotReaction";
import {BlockingUtils} from "../utils/BlockingUtils";
import {BlockingConstants} from "../constants/BlockingConstants";
import {WitchEvents} from "../witch/WitchEvents";
import {SmallEventConstants} from "../constants/SmallEventConstants";
import {WitchEvent} from "../witch/WitchEvent";
import {Constants} from "../Constants";
import {RandomUtils} from "../utils/RandomUtils";
import {generateRandomItem, giveItemToPlayer} from "../utils/ItemUtils";
import {InventorySlots} from "../database/game/models/InventorySlot";
import {GenericItemModel} from "../database/game/models/GenericItemModel";
import {ItemConstants} from "../constants/ItemConstants";

type WitchEventSelection = { randomAdvice: WitchEvent, randomIngredient: WitchEvent, nothingHappen: WitchEvent };

/**
 * Returns an object composed of three random witch events
 */
function getRandomWitchEvents(): WitchEventSelection {
	const randomAdvice = WitchEvents.getRandomWitchEventByType(SmallEventConstants.WITCH.ACTION_TYPE.ADVICE);
	const randomIngredient = WitchEvents.getRandomWitchEventByType(SmallEventConstants.WITCH.ACTION_TYPE.INGREDIENT);
	const nothingHappen = WitchEvents.getRandomWitchEventByType(SmallEventConstants.WITCH.ACTION_TYPE.NOTHING);
	return {randomAdvice, randomIngredient, nothingHappen};
}

/**
 * Give a specific potion to a player
 * @param player
 * @param potionToGive
 * @param language
 * @param interaction
 */
async function givePotion(player: Player, potionToGive: GenericItemModel, language: string, interaction: CommandInteraction): Promise<void> {
	await giveItemToPlayer(
		player,
		potionToGive,
		language,
		interaction.user,
		interaction.channel,
		await InventorySlots.getOfPlayer(player.id)
	);
}

/**
 * Send a message containing all the information about what happened to the player
 * @param seEmbed
 * @param outcome
 * @param tr
 * @param selectedEvent
 * @param interaction
 */
async function sendResultMessage(seEmbed: DraftBotEmbed, outcome: number, tr: TranslationModule, selectedEvent: WitchEvent, interaction: CommandInteraction): Promise<void> {
	const resultString = selectedEvent.generateResultString(outcome, tr);
	seEmbed.setDescription(resultString);
	await interaction.channel.send({embeds: [seEmbed]});
}

/**
 * Execute the relevant action for the selected event and outcome
 * @param outcome
 * @param selectedEvent
 * @param player
 * @param language
 * @param interaction
 */
async function applyOutcome(outcome: number, selectedEvent: WitchEvent, player: Player, language: string, interaction: CommandInteraction): Promise<void> {
	if (selectedEvent.forceEffect || outcome === SmallEventConstants.WITCH.OUTCOME_TYPE.EFFECT) {
		await selectedEvent.giveEffect(player);
	}
	if (outcome === SmallEventConstants.WITCH.OUTCOME_TYPE.HEALTH_LOSS) {
		await selectedEvent.removeLifePoints(interaction, player, language);
	}
	if (outcome === SmallEventConstants.WITCH.OUTCOME_TYPE.POTION) {
		const potionToGive = await selectedEvent.generatePotion();
		await givePotion(player, potionToGive, language, interaction);
	}
}

/**
 * Get the selected event from the user's choice
 * @param witchEventMessage
 */
function retrieveSelectedEvent(witchEventMessage: DraftBotReactionMessage): WitchEvent {
	const reaction = witchEventMessage.getFirstReaction();
	// If the player did not react, we use the nothing happen event with the menu reaction deny
	const reactionEmoji = reaction ? reaction.emoji.name : Constants.MENU_REACTION.DENY;
	return WitchEvents.getWitchEventByEmoji(reactionEmoji);
}

/**
 * Get the menu to display to the player and add the reactions to the embed
 * @param witchEvents
 * @param embed
 * @param language
 */
function generateWitchEventMenu(witchEvents: WitchEventSelection, embed: DraftBotReactionMessageBuilder, language: string): string {
	let witchEventMenu = "";
	for (const witchEvent of Object.entries(witchEvents)) {
		embed.addReaction(new DraftBotReaction(witchEvent[1].getEmoji()));
		witchEventMenu += `${witchEvent[1].toString(language, false)}\n`;
	}
	return witchEventMenu;
}

/**
 * generate an embed with the menu and a short introduction to the witch
 * @param embed
 * @param language
 * @param interaction
 * @param seEmbed
 * @param tr
 */
function generateInitialEmbed(
	embed: DraftBotReactionMessageBuilder,
	language: string,
	interaction: CommandInteraction,
	seEmbed: DraftBotEmbed,
	tr: TranslationModule
): DraftBotReactionMessage {
	const witchEvents = getRandomWitchEvents();
	const witchEventMenu = generateWitchEventMenu(witchEvents, embed, language);
	const intro = Translations.getModule("smallEventsIntros", language).getRandom("intro");
	const builtEmbed = embed.build();
	builtEmbed.formatAuthor(Translations.getModule("commands.report", language).get("journal"), interaction.user);
	builtEmbed.setDescription(
		`${seEmbed.data.description
		+ intro
		+ tr.getRandom("intro")
		+ tr.getRandom("description")
		+ tr.getRandom("situation")}\n\n${witchEventMenu}`
	);
	return builtEmbed;
}

export const smallEvent: SmallEvent = {
	/**
	 * No restrictions on who can do it
	 */
	canBeExecuted(): Promise<boolean> {
		return Promise.resolve(true);
	},

	/**
	 * A small event about a witch that gives a random potion... sometimes
	 * @param interaction
	 * @param language
	 * @param player
	 * @param seEmbed
	 */
	async executeSmallEvent(interaction: CommandInteraction, language: string, player: Player, seEmbed: DraftBotEmbed): Promise<void> {
		const tr = Translations.getModule("smallEvents.witch", language);

		const embed = new DraftBotReactionMessageBuilder()
			.allowUser(interaction.user)
			.endCallback(async (witchEventMessage) => {

				const selectedEvent = retrieveSelectedEvent(witchEventMessage);
				const outcome = selectedEvent.generateOutcome();
				BlockingUtils.unblockPlayer(player.discordUserId, BlockingConstants.REASONS.WITCH_CHOOSE);

				// there is a chance that the player will get a no effect potion, no matter what he chose
				if (RandomUtils.draftbotRandom.bool(SmallEventConstants.WITCH.NO_EFFECT_CHANCE)) {
					await sendResultMessage(seEmbed, SmallEventConstants.WITCH.OUTCOME_TYPE.POTION, tr, selectedEvent, interaction);
					const potionToGive = await generateRandomItem(
						ItemConstants.CATEGORIES.POTION,
						null,
						null,
						Constants.ITEM_NATURE.NO_EFFECT
					);
					await givePotion(player, potionToGive, language, interaction);
					return;
				}

				await sendResultMessage(seEmbed, outcome, tr, selectedEvent, interaction);

				await applyOutcome(outcome, selectedEvent, player, language, interaction);

			});

		const builtEmbed = generateInitialEmbed(embed, language, interaction, seEmbed, tr);

		await builtEmbed.editReply(interaction, (collector) => BlockingUtils.blockPlayerWithCollector(player.discordUserId, BlockingConstants.REASONS.WITCH_CHOOSE, collector));
	}
};