import { PacketContext } from "../../../Lib/src/packets/DraftBotPacket";
import { DiscordCache } from "../bot/DiscordCache";
import { ReactionCollectorCreationPacket } from "../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import { DraftBotEmbed } from "../messages/DraftBotEmbed";
import {
	DiscordCollectorUtils, SEND_POLITICS
} from "../utils/DiscordCollectorUtils";
import i18n from "../translations/i18n";
import { DisplayUtils } from "../utils/DisplayUtils";
import {
	ReactionCollectorItemChoiceItemReaction, ReactionCollectorItemChoiceRefuseReaction
} from "../../../Lib/src/packets/interaction/ReactionCollectorItemChoice";
import { ReactionCollectorItemAcceptData } from "../../../Lib/src/packets/interaction/ReactionCollectorItemAccept";
import { ItemCategory } from "../../../Lib/src/constants/ItemConstants";
import { ReactionCollectorReturnTypeOrNull } from "../packetHandlers/handlers/ReactionCollectorHandlers";

export async function itemChoiceCollector(context: PacketContext, packet: ReactionCollectorCreationPacket): Promise<ReactionCollectorReturnTypeOrNull> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction)!;
	const lng = interaction.userLanguage;
	const embed = new DraftBotEmbed();
	embed.formatAuthor(i18n.t("commands:inventory.chooseItemToReplaceTitle", { lng }), interaction.user);

	return await DiscordCollectorUtils.createChoiceListCollector(interaction, {
		packet,
		context
	}, {
		embed,
		items: packet.reactions.filter(reaction => reaction.type === ReactionCollectorItemChoiceItemReaction.name)
			.map(reaction => {
				const itemReaction = reaction.data as ReactionCollectorItemChoiceItemReaction;
				return DisplayUtils.getItemDisplayWithStats(itemReaction.itemWithDetails, lng);
			})
	}, {
		refuse: {
			can: true,
			reactionIndex: packet.reactions.findIndex(reaction => reaction.type === ReactionCollectorItemChoiceRefuseReaction.name)
		},
		sendManners: SEND_POLITICS.ALWAYS_SEND
	});
}

export async function itemAcceptCollector(context: PacketContext, packet: ReactionCollectorCreationPacket): Promise<ReactionCollectorReturnTypeOrNull> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction)!;
	const data = packet.data.data as ReactionCollectorItemAcceptData;
	const lng = interaction.userLanguage;

	const embed = new DraftBotEmbed()
		.formatAuthor(
			data.itemWithDetails.category === ItemCategory.POTION
				? i18n.t("commands:inventory.randomItemFooterPotion", { lng })
				: i18n.t("commands:inventory.randomItemFooter", { lng }),
			interaction.user
		)
		.setDescription(DisplayUtils.getItemDisplayWithStats(data.itemWithDetails, lng));

	return await DiscordCollectorUtils.createAcceptRefuseCollector(interaction, embed, packet, context);
}
