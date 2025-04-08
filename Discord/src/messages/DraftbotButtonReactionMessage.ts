import {
	ActionRowBuilder, ButtonBuilder, ButtonStyle
} from "discord.js";
import { DraftbotInteraction } from "./DraftbotInteraction";
import { DraftBotEmbed } from "./DraftBotEmbed";
import { EmoteUtils } from "../utils/EmoteUtils";
import { sendInteractionNotForYou } from "../utils/ErrorUtils";
import { DraftBotIcons } from "../../../Lib/src/DraftBotIcons";
import { DiscordCollectorUtils } from "../utils/DiscordCollectorUtils";
import { ReactionCollectorCreationPacket } from "../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import { PacketContext } from "../../../Lib/src/packets/DraftBotPacket";
import { ReactionCollectorReturnTypeOrNull } from "../packetHandlers/handlers/ReactionCollectorHandlers";

export type DraftbotButtonReaction = {
	customId: string;
	emote: string;
	description: string;
	buttonStyle?: ButtonStyle;
};

type DraftbotButtonReactionMessageOptions = {
	reactions: DraftbotButtonReaction[];
	embed: DraftBotEmbed;
	packet: ReactionCollectorCreationPacket;
	context: PacketContext;
	canEndReact?: boolean;
};

export class DraftbotButtonReactionMessage {
	private readonly _buttonRow: ActionRowBuilder<ButtonBuilder>;

	private readonly _embed: DraftBotEmbed;

	private readonly _interaction: DraftbotInteraction;

	private readonly _messageOptions: DraftbotButtonReactionMessageOptions;

	/**
	 * Create a new button reaction message: a message consisting of an embed and a list of buttons,
	 * one of which must be clicked
	 * @param interaction
	 * @param messageOptions
	 */
	constructor(interaction: DraftbotInteraction, messageOptions: DraftbotButtonReactionMessageOptions) {
		this._buttonRow = new ActionRowBuilder<ButtonBuilder>();
		this._buttonRow.addComponents(messageOptions.reactions.map(({
			emote,
			buttonStyle,
			customId
		}) =>
			new ButtonBuilder()
				.setCustomId(customId)
				.setStyle(buttonStyle ?? ButtonStyle.Secondary)
				.setEmoji(emote)));
		this._embed = messageOptions.embed;
		this._embed.setDescription(this._embed.toJSON().description + this.createMenuDescription(messageOptions.reactions));
		this._interaction = interaction;
		this._messageOptions = messageOptions;
	}

	sendReaction(customId: string | null): void {
		const indexes = this._messageOptions.reactions.map(r => r.customId);
		DiscordCollectorUtils.sendReaction(
			this._messageOptions.packet,
			this._messageOptions.context,
			this._messageOptions.context.keycloakId!,
			null,
			indexes.findIndex(r => r === customId)
		);
	}

	public async send(): Promise<ReactionCollectorReturnTypeOrNull> {
		const message = await this._interaction.editReply({
			embeds: [this._embed],
			components: [this._buttonRow]
		});

		const buttonCollector = message.createMessageComponentCollector({
			time: this._messageOptions.packet.endTime - Date.now()
		});

		const reactionCollector = this._messageOptions.canEndReact
			? message.createReactionCollector({
				filter: (reaction, user) => user.id === this._interaction.user.id && reaction.emoji.name === DraftBotIcons.messages.notReplied,
				time: this._messageOptions.packet.endTime - Date.now()
			})
			: null;

		buttonCollector.on("collect", async i => {
			if (i.user.id !== this._interaction.user.id) {
				await sendInteractionNotForYou(i.user, i, this._interaction.userLanguage);
				return;
			}

			this.sendReaction(i.customId);
		});

		reactionCollector?.on("collect", () => {
			this.sendReaction(null);
		});

		buttonCollector.on("end", async () => {
			await this._interaction.editReply({
				components: [],
				embeds: [this._embed]
			});
		});

		if (reactionCollector) {
			return [buttonCollector, reactionCollector];
		}

		return [buttonCollector];
	}

	/**
	 * Create the menu text
	 * @param reactions
	 */
	private createMenuDescription(reactions: DraftbotButtonReaction[]): string {
		return `\n\n${reactions.map(({
			emote,
			description
		}) =>
			`${EmoteUtils.translateEmojiToDiscord(emote)} ${description}`)
			.join("\n")
		}`;
	}
}
