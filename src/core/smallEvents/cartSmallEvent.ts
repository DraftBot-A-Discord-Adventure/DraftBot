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
import {NumberChangeReason} from "../constants/LogsConstants";


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


async function generateRandomMapLinkDifferentOfCurrent(player: Player) {
	let destination = await MapLinks.getRandomLink();
	if (destination.id === player.mapLinkId) { // If the player is already on the destination, get the inverse link
		destination = await MapLinks.getInverseLinkOf(player.mapLinkId);
	}
	return destination;
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

		const destination = await generateRandomMapLinkDifferentOfCurrent(player);
		let price = SmallEventConstants.CART.TRANSPARENT_TP_PRICE, displayedDestination = destination;

		// 40% chance that the player knows where they will be teleported
		if (chance <= SmallEventConstants.CART.HIDDEN_TP_THRESHOLD && chance > SmallEventConstants.CART.TRANSPARENT_TP_THRESHOLD) {
			// 50% chance that the player doesn't know where they will be teleported
			displayedDestination = null;
			price = SmallEventConstants.CART.HIDDEN_TP_PRICE;
		}
		else if (chance <= SmallEventConstants.CART.SCAM_THRESHOLD) {
			// 5% chance that the NPC lied about the destination but offers the trip for cheap
			displayedDestination = await generateRandomMapLinkDifferentOfCurrent(player);
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
				BlockingUtils.unblockPlayer(player.discordUserId, BlockingConstants.REASONS.CART_CHOOSE);
				const reaction = acceptOrRefuseMenu.getFirstReaction();
				const reactionEmoji = !reaction ? Constants.REACTIONS.NOT_REPLIED_REACTION : reaction.emoji.name;
				if (reactionEmoji === SmallEventConstants.CART.REACTIONS.ACCEPT) {
					// Player accepts the offer, teleport the player and debit the money
					if (player.money >= price) {
						await player.spendMoney({
							amount: price,
							channel: interaction.channel,
							language: tr.language,
							reason: NumberChangeReason.SMALL_EVENT
						});
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
				await interaction.channel.send({embeds: [seEmbed]});
			});

		const cartObject = {player, destination, price, displayedDestination};
		const builtEmbed = await generateInitialEmbed(embed, interaction, seEmbed, cartObject, tr);
		await builtEmbed.editReply(interaction, (collector) => BlockingUtils.blockPlayerWithCollector(player.discordUserId, BlockingConstants.REASONS.CART_CHOOSE, collector));
	}
};