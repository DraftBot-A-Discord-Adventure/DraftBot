import {packetHandler} from "../PacketHandler";
import {WebSocket} from "ws";
import {PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {SmallEventAdvanceTimePacket} from "../../../../Lib/src/packets/smallEvents/SmallEventAdvanceTimePacket";
import {DiscordCache} from "../../bot/DiscordCache";
import {DraftbotSmallEventEmbed} from "../../messages/DraftbotSmallEventEmbed";
import {Language} from "../../../../Lib/src/Language";
import {StringUtils} from "../../utils/StringUtils";
import {SmallEventBigBadPacket} from "../../../../Lib/src/packets/smallEvents/SmallEventBigBadPacket";
import {SmallEventBigBadKind} from "../../../../Lib/src/enums/SmallEventBigBadKind";
import i18n from "../../translations/i18n";
import {DraftBotIcons} from "../../../../Lib/src/DraftBotIcons";

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

	@packetHandler(SmallEventBigBadPacket)
	async smallEventBigBad(socket: WebSocket, packet: SmallEventBigBadPacket, context: PacketContext): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		if (interaction) {
			let story: string;
			switch (packet.kind) {
			case SmallEventBigBadKind.LIFE_LOSS:
				story = StringUtils.getRandomTranslation("smallEvents:bigBad.lifeLoss", interaction.userLanguage, { lifeLoss: packet.lifeLost });
				break;
			case SmallEventBigBadKind.ALTERATION:
				story = `${i18n.t(`smallEvents:bigBad.alterationStories.${packet.receivedStory}`, {lng: interaction.userLanguage})} ${DraftBotIcons.effects[packet.effectId!]}`;
				break;
			case SmallEventBigBadKind.MONEY_LOSS:
				story = StringUtils.getRandomTranslation("smallEvents:bigBad.moneyLoss", interaction.userLanguage, { moneyLost: packet.moneyLost });
				break;
			default:
				story = "";
			}

			const description = getRandomIntro(interaction.userLanguage) + story;
			await interaction.editReply({ embeds: [new DraftbotSmallEventEmbed("bigBad", description)]});
		}
	}
}