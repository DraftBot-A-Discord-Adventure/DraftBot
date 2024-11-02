import {makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {ICommand} from "../ICommand";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {CommandShopPacketReq} from "../../../../Lib/src/packets/commands/CommandShopPacket";
import {DiscordCache} from "../../bot/DiscordCache";
import {DraftBotEmbed} from "../../messages/DraftBotEmbed";
import i18n from "../../translations/i18n";
import {sendErrorMessage, sendInteractionNotForYou, SendManner} from "../../utils/ErrorUtils";
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
	MessageComponentInteraction,
	parseEmoji,
	SelectMenuInteraction,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder
} from "discord.js";
import {DisplayUtils} from "../../utils/DisplayUtils";
import {Constants} from "../../../../Lib/src/constants/Constants";
import {PacketUtils} from "../../utils/PacketUtils";
import {ChangeBlockingReasonPacket} from "../../../../Lib/src/packets/utils/ChangeBlockingReasonPacket";
import {BlockingConstants} from "../../../../Lib/src/constants/BlockingConstants";
import {DraftBotIcons} from "../../../../Lib/src/DraftBotIcons";
import {EmoteUtils} from "../../utils/EmoteUtils";
import {Language} from "../../../../Lib/src/Language";
import {DiscordCollectorUtils} from "../../utils/DiscordCollectorUtils";

function getPacket(): CommandShopPacketReq {
	return makePacket(CommandShopPacketReq, {});
}

export async function handleCommandShopNoAlterationToHeal(context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction!);

	if (interaction) {
		await sendErrorMessage(interaction.user, interaction, i18n.t("commands:shop.noAlterationToHeal", {lng: interaction.userLanguage}), {sendManner: SendManner.FOLLOWUP});
	}
}

export async function handleCommandShopNoEnergyToHeal(context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction!);

	if (interaction) {
		await sendErrorMessage(interaction.user, interaction, i18n.t("commands:shop.noEnergyToHeal", {lng: interaction.userLanguage}), {sendManner: SendManner.FOLLOWUP});
	}
}

export async function handleCommandShopTooManyEnergyBought(context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction!);

	if (interaction) {
		await sendErrorMessage(interaction.user, interaction, i18n.t("commands:shop.tooManyEnergyBought", {lng: interaction.userLanguage}), {sendManner: SendManner.FOLLOWUP});
	}
}

export async function handleCommandShopAlreadyHaveBadge(context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction!);

	if (interaction) {
		await sendErrorMessage(interaction.user, interaction, i18n.t("commands:shop.alreadyHaveBadge", {lng: interaction.userLanguage}), {sendManner: SendManner.FOLLOWUP});
	}
}

export async function handleCommandShopBoughtTooMuchDailyPotions(context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction!);

	if (interaction) {
		await sendErrorMessage(interaction.user, interaction, i18n.t("commands:shop.boughtTooMuchDailyPotions", {lng: interaction.userLanguage}), {sendManner: SendManner.FOLLOWUP});
	}
}

export async function handleCommandShopNotEnoughMoney(context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction!);

	if (interaction) {
		await sendErrorMessage(interaction.user, interaction, i18n.t("commands:shop.notEnoughMoney", {lng: interaction.userLanguage}), {sendManner: SendManner.FOLLOWUP});
	}
}

export async function handleCommandShopHealAlterationDone(context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction!);

	await interaction?.followUp({
		embeds: [
			new DraftBotEmbed()
				.formatAuthor(i18n.t("commands:shop.success", {
					lng: interaction.userLanguage,
					pseudo: interaction.user.username
				}), interaction.user)
				.setDescription(i18n.t("commands:shop.healAlteration", {lng: interaction.userLanguage}))
		]
	});
}

export async function handleCommandShopFullRegen(context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction!);

	await interaction?.followUp({
		embeds: [
			new DraftBotEmbed()
				.formatAuthor(i18n.t("commands:shop.success", {
					lng: interaction.userLanguage,
					pseudo: interaction.user.username
				}), interaction.user)
				.setDescription(i18n.t("commands:shop.fullRegen", {lng: interaction.userLanguage}))
		]
	});
}

