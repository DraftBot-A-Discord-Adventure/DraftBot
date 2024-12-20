import {
	CommandTopInvalidPagePacket,
	CommandTopPacketReq,
	CommandTopPacketRes,
	CommandTopPacketResGlory,
	CommandTopPacketResGuild,
	CommandTopPacketResScore
} from "../../../../Lib/src/packets/commands/CommandTopPacket";
import i18n from "../../translations/i18n";
import {makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {TopElement, TopElementScoreFirstType} from "../../../../Lib/src/interfaces/TopElement";
import {DraftBotIcons} from "../../../../Lib/src/DraftBotIcons";
import {LANGUAGE, Language} from "../../../../Lib/src/Language";
import {KeycloakUtils} from "../../../../Lib/src/keycloak/KeycloakUtils";
import {keycloakConfig} from "../../bot/DraftBotShard";
import {DiscordCache} from "../../bot/DiscordCache";
import {DraftBotEmbed} from "../../messages/DraftBotEmbed";
import {TopTiming} from "../../../../Lib/src/enums/TopTimings";
import {DraftbotInteraction} from "../../messages/DraftbotInteraction";
import {ICommand} from "../ICommand";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {TopDataType} from "../../../../Lib/src/enums/TopDataType";
import {SlashCommandBuilder, SlashCommandSubcommandBuilder} from "@discordjs/builders";
import {TopConstants} from "../../../../Lib/src/constants/TopConstants";
import {DraftBotErrorEmbed} from "../../messages/DraftBotErrorEmbed";

async function getPacket(interaction: DraftbotInteraction): Promise<CommandTopPacketReq> {
	await interaction.deferReply();

	const subCommand = interaction.options.getSubcommand();
	const timing = interaction.options.getString("timing") as TopTiming ?? TopTiming.ALL_TIME;
	const page = interaction.options.getInteger("page") ?? undefined;

	return makePacket(CommandTopPacketReq, {
		timing,
		dataType: subCommand === i18n.t("discordBuilder:top.subcommands.score.name", {lng: LANGUAGE.ENGLISH})
			? TopDataType.SCORE
			: subCommand === i18n.t("discordBuilder:top.subcommands.glory.name", {lng: LANGUAGE.ENGLISH})
				? TopDataType.GLORY
				: TopDataType.GUILD,
		page
	});
}

function addTimingOption(builder: SlashCommandSubcommandBuilder): void {
	builder.addStringOption(option => SlashCommandBuilderGenerator.generateOption("top", "timing", option)
		.addChoices(
			{
				name: i18n.t("discordBuilder:top.timings.allTime", {lng: LANGUAGE.ENGLISH}),
				"name_localizations": {
					fr: i18n.t("discordBuilder:top.timings.allTime", {lng: LANGUAGE.FRENCH})
				}, value: TopConstants.TIMING_ALLTIME
			},
			{
				name: i18n.t("discordBuilder:top.timings.weekly", {lng: LANGUAGE.ENGLISH}),
				"name_localizations": {
					fr: i18n.t("discordBuilder:top.timings.weekly", {lng: LANGUAGE.FRENCH})
				}, value: TopConstants.TIMING_WEEKLY
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
		i18n.t("commands:top.level", {lng, level: element.attributes["3"]})
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
	const title = i18n.t(textKeys.title, {lng, minRank: packet.minRank, maxRank: packet.maxRank});

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

	await interaction.editReply({
		embeds: [
			new DraftBotEmbed()
				.setTitle(title)
				.setDescription(desc)
		]
	});
}

export async function handleCommandTopPacketResScore(context: PacketContext, packet: CommandTopPacketResScore): Promise<void> {
	await handleGenericTopPacketRes(context, packet, {
		title: packet.timing === TopTiming.ALL_TIME
			? "commands:top.titleScoreAllTime"
			: "commands:top.titleScoreWeekly",
		yourRankTitle: "commands:top.yourRankTitle",
		yourRank: packet.contextRank === 1 ? "commands:top.yourRankFirst" : "commands:top.yourRank",
		yourRankNone: {key: "commands:top.yourRankNoneScore", replacements: {}},
		youRankAtPage: "commands:top.yourRankAtPage",
		nobodyInTop: "commands:top.nobodyInTopPlayers"
	}, formatScoreAttributes);
}

export async function handleCommandTopPacketResGlory(context: PacketContext, packet: CommandTopPacketResGlory): Promise<void> {
	await handleGenericTopPacketRes(context, packet, {
		title: "commands:top.titleGlory",
		yourRankTitle: "commands:top.yourRankTitle",
		yourRank: "commands:top.yourRank",
		yourRankNone: {key: "commands:top.yourRankNoneGlory", replacements: {needFight: packet.needFight}},
		youRankAtPage: "commands:top.yourRankAtPage",
		nobodyInTop: "commands:top.nobodyInTopPlayers"
	}, formatGloryAttributes);
}

export async function handleCommandTopPacketResGuild(context: PacketContext, packet: CommandTopPacketResGuild): Promise<void> {
	await handleGenericTopPacketRes(context, packet, {
		title: "commands:top.titleGuild",
		yourRankTitle: "commands:top.yourRankGuildTitle",
		yourRank: packet.contextRank === 1 ? "commands:top.yourRankGuildFirst" : "commands:top.yourRankGuild",
		yourRankNone: {key: "commands:top.yourRankNoneGuild", replacements: {}},
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
				lng: context.discord!.language!,
				minPage: packet.minPage,
				maxPage: packet.maxPage
			}))
		]
	});
}