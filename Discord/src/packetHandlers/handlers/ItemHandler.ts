import {packetHandler} from "../PacketHandler";
import {ItemAcceptPacket} from "../../../../Lib/src/packets/events/ItemAcceptPacket";
import {PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {ItemFoundPacket} from "../../../../Lib/src/packets/events/ItemFoundPacket";
import {ItemRefusePacket} from "../../../../Lib/src/packets/events/ItemRefusePacket";
import {DiscordCache} from "../../bot/DiscordCache";
import {DraftBotEmbed} from "../../messages/DraftBotEmbed";
import i18n from "../../translations/i18n";
import {DisplayUtils} from "../../utils/DisplayUtils";
import {ItemCategory} from "../../../../Lib/src/constants/ItemConstants";

export default class ItemHandler {
	@packetHandler(ItemAcceptPacket)
	async itemAcceptHandler(context: PacketContext, packet: ItemAcceptPacket): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		if (interaction) {
			const menuEmbed = new DraftBotEmbed()
				.formatAuthor(i18n.t("commands:inventory.acceptedTitle", {
					lng: interaction.userLanguage,
					pseudo: interaction.user.username
				}), interaction.user)
				.setDescription(DisplayUtils.getItemDisplayWithStats(packet.itemWithDetails, interaction.userLanguage));
			await interaction.channel.send({embeds: [menuEmbed]});
		}
	}

	@packetHandler(ItemFoundPacket)
	async itemFoundHandler(context: PacketContext, packet: ItemFoundPacket): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		if (interaction) {
			await interaction.channel.send({
				embeds: [
					new DraftBotEmbed()
						.formatAuthor(i18n.t("commands:inventory.randomItemTitle", {
							lng: interaction.userLanguage,
							pseudo: interaction.user.username
						}), interaction.user)
						.setDescription(DisplayUtils.getItemDisplayWithStats(packet.itemWithDetails, interaction.userLanguage))
				]
			});
		}
	}

	@packetHandler(ItemRefusePacket)
	async itemRefuseHandler(context: PacketContext, packet: ItemRefusePacket): Promise<void> {
		const interaction = DiscordCache.getInteraction(context.discord!.interaction);
		if (interaction) {
			const menuEmbed = new DraftBotEmbed();
			if (packet.item.category !== ItemCategory.POTION) {
				menuEmbed
					.formatAuthor(
						packet.autoSell
							? i18n.t("commands:sell.soldMessageAlreadyOwnTitle", {
								lng: interaction.userLanguage,
								pseudo: interaction.user.username
							})
							: i18n.t("commands:sell.soldMessageTitle", {
								lng: interaction.userLanguage,
								pseudo: interaction.user.username
							}),
						interaction.user
					)
					.setDescription(i18n.t("commands:sell.soldMessage", {
						lng: interaction.userLanguage,
						item: DisplayUtils.getItemDisplay(packet.item, interaction.userLanguage),
						value: packet.soldMoney,
						interpolation: {escapeValue: false}
					}));
			}
			else {
				menuEmbed
					.formatAuthor(
						packet.autoSell
							? i18n.t("commands:sell.soldMessageAlreadyOwnTitle", {
								lng: interaction.userLanguage,
								pseudo: interaction.user.username
							})
							: i18n.t("commands:sell.potionDestroyedTitle", {
								lng: interaction.userLanguage,
								pseudo: interaction.user.username
							}),
						interaction.user
					)
					.setDescription(i18n.t("commands:sell.potionDestroyedMessage", {
						lng: interaction.userLanguage,
						item: DisplayUtils.getItemDisplay(packet.item, interaction.userLanguage),
						interpolation: {escapeValue: false}
					}));
			}

			const buttonInteraction = context.discord!.buttonInteraction ? DiscordCache.getButtonInteraction(context.discord!.buttonInteraction!) : null;
			if (buttonInteraction && !buttonInteraction.replied) {
				await buttonInteraction.editReply({embeds: [menuEmbed]});
			}
			else {
				await interaction.channel.send({embeds: [menuEmbed]});
			}
		}
	}
}