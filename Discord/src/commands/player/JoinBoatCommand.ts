import {PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {ReactionCollectorCreationPacket} from "../../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {DiscordCache} from "../../bot/DiscordCache";
import {
	ReactionCollectorJoinBoatData
} from "../../../../Lib/src/packets/interaction/ReactionCollectorJoinBoat";
import {DraftBotEmbed} from "../../messages/DraftBotEmbed";
import i18n from "../../translations/i18n";
import {DiscordCollectorUtils} from "../../utils/DiscordCollectorUtils";
import {ReactionCollectorReturnType} from "../../packetHandlers/handlers/ReactionCollectorHandlers";

export async function createJoinBoatCollector(context: PacketContext, packet: ReactionCollectorCreationPacket): Promise<ReactionCollectorReturnType> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction)!;
	await interaction.deferReply();
	const data = packet.data.data as ReactionCollectorJoinBoatData;
	const embed = new DraftBotEmbed().formatAuthor(i18n.t("commands:joinBoat.confirmationMessage.title.confirmation", {
		lng: interaction.userLanguage,
		pseudo: interaction.user.displayName
	}), interaction.user)
		.setDescription(
			i18n.t("commands:joinBoat.confirmationMessage.description.confirmation.text", {
				lng: interaction.userLanguage,
				currentEnergy: data.energy.current,
				maxEnergy: data.energy.max,
				priceText: i18n.t("commands:joinBoat.confirmationMessage.description.confirmation.priceText", {
					lng: interaction.userLanguage,
					count: data.price,
					gemCost: data.price
				})
			})
		);

	return await DiscordCollectorUtils.createAcceptRefuseCollector(interaction, embed, packet, context);
}