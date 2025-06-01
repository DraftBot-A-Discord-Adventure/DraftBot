import { PacketContext } from "../../../Lib/src/packets/DraftBotPacket";
import { DiscordCache } from "../bot/DiscordCache";
import { DraftbotSmallEventEmbed } from "../messages/DraftbotSmallEventEmbed";
import { StringUtils } from "../utils/StringUtils";

export async function infosFightResult(context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction);
	const lng = interaction!.userLanguage;
	const actionKey = StringUtils.getRandomTranslation("smallEvents:infosFight", lng);
	const descriptionKey = StringUtils.getRandomTranslation(`smallEvents:infosFight.${actionKey}`, lng);
	await interaction?.editReply({
		embeds: [
			new DraftbotSmallEventEmbed(
				"infosFight",
				StringUtils.getRandomTranslation(`smallEvents:infosFight.${actionKey}.${descriptionKey}.description`, lng),
				interaction.user,
				lng
			)
		]
	});
}
