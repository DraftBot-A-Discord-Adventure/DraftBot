import {PacketContext} from "../../../Lib/src/packets/DraftBotPacket";
import {DiscordCache} from "../bot/DiscordCache";
import {ReactionCollectorCreationPacket} from "../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {DiscordCollectorUtils} from "../utils/DiscordCollectorUtils";
import i18n from "../translations/i18n";
import {DisplayUtils} from "../utils/DisplayUtils";
import {
	ReactionCollectorItemChoiceItemReaction
} from "../../../Lib/src/packets/interaction/ReactionCollectorItemChoice";
import {
	ReactionCollectorItemAcceptData
} from "../../../Lib/src/packets/interaction/ReactionCollectorItemAccept";
import {ItemCategory} from "../../../Lib/src/constants/ItemConstants";

export async function itemChoiceCollector(packet: ReactionCollectorCreationPacket, context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction)!;

	const embed = new DraftBotEmbed();
	embed.formatAuthor(i18n.t("commands:inventory.chooseItemToReplaceTitle", {
		lng: interaction.userLanguage
	}), interaction.user);

	await DiscordCollectorUtils.createChoiceListCollector(
		interaction,
		embed,
		packet,
		context,
		packet.reactions.filter(reaction => reaction.type === ReactionCollectorItemChoiceItemReaction.name).map((reaction) => {
			const itemReaction = reaction.data as ReactionCollectorItemChoiceItemReaction;
			return DisplayUtils.getItemDisplayWithStats(itemReaction.itemWithDetails, interaction.userLanguage);
		}),
		true
	);
}

export async function itemAcceptCollector(packet: ReactionCollectorCreationPacket, context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction)!;
	const data = packet.data.data as ReactionCollectorItemAcceptData;

	const embed = new DraftBotEmbed()
		.formatAuthor(
			data.itemWithDetails.category === ItemCategory.POTION
				? i18n.t("commands:inventory.randomItemFooterPotion", { lng: interaction.userLanguage })
				: i18n.t("commands:inventory.randomItemFooter", { lng: interaction.userLanguage }),
			interaction.user
		)
		.setDescription(DisplayUtils.getItemDisplayWithStats(data.itemWithDetails, interaction.userLanguage));

	await DiscordCollectorUtils.createAcceptRefuseCollector(interaction, embed, packet, context);
}