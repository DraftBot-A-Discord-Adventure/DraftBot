import {packetHandler} from "../PacketHandler";
import {WebSocket} from "ws";
import {PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {SmallEventAdvanceTimePacket} from "../../../../Lib/src/packets/smallEvents/SmallEventAdvanceTimePacket";
import {DiscordCache} from "../../bot/DiscordCache";
import {DraftbotSmallEventEmbed} from "../../messages/DraftbotSmallEventEmbed";
import {Language} from "../../../../Lib/src/Language";
import {StringUtils} from "../../utils/StringUtils";

function getRandomIntro(language: Language): string {
	return StringUtils.getRandomTranslation("smallEvents:intro", language);
}

export default class SmallEventsHandler {
	@packetHandler(SmallEventAdvanceTimePacket)
	async smallEventAdvanceTime(socket: WebSocket, packet: SmallEventAdvanceTimePacket, context: PacketContext): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		if (interaction) {
			const description = getRandomIntro(interaction.userLanguage) + StringUtils.getRandomTranslation("smallEvents:advanceTime.stories", interaction.userLanguage, { time: packet.amount });
			await interaction.editReply({ embeds: [new DraftbotSmallEventEmbed("advanceTime", description)]});
		}
	}
}