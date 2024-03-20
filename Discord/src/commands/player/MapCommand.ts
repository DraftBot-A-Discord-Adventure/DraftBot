import {DraftbotInteraction} from "../../messages/DraftbotInteraction";
import {KeycloakUser} from "../../../../Lib/src/keycloak/KeycloakUser";
import {CommandMapDisplayRes, CommandMapPacketReq} from "../../../../Lib/src/packets/commands/CommandMapPacket";
import {makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {ICommand} from "../ICommand";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {Effect} from "../../../../Lib/src/enums/Effect";
import {DiscordCache} from "../../bot/DiscordCache";
import {DraftBotEmbed} from "../../messages/DraftBotEmbed";
import i18n from "../../translations/i18n";
import {MapConstants} from "../../../../Lib/src/constants/MapConstants";
import {DraftBotIcons} from "../../../../Lib/src/DraftBotIcons";

function getPacket(interaction: DraftbotInteraction, user: KeycloakUser): Promise<CommandMapPacketReq> {
	return Promise.resolve(makePacket(CommandMapPacketReq, {keycloakId: user.id, language: interaction.userLanguage}));
}

export async function handleCommandMapDisplayRes(packet: CommandMapDisplayRes, context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction);

	if (interaction) {
		if (!packet.foundPlayer) {
			await interaction.reply({
				content: "commands:map.playerNotFound",
				ephemeral: true
			});
			return;
		}

		const embed = new DraftBotEmbed().formatAuthor(i18n.t("commands:map.title", {
			lng: interaction.userLanguage,
			pseudo: interaction.user.displayName
		}), interaction.user);

		// Todo: Find another way to replace the values between the brackets in the URL without using replace
		if (packet.data!.mapLink.forced) {
			embed.setImage(MapConstants.FORCED_MAPS_URL.replace("{name}", packet.data!.mapLink.name));
		} else {
			embed.setImage(MapConstants.MAP_URL_WITH_CURSOR.replace("{mapLink}", packet.data!.mapLink.name));
		}

		const mapName = i18n.t(`models:map_locations.${packet.data?.mapId}.name`, {
			lng: interaction.userLanguage,
			interpolation: { escapeValue: false }
		});

		const mapParticle = i18n.t(`models:map_locations.${packet.data?.mapId}.particle`, {
			lng: interaction.userLanguage
		});

		const mapDescription = i18n.t(`models:map_locations.${packet.data?.mapId}.description`, {
			lng: interaction.userLanguage,
			interpolation: { escapeValue: false }
		});

		embed.setDescription(i18n.t(packet.data!.inEvent
			? "commands:map.description.arrived"
			: "commands:map.description.ongoing", {
			lng: interaction.userLanguage,
			destination: mapName,
			particle: mapParticle,
			emote: DraftBotIcons.map_types[packet.data!.mapType],
			description: mapDescription,
			interpolation: { escapeValue: false }
		}));

		await interaction.reply({embeds: [embed]});
	}
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("map"),
	getPacket,
	requirements: {
		disallowEffects: [Effect.DEAD, Effect.NOT_STARTED]
	},
	mainGuildCommand: false
};