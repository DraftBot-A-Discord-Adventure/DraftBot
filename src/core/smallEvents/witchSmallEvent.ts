import {CommandInteraction} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import Player from "../database/game/models/Player";
import {Translations} from "../Translations";
import {SmallEvent} from "./SmallEvent";
import {DraftBotReactionMessageBuilder} from "../messages/DraftBotReactionMessage";
import {generateRandomPotion} from "../utils/ItemUtils";
import {RandomUtils} from "../utils/RandomUtils";
import {Constants} from "../Constants";
import {NumberChangeReason} from "../constants/LogsConstants";
import {TravelTime} from "../maps/TravelTime";
import {EffectsConstants} from "../constants/EffectsConstants";
import {DraftBotReaction} from "../messages/DraftBotReaction";
import {BlockingUtils} from "../utils/BlockingUtils";
import {BlockingConstants} from "../constants/BlockingConstants";


export const smallEvent: SmallEvent = {
	/**
	 * No restrictions on who can do it
	 */
	canBeExecuted(): Promise<boolean> {
		return Promise.resolve(true);
	},

	/**
	 * Do literally nothing, just shows the player he is doing its way
	 * @param interaction
	 * @param language
	 * @param player
	 * @param seEmbed
	 */
	async executeSmallEvent(interaction: CommandInteraction, language: string, player: Player, seEmbed: DraftBotEmbed): Promise<void> {
		const tr = Translations.getModule("smallEvents.witch", language);

		const embed = new DraftBotReactionMessageBuilder()
			.allowUser(interaction.user)
			.endCallback(async (chooseGobletMessage) => {
				const reaction = chooseGobletMessage.getFirstReaction();
				const reactionEmoji = reaction ? reaction.emoji.name : "🔚";
				if (!reaction || reaction.emoji.name === "") { // manque la réac
					if (RandomUtils.draftbotRandom.bool(0.15)) {
						// loose life
						if (RandomUtils.draftbotRandom.bool()) {
							await player.addHealth(-RandomUtils.randInt(3, 8),
								interaction.channel,
								language,
								NumberChangeReason.SMALL_EVENT);
						}
						else {
							await TravelTime.applyEffect(player,
								EffectsConstants.EMOJI_TEXT.OCCUPIED,
								RandomUtils.randInt(15, 31),
								interaction.createdAt,
								NumberChangeReason.SMALL_EVENT,
								interaction.createdAt);
						}
					}
					else {
						// potion sans effet
						await generateRandomPotion(Constants.ITEM_NATURE.NO_EFFECT);
					}
				}
				else if (RandomUtils.draftbotRandom.bool()) {
					// The witch is good
					await generateRandomPotion(
						RandomUtils.draftbotRandom.bool() ? Constants.ITEM_NATURE.HEALTH : Constants.ITEM_NATURE.TIME_SPEEDUP,
						Constants.RARITY.RARE);
				}
				else {
					// The witch is bad
					await generateRandomPotion(Constants.ITEM_NATURE.NO_EFFECT);
				}
			});

		const intro = Translations.getModule("smallEventsIntros", language).getRandom("intro");
		embed.addReaction(new DraftBotReaction(gobletEmoji));
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