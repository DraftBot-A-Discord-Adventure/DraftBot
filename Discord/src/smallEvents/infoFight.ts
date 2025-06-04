import { PacketContext } from "../../../Lib/src/packets/DraftBotPacket";
import { DiscordCache } from "../bot/DiscordCache";
import { DraftbotSmallEventEmbed } from "../messages/DraftbotSmallEventEmbed";
import { StringUtils } from "../utils/StringUtils";

export async function infoFightResult(context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction);
	const lng = interaction!.userLanguage;
	const intro = StringUtils.getRandomTranslation("smallEvents:infoFight.intro", lng);
	const description = StringUtils.getRandomTranslation("smallEvents:infoFight.fightActions", lng);
	await interaction?.editReply({
		embeds: [
			new DraftbotSmallEventEmbed(
				"infoFight",
				intro + description,
				interaction.user,
				lng
			)
		]
	});
}
