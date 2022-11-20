import {CacheType, CommandInteraction} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import Player from "../database/game/models/Player";
import {Translations} from "../Translations";
import {SmallEvent} from "./SmallEvent";
import {DraftBotReactionMessageBuilder} from "../messages/DraftBotReactionMessage";
import {DraftBotReaction} from "../messages/DraftBotReaction";
import {BlockingUtils} from "../utils/BlockingUtils";
import {BlockingConstants} from "../constants/BlockingConstants";
import {WitchEvents} from "../witch/WitchEvents";
import {SmallEventConstants} from "../constants/SmallEventConstants";
import {WitchEvent} from "../witch/WitchEvent";
import {Constants} from "../Constants";
import {RandomUtils} from "../utils/RandomUtils";
import {generateRandomPotion, giveItemToPlayer} from "../utils/ItemUtils";
import {InventorySlots} from "../database/game/models/InventorySlot";
import {GenericItemModel} from "../database/game/models/GenericItemModel";

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
async function givePotion(player: Player, potionToGive: GenericItemModel, language: string, interaction: CommandInteraction<CacheType>): Promise<void> {
	console.log(potionToGive.fr);
	await giveItemToPlayer(
		player,
		potionToGive,
		language,
		interaction.user,
		interaction.channel,
		await InventorySlots.getOfPlayer(player.id)
	);
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
				const reaction = witchEventMessage.getFirstReaction();
				// If the player did not react, we use the nothing happen event with the menu reaction deny
				const reactionEmoji = reaction ? reaction.emoji.name : Constants.MENU_REACTION.DENY;
				const selectedEvent = WitchEvents.getWitchEventByEmoji(reactionEmoji);

				const outcome = selectedEvent.generateOutcome();
				BlockingUtils.unblockPlayer(player.discordUserId, BlockingConstants.REASONS.WITCH_CHOOSE);
				// there is a 50 % chance that the player will get a no effect potion, no matter what he chose
				if (RandomUtils.draftbotRandom.bool()) {
					console.log("random force no effect");
					const potionToGive = await generateRandomPotion(Constants.ITEM_NATURE.NO_EFFECT);
					await givePotion(player, potionToGive, language, interaction);
					return;
				}

				if (outcome === SmallEventConstants.WITCH.OUTCOME_TYPE.NOTHING) {
					// nothing happen
					console.log("nothing happen");
				}

				if (outcome === SmallEventConstants.WITCH.OUTCOME_TYPE.POTION) {
					console.log("potion");
					const potionToGive = await selectedEvent.generatePotion();
					console.log("POTION À DONNER : ", potionToGive.fr);
					await givePotion(player, potionToGive, language, interaction);
				}

				if (outcome === SmallEventConstants.WITCH.OUTCOME_TYPE.EFFECT || selectedEvent.forceEffect) {
					await selectedEvent.giveEffect(player);
					console.log("EFFECT GIVEN");
				}

				if (outcome === SmallEventConstants.WITCH.OUTCOME_TYPE.HEALTH_LOSS) {
					await selectedEvent.removeLifePoints(interaction, player, language);
					console.log("HEALTH LOSS");
				}
			});
		const witchEvents = getRandomWitchEvents();
		let witchEventMenu = "";
		for (const witchEvent of Object.entries(witchEvents)) {
			embed.addReaction(new DraftBotReaction(witchEvent[1].getEmoji()));
			witchEventMenu += witchEvent[1].toString(language);
		}
		const intro = Translations.getModule("smallEventsIntros", language).getRandom("intro");
		const builtEmbed = embed.build();
		builtEmbed.formatAuthor(Translations.getModule("commands.report", language).get("journal"), interaction.user);
		builtEmbed.setDescription(
			seEmbed.data.description
			+ intro
			+ tr.getRandom("intro")
			+ witchEventMenu
		);
		await builtEmbed.editReply(interaction, (collector) => BlockingUtils.blockPlayerWithCollector(player.discordUserId, BlockingConstants.REASONS.WITCH_CHOOSE, collector));
	}
};