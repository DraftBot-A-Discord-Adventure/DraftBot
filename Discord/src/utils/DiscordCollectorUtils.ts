import {makePacket, PacketContext} from "../../../Lib/src/packets/DraftBotPacket";
import {
	ReactionCollectorAcceptReaction,
	ReactionCollectorCreationPacket,
	ReactionCollectorReactPacket, ReactionCollectorRefuseReaction
} from "../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {DiscordCache} from "../bot/DiscordCache";
import {DiscordWebSocket} from "../bot/Websocket";
import {KeycloakUser} from "../../../Lib/src/keycloak/KeycloakUser";
import {ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, Message, parseEmoji} from "discord.js";
import {DraftBotIcons} from "../../../Lib/src/DraftBotIcons";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {DraftbotInteraction} from "../messages/DraftbotInteraction";
import {sendInteractionNotForYou} from "./ErrorUtils";
import {KeycloakUtils} from "../../../Lib/src/keycloak/KeycloakUtils";
import {keycloakConfig} from "../bot/DraftBotShard";

export class DiscordCollectorUtils {
	static sendReaction(packet: ReactionCollectorCreationPacket, context: PacketContext, user: KeycloakUser, button: ButtonInteraction | null, reactionIndex: number): void {
		const responsePacket = makePacket(
			ReactionCollectorReactPacket,
			{
				id: packet.id,
				keycloakId: user.id,
				reactionIndex: reactionIndex
			}
		);

		if (button) {
			DiscordCache.cacheButtonInteraction(button);
		}
		DiscordWebSocket.socket!.send(JSON.stringify({
			packet: {
				name: responsePacket.constructor.name,
				data: responsePacket
			},
			context: {
				keycloakId: user.id,
				discord: {
					user: context.discord!.user,
					channel: context.discord!.channel,
					interaction: context.discord!.interaction,
					buttonInteraction: button?.id,
					language: context.discord!.language
				}
			}
		}));
	}

	static async createAcceptRefuseCollector(
		interaction: DraftbotInteraction,
		messageContentOrEmbed: DraftBotEmbed | string,
		reactionCollectorCreationPacket: ReactionCollectorCreationPacket,
		context: PacketContext
	): Promise<void> {
		const user = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, context.keycloakId!))!;

		const row = new ActionRowBuilder<ButtonBuilder>();

		// Create buttons
		const acceptCustomId = "accept";
		const buttonAccept = new ButtonBuilder()
			.setEmoji(parseEmoji(DraftBotIcons.collectors.accept)!)
			.setCustomId(acceptCustomId)
			.setStyle(ButtonStyle.Secondary);
		row.addComponents(buttonAccept);

		const buttonRefuse = new ButtonBuilder()
			.setEmoji(parseEmoji(DraftBotIcons.collectors.refuse)!)
			.setCustomId("refuse")
			.setStyle(ButtonStyle.Secondary);
		row.addComponents(buttonRefuse);

		// Edit message
		let msg: Message;
		if (messageContentOrEmbed instanceof DraftBotEmbed) {
			msg = await interaction?.editReply({
				embeds: [messageContentOrEmbed],
				components: [row]
			}) as Message;
		}
		else {
			msg = await interaction?.editReply({
				content: messageContentOrEmbed,
				components: [row]
			}) as Message;
		}

		// Create button collector
		const buttonCollector = msg.createMessageComponentCollector({
			time: reactionCollectorCreationPacket.endTime - Date.now()
		});

		// Send an error if someone uses the collector that is not intended for them and stop if it's the owner
		buttonCollector.on("collect", async (i: ButtonInteraction) => {
			if (i.user.id !== context.discord?.user) {
				await sendInteractionNotForYou(i.user, i, interaction.userLanguage);
				return;
			}

			buttonCollector.stop();
		});

		// Collector end
		buttonCollector.on("end", async (collected) => {
			const firstReaction = collected.first() as ButtonInteraction;
			await firstReaction.deferReply();

			// Accept collector
			if (firstReaction && firstReaction.customId === acceptCustomId) {
				DiscordCollectorUtils.sendReaction(
					reactionCollectorCreationPacket,
					context,
					user,
					firstReaction,
					reactionCollectorCreationPacket.reactions.findIndex((reaction) => reaction.type === ReactionCollectorAcceptReaction.name)
				);
			}
			// Refuse collector
			else {
				DiscordCollectorUtils.sendReaction(
					reactionCollectorCreationPacket,
					context,
					user,
					firstReaction,
					reactionCollectorCreationPacket.reactions.findIndex((reaction) => reaction.type === ReactionCollectorRefuseReaction.name)
				);
			}
		});
	}
}