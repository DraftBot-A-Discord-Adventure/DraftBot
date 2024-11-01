import {makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {ICommand} from "../ICommand";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {CommandShopPacketReq} from "../../../../Lib/src/packets/commands/CommandShopPacket";
import {DiscordCache} from "../../bot/DiscordCache";
import {DraftBotEmbed} from "../../messages/DraftBotEmbed";
import i18n from "../../translations/i18n";
import {sendErrorMessage, sendInteractionNotForYou} from "../../utils/ErrorUtils";
import {BadgeConstants} from "../../../../Lib/src/constants/BadgeConstants";
import {ReactionCollectorCreationPacket} from "../../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {
	ReactionCollectorShopData,
	ReactionCollectorShopItemReaction
} from "../../../../Lib/src/packets/interaction/ReactionCollectorShop";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	Message,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder
} from "discord.js";
import {DisplayUtils} from "../../utils/DisplayUtils";
import {Constants} from "../../../../Lib/src/constants/Constants";
import {DiscordCollectorUtils} from "../../utils/DiscordCollectorUtils";

function getPacket(): CommandShopPacketReq {
	return makePacket(CommandShopPacketReq, {});
}

export async function handleCommandShopClosed(context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction!);

	if (interaction) {
		await interaction.channel.send({
			embeds: [
				new DraftBotEmbed()
					.formatAuthor(i18n.t("commands:shop.closeShopTitle", {lng: interaction.userLanguage}), interaction.user)
					.setDescription(i18n.t("commands:shop.closeShop", {lng: interaction.userLanguage}))
			]
		});
	}
}

export async function handleCommandShopNoAlterationToHeal(context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction!);

	if (interaction) {
		await sendErrorMessage(interaction.user, interaction, i18n.t("commands:shop.noAlterationToHeal", {lng: interaction.userLanguage}));
	}
}

export async function handleCommandShopHealAlterationDone(context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction!);

	if (interaction) {
		await interaction.channel.send({
			embeds: [
				new DraftBotEmbed()
					.formatAuthor(i18n.t("commands:shop.success", {lng: interaction.userLanguage}), interaction.user)
					.setDescription(i18n.t("commands:shop.healAlteration", {lng: interaction.userLanguage}))
			]
		});
	}
}

export async function handleCommandShopTooManyEnergyBought(context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction!);

	if (interaction) {
		await sendErrorMessage(interaction.user, interaction, i18n.t("commands:shop.tooManyEnergyBought", {lng: interaction.userLanguage}));
	}
}

export async function handleCommandShopNoEnergyToHeal(context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction!);

	if (interaction) {
		await sendErrorMessage(interaction.user, interaction, i18n.t("commands:shop.noEnergyToHeal", {lng: interaction.userLanguage}));
	}
}

export async function handleCommandShopFullRegen(context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction!);

	if (interaction) {
		await interaction.channel.send({
			embeds: [
				new DraftBotEmbed()
					.formatAuthor(i18n.t("commands:shop.success", {lng: interaction.userLanguage}), interaction.user)
					.setDescription(i18n.t("commands:shop.fullRegen", {lng: interaction.userLanguage}))
			]
		});
	}
}

export async function handleCommandShopAlreadyHaveBadge(context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction!);

	if (interaction) {
		await sendErrorMessage(interaction.user, interaction, i18n.t("commands:shop.alreadyHaveBadge", {lng: interaction.userLanguage}));
	}
}

export async function handleCommandShopBadgeBought(context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction!);

	if (interaction) {
		await interaction.channel.send({
			embeds: [
				new DraftBotEmbed()
					.formatAuthor(i18n.t("commands:shop.success", {lng: interaction.userLanguage}), interaction.user)
					.setDescription(i18n.t("commands:shop.badgeBought", {
						lng: interaction.userLanguage,
						badge: BadgeConstants.RICH_PERSON
					}))
			]
		});
	}
}

export async function handleCommandShopBoughtTooMuchDailyPotions(context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction!);

	if (interaction) {
		await sendErrorMessage(interaction.user, interaction, i18n.t("commands:shop.boughtTooMuchDailyPotions", {lng: interaction.userLanguage}));
	}
}

export async function handleCommandShopNotEnoughMoney(context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction!);

	if (interaction) {
		await sendErrorMessage(interaction.user, interaction, i18n.t("commands:shop.notEnoughMoney", {lng: interaction.userLanguage}));
	}
}

export async function handleReactionCollectorBuyCategorySlotBuySuccess(context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction!);

	if (interaction) {
		await interaction.channel.send({
			embeds: [
				new DraftBotEmbed()
					.formatAuthor(i18n.t("commands:shop.success", {lng: interaction.userLanguage}), interaction.user)
					.setDescription(i18n.t("commands:shop.buyCategorySlotSuccess", {lng: interaction.userLanguage}))
			]
		});
	}
}

