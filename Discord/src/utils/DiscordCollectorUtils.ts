import {makePacket, PacketContext} from "../../../Lib/src/packets/DraftBotPacket";
import {
	ReactionCollectorAcceptReaction,
	ReactionCollectorCreationPacket,
	ReactionCollectorReactPacket,
	ReactionCollectorRefuseReaction
} from "../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {DiscordCache} from "../bot/DiscordCache";
import {KeycloakUser} from "../../../Lib/src/keycloak/KeycloakUser";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	Message,
	MessageComponentInteraction,
	parseEmoji
} from "discord.js";
import {DraftBotIcons} from "../../../Lib/src/DraftBotIcons";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {DraftbotInteraction} from "../messages/DraftbotInteraction";
import {sendInteractionNotForYou} from "./ErrorUtils";
import {PacketUtils} from "./PacketUtils";
import {keycloakConfig} from "../bot/DraftBotShard.js";
import {KeycloakUtils} from "../../../Lib/src/keycloak/KeycloakUtils.js";

export class DiscordCollectorUtils {
	private static choiceListEmotes = ["1⃣", "2⃣", "3⃣", "4⃣", "5⃣", "6⃣", "7⃣", "8⃣", "9⃣"];

	static sendReaction(packet: ReactionCollectorCreationPacket, context: PacketContext, userKeycloakId: KeycloakUser["id"], button: MessageComponentInteraction | null, reactionIndex: number): void {
		const responsePacket = makePacket(
			ReactionCollectorReactPacket,
			{
				id: packet.id,
				keycloakId: userKeycloakId,
				reactionIndex
			}
		);

		if (button && button.isButton()) {
			DiscordCache.cacheButtonInteraction(button);
		}

		PacketUtils.sendPacketToBackend({
			keycloakId: userKeycloakId,
			discord: {
				user: context.discord!.user,
				channel: context.discord!.channel,
				interaction: context.discord!.interaction,
				buttonInteraction: button?.id,
				language: context.discord!.language
			}
		}, responsePacket);
	}

	static async createAcceptRefuseCollector(
		interaction: DraftbotInteraction,
		messageContentOrEmbed: DraftBotEmbed | string,
		reactionCollectorCreationPacket: ReactionCollectorCreationPacket,
		context: PacketContext,
		options?: {
			acceptedUsersId?: string[]
		},
		emojis = {
			accept: DraftBotIcons.collectors.accept,
			refuse: DraftBotIcons.collectors.refuse
		}
	): Promise<void> {
		let users: KeycloakUser[] = [];
		if (options?.acceptedUsersId) {
			for (const id of options.acceptedUsersId) {
				const user = await KeycloakUtils.getUserByKeycloakId(keycloakConfig, id);
				if (user) {
					users.push(user);
				}
			}
		}
		else {
			users = [(await KeycloakUtils.getUserByKeycloakId(keycloakConfig, context.keycloakId!))!];
		}

		const row = new ActionRowBuilder<ButtonBuilder>();

		// Create buttons
		const acceptCustomId = "accept";
		const buttonAccept = new ButtonBuilder()
			.setEmoji(parseEmoji(emojis.accept)!)
			.setCustomId(acceptCustomId)
			.setStyle(ButtonStyle.Secondary);
		row.addComponents(buttonAccept);

		const buttonRefuse = new ButtonBuilder()
			.setEmoji(parseEmoji(emojis.refuse)!)
			.setCustomId("refuse")
			.setStyle(ButtonStyle.Secondary);
		row.addComponents(buttonRefuse);

		const sendFunction = reactionCollectorCreationPacket.mainPacket ? interaction.editReply : interaction.channel.send;

		// Edit message
		let msg: Message;
		if (messageContentOrEmbed instanceof DraftBotEmbed) {
			msg = await sendFunction({
				embeds: [messageContentOrEmbed],
				components: [row]
			}) as Message;
		}
		else {
			msg = await sendFunction({
				content: messageContentOrEmbed,
				components: [row]
			}) as Message;
		}

		// Create a button collector
		const buttonCollector = msg.createMessageComponentCollector({
			time: reactionCollectorCreationPacket.endTime - Date.now()
		});

		// Send an error if someone uses the collector that is not intended for them and stop if it's the owner
		buttonCollector.on("collect", async (i: ButtonInteraction) => {
			if (!users.find(user => user.attributes.discordId?.includes(i.user.id))) {
				await sendInteractionNotForYou(i.user, i, interaction.userLanguage);
				return;
			}

			buttonCollector.stop();
		});

		// Collector end
		buttonCollector.on("end", async (collected) => {
			const firstReaction = collected.first() as ButtonInteraction;
			const user = await KeycloakUtils.getDiscordUser(keycloakConfig, firstReaction.user.id, null);
			if (firstReaction) {
				await firstReaction.deferReply();

				// Accept collector
				if (firstReaction && firstReaction.customId === acceptCustomId) {
					DiscordCollectorUtils.sendReaction(
						reactionCollectorCreationPacket,
						context,
						context.keycloakId!,
						firstReaction,
						reactionCollectorCreationPacket.reactions.findIndex((reaction) => reaction.type === ReactionCollectorAcceptReaction.name)
					);
				}
				// Refuse collector
				else {
					DiscordCollectorUtils.sendReaction(
						reactionCollectorCreationPacket,
						context,
						context.keycloakId!,
						firstReaction,
						reactionCollectorCreationPacket.reactions.findIndex((reaction) => reaction.type === ReactionCollectorRefuseReaction.name)
					);
				}
			}
		});
	}

