import {ICommand} from "../ICommand";
import {makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {DraftbotInteraction} from "../../messages/DraftbotInteraction";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {EffectsConstants} from "../../../../Lib/src/constants/EffectsConstants";
import {CommandReportPacketReq} from "../../../../Lib/src/packets/commands/CommandReportPacket";
import {KeycloakUser} from "../../../../Lib/src/keycloak/KeycloakUser";
import {
	ReactionCollectorCreationPacket,
	ReactionCollectorReactPacket
} from "../../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {
	ReactionCollectorBigEventData,
	ReactionCollectorBigEventPossibilityReaction
} from "../../../../Lib/src/packets/interaction/ReactionCollectorBigEvent";
import i18n from "../../translations/i18n";
import {KeycloakUtils} from "../../../../Lib/src/keycloak/KeycloakUtils";
import {keycloakConfig} from "../../bot/DraftBotShard";
import {
	ActionRowBuilder,
	ButtonBuilder, ButtonInteraction, ButtonStyle, Message,
	parseEmoji
} from "discord.js";
import {DiscordCache} from "../../bot/DiscordCache";
import {DraftBotIcons} from "../../../../Lib/src/DraftBotIcons";
import {sendInteractionNotForYou} from "../../utils/ErrorUtils";
import {DiscordWebSocket} from "../../bot/Websocket";
import {Constants} from "../../../../Lib/src/constants/Constants";

async function getPacket(interaction: DraftbotInteraction, user: KeycloakUser): Promise<CommandReportPacketReq> {
	await interaction.deferReply();
	return Promise.resolve(makePacket(CommandReportPacketReq, {keycloakId: user.id}));
}

export async function createBigEventCollector(packet: ReactionCollectorCreationPacket, context: PacketContext): Promise<void> {
	const user = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, context.keycloakId!))!;
	const interaction = DiscordCache.getInteraction(context.discord!.interaction)!;
	const data = packet.data.data as ReactionCollectorBigEventData;
	const reactions = packet.reactions.map((reaction) => reaction.data) as ReactionCollectorBigEventPossibilityReaction[];

	const row = new ActionRowBuilder<ButtonBuilder>();
	let eventText = `${i18n.t(`events:${data.eventId}.text`, { lng: context.discord?.language, interpolation: { escapeValue: false } })}\n\n`;
	for (const possibility of reactions) {
		if (possibility.name !== "end") {
			const emoji = DraftBotIcons.events[data.eventId.toString()][possibility.name] as string;

			const button = new ButtonBuilder()
				.setEmoji(parseEmoji(emoji)!)
				.setCustomId(possibility.name)
				.setStyle(ButtonStyle.Secondary);
			row.addComponents(button);

			const reactionText = `${emoji} ${i18n.t(`events:${data.eventId}.possibilities.${possibility.name}.text`, {
				lng: context.discord?.language,
				interpolation: { escapeValue: false }
			})}`;
			eventText += `${reactionText}\n`;
		}
	}

	const msg = await interaction?.editReply({
		content: i18n.t("commands:report.doEvent", { lng: interaction?.userLanguage, event: eventText, pseudo: user.attributes.gameUsername, interpolation: { escapeValue: false } }),
		components: [row]
	}) as Message;

	let responded = false; // To avoid concurrence between buttons controller and reactions controller
	const respondToEvent = (possibilityName: string): void => {
		if (!responded) {
			responded = true;

			const responsePacket = makePacket(
				ReactionCollectorReactPacket,
				{
					id: packet.id,
					keycloakId: user.id,
					reactionIndex: reactions.findIndex((reaction) => reaction.name === possibilityName)
				}
			);

			DiscordWebSocket.socket!.send(JSON.stringify({
				packet: {
					name: responsePacket.constructor.name,
					data: responsePacket
				},
				context
			}));
		}
	};

	const buttonCollector = msg.createMessageComponentCollector({
		time: packet.endTime - Date.now()
	});
	const endCollector = msg.createReactionCollector({
		time: packet.endTime - Date.now(),
		filter: (reaction, user) => reaction.emoji.name === Constants.REACTIONS.NOT_REPLIED_REACTION && user.id === interaction.user.id
	});

	buttonCollector.on("collect", async (i: ButtonInteraction) => {
		if (i.user.id !== context.discord?.user) {
			await sendInteractionNotForYou(i.user, i, interaction.userLanguage);
			return;
		}

		buttonCollector.stop();
		endCollector.stop();
	});
	buttonCollector.on("end", (collected) => {
		const firstReaction = collected.first() as ButtonInteraction;

		if (!firstReaction) {
			respondToEvent("end");
		}
		else {
			respondToEvent(firstReaction.customId);
		}
	});

	endCollector.on("collect", () => {
		respondToEvent("end");

		// ButtonCollector.stop();
		// EndCollector.stop();
	});
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("report"),
	getPacket,
	requirements: {
		disallowEffects: [EffectsConstants.EMOJI_TEXT.DEAD]
	},
	mainGuildCommand: false
};