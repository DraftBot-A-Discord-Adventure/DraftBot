import { DraftbotInteraction } from "../../messages/DraftbotInteraction";
import { ICommand } from "../ICommand";
import { SlashCommandBuilderGenerator } from "../SlashCommandBuilderGenerator";
import {
	CommandFightHistoryPacketReq,
	CommandFightHistoryPacketRes,
	FightHistoryItem
} from "../../../../Lib/src/packets/commands/CommandFightHistoryPacket";
import { KeycloakUser } from "../../../../Lib/src/keycloak/KeycloakUser";
import {
	makePacket, PacketContext
} from "../../../../Lib/src/packets/DraftBotPacket";
import { DiscordCache } from "../../bot/DiscordCache";
import i18n from "../../translations/i18n";
import { escapeUsername } from "../../utils/StringUtils";
import { Language } from "../../../../Lib/src/Language";
import { dateDisplay } from "../../../../Lib/src/utils/TimeUtils";
import { DisplayUtils } from "../../utils/DisplayUtils";
import { handleClassicError } from "../../utils/ErrorUtils";
import { EloGameResult } from "../../../../Lib/src/types/EloGameResult";
import { FightConstants } from "../../../../Lib/src/constants/FightConstants";
import {
	InteractivePaginatedEmbed,
	FetchDataFunction,
	FormatEmbedFunction
} from "../../messages/InteractivePaginatedEmbed";
import { PacketUtils } from "../../utils/PacketUtils";
import { ButtonInteraction, CacheType, Message } from "discord.js";
import { DraftBotEmbed } from "../../messages/DraftBotEmbed"; // Import DraftBotEmbed

/**
 * Get the league change string
 * @param lng
 * @param leagueChange
 */
function getLeagueChange(
	lng: Language,
	leagueChange?: {
		oldLeague: number;
		newLeague: number;
	}
): string {
	if (!leagueChange) {
		return "";
	}

	return i18n.t(leagueChange.oldLeague < leagueChange.newLeague
		? "commands:fightHistory.leagueChanges.up"
		: "commands:fightHistory.leagueChanges.down", {
		lng,
		oldLeagueId: leagueChange.oldLeague,
		newLeagueId: leagueChange.newLeague
	});
}

/**
 * Build the fight history description from start to end indexes
 * @param history - The fight history
 * @param start - The start index
 * @param end - The end index
 * @param lng - The language
 * @param viewerKeycloakId - The keycloakId of the player viewing the history
 */
async function buildPacketHistoryDescription(history: FightHistoryItem[], start: number, end: number, lng: Language, viewerKeycloakId: string): Promise<string> {
	let desc = "";

	for (let i = end - 1; i >= start; i--) {
		const fight = history[i];
		const isViewerInitiator = fight.initiator;
		const attackSentence = i18n.t(isViewerInitiator ? "commands:fightHistory.attackSentence.attacker" : "commands:fightHistory.attackSentence.defender", {
			opponentClassId: fight.classes.opponent,
			opponent: await DisplayUtils.getEscapedUsername(fight.opponentKeycloakId, lng),
			lng
		});
		const resultSentence = i18n.t(fight.result === EloGameResult.LOSS
			? "commands:fightHistory.resultSentence.lost"
			: fight.result === EloGameResult.WIN
				? "commands:fightHistory.resultSentence.won"
				: "commands:fightHistory.resultSentence.draw", {
			lng
		});
		const leagueChange = isViewerInitiator ? fight.glory.leaguesChanges.me : fight.glory.leaguesChanges.opponent;
		const meLeagueChange = getLeagueChange(lng, leagueChange);
		desc += `${i18n.t("commands:fightHistory.historyLine", {
			lng,
			date: dateDisplay(new Date(fight.date)),
			attackSentence,
			resultSentence,
			meInitialGlory: fight.glory.initial.me,
			meFinalGlory: fight.glory.initial.me + fight.glory.change.me,
			opponentInitialGlory: fight.glory.initial.opponent,
			opponentFinalGlory: fight.glory.initial.opponent + fight.glory.change.opponent,
			meLeagueChange
		})}\n\n`;
	}

	return desc;
}

// Remove getFightHistoryPages as this logic will be handled by InteractivePaginatedEmbed

