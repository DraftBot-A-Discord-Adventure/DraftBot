import {ICommand} from "../ICommand";
import {makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {DraftbotInteraction} from "../../messages/DraftbotInteraction";
import i18n from "../../translations/i18n";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {SlashCommandBuilder} from "@discordjs/builders";
import {EffectsConstants} from "../../../../Lib/src/constants/EffectsConstants";
import {DraftBotEmbed} from "../../messages/DraftBotEmbed";
import {ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedField} from "discord.js";
import {Constants} from "../../Constants";
import {DiscordCache} from "../../bot/DiscordCache";
import {DraftBotErrorEmbed} from "../../messages/DraftBotErrorEmbed";
import {Language} from "../../../../Lib/src/Language";
import {KeycloakUser} from "../../../../Lib/src/keycloak/KeycloakUser";
import {KeycloakUtils} from "../../../../Lib/src/keycloak/KeycloakUtils";
import {keycloakConfig} from "../../bot/DraftBotShard";
import {CommandInventoryPacketReq, CommandInventoryPacketRes, MainItemDisplayPacket, SupportItemDisplayPacket} from "../../../../Lib/src/packets/commands/CommandInventoryPacket";
import {MaxStatsValues} from "../../../../Lib/dist/Core/src/data/GenericItem";
import {ItemNature} from "../../../../Lib/src/constants/ItemConstants";
import {minutesDisplay} from "../../../../Lib/src/utils/TimeUtils";

async function getPacket(interaction: DraftbotInteraction, keycloakUser: KeycloakUser): Promise<CommandInventoryPacketReq | null> {
	let askedPlayer: { keycloakId?: string, rank?: number } = {keycloakId: keycloakUser.id};

	const user = interaction.options.getUser("user");
	if (user) {
		const keycloakId = await KeycloakUtils.getKeycloakIdFromDiscordId(keycloakConfig, user.id);
		if (!keycloakId) {
			await interaction.reply({embeds: [new DraftBotErrorEmbed(interaction.user, interaction, interaction.channel.language, i18n.t("error:playerDoesntExist", {lng: interaction.channel.language}))]});
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

type Value = {
	maxValue: number,
	value: number,
	typeValue: "attack" | "defense" | "speed"
}

/**
 * Get a stat value of an item into its string form
 * @param language
 * @param values
 * @param value
 */
function getStringValueFor(language: Language, values: string[], value: Value): void {
	if (value.value !== 0) {
		values.push(i18n.t(`items:${value.typeValue}`, {
			lng: language,
			value: value.maxValue >= value.value ? value.value : i18n.t("items:nerfDisplay", {
				lng: language,
				old: value.value,
				max: value.maxValue
			})
		}));
	}
}

/**
 * Get the string for the stats of the main item
 * @param attack
 * @param defense
 * @param speed
 * @param language
 * @param maxStatsValue
 * @protected
 */
function getValues(attack: number, defense: number, speed: number, language: Language, maxStatsValue: MaxStatsValues | null = null): string {
	if (!maxStatsValue) {
		maxStatsValue = {
			attack: Infinity,
			defense: Infinity,
			speed: Infinity
		};
	}
	const values: string[] = [];
	getStringValueFor(language, values, {
		value: attack,
		maxValue: maxStatsValue.attack,
		typeValue: "attack"
	});
	getStringValueFor(language, values, {
		value: defense,
		maxValue: maxStatsValue.defense,
		typeValue: "defense"
	});
	getStringValueFor(language, values, {
		value: speed,
		maxValue: maxStatsValue.speed,
		typeValue: "speed"
	});
	return values.join(" ");
}

function getWeaponField(displayPacket: MainItemDisplayPacket, language: Language): EmbedField {
	const itemName = i18n.t(`models:weapons.${displayPacket.id}`);
	return {
		name: i18n.t("items:weapons.fieldName", {lng: language}),
		value: displayPacket.id === 0 ? itemName : i18n.t("items:weapons.fieldValue", {
			lng: language,
			name: `${displayPacket.emote} ${itemName}`,
			rarity: i18n.t(`items:rarities.${displayPacket.rarity}`, {lng: language}),
			values: getValues(displayPacket.attack.value, displayPacket.defense.value, displayPacket.speed.value, language, {
				attack: displayPacket.attack.maxValue,
				defense: displayPacket.defense.maxValue,
				speed: displayPacket.speed.maxValue
			})
		}),
		inline: false
	};
}

function getArmorField(displayPacket: MainItemDisplayPacket, language: Language): EmbedField {
	const itemName = i18n.t(`models:armors.${displayPacket.id}`);
	return {
		name: i18n.t("items:armors.fieldName", {lng: language}),
		value: displayPacket.id === 0 ? itemName : i18n.t("items:armors.fieldValue", {
			lng: language,
			name: `${displayPacket.emote} ${itemName}`,
			rarity: i18n.t(`items:rarities.${displayPacket.rarity}`, {lng: language}),
			values: getValues(displayPacket.attack.value, displayPacket.defense.value, displayPacket.speed.value, language, {
				attack: displayPacket.attack.maxValue,
				defense: displayPacket.defense.maxValue,
				speed: displayPacket.speed.maxValue
			})
		}),
		inline: false
	};
}

function getPotionField(displayPacket: SupportItemDisplayPacket, language: Language): EmbedField {
	const itemName = i18n.t(`models:potions.${displayPacket.id}`);
	return {
		name: i18n.t("items:potions.fieldName", {lng: language}),
		value: displayPacket.id === 0 ? itemName : i18n.t("items:potions.fieldValue", {
			lng: language,
			name: `${displayPacket.emote} ${itemName}`,
			rarity: i18n.t(`items:rarities.${displayPacket.rarity}`, {lng: language}),
			nature: i18n.t(`items:potions.natures.${displayPacket.nature}`, {
				lng: language,
				power: displayPacket.nature === ItemNature.TIME_SPEEDUP ? minutesDisplay(displayPacket.power, language) : displayPacket.power
			})
		}),
		inline: false
	};
}

function getObjectField(displayPacket: SupportItemDisplayPacket, language: Language): EmbedField {
	const itemName = i18n.t(`models:objects.${displayPacket.id}`);
	const natureTrKey = `items:objects.natures.${displayPacket.nature}`;
	let nature;
	if (displayPacket.nature === ItemNature.TIME_SPEEDUP) {
		nature = i18n.t(natureTrKey, { lng: language, power: minutesDisplay(displayPacket.power, language) });
	}
	else if (displayPacket.nature === ItemNature.SPEED) {
		nature = i18n.t(natureTrKey, {
			lng: language,
			power: displayPacket.maxPower >= displayPacket.power ? displayPacket.power : i18n.t("items:nerfDisplay", {
				lng: language,
				old: displayPacket.power,
				max: displayPacket.maxPower
			})
		});
	}
	else {
		nature = i18n.t(natureTrKey, { lng: language, power: displayPacket.power });
	}
	return {
		name: i18n.t("items:objects.fieldName", {lng: language}),
		value: displayPacket.id === 0 ? itemName : i18n.t("items:objects.fieldValue", {
			lng: language,
			name: `${displayPacket.emote} ${itemName}`,
			rarity: i18n.t(`items:rarities.${displayPacket.rarity}`, {lng: language}),
			nature
		}),
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
				getWeaponField(packet.data.weapon, language),
				getArmorField(packet.data.armor, language),
				getPotionField(packet.data.potion, language),
				getObjectField(packet.data.object, language)
			]);
	}

	throw new Error("Inventory packet data must not be undefined");
}

function getBackupEmbed(packet: CommandInventoryPacketRes, pseudo: string, language: Language): DraftBotEmbed {
	if (packet.data) {
		return new DraftBotEmbed()
			.setTitle(i18n.t("commands:inventory.title", {
				lng: language,
				pseudo
			}));
		// todo backup items fields
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
		const backupButtonLabel = i18n.t("commands:inventory.seeEquippedItems", {lng: interaction.channel.language});
		const equippedButtonLabel = i18n.t("commands:inventory.seeBackupItems", {lng: interaction.channel.language});

		const switchItemsButton = new ButtonBuilder()
			.setCustomId(buttonId)
			.setLabel(backupButtonLabel)
			.setStyle(ButtonStyle.Primary);

		const equippedEmbed = getEquippedEmbed(packet, keycloakUser.attributes.gameUsername, interaction.channel.language);
		const backupEmbed = getBackupEmbed(packet, keycloakUser.attributes.gameUsername, interaction.channel.language);

		const collector = interaction.channel.createMessageComponentCollector({
			filter: i => i.customId === buttonId && i.user.id === context.discord?.user,
			time: Constants.MESSAGES.COLLECTOR_TIME
		});
		collector.on("collect", async i => {
			equippedView = !equippedView;
			switchItemsButton.setLabel(equippedView ? equippedButtonLabel : backupButtonLabel);
			await i.update({
				embeds: [equippedView ? equippedEmbed : backupEmbed],
				components: [new ActionRowBuilder<ButtonBuilder>().addComponents(switchItemsButton)]
			});
		});

		await interaction.reply({
			embeds: [equippedEmbed],
			components: [new ActionRowBuilder<ButtonBuilder>().addComponents(switchItemsButton)]
		});
	}
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("inventory")
		.addUserOption(option =>
			SlashCommandBuilderGenerator.generateOption("inventory", "user", option)
				.setRequired(false)
		)
		.addIntegerOption(option =>
			SlashCommandBuilderGenerator.generateOption("inventory", "rank", option)
				.setRequired(false)
		) as SlashCommandBuilder,
	getPacket,
	requirements: {
		disallowEffects: [EffectsConstants.EMOJI_TEXT.BABY, EffectsConstants.EMOJI_TEXT.DEAD]
	},
	mainGuildCommand: false
};