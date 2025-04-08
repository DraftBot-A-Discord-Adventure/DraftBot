import {
	makePacket, PacketContext
} from "../../../../Lib/src/packets/DraftBotPacket";
import { ReactionCollectorCreationPacket } from "../../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import { DiscordCache } from "../../bot/DiscordCache";
import {
	ReactionCollectorJoinBoatData
} from "../../../../Lib/src/packets/interaction/ReactionCollectorJoinBoat";
import { DraftBotEmbed } from "../../messages/DraftBotEmbed";
import i18n from "../../translations/i18n";
import { DiscordCollectorUtils } from "../../utils/DiscordCollectorUtils";
import { ReactionCollectorReturnTypeOrNull } from "../../packetHandlers/handlers/ReactionCollectorHandlers";
import {
	CommandJoinBoatAcceptPacketRes, CommandJoinBoatPacketReq,
	CommandJoinBoatRefusePacketRes
} from "../../../../Lib/src/packets/commands/CommandJoinBoatPacket";
import { SlashCommandBuilderGenerator } from "../SlashCommandBuilderGenerator";
import { ICommand } from "../ICommand";

export async function createJoinBoatCollector(context: PacketContext, packet: ReactionCollectorCreationPacket): Promise<ReactionCollectorReturnTypeOrNull> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction)!;
	await interaction.deferReply();
	const data = packet.data.data as ReactionCollectorJoinBoatData;
	const embed = new DraftBotEmbed().formatAuthor(i18n.t("commands:joinBoat.confirmationMessage.title.confirmation", {
		lng: interaction.userLanguage,
		pseudo: interaction.user.displayName
	}), interaction.user)
		.setDescription(
			i18n.t("commands:joinBoat.confirmationMessage.description.confirmation.text", {
				lng: interaction.userLanguage,
				currentEnergy: data.energy.current,
				maxEnergy: data.energy.max,
				priceText: i18n.t("commands:joinBoat.confirmationMessage.description.confirmation.priceText", {
					lng: interaction.userLanguage,
					count: data.price,
					gemsCost: data.price
				})
			})
		);

	return await DiscordCollectorUtils.createAcceptRefuseCollector(interaction, embed, packet, context);
}

export async function handleCommandJoinBoatAcceptPacketRes(packet: CommandJoinBoatAcceptPacketRes, context: PacketContext): Promise<void> {
	const originalInteraction = DiscordCache.getInteraction(context.discord!.interaction!);
	const buttonInteraction = DiscordCache.getButtonInteraction(context.discord!.buttonInteraction!);
	if (buttonInteraction && originalInteraction) {
		await buttonInteraction.editReply({
			embeds: [
				new DraftBotEmbed().formatAuthor(i18n.t("commands:joinBoat.confirmationMessage.title.confirmed", {
					lng: originalInteraction.userLanguage,
					pseudo: originalInteraction.user.displayName
				}), originalInteraction.user)
					.setDescription(
						i18n.t("commands:joinBoat.confirmationMessage.description.confirmed", {
							lng: originalInteraction.userLanguage,
							gainScore: packet.score <= 0
								? ""
								: i18n.t("commands:joinBoat.confirmationMessage.description.confirmedScore", {
									lng: originalInteraction.userLanguage,
									score: packet.score
								})
						})
					)
			]
		});
	}
}

export async function handleCommandJoinBoatRefusePacketRes(_packet: CommandJoinBoatRefusePacketRes, context: PacketContext): Promise<void> {
	const originalInteraction = DiscordCache.getInteraction(context.discord!.interaction!);
	if (!originalInteraction) {
		return;
	}
	const buttonInteraction = DiscordCache.getButtonInteraction(context.discord!.buttonInteraction!);
	await buttonInteraction?.editReply({
		embeds: [
			new DraftBotEmbed().formatAuthor(i18n.t("commands:joinBoat.confirmationMessage.title.confirmed", {
				lng: originalInteraction.userLanguage,
				pseudo: originalInteraction.user.displayName
			}), originalInteraction.user)
				.setDescription(
					i18n.t("commands:joinBoat.refuse", {
						lng: originalInteraction.userLanguage
					})
				)
				.setErrorColor()
		]
	});
}

/**
 * Demote an elder from a guild
 */
function getPacket(): CommandJoinBoatPacketReq {
	return makePacket(CommandJoinBoatPacketReq, {});
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("joinBoat"),
	getPacket,
	mainGuildCommand: false
};

