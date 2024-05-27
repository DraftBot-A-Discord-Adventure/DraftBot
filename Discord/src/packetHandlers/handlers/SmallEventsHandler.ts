import {packetHandler} from "../PacketHandler";
import {WebSocket} from "ws";
import {PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {SmallEventAdvanceTimePacket} from "../../../../Lib/src/packets/smallEvents/SmallEventAdvanceTimePacket";
import {DiscordCache} from "../../bot/DiscordCache";
import {DraftbotSmallEventEmbed} from "../../messages/DraftbotSmallEventEmbed";
import i18n from "../../translations/i18n";
import {Language} from "../../../../Lib/src/Language";

function getRandomSmallEventText(tr: string, language: Language, replacements: { [key: string]: unknown } = {}): string {
	const intros: string[] = i18n.t(tr, { returnObjects: true, lng: language, ...replacements });
	return intros[Math.floor(Math.random() * intros.length)];
}

function getRandomIntro(language: Language): string {
	return getRandomSmallEventText("smallEvents:intro", language);
}

export default class SmallEventsHandler {
	@packetHandler(SmallEventAdvanceTimePacket)
	async smallEventAdvanceTime(socket: WebSocket, packet: SmallEventAdvanceTimePacket, context: PacketContext): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		if (interaction) {
			const description = getRandomIntro(interaction.userLanguage) + getRandomSmallEventText("smallEvents:advanceTime.stories", interaction.userLanguage, { time: packet.amount });
			await interaction.editReply({ embeds: [new DraftbotSmallEventEmbed("advanceTime", description)]});
		}
	}
}