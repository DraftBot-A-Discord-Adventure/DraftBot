import {ICommand} from "../ICommand";
import {makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {DraftbotInteraction} from "../../messages/DraftbotInteraction";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {
	CommandReportBigEventResultRes,
	CommandReportPacketReq
} from "../../../../Lib/src/packets/commands/CommandReportPacket";
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
import {Effect} from "../../../../Lib/src/enums/Effect";
import {minutesDisplay} from "../../../../Lib/src/utils/TimeUtils";

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
	const respondToEvent = (possibilityName: string, buttonInteraction: ButtonInteraction | null): void => {
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

			if (buttonInteraction) {
				DiscordCache.cacheButtonInteraction(buttonInteraction);
			}
			DiscordWebSocket.socket!.send(JSON.stringify({
				packet: {
					name: responsePacket.constructor.name,
					data: responsePacket
				},
				context: {
					keycloakId: user.id,
					discord: {
						user: interaction.user.id,
						channel: interaction.channel.id,
						interaction: interaction.id,
						buttonInteraction: buttonInteraction?.id,
						language: interaction.userLanguage
					}
				}
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
	buttonCollector.on("end", async (collected) => {
		const firstReaction = collected.first() as ButtonInteraction;

		if (!firstReaction) {
			respondToEvent("end", null);
		}
		else {
			await firstReaction.deferReply();
			respondToEvent(firstReaction.customId, firstReaction);
		}
	});

	endCollector.on("collect", () => {
		respondToEvent("end", null);

		buttonCollector.stop();
		endCollector.stop();
	});
}

export async function reportResult(packet: CommandReportBigEventResultRes, context: PacketContext): Promise<void> {
	const user = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, context.keycloakId!))!;
	const interaction = DiscordCache.getInteraction(context.discord!.interaction)!;

	let result = "";
	if (packet.score) {
		result += i18n.t("commands:report.points", { lng: interaction.channel.language, score: packet.score });
	}
	if (packet.money < 0) {
		result += i18n.t("commands:report.moneyLoose", { lng: interaction.channel.language, money: -packet.money });
	}
	else if (packet.money > 0) {
		result += i18n.t("commands:report.money", { lng: interaction.channel.language, money: packet.money });
	}
	if (packet.health < 0) {
		result += i18n.t("commands:report.healthLoose", { lng: interaction.channel.language, health: -packet.health });
	}
	else if (packet.health > 0) {
		result += i18n.t("commands:report.health", { lng: interaction.channel.language, health: packet.health });
	}
	if (packet.energy) {
		result += i18n.t("commands:report.energy", { lng: interaction.channel.language, energy: packet.energy });
	}
	if (packet.gems) {
		result += i18n.t("commands:report.gems", { lng: interaction.channel.language, gems: packet.gems });
	}
	if (packet.experience) {
		result += i18n.t("commands:report.experience", { lng: interaction.channel.language, experience: packet.experience });
	}
	if (packet.effect && packet.effect.name === Effect.OCCUPIED.id) {
		result += i18n.t("commands:report.timeLost", { lng: interaction.channel.language, timeLost: minutesDisplay(packet.effect.time) });
	}

	const content = i18n.t("commands:report.doPossibility", {
		lng: interaction.channel.language,
		interpolation: { escapeValue: false },
		pseudo: user.attributes.gameUsername,
		result,
		event: i18n.t(`events:${packet.eventId}.possibilities.${packet.possibilityId}.outcomes.${packet.outcomeId}`),
		emoji: packet.possibilityId === "end" ? (DraftBotIcons.events[packet.eventId].end as { [outcomeId: string]: string })[packet.outcomeId] : DraftBotIcons.events[packet.possibilityId],
		alte: packet.effect ? DraftBotIcons.effects[packet.effect.name] : ""
	});

	const buttonInteraction = context.discord?.buttonInteraction ? DiscordCache.getButtonInteraction(context.discord?.buttonInteraction) : null;

	if (buttonInteraction) {
		await buttonInteraction.editReply({ content });
	}
	else {
		await interaction.channel.send({ content });
	}
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("report"),
	getPacket,
	requirements: {
		disallowEffects: [Effect.DEAD]
	},
	mainGuildCommand: false
};