export async function handleCommandShopBadgeBought(context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction!);

	await interaction?.followUp({
		embeds: [
			new DraftBotEmbed()
				.formatAuthor(i18n.t("commands:shop.success", {
					lng: interaction.userLanguage,
					pseudo: interaction.user.username
				}), interaction.user)
				.setDescription(i18n.t("commands:shop.badgeBought", {
					lng: interaction.userLanguage,
					badge: EmoteUtils.translateEmojiToDiscord(DraftBotIcons.badges.richPerson)
				}))
		]
	});
}

export async function handleReactionCollectorBuyCategorySlotBuySuccess(context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction!);

	await interaction?.followUp({
		embeds: [
			new DraftBotEmbed()
				.formatAuthor(i18n.t("commands:shop.success", {
					lng: interaction.userLanguage,
					pseudo: interaction.user.username
				}), interaction.user)
				.setDescription(i18n.t("commands:shop.buyCategorySlotSuccess", {lng: interaction.userLanguage}))
		]
	});
}

export async function handleCommandShopClosed(context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction!);

	await (interaction?.replied ? interaction.followUp({
		embeds: [
			new DraftBotEmbed()
				.formatAuthor(i18n.t("commands:shop.closeShopTitle", {lng: interaction.userLanguage}), interaction.user)
				.setDescription(i18n.t("commands:shop.closeShop", {lng: interaction.userLanguage}))
		]
	}) : interaction?.reply({
		embeds: [
			new DraftBotEmbed()
				.formatAuthor(i18n.t("commands:shop.closeShopTitle", {
					lng: interaction.userLanguage,
					pseudo: interaction.user.username
				}), interaction.user)
				.setDescription(i18n.t("commands:shop.closeShop", {
					lng: interaction.userLanguage
				}))
		]
	}));
}

async function manageBuyoutConfirmation(packet: ReactionCollectorCreationPacket, context: PacketContext, data: ReactionCollectorShopData, reaction: ReactionCollectorShopItemReaction): Promise<void> {
	PacketUtils.sendPacketToBackend(context, makePacket(ChangeBlockingReasonPacket, {
		oldReason: BlockingConstants.REASONS.SHOP,
		newReason: BlockingConstants.REASONS.SHOP_CONFIRMATION
	}));

	const interaction = DiscordCache.getInteraction(context.discord!.interaction!);
	if (!interaction) {
		return;
	}
	const shopItemId = reaction.shopItemId;

	const row = new ActionRowBuilder<ButtonBuilder>();
	const buttonAccept = new ButtonBuilder()
		.setEmoji(parseEmoji(DraftBotIcons.collectors.accept)!)
		.setCustomId("accept")
		.setStyle(ButtonStyle.Secondary);
	row.addComponents(buttonAccept);

	const buttonRefuse = new ButtonBuilder()
		.setEmoji(parseEmoji(DraftBotIcons.collectors.refuse)!)
		.setCustomId("refuse")
		.setStyle(ButtonStyle.Secondary);
	row.addComponents(buttonRefuse);

	const shopItemNames = getShopItemNames(data, shopItemId, interaction.userLanguage);

	const msg = await interaction.followUp({
		embeds: [
			new DraftBotEmbed()
				.formatAuthor(i18n.t("commands:shop.shopConfirmationTitle", {
					lng: interaction.userLanguage,
					pseudo: interaction.user.username
				}), interaction.user)
				.setDescription(`${
					getShopItemDisplay(data, reaction, interaction.userLanguage, shopItemNames)
				}\n${EmoteUtils.translateEmojiToDiscord(DraftBotIcons.collectors.warning)}${
					i18n.t(`commands:shop.shopItems.${shopItemId}.info`, {
						lng: interaction.userLanguage
					})
				}`)
		],
		components: [row]
	});

	const buttonCollector = msg.createMessageComponentCollector({
		time: Constants.MESSAGES.COLLECTOR_TIME
	});

	let collectedInteraction: MessageComponentInteraction | null = null;

	buttonCollector.on("collect", async (i: ButtonInteraction) => {
		if (i.user.id !== context.discord?.user) {
			await sendInteractionNotForYou(i.user, i, interaction.userLanguage);
			return;
		}
		collectedInteraction = i;
		await collectedInteraction.update({components: []});
		buttonCollector.stop();
	});
	buttonCollector.on("end", async (collected) => {
		PacketUtils.sendPacketToBackend(context, makePacket(ChangeBlockingReasonPacket, {
			oldReason: BlockingConstants.REASONS.SHOP_CONFIRMATION,
			newReason: BlockingConstants.REASONS.NONE
		}));
		if (!collected.first() || collected.first()?.customId === "refuse") {
			await handleCommandShopClosed(context);
			return;
		}
		DiscordCollectorUtils.sendReaction(packet, context, context.keycloakId!, null, packet.reactions.findIndex(r =>
			r.type === ReactionCollectorShopItemReaction.name
			&& (r.data as ReactionCollectorShopItemReaction).shopItemId === reaction.shopItemId));
	});

}

