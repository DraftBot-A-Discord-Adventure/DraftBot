import { DraftbotInteraction } from "../../messages/DraftbotInteraction";
import {
	makePacket, PacketContext
} from "../../../../Lib/src/packets/DraftBotPacket";
import {
	CommandPetTransferPacketReq,
	CommandPetTransferSuccessPacket
} from "../../../../Lib/src/packets/commands/CommandPetTransferPacket";
import { ICommand } from "../ICommand";
import { SlashCommandBuilderGenerator } from "../SlashCommandBuilderGenerator";
import {
	MessageActionRowComponentBuilder, SlashCommandBuilder
} from "@discordjs/builders";
import { DiscordCache } from "../../bot/DiscordCache";
import { DisplayUtils } from "../../utils/DisplayUtils";
import { DraftBotEmbed } from "../../messages/DraftBotEmbed";
import i18n from "../../translations/i18n";
import {
	ReactionCollectorCreationPacket, ReactionCollectorReaction,
	ReactionCollectorRefuseReaction
} from "../../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import { ReactionCollectorReturnTypeOrNull } from "../../packetHandlers/handlers/ReactionCollectorHandlers";
import {
	ReactionCollectorPetTransferData,
	ReactionCollectorPetTransferDepositReaction,
	ReactionCollectorPetTransferSwitchReaction,
	ReactionCollectorPetTransferWithdrawReaction
} from "../../../../Lib/src/packets/interaction/ReactionCollectorPetTransfer";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	Message,
	MessageComponentInteraction,
	parseEmoji, StringSelectMenuBuilder, StringSelectMenuInteraction, StringSelectMenuOptionBuilder
} from "discord.js";
import { Language } from "../../../../Lib/src/Language";
import { DraftBotIcons } from "../../../../Lib/src/DraftBotIcons";
import { sendInteractionNotForYou } from "../../utils/ErrorUtils";
import { DiscordCollectorUtils } from "../../utils/DiscordCollectorUtils";
import { EmoteUtils } from "../../utils/EmoteUtils";
import { MessagesUtils } from "../../utils/MessagesUtils";

async function getPacket(interaction: DraftbotInteraction): Promise<CommandPetTransferPacketReq> {
	await interaction.deferReply();
	return makePacket(CommandPetTransferPacketReq, {});
}

export async function handlePetTransferSuccess(context: PacketContext, packet: CommandPetTransferSuccessPacket): Promise<void> {
	const interaction: DraftbotInteraction = MessagesUtils.getCurrentInteraction(context);

	if (!interaction) {
		return;
	}

	const lng = context.discord!.language;

	const oldPetDisplay = packet.oldPet ? DisplayUtils.getOwnedPetInlineDisplay(packet.oldPet, lng) : null;
	const newPetDisplay = packet.newPet ? DisplayUtils.getOwnedPetInlineDisplay(packet.newPet, lng) : null;

	const i18nText = oldPetDisplay && newPetDisplay
		? "commands:petTransfer.confirmSwitch"
		: oldPetDisplay
			? "commands:petTransfer.confirmDeposit"
			: "commands:petTransfer.confirmWithdraw";

	await interaction.editReply({
		embeds: [
			new DraftBotEmbed()
				.formatAuthor(i18n.t("commands:petTransfer.confirmTransferTitle", {
					lng,
					pseudo: interaction.user.displayName
				}), interaction.user)
				.setDescription(i18n.t(i18nText, {
					lng,
					oldPet: oldPetDisplay,
					newPet: newPetDisplay
				}))
		]
	});
}

type ReactionMap = {
	reaction: {
		type: string;
		data: ReactionCollectorReaction;
	};
	index: number;
};

const depositCustomId = "deposit";
const switchCustomId = "switch";
const withdrawCustomId = "withdraw";
const refuseCustomId = "refuse";
const backCustomId = "back";

