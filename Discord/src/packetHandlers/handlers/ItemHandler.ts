import {packetHandler} from "../PacketHandler";
import {ItemAcceptPacket} from "../../../../Lib/src/packets/notifications/ItemAcceptPacket";
import {WebSocket} from "ws";
import {PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {ItemFoundPacket} from "../../../../Lib/src/packets/notifications/ItemFoundPacket";
import {ItemRefusePacket} from "../../../../Lib/src/packets/notifications/ItemRefusePacket";
import {DiscordCache} from "../../bot/DiscordCache";
import {DraftBotEmbed} from "../../messages/DraftBotEmbed";
import i18n from "../../translations/i18n";
import {DisplayUtils} from "../../utils/DisplayUtils";
import {ItemCategory} from "../../../../Lib/src/constants/ItemConstants";

export default class ItemHandler {
	@packetHandler(ItemAcceptPacket)
	async itemAcceptHandler(socket: WebSocket, packet: ItemAcceptPacket, context: PacketContext): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		if (interaction) {
			const menuEmbed = new DraftBotEmbed()
				.formatAuthor(i18n.t("commands:inventory.acceptedTitle", { lng: interaction.userLanguage, pseudo: interaction.user.username }), interaction.user)
				.setDescription(DisplayUtils.getItemDisplay(packet.category, packet.id, interaction.userLanguage));
			await interaction.channel.send({ embeds: [menuEmbed] });
		}
	}

	@packetHandler(ItemFoundPacket)
	async itemFoundHandler(socket: WebSocket, packet: ItemFoundPacket, context: PacketContext): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		if (interaction) {
			await interaction.channel.send({
				embeds: [
					new DraftBotEmbed()
						.formatAuthor(i18n.t("commands:inventory.randomItemTitle", {lng: interaction.userLanguage, pseudo: interaction.user.username}), interaction.user)
						.setDescription(DisplayUtils.getItemDisplay(packet.category, packet.id, interaction.userLanguage))
				]
			});
		}
	}

	@packetHandler(ItemRefusePacket)
	async itemRefuseHandler(socket: WebSocket, packet: ItemRefusePacket, context: PacketContext): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		if (interaction) {
			const menuEmbed = new DraftBotEmbed();
			if (packet.category === ItemCategory.POTION) {
				menuEmbed
					.formatAuthor(
						packet.autoSell
							? i18n.t("commands:sell.soldMessageAlreadyOwnTitle", {lng: interaction.userLanguage, pseudo: interaction.user.username})
							: i18n.t("commands:sell.soldMessageTitle", {lng: interaction.userLanguage, pseudo: interaction.user.username}),
						interaction.user
					)
					.setDescription(i18n.t("commands:sell.soldMessage", {
						lng: interaction.userLanguage,
						item: DisplayUtils.getItemDisplay(packet.category, packet.id, interaction.userLanguage),
						money: packet.soldMoney
					}));
			}
			else {
				menuEmbed
					.formatAuthor(
						packet.autoSell
							? i18n.t("commands:sell.soldMessageAlreadyOwnTitle", {lng: interaction.userLanguage, pseudo: interaction.user.username})
							: i18n.t("commands:sell.potionDestroyedTitle", {lng: interaction.userLanguage, pseudo: interaction.user.username}),
						interaction.user
					)
					.setDescription(i18n.t("commands:sell.potionDestroyedMessage", {
						lng: interaction.userLanguage,
						item: DisplayUtils.getItemDisplay(packet.category, packet.id, interaction.userLanguage)
					}));
			}
			await interaction.channel.send({embeds: [menuEmbed]});
		}
	}
}