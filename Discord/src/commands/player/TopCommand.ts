import {
	CommandTopInvalidPagePacket,
	CommandTopPacketReq,
	CommandTopPacketRes,
	CommandTopPacketResGlory,
	CommandTopPacketResGuild,
	CommandTopPacketResScore
} from "../../../../Lib/src/packets/commands/CommandTopPacket";
import i18n from "../../translations/i18n";
import {
	makePacket, PacketContext
} from "../../../../Lib/src/packets/DraftBotPacket";
import {
	TopElement, TopElementScoreFirstType
} from "../../../../Lib/src/types/TopElement";
import { DraftBotIcons } from "../../../../Lib/src/DraftBotIcons";
import {
	LANGUAGE, Language
} from "../../../../Lib/src/Language";
import { KeycloakUtils } from "../../../../Lib/src/keycloak/KeycloakUtils";
import { keycloakConfig } from "../../bot/DraftBotShard";
import { DiscordCache } from "../../bot/DiscordCache";
import { DraftBotEmbed } from "../../messages/DraftBotEmbed";
import { TopTiming } from "../../../../Lib/src/types/TopTimings";
import { DraftbotInteraction } from "../../messages/DraftbotInteraction";
import { ICommand } from "../ICommand";
import { SlashCommandBuilderGenerator } from "../SlashCommandBuilderGenerator";
import { TopDataType } from "../../../../Lib/src/types/TopDataType";
import {
	SlashCommandBuilder, SlashCommandSubcommandBuilder
} from "@discordjs/builders";
import { DraftBotErrorEmbed } from "../../messages/DraftBotErrorEmbed";

async function getPacket(interaction: DraftbotInteraction): Promise<CommandTopPacketReq> {
	await interaction.deferReply();

	const subCommand = interaction.options.getSubcommand();
	const timing = interaction.options.getString("timing") as TopTiming ?? TopTiming.ALL_TIME;
	const page = interaction.options.getInteger("page") ?? undefined;

	return makePacket(CommandTopPacketReq, {
		timing,
		dataType: subCommand === i18n.t("discordBuilder:top.subcommands.score.name", { lng: LANGUAGE.ENGLISH })
			? TopDataType.SCORE
			: subCommand === i18n.t("discordBuilder:top.subcommands.glory.name", { lng: LANGUAGE.ENGLISH })
				? TopDataType.GLORY
				: TopDataType.GUILD,
		page
	});
}

function addTimingOption(builder: SlashCommandSubcommandBuilder): void {
	builder.addStringOption(option => SlashCommandBuilderGenerator.generateOption("top", "timing", option)
		.addChoices(
			{
				name: i18n.t("discordBuilder:top.timings.allTime", { lng: LANGUAGE.ENGLISH }),

				// Discord naming conventions
				// eslint-disable-next-line camelcase
				name_localizations: {
					fr: i18n.t("discordBuilder:top.timings.allTime", { lng: LANGUAGE.FRENCH })
				},
				value: TopTiming.ALL_TIME
			},
			{
				name: i18n.t("discordBuilder:top.timings.weekly", { lng: LANGUAGE.ENGLISH }),

				// Discord naming conventions
				// eslint-disable-next-line camelcase
				name_localizations: {
					fr: i18n.t("discordBuilder:top.timings.weekly", { lng: LANGUAGE.FRENCH })
				},
				value: TopTiming.WEEK
			}
		));
}

function addPageOption(builder: SlashCommandSubcommandBuilder): void {
	builder.addIntegerOption(option => SlashCommandBuilderGenerator.generateOption("top", "page", option)
		.setMinValue(1)
		.setRequired(false));
}

function getScoreSubCommand(): SlashCommandSubcommandBuilder {
	const builder = SlashCommandBuilderGenerator.generateSubCommand("top", "score");
	addTimingOption(builder);
	addPageOption(builder);
	return builder;
}

function getGlorySubCommand(): SlashCommandSubcommandBuilder {
	const builder = SlashCommandBuilderGenerator.generateSubCommand("top", "glory");
	addPageOption(builder);
	return builder;
}

function getGuildSubCommand(): SlashCommandSubcommandBuilder {
	const builder = SlashCommandBuilderGenerator.generateSubCommand("top", "guild");
	addPageOption(builder);
	return builder;
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("top")
		.addSubcommand(getScoreSubCommand())
		.addSubcommand(getGlorySubCommand())
		.addSubcommand(getGuildSubCommand()) as SlashCommandBuilder,
	getPacket,
	mainGuildCommand: false
};