	static async createChoiceListCollector(
		interaction: DraftbotInteraction,
		messageContentOrEmbed: DraftBotEmbed | string,
		reactionCollectorCreationPacket: ReactionCollectorCreationPacket,
		context: PacketContext,
		items: string[],
		canRefuse: boolean
	): Promise<void> {
		if (items.length > DiscordCollectorUtils.choiceListEmotes.length) {
			throw "Too many items to display";
		}

		let choiceDesc = "";
		const row = new ActionRowBuilder<ButtonBuilder>();
		// Create buttons
		for (let i = 0; i < items.length; ++i) {
			const button = new ButtonBuilder()
				.setEmoji(parseEmoji(DiscordCollectorUtils.choiceListEmotes[i])!)
				.setCustomId(i.toString())
				.setStyle(ButtonStyle.Secondary);
			row.addComponents(button);
			choiceDesc += `${DiscordCollectorUtils.choiceListEmotes[i]} - ${items[i]}\n`;
		}

		if (canRefuse) {
			const buttonRefuse = new ButtonBuilder()
				.setEmoji(parseEmoji(DraftBotIcons.collectors.refuse)!)
				.setCustomId("refuse")
				.setStyle(ButtonStyle.Secondary);
			row.addComponents(buttonRefuse);
		}

		// Add a choice description to the embed
		if (messageContentOrEmbed instanceof DraftBotEmbed) {
			messageContentOrEmbed.setDescription((messageContentOrEmbed.data.description ?? "") + choiceDesc);
		}
		else {
			messageContentOrEmbed += choiceDesc;
		}

		// Edit message
		let msg: Message;
		if (messageContentOrEmbed instanceof DraftBotEmbed) {
			msg = await interaction?.channel.send({
				embeds: [messageContentOrEmbed],
				components: [row]
			}) as Message;
		}
		else {
			msg = await interaction?.channel.send({
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

			if (firstReaction) {
				await firstReaction.deferReply();
				if (firstReaction.customId !== "refuse") {
					DiscordCollectorUtils.sendReaction(reactionCollectorCreationPacket, context, context.keycloakId!, firstReaction, parseInt(firstReaction.customId));
					return;
				}
			}

			DiscordCollectorUtils.sendReaction(reactionCollectorCreationPacket, context, context.keycloakId!, firstReaction, items.length);
		});
	}
}