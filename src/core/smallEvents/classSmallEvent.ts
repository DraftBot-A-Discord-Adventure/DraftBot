import {SmallEvent} from "./SmallEvent";
import {CommandInteraction} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {Translations} from "../Translations";
import {RandomUtils} from "../utils/RandomUtils";
import {Data} from "../Data";
import {format} from "../utils/StringFormatter";
import {
	generateRandomItem,
	giveItemToPlayer,
	giveRandomItem
} from "../utils/ItemUtils";
import {Constants} from "../Constants";
import {NumberChangeReason} from "../constants/LogsConstants";
import Player from "../database/game/models/Player";
import {InventorySlots} from "../database/game/models/InventorySlot";
import {SmallEventConstants} from "../constants/SmallEventConstants";
import {ItemConstants} from "../constants/ItemConstants";
import {Language} from "../constants/TypeConstants";

export const smallEvent: SmallEvent = {
	/**
	 * No restrictions on who can do it
	 */
	canBeExecuted(): Promise<boolean> {
		return Promise.resolve(true);
	},

	/**
	 * Gives a reward depending on your current class
	 * @param interaction
	 * @param language
	 * @param player
	 * @param seEmbed
	 */
	async executeSmallEvent(interaction: CommandInteraction, language: Language, player: Player, seEmbed: DraftBotEmbed): Promise<void> {
		const classId = player.class;
		const tr = Translations.getModule("smallEvents.class", language);
		const classDataModule = Data.getModule("smallEvents.class");
		const base = seEmbed.data.description + Translations.getModule("smallEventsIntros", language).getRandom("intro");
		let item;
		if (classDataModule.getNumberArray("attackEligible").includes(classId)) {
			const outRand = RandomUtils.draftbotRandom.integer(0, 2);

			switch (outRand) {
			case 0:
				// winAttackPotion
				seEmbed.setDescription(base + tr.getRandom("attack.winPotion"));
				item = await generateRandomItem(ItemConstants.CATEGORIES.POTION, ItemConstants.RARITY.COMMON, ItemConstants.RARITY.MYTHICAL, Constants.ITEM_NATURE.ATTACK);
				break;
			case 1:
				// winAttackObject
				seEmbed.setDescription(base + tr.getRandom("attack.winObject"));
				item = await generateRandomItem(ItemConstants.CATEGORIES.OBJECT, ItemConstants.RARITY.COMMON, ItemConstants.RARITY.MYTHICAL, Constants.ITEM_NATURE.ATTACK);
				break;
			default:
				// winWeapon
				seEmbed.setDescription(base + tr.getRandom("attack.winWeapon"));
				item = await generateRandomItem(ItemConstants.CATEGORIES.WEAPON, ItemConstants.RARITY.COMMON, ItemConstants.RARITY.MYTHICAL);
				break;
			}
			await interaction.editReply({embeds: [seEmbed]});
			await giveItemToPlayer(player, item, language, interaction.user, interaction.channel, await InventorySlots.getOfPlayer(player.id));
		}
		else if (classDataModule.getNumberArray("defenseEligible").includes(classId)) {
			const outRand = RandomUtils.draftbotRandom.integer(0, 2);
			switch (outRand) {
			case 0:
				// winDefensePotion
				seEmbed.setDescription(base + tr.getRandom("defense.winPotion"));
				item = await generateRandomItem(ItemConstants.CATEGORIES.POTION, ItemConstants.RARITY.COMMON, ItemConstants.RARITY.MYTHICAL, Constants.ITEM_NATURE.DEFENSE);
				break;
			case 1:
				// winDefenseObject
				seEmbed.setDescription(base + tr.getRandom("defense.winObject"));
				item = await generateRandomItem(ItemConstants.CATEGORIES.OBJECT, ItemConstants.RARITY.COMMON, ItemConstants.RARITY.MYTHICAL, Constants.ITEM_NATURE.DEFENSE);
				break;
			default:
				// winArmor
				seEmbed.setDescription(base + tr.getRandom("defense.winArmor"));
				item = await generateRandomItem(ItemConstants.CATEGORIES.ARMOR, ItemConstants.RARITY.COMMON, ItemConstants.RARITY.MYTHICAL);
				break;
			}
			await interaction.editReply({embeds: [seEmbed]});
			await giveItemToPlayer(player, item, language, interaction.user, interaction.channel, await InventorySlots.getOfPlayer(player.id));
		}
		else if (classDataModule.getNumberArray("basicEligible").includes(classId)) {
			if (RandomUtils.draftbotRandom.bool()) {
				// winItem
				seEmbed.setDescription(base + tr.getRandom("basic.winItem"));
				await interaction.editReply({embeds: [seEmbed]});
				await giveRandomItem(interaction.user, interaction.channel, language, player);
			}
			else {
				// winMoney
				const moneyWon = RandomUtils.rangedInt(SmallEventConstants.CLASS.MONEY);
				seEmbed.setDescription(base + format(tr.getRandom("basic.winMoney"), {money: moneyWon}));
				await interaction.editReply({embeds: [seEmbed]});
				await player.addMoney({
					amount: moneyWon,
					channel: interaction.channel,
					language,
					reason: NumberChangeReason.SMALL_EVENT
				});
			}
		}
		else if (classDataModule.getNumberArray("otherEligible").includes(classId)) {
			if (RandomUtils.draftbotRandom.bool()) {
				// winItem
				seEmbed.setDescription(base + tr.getRandom("other.winItem"));
				await interaction.editReply({embeds: [seEmbed]});
				await giveRandomItem(interaction.user, interaction.channel, language, player);
			}
			else {
				// winHealth
				const healthWon = RandomUtils.rangedInt(SmallEventConstants.CLASS.HEALTH);
				seEmbed.setDescription(base + format(tr.getRandom("other.winHealth"), {health: healthWon}));
				await interaction.editReply({embeds: [seEmbed]});
				await player.addHealth(healthWon, interaction.channel, language, NumberChangeReason.SMALL_EVENT);
			}
		}
		else {
			console.log(`This user has an unknown class : ${player.discordUserId}`);
		}

		await player.save();
	}
};