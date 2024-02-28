import {ICommand} from "../ICommand";
import {makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {DraftbotInteraction} from "../../messages/DraftbotInteraction";
import i18n from "../../translations/i18n";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {SlashCommandBuilder} from "@discordjs/builders";
import {EffectsConstants} from "../../../../Lib/src/constants/EffectsConstants";
import {DraftBotEmbed} from "../../messages/DraftBotEmbed";
import {ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, EmbedField} from "discord.js";
import {Constants} from "../../Constants";
import {DiscordCache} from "../../bot/DiscordCache";
import {DraftBotErrorEmbed} from "../../messages/DraftBotErrorEmbed";
import {Language} from "../../../../Lib/src/Language";
import {KeycloakUser} from "../../../../Lib/src/keycloak/KeycloakUser";
import {KeycloakUtils} from "../../../../Lib/src/keycloak/KeycloakUtils";
import {keycloakConfig} from "../../bot/DraftBotShard";
import {CommandInventoryPacketReq, CommandInventoryPacketRes, MainItemDisplayPacket, SupportItemDisplayPacket} from "../../../../Lib/src/packets/commands/CommandInventoryPacket";
import {DiscordItemUtils} from "../../utils/DiscordItemUtils";
import {sendInteractionNotForYou} from "../../utils/ErrorUtils";

async function getPacket(interaction: DraftbotInteraction, keycloakUser: KeycloakUser): Promise<CommandInventoryPacketReq | null> {
	let askedPlayer: { keycloakId?: string, rank?: number } = {keycloakId: keycloakUser.id};

	const user = interaction.options.getUser("user");
	if (user) {
		const keycloakId = await KeycloakUtils.getKeycloakIdFromDiscordId(keycloakConfig, user.id, user.displayName);
		if (!keycloakId) {
			await interaction.reply({
				embeds: [
					new DraftBotErrorEmbed(interaction.user, interaction, interaction.channel.language, i18n.t("error:playerDoesntExist", {lng: interaction.channel.language}))
				]
			});
			return null;
		}
		askedPlayer = {keycloakId};
	}
	const rank = interaction.options.get("rank");
	if (rank) {
		askedPlayer = {rank: <number>rank.value};
	}

	return makePacket(CommandInventoryPacketReq, {askedPlayer});
}

function getBackupField<T = MainItemDisplayPacket | SupportItemDisplayPacket>(
	language: Language,
	items: { display: T, slot: number}[],
	slots: number,
	toFieldFunc: (displayPacket: T, language: Language) => EmbedField
): EmbedField {
	const formattedTitle = i18n.t("commands:inventory.weapons", { lng: language, count: items.length, max: slots - 1 });
	if (slots <= 1) {
		return {
			name: formattedTitle,
			value: i18n.t("commands:inventory.noSlot", { lng: language }),
			inline: false
		};
	}
	let value = "";
	for (let i = 1; i < slots; ++i) {
		const search = items.find(item => item.slot === i);
		if (!search) {
			value += i18n.t("commands:inventory.emptySlot", { lng: language });
		}
		else {
			value += toFieldFunc(search.display, language).value;
		}
		value += "\n";
	}
	return {
		name: formattedTitle,
		value,
		inline: false
	};
}

function getEquippedEmbed(packet: CommandInventoryPacketRes, pseudo: string, language: Language): DraftBotEmbed {
	if (packet.data) {
		return new DraftBotEmbed()
			.setTitle(i18n.t("commands:inventory.title", {
				lng: language,
				pseudo
			}))
			.addFields([
				DiscordItemUtils.getWeaponField(packet.data.weapon, language),
				DiscordItemUtils.getArmorField(packet.data.armor, language),
				DiscordItemUtils.getPotionField(packet.data.potion, language),
				DiscordItemUtils.getObjectField(packet.data.object, language)
			]);
	}

	throw new Error("Inventory packet data must not be undefined");
}

function getBackupEmbed(packet: CommandInventoryPacketRes, pseudo: string, language: Language): DraftBotEmbed {
	if (packet.data) {
		return new DraftBotEmbed()
			.setTitle(i18n.t("commands:inventory.stockTitle", {
				lng: language,
				pseudo
			}))
			.addFields([
				getBackupField(language, packet.data.backupWeapons, packet.data.slots.weapons, DiscordItemUtils.getWeaponField),
				getBackupField(language, packet.data.backupArmors, packet.data.slots.armors, DiscordItemUtils.getArmorField),
				getBackupField(language, packet.data.backupPotions, packet.data.slots.potions, DiscordItemUtils.getPotionField),
				getBackupField(language, packet.data.backupObjects, packet.data.slots.objects, DiscordItemUtils.getObjectField)
			]);
	}

	throw new Error("Inventory packet data must not be undefined");
}

export async function handleCommandInventoryPacketRes(packet: CommandInventoryPacketRes, context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction);

	if (interaction) {
		if (!packet.foundPlayer) {
			await interaction.reply({
				embeds: [
					new DraftBotErrorEmbed(
						interaction.user,
						interaction,
						interaction.channel.language,
						i18n.t("error:playerDoesntExist", {lng: interaction.channel.language})
					)
				]
			});
			return;
		}

		const keycloakUser = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, packet.keycloakId!))!;
		let equippedView = true;

		const buttonId = "switchItems";
		const equippedButtonLabel = i18n.t("commands:inventory.seeEquippedItems", {lng: interaction.channel.language});
		const backupButtonLabel = i18n.t("commands:inventory.seeBackupItems", {lng: interaction.channel.language});

		const switchItemsButton = new ButtonBuilder()
			.setCustomId(buttonId)
			.setLabel(backupButtonLabel)
			.setStyle(ButtonStyle.Primary);

		const equippedEmbed = getEquippedEmbed(packet, keycloakUser.attributes.gameUsername, interaction.channel.language);
		const backupEmbed = getBackupEmbed(packet, keycloakUser.attributes.gameUsername, interaction.channel.language);

		const msg = await interaction.reply({
			embeds: [equippedEmbed],
			components: [new ActionRowBuilder<ButtonBuilder>().addComponents(switchItemsButton)]
		});

		const collector = msg.createMessageComponentCollector({
			filter: i => i.customId === buttonId, // TODO: rename single letter variable to something clearer
			time: Constants.MESSAGES.COLLECTOR_TIME
		});
		collector.on("collect", async (i: ButtonInteraction) => {
			if (i.user.id !== context.discord?.user) {
				await sendInteractionNotForYou(i.user, i, interaction.channel.language);
				return;
			}

			equippedView = !equippedView;
			switchItemsButton.setLabel(equippedView ? backupButtonLabel : equippedButtonLabel);
			await i.update({
				embeds: [equippedView ? equippedEmbed : backupEmbed],
				components: [new ActionRowBuilder<ButtonBuilder>().addComponents(switchItemsButton)]
			});
		});
	}
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("inventory")
		.addUserOption(option =>
			SlashCommandBuilderGenerator.generateOption("inventory", "user", option)
				.setRequired(false))
		.addIntegerOption(option =>
			SlashCommandBuilderGenerator.generateOption("inventory", "rank", option)
				.setRequired(false)) as SlashCommandBuilder,
	getPacket,
	requirements: {
		disallowEffects: [EffectsConstants.EMOJI_TEXT.BABY, EffectsConstants.EMOJI_TEXT.DEAD]
	},
	mainGuildCommand: false
};