function getMainMenuComponents(
	data: ReactionCollectorPetTransferData,
	reactions: {
		deposit?: ReactionMap;
		switches: ReactionMap[];
		withdraws: ReactionMap[];
		refuse?: ReactionMap;
	},
	lng: Language
): ActionRowBuilder<ButtonBuilder>[] {
	const rows = [];

	if (reactions.deposit) {
		rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setEmoji(parseEmoji(DraftBotIcons.petTransfer.deposit)!)
				.setLabel(i18n.t("commands:petTransfer.depositButton", {
					lng,
					pet: DisplayUtils.getOwnedPetInlineDisplay(data.ownPet!, lng)
				}))
				.setStyle(ButtonStyle.Secondary)
				.setCustomId(depositCustomId)
		));
	}

	if (reactions.switches.length > 0) {
		rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setEmoji(parseEmoji(DraftBotIcons.petTransfer.switch)!)
				.setLabel(i18n.t("commands:petTransfer.switchButton", {
					lng,
					pet: DisplayUtils.getOwnedPetInlineDisplay(data.ownPet!, lng)
				}))
				.setStyle(ButtonStyle.Secondary)
				.setCustomId(switchCustomId)
		));
	}

	if (reactions.withdraws.length > 0) {
		rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setEmoji(parseEmoji(DraftBotIcons.petTransfer.withdraw)!)
				.setLabel(i18n.t("commands:petTransfer.withdrawButton", { lng }))
				.setStyle(ButtonStyle.Secondary)
				.setCustomId(withdrawCustomId)
		));
	}

	rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setEmoji(parseEmoji(DraftBotIcons.collectors.refuse)!)
			.setLabel(i18n.t("commands:petTransfer.refuseButton", { lng }))
			.setStyle(ButtonStyle.Secondary)
			.setCustomId(refuseCustomId)
	));

	return rows;
}

function getBackButton(lng: Language): ButtonBuilder {
	return new ButtonBuilder()
		.setEmoji(parseEmoji(DraftBotIcons.collectors.back)!)
		.setLabel(i18n.t("commands:petTransfer.backButton", { lng }))
		.setStyle(ButtonStyle.Secondary)
		.setCustomId(backCustomId);
}

function getShelterPetSelectMenu(
	data: ReactionCollectorPetTransferData,
	reactions: ReactionMap[],
	placeHolder: string,
	lng: Language
): StringSelectMenuBuilder {
	return new StringSelectMenuBuilder()
		.setPlaceholder(placeHolder)
		.setCustomId("switchSelect")
		.addOptions(reactions.map(reaction => {
			const reactionData = reaction.reaction.data as ReactionCollectorPetTransferSwitchReaction;
			const shelterPet = data.shelterPets.find(pet => pet.petEntityId === reactionData.petEntityId)!;
			return new StringSelectMenuOptionBuilder()
				.setLabel(DisplayUtils.getPetNicknameOrTypeName(shelterPet.pet.nickname, shelterPet.pet.typeId, shelterPet.pet.sex, lng))
				.setEmoji(parseEmoji(EmoteUtils.translateEmojiForSelectMenus(DisplayUtils.getPetIcon(shelterPet.pet.typeId, shelterPet.pet.sex)))!)
				.setValue(reaction.index.toString())
				.setDescription(i18n.t("commands:petTransfer.selectMenuPetDetails", {
					lng,
					rarity: DisplayUtils.getPetRarityDisplay(shelterPet.pet.rarity),
					sex: DisplayUtils.getPetSexName(shelterPet.pet.sex, lng),
					loveLevel: DisplayUtils.getPetLoveLevelDisplay(shelterPet.pet.loveLevel, shelterPet.pet.sex, lng, false)
				}));
		}));
}

function getSwitchComponents(
	data: ReactionCollectorPetTransferData,
	reactions: ReactionMap[],
	lng: Language
): ActionRowBuilder<MessageActionRowComponentBuilder>[] {
	const rows = [];

	rows.push(new ActionRowBuilder<StringSelectMenuBuilder>()
		.addComponents(
			getShelterPetSelectMenu(
				data,
				reactions,
				i18n.t("commands:petTransfer.switchPlaceholder", {
					lng,
					pet: DisplayUtils.getOwnedPetInlineDisplay(data.ownPet!, lng)
				}),
				lng
			)
		));

	rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(getBackButton(lng)));

	return rows;
}

function getWithdrawComponents(
	data: ReactionCollectorPetTransferData,
	reactions: ReactionMap[],
	lng: Language
): ActionRowBuilder<MessageActionRowComponentBuilder>[] {
	const rows = [];

	rows.push(new ActionRowBuilder<StringSelectMenuBuilder>()
		.addComponents(
			getShelterPetSelectMenu(
				data,
				reactions,
				i18n.t("commands:petTransfer.withdrawPlaceholder", { lng }),
				lng
			)
		));

	rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(getBackButton(lng)));

	return rows;
}

