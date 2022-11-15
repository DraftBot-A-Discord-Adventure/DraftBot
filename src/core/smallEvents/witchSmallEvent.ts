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

		const intro = Translations.getModule("smallEventsIntros", language).getRandom("intro");
		let types = [SmallEventConstants.WITCH.ACTION_TYPE];
		types.forEach((type) => {
			console.log(type);
		});
		return;
		const randomAdvice = WitchEvents.getRandomWitchEventByType(0);
		const randomIngredient = WitchEvents.getRandomWitchEventByType(1);
		const nothingHappen = WitchEvents.getRandomWitchEventByType(2);
		embed.addReaction(new DraftBotReaction(randomAdvice.getEmoji()));
		embed.addReaction(new DraftBotReaction(randomIngredient.getEmoji()));
		embed.addReaction(new DraftBotReaction(nothingHappen.getEmoji()));
		const builtEmbed = embed.build();
		builtEmbed.formatAuthor(Translations.getModule("commands.report", language).get("journal"), interaction.user);
		builtEmbed.setDescription(
			seEmbed.data.description
			+ intro
			+ tr.getRandom("intro.intrigue")
		);
		await builtEmbed.editReply(interaction, (collector) => BlockingUtils.blockPlayerWithCollector(player.discordUserId, BlockingConstants.REASONS.GOBLET_CHOOSE, collector));
	}
};