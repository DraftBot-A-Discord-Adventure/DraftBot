import {SmallEvent} from "./SmallEvent";
import {CommandInteraction} from "discord.js";
import Player from "../database/game/models/Player";
import {Maps} from "../maps/Maps";
import {RandomUtils} from "../utils/RandomUtils";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {SmallEventConstants} from "../constants/SmallEventConstants";
import {Translations} from "../Translations";
import {DraftBotReactionMessageBuilder} from "../messages/DraftBotReactionMessage";
import {Constants} from "../Constants";
import {MapLinks} from "../database/game/models/MapLink";

export const smallEvent: SmallEvent = {
	/**
	 * Check if small event can be executed
	 */
	canBeExecuted(player: Player): Promise<boolean> {
		return Promise.resolve(Maps.isOnContinent(player));
	},

	/**
	 * Execute the small event
	 * @param interaction
	 * @param language
	 * @param player
	 * @param seEmbed
	 */
	async executeSmallEvent(interaction: CommandInteraction, language: string, player: Player, seEmbed: DraftBotEmbed): Promise<void> {
		const tr = Translations.getModule("smallEvents.cart", language);
		const chance = RandomUtils.draftbotRandom.realZeroToOneInclusive();

		let destination, price, displayedDestination; // Determined randomly depending on the chance
		destination = RandomUtils.draftbotRandom.pick(await MapLinks.getMapLinks(await MapLinks.getById(player.mapLinkId)));
		if (chance <= SmallEventConstants.CART.TRANSPARENT_TP_THRESHOLD) {
			// 40% chance that the player knows where they will be teleported
			displayedDestination = destination;
			price = SmallEventConstants.CART.TRANSPARENT_TP_PRICE;
		}
		else if (chance <= SmallEventConstants.CART.HIDDEN_TP_THRESHOLD) {
			// 50% chance that the player doesn't know where they will be teleported
			displayedDestination = null;
			price = SmallEventConstants.CART.HIDDEN_TP_PRICE;
		}
		else if (chance <= SmallEventConstants.CART.SCAM_THRESHOLD) {
			// 5% chance that the NPC lied about the destination but offers the trip for cheap
			displayedDestination = RandomUtils.draftbotRandom.pick(await MapLinks.getMapLinks(await MapLinks.getById(player.mapLinkId)));
			price = SmallEventConstants.CART.SCAM_TP_PRICE;
		}
		else {
			// 5% chance that the trip is just cheap
			displayedDestination = destination;
			price = SmallEventConstants.CART.SCAM_TP_PRICE;
		}

		const embed = new DraftBotReactionMessageBuilder()
			.allowUser(interaction.user)
			.endCallback(async (acceptOrRefuseMenu) => {
				const reaction = acceptOrRefuseMenu.getFirstReaction();
				const reactionEmoji = !reaction ? Constants.REACTIONS.NOT_REPLIED_REACTION : reaction.emoji.name;

			});
		const intro = Translations.getModule("smallEventsIntros", language).getRandom("intro");
	}
};