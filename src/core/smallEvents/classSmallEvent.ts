import {SmallEvent} from "./SmallEvent";
import Entity from "../database/game/models/Entity";
import {CommandInteraction} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {Translations} from "../Translations";
import {RandomUtils} from "../utils/RandomUtils";
import {Data} from "../Data";
import {format} from "../utils/StringFormatter";
import {
	generateRandomItem,
	generateRandomObject,
	generateRandomPotion,
	giveItemToPlayer,
	giveRandomItem
} from "../utils/ItemUtils";
import {Constants} from "../Constants";
import {NumberChangeReason} from "../database/logs/LogsDatabase";

export const smallEvent: SmallEvent = {
	canBeExecuted(): Promise<boolean> {
		return Promise.resolve(true);
	},

	async executeSmallEvent(interaction: CommandInteraction, language: string, entity: Entity, seEmbed: DraftBotEmbed): Promise<void> {
		const classId = entity.Player.class;
		const tr = Translations.getModule("smallEvents.class", language);
		const classDataModule = Data.getModule("smallEvents.class");
		const base = seEmbed.description + Translations.getModule("smallEventsIntros", language).getRandom("intro") + " ";
		let item;
		if (classDataModule.getNumberArray("attackEligible").includes(classId)) {
			const outRand = RandomUtils.draftbotRandom.integer(0, 2);

			switch (outRand) {
			case 0:
				// winAttackPotion
				seEmbed.setDescription(base + tr.getRandom("attack.winPotion"));
				item = await generateRandomPotion(Constants.ITEM_NATURE.ATTACK);
				break;
			case 1:
				// winAttackObject
				seEmbed.setDescription(base + tr.getRandom("attack.winObject"));
				item = await generateRandomObject(Constants.ITEM_NATURE.ATTACK);
				break;
			default:
				// winWeapon
				seEmbed.setDescription(base + tr.getRandom("attack.winWeapon"));
				item = await generateRandomItem(Constants.RARITY.MYTHICAL, Constants.ITEM_CATEGORIES.WEAPON);
				break;
			}
			await interaction.reply({embeds: [seEmbed]});
			await giveItemToPlayer(entity, item, language, interaction.user, interaction.channel);
		}
		else if (classDataModule.getNumberArray("defenseEligible").includes(classId)) {
			const outRand = RandomUtils.draftbotRandom.integer(0, 2);
			switch (outRand) {
			case 0:
				// winDefensePotion
				seEmbed.setDescription(base + tr.getRandom("defense.winPotion"));
				item = await generateRandomPotion(Constants.ITEM_NATURE.DEFENSE);
				break;
			case 1:
				// winDefenseObject
				seEmbed.setDescription(base + tr.getRandom("defense.winObject"));
				item = await generateRandomObject(Constants.ITEM_NATURE.DEFENSE);
				break;
			default:
				// winArmor
				seEmbed.setDescription(base + tr.getRandom("defense.winArmor"));
				item = await generateRandomItem(Constants.RARITY.MYTHICAL, Constants.ITEM_CATEGORIES.ARMOR);
				break;
			}
			await interaction.reply({embeds: [seEmbed]});
			await giveItemToPlayer(entity, item, language, interaction.user, interaction.channel);
		}
		else if (classDataModule.getNumberArray("basicEligible").includes(classId)) {
			if (RandomUtils.draftbotRandom.bool()) {
				// winItem
				seEmbed.setDescription(base + tr.getRandom("basic.winItem"));
				await interaction.reply({embeds: [seEmbed]});
				await giveRandomItem(interaction.user, interaction.channel, language, entity);
			}
			else {
				// winMoney
				const moneyWon = RandomUtils.draftbotRandom.integer(Constants.SMALL_EVENT.MINIMUM_MONEY_WON_CLASS, Constants.SMALL_EVENT.MAXIMUM_MONEY_WON_CLASS);
				seEmbed.setDescription(base + format(tr.getRandom("basic.winMoney"), {money: moneyWon}));
				await interaction.reply({embeds: [seEmbed]});
				await entity.Player.addMoney(entity, moneyWon, interaction.channel, language, NumberChangeReason.SMALL_EVENT);
			}
		}
		else if (classDataModule.getNumberArray("otherEligible").includes(classId)) {
			if (RandomUtils.draftbotRandom.bool()) {
				// winItem
				seEmbed.setDescription(base + tr.getRandom("other.winItem"));
				await interaction.reply({embeds: [seEmbed]});
				await giveRandomItem(interaction.user, interaction.channel, language, entity);
			}
			else {
				// winHealth
				const healthWon = RandomUtils.draftbotRandom.integer(Constants.SMALL_EVENT.MINIMUM_HEALTH_WON_CLASS, Constants.SMALL_EVENT.MAXIMUM_HEALTH_WON_CLASS);
				seEmbed.setDescription(base + format(tr.getRandom("other.winHealth"), {health: healthWon}));
				await interaction.reply({embeds: [seEmbed]});
				await entity.addHealth(healthWon, interaction.channel, language);
			}
		}
		else {
			console.log("This user has an unknown class : " + entity.discordUserId);
		}

		await entity.Player.save();
		console.log(entity.discordUserId + " got class small event.");
	}
};