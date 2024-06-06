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
import {SmallEventBoatAdvicePacket} from "../../../../Lib/src/packets/smallEvents/SmallEventBoatAdvicePacket";
import {
	SmallEventGoToPVEIslandAcceptPacket, SmallEventGoToPVEIslandNotEnoughGemsPacket,
	SmallEventGoToPVEIslandRefusePacket
} from "../../../../Lib/src/packets/smallEvents/SmallEventGoToPVEIslandPacket";
import {KeycloakUtils} from "../../../../Lib/src/keycloak/KeycloakUtils";
import {keycloakConfig} from "../../bot/DraftBotShard";

export function getRandomSmallEventIntro(language: Language): string {
	return StringUtils.getRandomTranslation("smallEvents:intro", language);
}

export default class SmallEventsHandler {
	@packetHandler(SmallEventAdvanceTimePacket)
	async smallEventAdvanceTime(socket: WebSocket, packet: SmallEventAdvanceTimePacket, context: PacketContext): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		if (interaction) {
			const description = getRandomSmallEventIntro(interaction.userLanguage) + StringUtils.getRandomTranslation("smallEvents:advanceTime.stories", interaction.userLanguage, { time: packet.amount });
			await interaction.editReply({ embeds: [new DraftbotSmallEventEmbed("advanceTime", description, interaction.user, interaction.userLanguage)]});
		}
	}

	@packetHandler(SmallEventBigBadPacket)
	async smallEventBigBad(socket: WebSocket, packet: SmallEventBigBadPacket, context: PacketContext): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		if (interaction) {
			let story: string;
			switch (packet.kind) {
			case SmallEventBigBadKind.LIFE_LOSS:
				story = StringUtils.getRandomTranslation("smallEvents:bigBad.lifeLoss", interaction.userLanguage, {lifeLoss: packet.lifeLost});
				break;
			case SmallEventBigBadKind.ALTERATION:
				story = `${i18n.t(`smallEvents:bigBad.alterationStories.${packet.receivedStory}`, {lng: interaction.userLanguage})} ${DraftBotIcons.effects[packet.effectId!]}`;
				break;
			case SmallEventBigBadKind.MONEY_LOSS:
				story = StringUtils.getRandomTranslation("smallEvents:bigBad.moneyLoss", interaction.userLanguage, {moneyLost: packet.moneyLost});
				break;
			default:
				story = "";
			}

			const description = getRandomSmallEventIntro(interaction.userLanguage) + story;
			await interaction.editReply({embeds: [new DraftbotSmallEventEmbed("bigBad", description, interaction.user, interaction.userLanguage)]});
		}
	}

	@packetHandler(SmallEventBoatAdvicePacket)
	async smallEventBoatAdvice(socket: WebSocket, packet: SmallEventBoatAdvicePacket, context: PacketContext): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		if (interaction) {
			const description = StringUtils.getRandomTranslation(
				"smallEvents:boatAdvice.intro",
				interaction.userLanguage,
				{ advice: StringUtils.getRandomTranslation("smallEvents:boatAdvice.advices", interaction.userLanguage) }
			);
			await interaction.editReply({ embeds: [new DraftbotSmallEventEmbed("boatAdvice", description, interaction.user, interaction.userLanguage)]});
		}
	}

	@packetHandler(SmallEventGoToPVEIslandAcceptPacket)
	async smallEventGoToPVEIslandAccept(socket: WebSocket, packet: SmallEventGoToPVEIslandAcceptPacket, context: PacketContext): Promise<void> {
		const user = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, context.keycloakId!))!;
		const interaction = DiscordCache.getButtonInteraction(context.discord!.buttonInteraction!);
		if (interaction) {
			await interaction.editReply({ embeds: [
				new DraftbotSmallEventEmbed(
					"goToPVEIsland",
					i18n.t(
						packet.alone
							? "smallEvents:goToPVEIsland.endStoryAccept"
							: "smallEvents:goToPVEIsland.endStoryAcceptWithMember",
						{ lng: user.attributes.language[0] }
					),
					interaction.user,
					user.attributes.language[0]
				)]});
		}
	}

	@packetHandler(SmallEventGoToPVEIslandRefusePacket)
	async smallEventGoToPVEIslandRefuse(socket: WebSocket, packet: SmallEventGoToPVEIslandRefusePacket, context: PacketContext): Promise<void> {
		const user = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, context.keycloakId!))!;
		const interaction = DiscordCache.getButtonInteraction(context.discord!.buttonInteraction!);
		if (interaction) {
			await interaction.editReply({ embeds: [
				new DraftbotSmallEventEmbed(
					"goToPVEIsland",
					i18n.t("smallEvents:goToPVEIsland.endStoryRefuse", { lng: user.attributes.language[0] }),
					interaction.user,
					user.attributes.language[0]
				)]});
		}
	}

	@packetHandler(SmallEventGoToPVEIslandNotEnoughGemsPacket)
	async smallEventGoToPVEIslandNotEnoughGems(socket: WebSocket, packet: SmallEventGoToPVEIslandNotEnoughGemsPacket, context: PacketContext): Promise<void> {
		const user = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, context.keycloakId!))!;
		const interaction = DiscordCache.getButtonInteraction(context.discord!.buttonInteraction!);
		if (interaction) {
			await interaction.editReply({ embeds: [
				new DraftbotSmallEventEmbed(
					"goToPVEIsland",
					i18n.t("smallEvents:goToPVEIsland.notEnoughGems", { lng: user.attributes.language[0] }),
					interaction.user,
					user.attributes.language[0]
				)]});
		}
	}
}