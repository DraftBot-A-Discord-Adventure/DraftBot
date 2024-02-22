import {ICommand} from "../ICommand";
import {makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {DraftbotInteraction} from "../../messages/DraftbotInteraction";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {EffectsConstants} from "../../../../Lib/src/constants/EffectsConstants";
import {CommandReportPacketReq} from "../../../../Lib/src/packets/commands/CommandReportPacket";
import {KeycloakUser} from "../../../../Lib/src/keycloak/KeycloakUser";
import {ReactionCollectorCreationPacket} from "../../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {
	ReactionCollectorBigEventData,
	ReactionCollectorBigEventPossibilityReaction
} from "../../../../Lib/src/packets/interaction/ReactionCollectorBigEvent";
import i18n from "../../translations/i18n";
import {KeycloakUtils} from "../../../../Lib/src/keycloak/KeycloakUtils";
import {keycloakConfig} from "../../bot/DraftBotShard";
import {Message} from "discord.js";
import {DiscordCache} from "../../bot/DiscordCache";

async function getPacket(interaction: DraftbotInteraction, user: KeycloakUser): Promise<CommandReportPacketReq> {
	await interaction.deferReply();
	return Promise.resolve(makePacket(CommandReportPacketReq, {keycloakId: user.id}));
}

export async function createBigEventCollector(packet: ReactionCollectorCreationPacket, context: PacketContext): Promise<void> {
	const user = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, context.keycloakId!))!;
	const interaction = DiscordCache.getInteraction(context.discord!.interaction);
	const data = packet.data.data as ReactionCollectorBigEventData;
	const reactions = packet.reactions.map((reaction) => reaction.data) as ReactionCollectorBigEventPossibilityReaction[];

	let eventText = `${i18n.t(`events:${data.eventId}.text`, { lng: context.discord?.language, interpolation: { escapeValue: false } })}\n\n`;
	for (const possibility of reactions) {
		if (possibility.name !== "end") {
			eventText += `[TODO emoji] ${i18n.t(`events:${data.eventId}.possibilities.${possibility.name}.text`, {
				lng: context.discord?.language,
				interpolation: { escapeValue: false }
			})}\n`; // todo emoji
		}
	}

	const eventDisplayed = await interaction?.editReply({
		content: i18n.t("commands:report.doEvent", {
			lng: context.discord?.language,
			pseudo: user.attributes.gameUsername,
			event: eventText
		})
	}) as Message;
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("report"),
	getPacket,
	requirements: {
		disallowEffects: [EffectsConstants.EMOJI_TEXT.DEAD]
	},
	mainGuildCommand: false
};