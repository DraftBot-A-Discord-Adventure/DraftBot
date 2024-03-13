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
import {Constants} from "../../../../Lib/src/constants/Constants";
import {Effect} from "../../../../Lib/src/enums/Effect";
import {minutesDisplay} from "../../../../Lib/src/utils/TimeUtils";
import {DraftBotEmbed} from "../../messages/DraftBotEmbed";
import {ReactionCollectorChooseDestinationReaction} from "../../../../Lib/src/packets/interaction/ReactionCollectorChooseDestination";
import {Language} from "../../../../Lib/src/Language";
import {DiscordCollectorUtils} from "../../utils/DiscordCollectorUtils";

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
			DiscordCollectorUtils.sendReaction(packet, context, user, buttonInteraction, reactions.findIndex((reaction) => reaction.name === possibilityName));
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

		if (firstReaction) {
			await firstReaction.deferReply();
			respondToEvent(firstReaction.customId, firstReaction);
		}
	});

	endCollector.on("collect", () => {
		buttonCollector.stop();
		endCollector.stop();

		respondToEvent("end", null);
	});
}

export async function reportResult(packet: CommandReportBigEventResultRes, context: PacketContext): Promise<void> {
	const user = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, context.keycloakId!))!;
	const interaction = DiscordCache.getInteraction(context.discord!.interaction)!;

	let result = "";
	if (packet.score) {
		result += i18n.t("commands:report.points", { lng: interaction.userLanguage, score: packet.score });
	}
	if (packet.money < 0) {
		result += i18n.t("commands:report.moneyLoose", { lng: interaction.userLanguage, money: -packet.money });
	}
	else if (packet.money > 0) {
		result += i18n.t("commands:report.money", { lng: interaction.userLanguage, money: packet.money });
	}
	if (packet.health < 0) {
		result += i18n.t("commands:report.healthLoose", { lng: interaction.userLanguage, health: -packet.health });
	}
	else if (packet.health > 0) {
		result += i18n.t("commands:report.health", { lng: interaction.userLanguage, health: packet.health });
	}
	if (packet.energy) {
		result += i18n.t("commands:report.energy", { lng: interaction.userLanguage, energy: packet.energy });
	}
	if (packet.gems) {
		result += i18n.t("commands:report.gems", { lng: interaction.userLanguage, gems: packet.gems });
	}
	if (packet.experience) {
		result += i18n.t("commands:report.experience", { lng: interaction.userLanguage, experience: packet.experience });
	}
	if (packet.effect && packet.effect.name === Effect.OCCUPIED.id) {
		result += i18n.t("commands:report.timeLost", { lng: interaction.userLanguage, timeLost: minutesDisplay(packet.effect.time) });
	}

	const content = i18n.t("commands:report.doPossibility", {
		lng: interaction.userLanguage,
		interpolation: { escapeValue: false },
		pseudo: user.attributes.gameUsername,
		result,
		event: i18n.t(`events:${packet.eventId}.possibilities.${packet.possibilityId}.outcomes.${packet.outcomeId}`, { lng: interaction.userLanguage }),
		emoji: packet.possibilityId === "end" ? (DraftBotIcons.events[packet.eventId].end as { [outcomeId: string]: string })[packet.outcomeId] : DraftBotIcons.events[packet.possibilityId],
		alte: packet.effect && packet.effect.name !== Effect.OCCUPIED.id ? DraftBotIcons.effects[packet.effect.name] : ""
	});

	const buttonInteraction = context.discord?.buttonInteraction ? DiscordCache.getButtonInteraction(context.discord?.buttonInteraction) : null;

	if (buttonInteraction) {
		await buttonInteraction.editReply({ content });
	}
	else {
		await interaction.channel.send({ content });
	}
}

const destinationChoiceEmotes = ["1⃣", "2⃣", "3⃣", "4⃣", "5⃣", "6⃣", "7⃣", "8⃣", "9⃣"];

/**
 * Creates the description for a chooseDestination embed
 * @param reactions
 * @param language
 */
function createDescriptionChooseDestination(reactions: ReactionCollectorChooseDestinationReaction[], language: Language): string {
	let desc = `${i18n.t("commands:report.chooseDestinationIndications", { lng: language })}\n`;
	for (let i = 0; i < reactions.length; ++i) {
		const reaction = reactions[i];
		const duration = reaction.tripDuration ? minutesDisplay(reaction.tripDuration) : "?h";
		desc += `${destinationChoiceEmotes[i]} - ${DraftBotIcons.map_types[reaction.mapTypeId]} ${i18n.t(`models:map_locations.${reaction.mapId}.name`, { lng: language })} (${duration})\n`;
	}
	return desc;
}

export async function chooseDestinationCollector(packet: ReactionCollectorCreationPacket, context: PacketContext): Promise<void> {
	const user = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, context.keycloakId!))!;
	const interaction = DiscordCache.getInteraction(context.discord!.interaction)!;

	const embed = new DraftBotEmbed();
	embed.formatAuthor(i18n.t("commands:report.destinationTitle", {
		lng: interaction.userLanguage,
		pseudo: user.attributes.gameUsername
	}), interaction.user);
	embed.setDescription(
		createDescriptionChooseDestination(
			packet.reactions.map(reaction => reaction.data) as ReactionCollectorChooseDestinationReaction[],
			interaction.userLanguage
		)
	);

	const row = new ActionRowBuilder<ButtonBuilder>();

	for (let i = 0; i < packet.reactions.length; ++i) {
		const button = new ButtonBuilder()
			.setEmoji(parseEmoji(destinationChoiceEmotes[i])!)
			.setCustomId(i.toString())
			.setStyle(ButtonStyle.Secondary);
		row.addComponents(button);
	}

	const msg = await interaction?.channel.send({
		embeds: [embed],
		components: [row]
	}) as Message;

	const buttonCollector = msg.createMessageComponentCollector({
		time: packet.endTime - Date.now()
	});

	buttonCollector.on("collect", async (i: ButtonInteraction) => {
		if (i.user.id !== context.discord?.user) {
			await sendInteractionNotForYou(i.user, i, interaction.userLanguage);
			return;
		}

		buttonCollector.stop();
	});
	buttonCollector.on("end", async (collected) => {
		const firstReaction = collected.first() as ButtonInteraction;

		if (firstReaction) {
			await firstReaction.deferReply();
			DiscordCollectorUtils.sendReaction(packet, context, user, firstReaction, parseInt(firstReaction.customId));
		}
	});
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("report"),
	getPacket,
	requirements: {
		disallowEffects: [Effect.DEAD]
	},
	mainGuildCommand: false
};