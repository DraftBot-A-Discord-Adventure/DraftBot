import { PacketContext } from "../../../Lib/src/packets/DraftBotPacket";
import { DiscordCache } from "../bot/DiscordCache";
import { DraftbotSmallEventEmbed } from "../messages/DraftbotSmallEventEmbed";
import { StringUtils } from "../utils/StringUtils";

export async function infoFightResult(context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction);
	const lng = interaction!.userLanguage;
	const actionKey = StringUtils.getRandomTranslation("smallEvents:infoFight", lng);
	const descriptionKey = StringUtils.getRandomTranslation(`smallEvents:infoFight.${actionKey}`, lng);
	await interaction?.editReply({
		embeds: [
			new DraftbotSmallEventEmbed(
				"infoFight",
				StringUtils.getRandomTranslation(`smallEvents:infoFight.${actionKey}.${descriptionKey}.description`, lng),
				interaction.user,
				lng
			)
		]
	});
}
