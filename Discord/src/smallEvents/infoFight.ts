import { PacketContext } from "../../../Lib/src/packets/DraftBotPacket";
import { DiscordCache } from "../bot/DiscordCache";
import { DraftbotSmallEventEmbed } from "../messages/DraftbotSmallEventEmbed";
import { StringUtils } from "../utils/StringUtils";
import { RandomUtils } from "../../../Lib/src/utils/RandomUtils";

export async function infoFightResult(context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction);
	const lng = interaction!.userLanguage;
	const intro = StringUtils.getRandomTranslation("smallEvents:infoFight.intro", lng);
	const typeOfActionExplained = RandomUtils.draftbotRandom.pick(["fightActions"]);
	const description = StringUtils.getRandomTranslation(`smallEvents:infoFight.${typeOfActionExplained}`, lng);
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
