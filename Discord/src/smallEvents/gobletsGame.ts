import {ReactionCollectorCreationPacket} from "../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {PacketContext} from "../../../Lib/src/packets/DraftBotPacket";
import {DiscordCache} from "../bot/DiscordCache";
import {DraftbotSmallEventEmbed} from "../messages/DraftbotSmallEventEmbed";
import {getRandomSmallEventIntro} from "../packetHandlers/handlers/SmallEventsHandler";
import i18n from "../translations/i18n";
import {DraftBotIcons} from "../../../Lib/src/DraftBotIcons";
import {ButtonStyle} from "discord.js";
import {DraftbotInteraction} from "../messages/DraftbotInteraction";
import {DraftbotButtonReaction, DraftbotButtonReactionMessage} from "../messages/DraftbotButtonReactionMessage";

function getGobletsGameReactions(interaction: DraftbotInteraction) {
	const reactions: DraftbotButtonReaction[] = [];
	for (const [customId, emote] of Object.entries(DraftBotIcons.goblets)) {
		reactions.push({
			customId,
			emote,
			description: i18n.t(`smallEvents:gobletsGame.goblets.${customId}.description`, {
				lng: interaction.userLanguage,
			})
		});
	}
	return reactions;
}

export async function gobletsGameCollector(packet: ReactionCollectorCreationPacket, context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction)!;
	const lng = interaction.userLanguage;
	const reactions = getGobletsGameReactions(interaction);
	const embed = new DraftbotSmallEventEmbed(
		"gobletsGame",
		`${getRandomSmallEventIntro(lng)}${i18n.t("smallEvents:gobletsGame.intro", {lng})}`,
		interaction.user,
		lng
	);

	await new DraftbotButtonReactionMessage(interaction, {
		reactions,
		embed,
		packet,
		context,
		canEndReact: true
	}).send();
}