async function handlePetTransferCollect(
	inMainMenu: boolean,
	packet: ReactionCollectorCreationPacket,
	context: PacketContext,
	reactions: {
		depositReaction?: {
			reaction: {
				type: string; data: ReactionCollectorReaction;
			};
			index: number;
		};
		refuseReaction?: {
			reaction: {
				type: string; data: ReactionCollectorReaction;
			};
			index: number;
		};
	},
	discord: {
		collectedInteraction: MessageComponentInteraction;
		mainMenuEmbed: DraftBotEmbed;
		switchComponents: ActionRowBuilder<MessageActionRowComponentBuilder>[];
		withdrawComponents: ActionRowBuilder<MessageActionRowComponentBuilder>[];
		mainMenuComponents: ActionRowBuilder<ButtonBuilder>[];
	}
): Promise<boolean> {
	if (inMainMenu) {
		const customId = discord.collectedInteraction.customId;

		switch (customId) {
			case depositCustomId:
				await discord.collectedInteraction.deferReply();
				DiscordCollectorUtils.sendReaction(
					packet,
					context,
					context.keycloakId!,
					discord.collectedInteraction,
					reactions.depositReaction!.index
				);
				break;
			case switchCustomId:
				await discord.collectedInteraction.update({
					embeds: [discord.mainMenuEmbed],
					components: discord.switchComponents
				});
				inMainMenu = false;
				break;
			case withdrawCustomId:
				await discord.collectedInteraction.update({
					embeds: [discord.mainMenuEmbed],
					components: discord.withdrawComponents
				});
				inMainMenu = false;
				break;
			case refuseCustomId:
				await discord.collectedInteraction.deferReply();
				DiscordCollectorUtils.sendReaction(
					packet,
					context,
					context.keycloakId!,
					discord.collectedInteraction,
					reactions.refuseReaction!.index
				);
				break;
			default:
				break;
		}
	}
	else if (discord.collectedInteraction.customId === backCustomId) {
		await discord.collectedInteraction.update({
			embeds: [discord.mainMenuEmbed],
			components: discord.mainMenuComponents
		});
		inMainMenu = true;
	}
	else {
		await discord.collectedInteraction.deferReply();
		DiscordCollectorUtils.sendReaction(
			packet,
			context,
			context.keycloakId!,
			discord.collectedInteraction,
			parseInt((discord.collectedInteraction as StringSelectMenuInteraction).values[0], 10)
		);
	}

	return inMainMenu;
}

export async function handlePetTransferReactionCollector(context: PacketContext, packet: ReactionCollectorCreationPacket): Promise<ReactionCollectorReturnTypeOrNull> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction);

	if (!interaction) {
		return null;
	}

	const lng = context.discord!.language;
	const data = packet.data.data as ReactionCollectorPetTransferData;
	const depositReaction = packet.reactions.map((reaction, index) => ({
		reaction,
		index
	}))
		.find(reaction => reaction.reaction.type === ReactionCollectorPetTransferDepositReaction.name);
	const switchReactions = packet.reactions.map((reaction, index) => ({
		reaction,
		index
	}))
		.filter(reaction => reaction.reaction.type === ReactionCollectorPetTransferSwitchReaction.name);
	const withdrawReactions = packet.reactions.map((reaction, index) => ({
		reaction,
		index
	}))
		.filter(reaction => reaction.reaction.type === ReactionCollectorPetTransferWithdrawReaction.name);
	const refuseReaction = packet.reactions.map((reaction, index) => ({
		reaction,
		index
	}))
		.find(reaction => reaction.reaction.type === ReactionCollectorRefuseReaction.name);

	const mainMenuEmbed = new DraftBotEmbed()
		.formatAuthor(i18n.t("commands:petTransfer.chooseActionTitle", { lng }), interaction.user)
		.setDescription(i18n.t("commands:petTransfer.chooseActionDesc", { lng }));

	const mainMenuComponents = getMainMenuComponents(data, {
		deposit: depositReaction,
		switches: switchReactions,
		withdraws: withdrawReactions,
		refuse: refuseReaction
	}, lng);
	const switchComponents = switchReactions.length !== 0 ? getSwitchComponents(data, switchReactions, lng) : [];
	const withdrawComponents = withdrawReactions.length !== 0 ? getWithdrawComponents(data, withdrawReactions, lng) : [];

	const msg = await interaction?.editReply({
		embeds: [mainMenuEmbed],
		components: mainMenuComponents
	}) as Message;

	let inMainMenu = true;

	const msgCollector = msg.createMessageComponentCollector({
		time: packet.endTime - Date.now()
	});

	msgCollector.on("collect", async (collectedInteraction: MessageComponentInteraction) => {
		if (collectedInteraction.user.id !== context.discord?.user) {
			await sendInteractionNotForYou(collectedInteraction.user, collectedInteraction, interaction.userLanguage);
			return;
		}

		inMainMenu = await handlePetTransferCollect(
			inMainMenu,
			packet,
			context,
			{
				depositReaction,
				refuseReaction
			},
			{
				collectedInteraction,
				mainMenuEmbed,
				switchComponents,
				withdrawComponents,
				mainMenuComponents
			}
		);
	});

	msgCollector.on("end", () => {
		msg.edit({
			embeds: [mainMenuEmbed],
			components: []
		});
	});

	return [msgCollector];
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("petTransfer") as SlashCommandBuilder,
	getPacket,
	mainGuildCommand: false
};
