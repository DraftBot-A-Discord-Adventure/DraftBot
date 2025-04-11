import { DraftbotInteraction } from "../../messages/DraftbotInteraction";
import {
	CommandMapDisplayRes, CommandMapPacketReq
} from "../../../../Lib/src/packets/commands/CommandMapPacket";
import {
	makePacket, PacketContext
} from "../../../../Lib/src/packets/DraftBotPacket";
import { ICommand } from "../ICommand";
import { SlashCommandBuilderGenerator } from "../SlashCommandBuilderGenerator";
import { DiscordCache } from "../../bot/DiscordCache";
import { DraftBotEmbed } from "../../messages/DraftBotEmbed";
import i18n from "../../translations/i18n";
import { MapConstants } from "../../../../Lib/src/constants/MapConstants";
import { DraftBotIcons } from "../../../../Lib/src/DraftBotIcons";
import { EmoteUtils } from "../../utils/EmoteUtils";

function getPacket(interaction: DraftbotInteraction): Promise<CommandMapPacketReq> {
	return Promise.resolve(makePacket(CommandMapPacketReq, { language: interaction.userLanguage }));
}

/**
 * Sets the map image in the embed
 * @param embed
 * @param mapLink
 */
async function setEmbedMap(embed: DraftBotEmbed, mapLink: {
	name: string;
	fallback?: string;
	forced: boolean;
}): Promise<void> {
	if (mapLink.forced && !mapLink.fallback) {
		embed.setImage(MapConstants.FORCED_MAPS_URL.replace("{name}", mapLink.name));
	}
	else {
		await fetch(mapLink.forced
			? MapConstants.FORCED_MAPS_URL.replace("{name}", mapLink.name)
			: MapConstants.MAP_URL_WITH_CURSOR.replace("{mapLink}", mapLink.name))
			.then(res => {
				if (res.status !== 200 && mapLink.fallback) {
					embed.setImage(mapLink.forced
						? MapConstants.FORCED_MAPS_URL.replace("{name}", mapLink.fallback)
						: MapConstants.MAP_URL_WITH_CURSOR.replace("{mapLink}", mapLink.fallback));
				}
				else {
					embed.setImage(mapLink.forced
						? MapConstants.FORCED_MAPS_URL.replace("{name}", mapLink.name)
						: MapConstants.MAP_URL_WITH_CURSOR.replace("{mapLink}", mapLink.name));
				}
			})
			.catch(() => {
				if (mapLink.fallback) {
					embed.setImage(mapLink.forced
						? MapConstants.FORCED_MAPS_URL.replace("{name}", mapLink.fallback)
						: MapConstants.MAP_URL_WITH_CURSOR.replace("{mapLink}", mapLink.fallback));
				}
			});
	}
}

/**
 * Handles the response of the map command
 * @param packet
 * @param context
 */
export async function handleCommandMapDisplayRes(packet: CommandMapDisplayRes, context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction);

	if (!interaction) {
		return;
	}
	const lng = interaction.userLanguage;
	const embed = new DraftBotEmbed().formatAuthor(i18n.t("commands:map.title", {
		lng,
		pseudo: interaction.user.displayName
	}), interaction.user);
	await setEmbedMap(embed, packet.mapLink);
	const mapName = i18n.t(`models:map_locations.${packet.mapId}.name`, {
		lng,
		interpolation: { escapeValue: false }
	});
	const mapParticle = i18n.t(`models:map_locations.${packet.mapId}.particle`, { lng });
	const mapDescription = i18n.t(`models:map_locations.${packet.mapId}.description`, {
		lng,
		interpolation: { escapeValue: false }
	});
	embed.setDescription(i18n.t(packet.inEvent
		? "commands:map.description.arrived"
		: "commands:map.description.ongoing", {
		lng,
		destination: mapName,
		particle: mapParticle,
		emote: EmoteUtils.translateEmojiToDiscord(DraftBotIcons.mapTypes[packet.mapType]),
		description: mapDescription,
		interpolation: { escapeValue: false }
	}));
	await interaction.reply({ embeds: [embed] });
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("map"),
	getPacket,
	mainGuildCommand: false
};
