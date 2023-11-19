import {SmallEvent} from "./SmallEvent";
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
import {DraftbotInteraction} from "../messages/DraftbotInteraction";
import {draftBotInstance} from "../bot";


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
	interaction: DraftbotInteraction,
	seEmbed: DraftBotEmbed,
	cartObject: { player: Player, destination: MapLink, price: number, displayedDestination: MapLink },
	tr: TranslationModule
): Promise<DraftBotReactionMessage> {
	embed.addReaction(new DraftBotReaction(SmallEventConstants.CART.REACTIONS.ACCEPT));
	embed.addReaction(new DraftBotReaction(SmallEventConstants.CART.REACTIONS.REFUSE));
	let displayedDestinationString = "";
	if (cartObject.displayedDestination) {
		const mapLocationDestination = await MapLocations.getById(cartObject.displayedDestination.endMap);
		displayedDestinationString = mapLocationDestination.getDisplayName(tr.language);
	}

	const language = tr.language;
	const intro = Translations.getModule("smallEventsIntros", language).getRandom("intro");
	const builtEmbed = embed.build();
	const situation = cartObject.displayedDestination
		? tr.formatRandom("knownDestination", {destination: displayedDestinationString, price: cartObject.price})
		: tr.formatRandom("unknownDestination", {price: cartObject.price});
	builtEmbed.formatAuthor(Translations.getModule("commands.report", language).get("journal"), interaction.user);
	builtEmbed.setDescription(
		`${seEmbed.data.description
		+ intro
		+ situation
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
	async executeSmallEvent(interaction: DraftbotInteraction, language: string, player: Player, seEmbed: DraftBotEmbed): Promise<void> {
		const tr = Translations.getModule("smallEvents.cart", language);
		const chance = RandomUtils.draftbotRandom.realZeroToOneInclusive();

		const destination = await MapLinks.generateRandomMapLinkDifferentOfCurrent(player.mapLinkId);
		let price = SmallEventConstants.CART.TRANSPARENT_TP_PRICE, displayedDestination = destination;

		// 40% chance that the player knows where they will be teleported
		if (chance <= SmallEventConstants.CART.HIDDEN_TP_THRESHOLD && chance > SmallEventConstants.CART.TRANSPARENT_TP_THRESHOLD) {
			// 50% chance that the player doesn't know where they will be teleported
			displayedDestination = null;
			price = SmallEventConstants.CART.HIDDEN_TP_PRICE;
		}
		else if (chance <= SmallEventConstants.CART.SCAM_THRESHOLD) {
			// 5% chance that the NPC lied about the destination but offers the trip for cheap
			displayedDestination = await MapLinks.generateRandomMapLinkDifferentOfCurrent(player.mapLinkId);
			price = SmallEventConstants.CART.SCAM_TP_PRICE;
		}
		else {
			// 5% chance that the trip is just cheap
			displayedDestination = destination;
			price = SmallEventConstants.CART.SCAM_TP_PRICE;
		}

		// Apply the RANDOM_PRICE_BONUS
		price = Math.round(price * (1 + RandomUtils.draftbotRandom.realZeroToOneInclusive() * SmallEventConstants.CART.RANDOM_PRICE_BONUS));

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
						await draftBotInstance.logsDatabase.logTeleportation(player.discordUserId, player.mapLinkId, destination.id);
						player.mapLinkId = destination.id;
						await player.save();
						if (!displayedDestination) {
							seEmbed.setDescription(tr.getRandom("unknownDestinationTravelDone"));
						}
						else if ( destination.id !== displayedDestination.id) {
							seEmbed.setDescription(tr.getRandom("scamTravelDone"));
						}
						else {
							seEmbed.setDescription(tr.getRandom("normalTravelDone"));
						}
					}
					else {
						seEmbed.setDescription(tr.getRandom("notEnoughMoney"));
					}
				}
				else {
					seEmbed.setDescription(tr.getRandom("travelRefused"));
				}
				await interaction.channel.send({embeds: [seEmbed]});
			});

		const cartObject = {player, destination, price, displayedDestination};
		const builtEmbed = await generateInitialEmbed(embed, interaction, seEmbed, cartObject, tr);
		await builtEmbed.editReply(interaction, (collector) => BlockingUtils.blockPlayerWithCollector(player.discordUserId, BlockingConstants.REASONS.CART_CHOOSE, collector));
	}
};