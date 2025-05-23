import { DraftbotCachedMessage } from "./DraftbotCachedMessage";
import { PacketContext } from "../../../Lib/src/packets/DraftBotPacket";
import { DiscordCache } from "../bot/DiscordCache";
import { DraftBotEmbed } from "./DraftBotEmbed";
import i18n from "../translations/i18n";
import {
	ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, parseEmoji
} from "discord.js";
import { EmoteUtils } from "../utils/EmoteUtils";
import { DraftBotIcons } from "../../../Lib/src/DraftBotIcons";
import { DiscordCollectorUtils } from "../utils/DiscordCollectorUtils";
import { ReactionCollectorCreationPacket } from "../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {
	ReactionCollectorFightChooseActionData,
	ReactionCollectorFightChooseActionReaction
} from "../../../Lib/src/packets/interaction/ReactionCollectorFightChooseAction";
import { ReactionCollectorReturnTypeOrNull } from "../packetHandlers/handlers/ReactionCollectorHandlers";
import { DiscordConstants } from "../DiscordConstants";
import { sendInteractionNotForYou } from "../utils/ErrorUtils";
import { DisplayUtils } from "../utils/DisplayUtils";

export class DraftbotActionChooseCachedMessage extends DraftbotCachedMessage<ReactionCollectorCreationPacket> {
	private usernameCache?: string;

	readonly duration = 30;

	get type(): string {
		return "action_choose";
	}

	updateMessage = async (packet: ReactionCollectorCreationPacket, context: PacketContext): Promise<ReactionCollectorReturnTypeOrNull> => {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction)!;
		const data = packet.data.data as ReactionCollectorFightChooseActionData;
		const lng = interaction.userLanguage;
		if (!this.usernameCache) {
			this.usernameCache = await DisplayUtils.getEscapedUsername(data.fighterKeycloakId, interaction.userLanguage);
		}
		const embed = new DraftBotEmbed().formatAuthor(i18n.t("commands:fight.fightActionChoose.turnIndicationTitle", {
			lng,
			pseudo: this.usernameCache
		}), interaction.user)
			.setDescription(i18n.t("commands:fight.fightActionChoose.turnIndicationDescription", { lng }));
		const rows = [new ActionRowBuilder<ButtonBuilder>()];
		const reactions = packet.reactions as {
			type: string; data: ReactionCollectorFightChooseActionReaction;
		}[];
		reactions.forEach(action => {
			const react = action.data as ReactionCollectorFightChooseActionReaction;
			const emoji = EmoteUtils.translateEmojiToDiscord(DraftBotIcons.fightActions[react.id]);

			const button = new ButtonBuilder()
				.setEmoji(parseEmoji(emoji)!)
				.setCustomId(react.id)
				.setStyle(ButtonStyle.Secondary);

			if (rows[rows.length - 1].components.length >= DiscordConstants.MAX_BUTTONS_PER_ROW) {
				rows.push(new ActionRowBuilder<ButtonBuilder>());
			}
			rows[rows.length - 1].addComponents(button);
		});
		const msg = await this.post({
			embeds: [embed],
			components: rows
		});
		const buttonCollector = msg!.createMessageComponentCollector({
			time: packet.endTime - Date.now()
		});

		let expectedFighterId: string;
		if (context.discord?.user) {
			expectedFighterId = context.discord.user;
		}
		else {
			// TODO: Add proper logging if DraftBotLogger is available
			console.error("Error: context.discord.user is null or undefined in DraftbotActionChooseCachedMessage.ts");
			expectedFighterId = "undefined"; // Prevent accidental interaction processing
		}
		// TODO: Add proper logging if DraftBotLogger is available
		// console.log(`expectedFighterId: ${expectedFighterId}`);

		buttonCollector.on("collect", async (buttonInteraction: ButtonInteraction) => {
			// TODO: Add proper logging if DraftBotLogger is available
			console.log(`Fight Action Click: Clicker: ${buttonInteraction.user.id}, Expected: ${expectedFighterId}`);
			if (buttonInteraction.user.id !== expectedFighterId) {
				await sendInteractionNotForYou(buttonInteraction.user, buttonInteraction, lng);
				return;
			}
			await buttonInteraction.update({
				components: []
			});
			DiscordCollectorUtils.sendReaction(packet, context, context.keycloakId!, buttonInteraction, reactions.findIndex(reaction => reaction.data.id === buttonInteraction.customId));
		});
		return [buttonCollector];
	};
}
