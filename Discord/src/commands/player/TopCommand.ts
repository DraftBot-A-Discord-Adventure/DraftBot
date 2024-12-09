import {
	CommandTopPacketRes,
	CommandTopPacketResGlory,
	CommandTopPacketResGuild,
	CommandTopPacketResScore
} from "../../../../Lib/src/packets/commands/CommandTopPacket";
import i18n from "../../translations/i18n";
import {PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {TopElement, TopElementScoreFirstType} from "../../../../Lib/src/interfaces/TopElement";
import {DraftBotIcons} from "../../../../Lib/src/DraftBotIcons";
import {Language} from "../../../../Lib/src/Language";
import {KeycloakUtils} from "../../../../Lib/src/keycloak/KeycloakUtils";
import {keycloakConfig} from "../../bot/DraftBotShard";
import {DiscordCache} from "../../bot/DiscordCache";
import {DraftBotEmbed} from "../../messages/DraftBotEmbed";
import {TopScope} from "../../../../Lib/src/enums/TopScope";
import {TopTiming} from "../../../../Lib/src/enums/TopTimings";

// todo register command and getPacket

function getBadgeForPosition(rank: number, sameContext: boolean, contextElementPosition?: number): string {
	switch (rank) {
	case 1:
		return DraftBotIcons.top.badges.first;
	case 2:
		return DraftBotIcons.top.badges.second;
	case 3:
		return DraftBotIcons.top.badges.third;
	default:
		return sameContext
			? contextElementPosition === rank
				? DraftBotIcons.top.badges.self
				: DraftBotIcons.top.badges.sameContext
			: DraftBotIcons.top.badges.default;
	}
}

function formatScoreAttributes(element: TopElement<TopElementScoreFirstType, number, number>, lng: Language): string {
	let attributes = "";

	if (element.attributes["1"].afk) {
		attributes += `${DraftBotIcons.top.afk} | `;
	}
	else if (element.attributes["1"].mapType) {
		attributes += `${DraftBotIcons.map_types[element.attributes["1"].mapType]} | `;
	}

	attributes += `\`${element.attributes["2"]}\` | \`${i18n.t("commands:top.level", { lng, level: element.attributes["3"] })}\``;

	return attributes;
}

function formatGloryAttributes(element: TopElement<number, number, number>, lng: Language): string {
	return `${
		DraftBotIcons.leagues[element.attributes["1"].toString(10)]
	} | \`${
		element.attributes["2"]
	}\` | \`${
		i18n.t("commands:top.level", { lng, level: element.attributes["3"] })
	}\``;
}

function formatGuildAttributes(element: TopElement<number, number, undefined>): string {
	return `${element.attributes["1"]} | \`${element.attributes["2"]}\``;
}

async function handleGenericTopPacketRes<T extends TopElement<U, V, W>, U, V, W>(context: PacketContext, packet: CommandTopPacketRes<T, U, V, W>, textKeys: {
	title: string;
	yourRankTitle: string;
	yourRank: string;
	yourRankNone: { key: string, replacements: { [key: string]: unknown } };
	youRankAtPage: string;
	nobodyInTop: string;
	cantBeRanked?: string;
}, formatAttributes: (element: T, lng: Language) => string): Promise<void> {
	const user = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, context.keycloakId!))!;
	const interaction = DiscordCache.getInteraction(context.discord!.interaction!)!;

	const lng = context.discord!.language!;
	const title = i18n.t(textKeys.title, { lng, minRank: packet.minRank, maxRank: packet.maxRank });

	let desc = "";
	if (packet.elements.length > 0) {
		for (let i = 0; i < packet.elements.length; i++) {
			const element = packet.elements[i];
			desc += `${getBadgeForPosition(element.rank, element.sameContext, packet.contextRank)} ${element.text} | ${formatAttributes(element, lng)}\n`;
		}

		desc += `${i18n.t(textKeys.yourRankTitle, {lng})}\n`;

		if (packet.contextRank) {
			desc += i18n.t(
				textKeys.yourRank,
				{
					lng,
					badge: getBadgeForPosition(packet.contextRank, true, packet.contextRank),
					pseudo: user.attributes.gameUsername,
					rank: packet.contextRank,
					total: packet.totalElements
				}
			);
			if (packet.contextRank < packet.minRank || packet.contextRank > packet.maxRank) {
				desc += i18n.t(
					textKeys.youRankAtPage,
					{
						lng,
						page: Math.ceil(packet.contextRank / (packet.maxRank - packet.minRank)),
						maxPage: Math.ceil(packet.totalElements / (packet.maxRank - packet.minRank))
					}
				);
			}
		}
		else if (packet.canBeRanked) {
			desc += i18n.t(textKeys.yourRankNone.key, {
				lng,
				pseudo: user.attributes.gameUsername, ...textKeys.yourRankNone.replacements
			});
		}
		else if (textKeys.cantBeRanked) {
			desc += i18n.t(textKeys.cantBeRanked, {lng});
		}
	}
	else {
		desc = i18n.t(textKeys.nobodyInTop, {lng});
	}

	await interaction.reply({
		embeds: [
			new DraftBotEmbed()
				.setTitle(title)
				.setDescription(desc)
		]
	});
}

export async function handleCommandTopPacketResScore(context: PacketContext, packet: CommandTopPacketResScore): Promise<void> {
	await handleGenericTopPacketRes(context, packet, {
		title: packet.scope === TopScope.GLOBAL
			? packet.timing === TopTiming.ALL_TIME
				? "commands:top.titleScoreAllTime"
				: "commands:top.titleScoreWeekly"
			: packet.timing === TopTiming.ALL_TIME
				? "commands:top.titleScoreAllTimeServer"
				: "commands:top.titleScoreWeeklyServer",
		yourRankTitle: "commands:top.yourRankTitle",
		yourRank: packet.contextRank === 1 ? "commands:top.yourRankFirst" : "commands:top.yourRank",
		yourRankNone: { key: "commands:top.yourRankNoneScore", replacements: {}},
		youRankAtPage: "commands:top.yourRankAtPage",
		nobodyInTop: "commands:top.nobodyInTopPlayers"
	}, formatScoreAttributes);
}

export async function handleCommandTopPacketResGlory(context: PacketContext, packet: CommandTopPacketResGlory): Promise<void> {
	await handleGenericTopPacketRes(context, packet, {
		title: packet.scope === TopScope.GLOBAL
			? "commands:top.titleGlory"
			: "commands:top.titleGloryServer",
		yourRankTitle: "commands:top.yourRankTitle",
		yourRank: "commands:top.yourRank",
		yourRankNone: { key: "commands:top.yourRankNoneGlory", replacements: { needFight: packet.needFight }},
		youRankAtPage: "commands:top.yourRankAtPage",
		nobodyInTop: "commands:top.nobodyInTopPlayers"
	}, formatGloryAttributes);
}

export async function handleCommandTopPacketResGuild(context: PacketContext, packet: CommandTopPacketResGuild): Promise<void> {
	await handleGenericTopPacketRes(context, packet, {
		title: "commands:top.titleGuild",
		yourRankTitle: "commands:top.yourRankGuildTitle",
		yourRank: packet.contextRank === 1 ? "commands:top.yourRankGuildFirst" : "commands:top.yourRankGuild",
		yourRankNone: { key: "commands:top.yourRankNoneGuild", replacements: {}},
		youRankAtPage: "commands:top.yourRankAtPageGuild",
		nobodyInTop: "commands:top.nobodyInTopGuilds",
		cantBeRanked: "commands:top.noGuild"
	}, formatGuildAttributes);
}