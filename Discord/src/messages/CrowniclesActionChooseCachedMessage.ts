import { CrowniclesCachedMessage } from "./CrowniclesCachedMessage";
import { PacketContext } from "../../../Lib/src/packets/CrowniclesPacket";
import { DiscordCache } from "../bot/DiscordCache";
import { crowniclesClient } from "../bot/CrowniclesShard";
import { CrowniclesEmbed } from "./CrowniclesEmbed";
import i18n from "../translations/i18n";
import {
	ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, parseEmoji
} from "discord.js";
import { CrowniclesIcons } from "../../../Lib/src/CrowniclesIcons";
import {
	DiscordCollectorUtils,
	disableRows
} from "../utils/DiscordCollectorUtils";
import {
	ReactionCollectorFightChooseActionPacket,
	ReactionCollectorFightChooseActionReaction
} from "../../../Lib/src/packets/interaction/ReactionCollectorFightChooseAction";
import { ReactionCollectorReturnTypeOrNull } from "../packetHandlers/handlers/ReactionCollectorHandlers";
import { DiscordConstants } from "../DiscordConstants";
import { sendInteractionNotForYou } from "../utils/ErrorUtils";
import { DisplayUtils } from "../utils/DisplayUtils";
import { CrowniclesLogger } from "../../../Lib/src/logs/CrowniclesLogger";

/**
 * Disable the action buttons; a failed acknowledgement is only logged so the chosen action still reaches Core (#4877)
 */
async function acknowledgeActionClick(buttonInteraction: ButtonInteraction, rows: ActionRowBuilder<ButtonBuilder>[]): Promise<void> {
	try {
		await buttonInteraction.update({ components: rows });
	}
	catch (error) {
		CrowniclesLogger.warn("Fight action choice could not be acknowledged, sending it anyway", {
			reason: error instanceof Error ? error.message : String(error),
			interactionAgeMs: Date.now() - buttonInteraction.createdTimestamp
		});
	}
}

export class CrowniclesActionChooseCachedMessage extends CrowniclesCachedMessage<ReactionCollectorFightChooseActionPacket> {
	private usernameCache?: string;

	readonly duration = 30;

	get type(): string {
		return "action_choose";
	}

	updateMessage = async (packet: ReactionCollectorFightChooseActionPacket, context: PacketContext): Promise<ReactionCollectorReturnTypeOrNull> => {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		const data = packet.data.data;
		const lng = interaction?.userLanguage ?? context.discord!.language;
		const user = interaction?.user ?? await crowniclesClient.users.fetch(context.discord!.user);
		if (!this.usernameCache) {
			this.usernameCache = await DisplayUtils.getEscapedUsername(data.fighterKeycloakId, lng);
		}
		const embed = new CrowniclesEmbed().formatAuthor(i18n.t("commands:fight.fightActionChoose.turnIndicationTitle", {
			lng,
			pseudo: this.usernameCache
		}), user)
			.setDescription(i18n.t("commands:fight.fightActionChoose.turnIndicationDescription", { lng }));
		const rows = [new ActionRowBuilder<ButtonBuilder>()];
		const reactions = packet.reactions as {
			type: string; data: ReactionCollectorFightChooseActionReaction;
		}[];
		reactions.forEach(action => {
			const react = action.data as ReactionCollectorFightChooseActionReaction;
			const emoji = CrowniclesIcons.fightActions[react.id];

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
		}, context.discord!.channel);
		if (!msg) {
			return null;
		}
		const buttonCollector = msg.createMessageComponentCollector({
			time: packet.endTime - Date.now()
		});
		let actionSent = false;
		buttonCollector.on("collect", async (buttonInteraction: ButtonInteraction) => {
			if (buttonInteraction.user.id !== context.discord?.user) {
				await sendInteractionNotForYou(buttonInteraction.user, buttonInteraction, lng);
				return;
			}

			// Clicks queued while the shard was lagging: only the first one is the chosen action
			if (actionSent) {
				await buttonInteraction.deferUpdate().catch(() => null);
				return;
			}
			actionSent = true;

			disableRows(rows);
			await acknowledgeActionClick(buttonInteraction, rows);
			DiscordCollectorUtils.sendReaction(packet, context, context.keycloakId!, buttonInteraction, reactions.findIndex(reaction => reaction.data.id === buttonInteraction.customId));
		});
		return [buttonCollector];
	};
}