function getBadgeForPosition(rank: number, sameContext: boolean, contextElementPosition?: number): string {
	switch (rank) {
		case 1:
			return DraftBotIcons.top.badges.first;
		case 2:
			return DraftBotIcons.top.badges.second;
		case 3:
			return DraftBotIcons.top.badges.third;
		case 4:
			return DraftBotIcons.top.badges.fourth;
		case 5:
			return DraftBotIcons.top.badges.fifth;
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
	else if (element.attributes["1"].effectId) {
		attributes += `${DraftBotIcons.effects[element.attributes["1"].effectId]} | `;
	}
	else if (element.attributes["1"].mapType) {
		attributes += `${DraftBotIcons.mapTypes[element.attributes["1"].mapType]} | `;
	}

	attributes += `\`${element.attributes["2"]}\` | \`${i18n.t("commands:top.level", {
		lng,
		level: element.attributes["3"]
	})}\``;

	return attributes;
}

function formatGloryAttributes(element: TopElement<number, number, number>, lng: Language): string {
	return `${
		DraftBotIcons.leagues[element.attributes["1"].toString(10)]
	} | \`${
		element.attributes["2"]
	}\` | \`${
		i18n.t("commands:top.level", {
			lng,
			level: element.attributes["3"]
		})
	}\``;
}

function formatGuildAttributes(element: TopElement<number, number, undefined>, lng: Language): string {
	return `\`${element.attributes["1"]}\` | \`${i18n.t("commands:top.level", {
		lng,
		level: element.attributes["2"]
	})}\``;
}

type TopTextKeys = {
	title: string;
	yourRankTitle: string;
	yourRank: string;
	yourRankNone: {
		key: string; replacements: { [key: string]: unknown };
	};
	youRankAtPage: string;
	nobodyInTop: string;
	cantBeRanked?: string;
	overriddenElementTexts?: string[];
};

function getTopDescription<TopElementKind extends TopElement<T, U, V>, T, U, V>(
	packet: CommandTopPacketRes<TopElementKind, T, U, V>,
	textKeys: TopTextKeys,
	formatAttributes: (element: TopElementKind, lng: Language) => string,
	lng: Language,
	playerUsernames: string[]
): string {
	if (packet.elements.length <= 0) {
		return i18n.t(textKeys.nobodyInTop, { lng });
	}
	let desc = "";
	for (let i = 0; i < packet.elements.length; i++) {
		const element = packet.elements[i];
		desc += `${getBadgeForPosition(element.rank, element.sameContext, packet.contextRank)} ${
			textKeys.overriddenElementTexts ? textKeys.overriddenElementTexts[i] : element.text
		} | ${formatAttributes(element, lng)}\n`;
	}

	desc += `${i18n.t(textKeys.yourRankTitle, { lng })}\n`;

	if (packet.contextRank) {
		desc += i18n.t(textKeys.yourRank, {
			lng,
			badge: getBadgeForPosition(packet.contextRank, true, packet.contextRank),
			pseudo: playerUsernames,
			rank: packet.contextRank,
			total: packet.totalElements,
			count: packet.totalElements
		});
		if (packet.contextRank < packet.minRank || packet.contextRank > packet.maxRank) {
			desc += ` ${i18n.t(textKeys.youRankAtPage, {
				lng,
				page: Math.ceil(packet.contextRank / packet.elementsPerPage),
				maxPage: Math.ceil(packet.totalElements / packet.elementsPerPage)
			})}`;
		}
	}
	else if (packet.canBeRanked) {
		desc += i18n.t(textKeys.yourRankNone.key, {
			lng,
			pseudo: playerUsernames,
			...textKeys.yourRankNone.replacements,
			interpolation: { escapeValue: false }
		});
	}
	else if (textKeys.cantBeRanked) {
		desc += i18n.t(textKeys.cantBeRanked, { lng });
	}
	return desc;
}

async function handleGenericTopPacketRes<TopElementKind extends TopElement<T, U, V>, T, U, V>(
	context: PacketContext,
	packet: CommandTopPacketRes<TopElementKind, T, U, V>,
	textKeys: TopTextKeys,
	formatAttributes: (element: TopElementKind, lng: Language) => string
): Promise<void> {
	const user = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, context.keycloakId!))!;
	const interaction = DiscordCache.getInteraction(context.discord!.interaction!)!;

	const lng = interaction.userLanguage;
	const title = i18n.t(textKeys.title, {
		lng,
		minRank: packet.minRank,
		maxRank: packet.maxRank
	});

	await interaction.editReply({
		embeds: [
			new DraftBotEmbed()
				.setTitle(title)
				.setDescription(getTopDescription(packet, textKeys, formatAttributes, lng, user.attributes.gameUsername))
		]
	});
}