export async function shopCollector(packet: ReactionCollectorCreationPacket, context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction!)!;
	const data = packet.data.data as ReactionCollectorShopData;

	const categories: string[] = [];
	for (const reaction of packet.reactions) {
		if (reaction.type === ReactionCollectorShopItemReaction.name && categories.indexOf((reaction.data as ReactionCollectorShopItemReaction).shopCategoryId) === -1) {
			categories.push((reaction.data as ReactionCollectorShopItemReaction).shopCategoryId);
		}
	}


	let shopText = "";
	const select = new StringSelectMenuBuilder()
		.setCustomId("shop")
		.setPlaceholder(i18n.t("commands:shop.shopSelectPlaceholder", {lng: interaction.userLanguage}));
	for (const categoryId of categories) {
		const categoryItems = packet.reactions.filter(
			reaction => reaction.type === ReactionCollectorShopItemReaction.name && (reaction.data as ReactionCollectorShopItemReaction).shopCategoryId === categoryId
		);
		shopText += `**${i18n.t(`commands:shop.shopCategories.${categoryId}`, {lng: interaction.userLanguage})}** :\n`;
		shopText += categoryItems.map(item => {
			const reaction = (item.data as ReactionCollectorShopItemReaction);
			let shopItemName;
			let shopItemNameShort;
			if (reaction.shopItemId === "dailyPotion") {
				shopItemName = DisplayUtils.getItemDisplayWithStats(data.dailyPotion!, interaction.userLanguage);
				shopItemNameShort = DisplayUtils.getItemDisplay({
					id: data.dailyPotion!.id,
					category: data.dailyPotion!.category
				}, interaction.userLanguage);
			}
			else {
				shopItemName = i18n.t(`commands:shop.shopItems.${reaction.shopItemId}`, {
					lng: interaction.userLanguage,
					interpolation: {escapeValue: false}
				});
				shopItemNameShort = shopItemName;
			}

			select.addOptions(new StringSelectMenuOptionBuilder()
				.setLabel(shopItemNameShort)
				.setDescription(i18n.t("commands:shop.shopItemsSelectDescription", {
					lng: interaction.userLanguage,
					price: reaction.price
				}))
				.setValue(packet.reactions.findIndex(reaction => reaction === item).toString()));
			return i18n.t("commands:shop.shopItemsDisplay", {
				lng: interaction.userLanguage,
				name: shopItemName,
				price: reaction.price,
				interpolation: {escapeValue: false},
				remainingPotions: data.remainingPotions
			}) + "\n";
		}) + "\n";
	}

	const closeShopButton = new ButtonBuilder()
		.setCustomId("closeShop")
		.setLabel(i18n.t("commands:shop.closeShopButton", {lng: interaction.userLanguage}))
		.setStyle(ButtonStyle.Secondary);

	const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(closeShopButton);
	const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

	const embed = new DraftBotEmbed()
		.setTitle(i18n.t("commands:shop.title", {lng: interaction.userLanguage}))
		.setDescription(shopText + i18n.t("commands:shop.currentMoney", {
			lng: interaction.userLanguage,
			money: data.availableMoney
		}));

	const msg = await interaction.reply({
		embeds: [embed],
		components: [buttonRow, selectRow],
		fetchReply: true
	}) as Message;

	const buttonCollector = msg.createMessageComponentCollector({
		time: packet.endTime - Date.now()
	});

	const endCollector = msg.createReactionCollector({
		time: packet.endTime - Date.now(),
		filter: (reaction, user) => reaction.emoji.name === Constants.REACTIONS.NOT_REPLIED_REACTION && user.id === interaction.user.id
	});

	const buySomething = (reactionId: string, buttonInteraction: ButtonInteraction | null): void => {
		console.log(categories);
		console.log(reactionId);
		DiscordCollectorUtils.sendReaction(packet, context, context.keycloakId!, buttonInteraction, packet.reactions.findIndex(reaction => reaction.type === reactionId));
	};

	buttonCollector.on("collect", async (i: ButtonInteraction) => {
		if (i.user.id !== context.discord?.user) {
			await sendInteractionNotForYou(i.user, i, interaction.userLanguage);
			return;
		}

		buttonCollector.stop();
		endCollector.stop();
	});
	buttonCollector.on("end", async (collected) => {
		const firstReaction = collected.first();

		if (firstReaction) {
			if (firstReaction.customId === "shop") []
			await firstReaction.deferReply();
			buySomething(firstReaction.customId, firstReaction);
		}
	});

	endCollector.on("collect", () => {
		buttonCollector.stop();
		endCollector.stop();

		buySomething("end", null);
	});
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("shop"),
	getPacket,
	requirements: {},
	mainGuildCommand: false
};