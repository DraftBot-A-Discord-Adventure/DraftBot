import {packetHandler} from "../PacketHandler";
import {WebSocket} from "ws";
import {PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {SmallEventAdvanceTimePacket} from "../../../../Lib/src/packets/smallEvents/SmallEventAdvanceTimePacket";
import {DiscordCache} from "../../bot/DiscordCache";
import {DraftbotSmallEventEmbed} from "../../messages/DraftbotSmallEventEmbed";
import i18n from "../../translations/i18n";
import {Language} from "../../../../Lib/src/Language";

function getRandomIntro(language: Language): string {
	const intros: string[] = i18n.t("smallEvents:intro", { returnObjects: true, lng: language });
	return intros[Math.floor(Math.random() * intros.length)];
}

export default class SmallEventsHandler {
	@packetHandler(SmallEventAdvanceTimePacket)
	async smallEventAdvanceTime(socket: WebSocket, packet: SmallEventAdvanceTimePacket, context: PacketContext): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		if (interaction) {
			const description = getRandomIntro(interaction.userLanguage) + 
			await interaction.editReply({ embeds: [new DraftbotSmallEventEmbed("advanceTime", description)]});
		}
	}
}