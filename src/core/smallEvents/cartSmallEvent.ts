import {SmallEvent} from "./SmallEvent";
import {CommandInteraction} from "discord.js";
import Player from "../database/game/models/Player";
import {Maps} from "../maps/Maps";
import {RandomUtils} from "../utils/RandomUtils";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {SmallEventConstants} from "../constants/SmallEventConstants";
import {TranslationModule, Translations} from "../Translations";
import {DraftBotReactionMessage, DraftBotReactionMessageBuilder} from "../messages/DraftBotReactionMessage";
import {Constants} from "../Constants";
import {MapLink, MapLinks} from "../database/game/models/MapLink";
import {BlockingUtils} from "../utils/BlockingUtils";
import {BlockingConstants} from "../constants/BlockingConstants";
import {MapLocations} from "../database/game/models/MapLocation";
import {DraftBotReaction} from "../messages/DraftBotReaction";


/**
 * Generate an embed with the menu and a short introduction to the cart man
 * @param embed
 * @param interaction
 * @param seEmbed
 * @param cartObject
 * @param tr
 */
async function generateInitialEmbed(
	embed: DraftBotReactionMessageBuilder,
	interaction: CommandInteraction,
	seEmbed: DraftBotEmbed,
	cartObject: { player: Player, destination: MapLink, price: number, displayedDestination: MapLink },
	tr: TranslationModule
): Promise<DraftBotReactionMessage> {
	embed.addReaction(new DraftBotReaction(SmallEventConstants.CART.REACTIONS.ACCEPT));
	embed.addReaction(new DraftBotReaction(SmallEventConstants.CART.REACTIONS.REFUSE));
	let displayedDestinationString = tr.get("unknownDestination");
	if (cartObject.displayedDestination) {
		const mapLocationDestination = await MapLocations.getById(cartObject.displayedDestination.endMap);
		displayedDestinationString = mapLocationDestination.getDisplayName(tr.language);
	}

	const language = tr.language;
	const intro = Translations.getModule("smallEventsIntros", language).getRandom("intro");
	const builtEmbed = embed.build();
	builtEmbed.formatAuthor(Translations.getModule("commands.report", language).get("journal"), interaction.user);
	builtEmbed.setDescription(
		`${seEmbed.data.description
		+ intro
		+ tr.formatRandom("situation", {destination: displayedDestinationString, price: cartObject.price})
		+ tr.get("menu")}`
	);
	return builtEmbed;
}


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

		const destination = RandomUtils.draftbotRandom.pick(await MapLinks.getMapLinks(await MapLinks.getById(player.mapLinkId)));
		let price = SmallEventConstants.CART.TRANSPARENT_TP_PRICE, displayedDestination = destination;

		// 40% chance that the player knows where they will be teleported
		if (chance <= SmallEventConstants.CART.HIDDEN_TP_THRESHOLD && chance > SmallEventConstants.CART.TRANSPARENT_TP_THRESHOLD) {
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
			.allowEndReaction()
			.endCallback(async (acceptOrRefuseMenu) => {
				const reaction = acceptOrRefuseMenu.getFirstReaction();
				const reactionEmoji = !reaction ? Constants.REACTIONS.NOT_REPLIED_REACTION : reaction.emoji.name;
				if (reactionEmoji === Constants.REACTIONS.VALIDATE_REACTION) {
					// Player accepts the offer, teleport the player and debit the money
					if (player.money >= price) {
						player.money -= price;
						player.mapLinkId = destination.id;
						await player.save();
						seEmbed.setDescription(tr.get("travelAccepted"));
					}
					else {
						seEmbed.setDescription(tr.get("notEnoughMoney"));
					}
				}
				else {
					seEmbed.setDescription(tr.get("travelRefused"));
				}
				await interaction.editReply({embeds: [seEmbed]});
			});

		const cartObject = {player, destination, price, displayedDestination};
		const builtEmbed = await generateInitialEmbed(embed, interaction, seEmbed, cartObject, tr);
		await builtEmbed.reply(interaction, (collector) => BlockingUtils.blockPlayerWithCollector(player.discordUserId, BlockingConstants.REASONS.CART_CHOOSE, collector));
	}
};