export async function handlePacketHistoryRes(packet: CommandFightHistoryPacketRes, context: PacketContext): Promise<void> {
	const interactionIdFromContext = context.discord!.interaction!;
	const interaction = DiscordCache.getInteraction(interactionIdFromContext);
	if (!interaction) {
		console.error(`Interaction ${interactionIdFromContext} not found in cache for FightHistory response.`);
		return;
	}

	if (packet.history.length === 0) {
		await handleClassicError(context, i18n.t("commands:fightHistory.noHistory", { lng: interaction.userLanguage }));
		return;
	}

	const playerUsername = await DisplayUtils.getEscapedUsername(context.keycloakId!, interaction.userLanguage);

	const fetchData_History: FetchDataFunction = async (page, fetchCtx, originalInteraction) => {
		const dummyPacket = makePacket(CommandFightHistoryPacketReq, {});
		await PacketUtils.sendPacketToBackend(fetchCtx, dummyPacket);
	};

	const formatEmbed_History: FormatEmbedFunction<CommandFightHistoryPacketRes> = async (data, currentPage, totalPages, inter, username) => {
		const lng = inter.userLanguage;
		const itemsPerPage = FightConstants.HISTORY_DISPLAY_LIMIT;
		const start = (currentPage - 1) * itemsPerPage;
		const end = Math.min(start + itemsPerPage, data.history.length);

		const pageDescription = await buildPacketHistoryDescription(data.history, start, end, lng, context.keycloakId!);

		const embed = new DraftBotEmbed() // Use imported DraftBotEmbed
			.formatAuthor(i18n.t("commands:fightHistory.title", { lng, pseudo: username }), inter.user)
			.setDescription(pageDescription || i18n.t("commands:fightHistory.noHistoryForPage", {lng}))
			.setFooter({ text: i18n.t("common:currentPage", { lng, currentPage, totalPages }) });
		return { embeds: [embed] };
	};

	const paginatedData: CommandFightHistoryPacketRes & { totalElements: number; elementsPerPage: number; minRank: number } = {
		...packet,
		totalElements: packet.history.length,
		elementsPerPage: FightConstants.HISTORY_DISPLAY_LIMIT,
		minRank: 1
	};

	if (interaction.isCommand()) {
		const originalCmdInteraction = interaction as DraftbotInteraction;
		const message = await originalCmdInteraction.editReply({ content: i18n.t("common:loading", {lng: originalCmdInteraction.userLanguage}), embeds: [], components: [] }) as Message;

		const paginator = new InteractivePaginatedEmbed(
			originalCmdInteraction,
			message,
			paginatedData,
			fetchData_History,
			formatEmbed_History,
			context.keycloakId!,
			playerUsername
		);
		await paginator.start();
	} else if (interaction.isButton()) {
		const buttonInteraction = interaction as ButtonInteraction<CacheType>; // Cast to ButtonInteraction
		const paginator = InteractivePaginatedEmbed.activePaginators.get(buttonInteraction.message.id);
		if (paginator) {
			await paginator.updateWithNewPageData(paginatedData);
		} else {
			console.error("Paginator instance not found for fight history button interaction");
			const lng = DraftbotInteraction.cast(buttonInteraction).userLanguage; // Use DraftbotInteraction for language
			const pageDescription = await buildPacketHistoryDescription(packet.history, 0, Math.min(FightConstants.HISTORY_DISPLAY_LIMIT, packet.history.length), lng, context.keycloakId!);
			const embed = new DraftBotEmbed() // Use imported DraftBotEmbed
				.formatAuthor(i18n.t("commands:fightHistory.title", { lng, pseudo: playerUsername }), buttonInteraction.user) // Use buttonInteraction.user
				.setDescription(pageDescription || i18n.t("commands:fightHistory.noHistoryForPage", {lng}))
				.setFooter({ text: i18n.t("common:currentPage", { lng, currentPage: 1, totalPages: Math.ceil(packet.history.length / FightConstants.HISTORY_DISPLAY_LIMIT) }) });
			try {
				await buttonInteraction.editReply({ embeds: [embed], components:[] }); // Use buttonInteraction
			} catch(e) { console.error("Failed to edit reply for fallback FightHistory:", e); }
		}
	}
}

/**
 * Get the packet for the fight history command
 * @param interaction
 * @param _user
 */
async function getPacket(interaction: DraftbotInteraction, _user: KeycloakUser): Promise<CommandFightHistoryPacketReq> {
	await interaction.deferReply();
	return makePacket(CommandFightHistoryPacketReq, {});
}

/**
 * Command info
 */
export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("fightHistory"),
	getPacket,
	mainGuildCommand: false
};