type ShopItemNames = {
	normal: string,
	short: string
}

function getShopItemNames(data: ReactionCollectorShopData, shopItemId: string, lng: Language): ShopItemNames {
	if (shopItemId === "dailyPotion") {
		return {
			normal: DisplayUtils.getItemDisplayWithStats(data.dailyPotion!, lng),
			short: DisplayUtils.getItemDisplay({
				id: data.dailyPotion!.id,
				category: data.dailyPotion!.category
			}, lng)
		};
	}
	const bothNames = i18n.t(`commands:shop.shopItems.${shopItemId}.name`, {
		lng,
		interpolation: {escapeValue: false},
		shopItemEmote: EmoteUtils.translateEmojiToDiscord(DraftBotIcons.shopItems[shopItemId])
	});
	return {
		normal: `**${bothNames}**`,
		short: bothNames
	};
}

function getShopItemDisplay(data: ReactionCollectorShopData, reaction: ReactionCollectorShopItemReaction, lng: Language, shopItemNames: ShopItemNames): string {
	return `${i18n.t("commands:shop.shopItemsDisplay", {
		lng,
		name: shopItemNames.normal,
		price: reaction.price,
		interpolation: {escapeValue: false},
		remainingPotions: data.remainingPotions
	})}\n`;
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

	categories.sort((a, b) => a.localeCompare(b));


	let shopText = "";
	const select = new StringSelectMenuBuilder()
		.setCustomId("shop")
		.setPlaceholder(i18n.t("commands:shop.shopSelectPlaceholder", {lng: interaction.userLanguage}));
	for (const categoryId of categories) {
		const categoryItems = packet.reactions.filter(
			reaction => reaction.type === ReactionCollectorShopItemReaction.name && (reaction.data as ReactionCollectorShopItemReaction).shopCategoryId === categoryId
		);
		shopText += `${`**${i18n.t(`commands:shop.shopCategories.${categoryId}`, {
			lng: interaction.userLanguage,
			count: data.remainingPotions
		})}** :\n`
			.concat(...categoryItems.map(item => {
				const reaction = (item.data as ReactionCollectorShopItemReaction);
				const shopItemName = getShopItemNames(data, reaction.shopItemId, interaction.userLanguage);

				select.addOptions(new StringSelectMenuOptionBuilder()
					.setLabel(shopItemName.short)
					.setDescription(i18n.t("commands:shop.shopItemsSelectDescription", {
						lng: interaction.userLanguage,
						price: reaction.price
					}))
					.setValue(reaction.shopItemId));
				return getShopItemDisplay(data, reaction, interaction.userLanguage, shopItemName);
			}))}\n\n`;
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
		components: [selectRow, buttonRow],
		fetchReply: true
	}) as Message;

	const buttonCollector = msg.createMessageComponentCollector({
		time: packet.endTime - Date.now()
	});

	buttonCollector.on("collect", async (i: ButtonInteraction) => {
		if (i.user.id !== context.discord?.user) {
			await sendInteractionNotForYou(i.user, i, interaction.userLanguage);
			return;
		}
		await i.update({components: []});
		buttonCollector.stop();
	});
	buttonCollector.on("end", async (collected) => {
		if (!collected.first() || collected.first()?.customId === "closeShop") {
			PacketUtils.sendPacketToBackend(context, makePacket(ChangeBlockingReasonPacket, {
				oldReason: BlockingConstants.REASONS.SHOP,
				newReason: BlockingConstants.REASONS.NONE
			}));
			await handleCommandShopClosed(context);
			return;
		}
		const firstReaction = collected.first() as SelectMenuInteraction;
		await manageBuyoutConfirmation(
			packet,
			context,
			data,
			packet.reactions.find(
				reaction =>
					reaction.type === ReactionCollectorShopItemReaction.name
					&& (reaction.data as ReactionCollectorShopItemReaction).shopItemId === firstReaction.values[0]
			)!.data as ReactionCollectorShopItemReaction
		);

	});

}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("shop"),
	getPacket,
	requirements: {},
	mainGuildCommand: false
};