async function getOverriddenPlayersUsernames<U, V, W>(elements: TopElement<U, V, W>[], lng: Language): Promise<string[]> {
	return (await KeycloakUtils.getUsersFromIds(keycloakConfig, elements.map(e => e.text)))
		.map(u => (u ? u.attributes.gameUsername[0] : i18n.t("error:unknownPlayer", { lng })));
}

export async function handleCommandTopPacketResScore(context: PacketContext, packet: CommandTopPacketResScore): Promise<void> {
	await handleGenericTopPacketRes(context, packet, {
		title: packet.timing === TopTiming.ALL_TIME
			? "commands:top.titleScoreAllTime"
			: "commands:top.titleScoreWeekly",
		yourRankTitle: "commands:top.yourRankTitle",
		yourRank: packet.contextRank === 1 ? "commands:top.yourRankFirst" : "commands:top.yourRank",
		yourRankNone: {
			key: "commands:top.yourRankNoneScore",
			replacements: {}
		},
		youRankAtPage: "commands:top.yourRankAtPage",
		nobodyInTop: "commands:top.nobodyInTopPlayers",
		overriddenElementTexts: await getOverriddenPlayersUsernames(packet.elements, context.discord!.language!)
	}, formatScoreAttributes);
}

export async function handleCommandTopPacketResGlory(context: PacketContext, packet: CommandTopPacketResGlory): Promise<void> {
	await handleGenericTopPacketRes(context, packet, {
		title: "commands:top.titleGlory",
		yourRankTitle: "commands:top.yourRankTitle",
		yourRank: packet.contextRank === 1 ? "commands:top.yourRankFirst" : "commands:top.yourRank",
		yourRankNone: {
			key: "commands:top.yourRankNoneGlory",
			replacements: {
				needFight: packet.needFight,
				count: packet.needFight
			}
		},
		youRankAtPage: "commands:top.yourRankAtPage",
		nobodyInTop: "commands:top.nobodyInTopPlayers",
		overriddenElementTexts: await getOverriddenPlayersUsernames(packet.elements, context.discord!.language!)
	}, formatGloryAttributes);
}

export async function handleCommandTopPacketResGuild(context: PacketContext, packet: CommandTopPacketResGuild): Promise<void> {
	await handleGenericTopPacketRes(context, packet, {
		title: "commands:top.titleGuild",
		yourRankTitle: "commands:top.yourRankGuildTitle",
		yourRank: packet.contextRank === 1 ? "commands:top.yourRankGuildFirst" : "commands:top.yourRankGuild",
		yourRankNone: {
			key: "commands:top.yourRankNoneGuild",
			replacements: {}
		},
		youRankAtPage: "commands:top.yourRankAtPageGuild",
		nobodyInTop: "commands:top.nobodyInTopGuilds",
		cantBeRanked: "commands:top.noGuild"
	}, formatGuildAttributes);
}

export async function handleCommandTopInvalidPagePacket(context: PacketContext, packet: CommandTopInvalidPagePacket): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction!)!;

	await interaction.editReply({
		embeds: [
			new DraftBotErrorEmbed(interaction.user, interaction, i18n.t("commands:top.invalidPage", {
				lng: interaction.userLanguage,
				minPage: packet.minPage,
				maxPage: packet.maxPage
			}))
		]
	});
}

export async function handleCommandTopPlayersEmptyPacket(context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction!)!;

	await interaction.editReply({
		embeds: [new DraftBotErrorEmbed(interaction.user, interaction, i18n.t("commands:top.nobodyInTopPlayers", { lng: interaction.userLanguage }))]
	});
}

export async function handleCommandTopGuildsEmptyPacket(context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction!)!;

	await interaction.editReply({
		embeds: [new DraftBotErrorEmbed(interaction.user, interaction, i18n.t("commands:top.nobodyInTopGuilds", { lng: interaction.userLanguage }))]
	});
}
