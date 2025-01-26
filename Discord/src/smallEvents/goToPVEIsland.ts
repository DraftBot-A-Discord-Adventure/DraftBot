import {ReactionCollectorCreationPacket} from "../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {PacketContext} from "../../../Lib/src/packets/DraftBotPacket";
import {DiscordCache} from "../bot/DiscordCache";
import { ReactionCollectorGoToPVEIslandData } from "../../../Lib/src/packets/interaction/ReactionCollectorGoToPVEIsland";
import i18n from "../translations/i18n";
import {DraftbotSmallEventEmbed} from "../messages/DraftbotSmallEventEmbed";
import {getRandomSmallEventIntro} from "../packetHandlers/handlers/SmallEventsHandler";
import {StringUtils} from "../utils/StringUtils";
import {DiscordCollectorUtils} from "../utils/DiscordCollectorUtils";

export async function goToPVEIslandCollector(context: PacketContext, packet: ReactionCollectorCreationPacket): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction)!;
	const data = packet.data.data as ReactionCollectorGoToPVEIslandData;

	const embed = new DraftbotSmallEventEmbed(
		"goToPVEIsland",
		getRandomSmallEventIntro(interaction.userLanguage)
		+ StringUtils.getRandomTranslation(
			"smallEvents:goToPVEIsland.stories",
			interaction.userLanguage,
			{
				priceText: data.price === 0
					? i18n.t("smallEvents:goToPVEIsland.priceFree", { lng: interaction.userLanguage })
					: i18n.t("smallEvents:goToPVEIsland.priceMoney", { lng: interaction.userLanguage, price: data.price })
			}
		)
		+ "\n\n"
		+ i18n.t("smallEvents:goToPVEIsland.confirm", {
			lng: interaction.userLanguage,
			fightPoints: data.energy.current,
			fightPointsMax: data.energy.max
		}),
		interaction.user,
		interaction.userLanguage
	);

	await DiscordCollectorUtils.createAcceptRefuseCollector(interaction, embed, packet, context);
}