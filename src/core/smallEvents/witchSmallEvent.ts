import {CommandInteraction} from "discord.js";
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

type WitchEventSelection = { randomAdvice: WitchEvent, randomIngredient: WitchEvent, nothingHappen: WitchEvent };

/**
 * Returns an object composed of three random witch events
 */
function getRandomWitchEvents() : WitchEventSelection {
	const randomAdvice = WitchEvents.getRandomWitchEventByType(SmallEventConstants.WITCH.ACTION_TYPE.ADVICE);
	const randomIngredient = WitchEvents.getRandomWitchEventByType(SmallEventConstants.WITCH.ACTION_TYPE.INGREDIENT);
	const nothingHappen = WitchEvents.getRandomWitchEventByType(SmallEventConstants.WITCH.ACTION_TYPE.NOTHING);
	return {randomAdvice,randomIngredient,nothingHappen};
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
				const reactionEmoji = reaction ? reaction.emoji.name : "🔚";
				await Promise.resolve();
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