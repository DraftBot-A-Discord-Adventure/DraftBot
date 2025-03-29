import {DraftbotCachedMessage} from "./DraftbotCachedMessage";
import {PacketContext} from "../../../Lib/src/packets/DraftBotPacket";
import {DiscordCache} from "../bot/DiscordCache";
import {KeycloakUtils} from "../../../Lib/src/keycloak/KeycloakUtils";
import {keycloakConfig} from "../bot/DraftBotShard";
import {DraftBotEmbed} from "./DraftBotEmbed";
import i18n from "../translations/i18n";
import {ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, parseEmoji} from "discord.js";
import {EmoteUtils} from "../utils/EmoteUtils";
import {DraftBotIcons} from "../../../Lib/src/DraftBotIcons";
import {DiscordCollectorUtils} from "../utils/DiscordCollectorUtils";
import {ReactionCollectorCreationPacket} from "../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {
	ReactionCollectorFightChooseActionData,
	ReactionCollectorFightChooseActionReaction
} from "../../../Lib/src/packets/interaction/ReactionCollectorFightChooseAction";
import {ReactionCollectorReturnType} from "../packetHandlers/handlers/ReactionCollectorHandlers";
import {DiscordConstants} from "../DiscordConstants";

export class DraftbotActionChooseCachedMessage extends DraftbotCachedMessage<ReactionCollectorCreationPacket> {
	readonly duration = 30;

	get type(): string {
		return "action_choose";
	}

	updateMessage = async (packet: ReactionCollectorCreationPacket, context: PacketContext): Promise<ReactionCollectorReturnType> => {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction)!;
		const data = packet.data.data as ReactionCollectorFightChooseActionData;
		const fighter = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, data.fighterKeycloakId))!.attributes.gameUsername[0];
		const embed = new DraftBotEmbed().formatAuthor(i18n.t("commands:fight.fightActionChoose.turnIndicationTitle", {
			lng: interaction.userLanguage,
			pseudo: fighter
		}), interaction.user)
			.setDescription(i18n.t("commands:fight.fightActionChoose.turnIndicationDescription", {lng: interaction.userLanguage}));
		const rows = [new ActionRowBuilder<ButtonBuilder>()];
		const reactions = packet.reactions as {type: string, data: ReactionCollectorFightChooseActionReaction}[];
		reactions.forEach((action) => {
			const react = action.data as ReactionCollectorFightChooseActionReaction;
			const emoji = EmoteUtils.translateEmojiToDiscord(DraftBotIcons.fight_actions[react.id]);

			const button = new ButtonBuilder()
				.setEmoji(parseEmoji(emoji)!)
				.setCustomId(react.id)
				.setStyle(ButtonStyle.Secondary);

			if (rows[rows.length - 1].components.length >= DiscordConstants.MAX_BUTTONS_PER_ROW) {
				rows.push(new ActionRowBuilder<ButtonBuilder>());
			}
			rows[rows.length - 1].addComponents(button);
		});
		await this.post({
			embeds: [embed],
			components: rows
		});
		const buttonCollector = this.storedMessage!.createMessageComponentCollector({
			time: packet.endTime - Date.now()
		});
		buttonCollector.on("collect", (buttonInteraction: ButtonInteraction) => {
			if (buttonInteraction.user.id !== context.discord?.user) {
				return;
			}
			buttonCollector.stop();
			buttonInteraction.update({
				components: []
			});
			DiscordCollectorUtils.sendReaction(packet, context, context.keycloakId!, buttonInteraction, reactions.findIndex((reaction) => reaction.data.id === buttonInteraction.customId));
		});
		return [buttonCollector];
	};
}
