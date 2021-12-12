/**
 * Main function of small event
 * @param {module:"discord.js".Message} message
 * @param {"fr"|"en"} language
 * @param {Entities} entity
 * @param {module:"discord.js".MessageEmbed} seEmbed - The template embed to send. The description already contains the emote so you have to get it and add your text
 * @returns {Promise<>}
 */
import {
	generateRandomItem,
	generateRandomObject,
	generateRandomPotion,
	giveItemToPlayer,
	giveRandomItem
} from "../utils/ItemUtils";
import {Constants} from "../Constants";

const executeSmallEvent = async function(message, language, entity, seEmbed) {
	const classId = entity.Player.class;
	const trans = JsonReader.smallEvents.class.getTranslation(language);
	const translationIntroSE = JsonReader.smallEventsIntros.getTranslation(language);
	const base = JsonReader.smallEvents.class.emote + " " + translationIntroSE.intro[randInt(0, translationIntroSE.intro.length)] + " ";
	let item;
	if (JsonReader.smallEvents.class.attackEligible.includes(classId)) {
		const outRand = draftbotRandom.integer(0, 2);

		switch (outRand) {
		case 0:
			// winAttackPotion
			seEmbed.setDescription(base + trans.attack.winPotion[draftbotRandom.integer(0, trans.attack.winPotion.length - 1)]);
			item = await generateRandomPotion(Constants.ITEM_NATURE.ATTACK);
			break;
		case 1:
			// winAttackObject
			seEmbed.setDescription(base + trans.attack.winObject[draftbotRandom.integer(0, trans.attack.winObject.length - 1)]);
			item = await generateRandomObject(Constants.ITEM_NATURE.ATTACK);
			break;
		default:
			// winWeapon
			seEmbed.setDescription(base + trans.attack.winWeapon[draftbotRandom.integer(0, trans.attack.winWeapon.length - 1)]);
			item = await generateRandomItem(Constants.RARITY.MYTHICAL, Constants.ITEM_CATEGORIES.WEAPON);
			break;
		}
		await message.channel.send({ embeds: [seEmbed] });
		await giveItemToPlayer(entity, item, language, message.author, message.channel);
	}
	else if (JsonReader.smallEvents.class.defenseEligible.includes(classId)) {
		const outRand = draftbotRandom.integer(0, 2);
		switch (outRand) {
		case 0:
			// winDefensePotion
			seEmbed.setDescription(base + trans.defense.winPotion[draftbotRandom.integer(0, trans.defense.winPotion.length - 1)]);
			item = await generateRandomPotion(Constants.ITEM_NATURE.DEFENSE);
			break;
		case 1:
			// winDefenseObject
			seEmbed.setDescription(base + trans.defense.winObject[draftbotRandom.integer(0, trans.defense.winObject.length - 1)]);
			item = await generateRandomObject(Constants.ITEM_NATURE.DEFENSE);
			break;
		default:
			// winArmor
			seEmbed.setDescription(base + trans.defense.winArmor[draftbotRandom.integer(0, trans.defense.winArmor.length - 1)]);
			item = await generateRandomItem(Constants.RARITY.MYTHICAL, Constants.ITEM_CATEGORIES.ARMOR);
			break;
		}
		await message.channel.send({ embeds: [seEmbed] });
		await giveItemToPlayer(entity, item, language, message.author, message.channel);
	}
	else if (JsonReader.smallEvents.class.basicEligible.includes(classId)) {
		if (draftbotRandom.bool()) {
			// winItem
			seEmbed.setDescription(base + trans.basic.winItem[draftbotRandom.integer(0, trans.basic.winItem.length - 1)]);
			await message.channel.send({ embeds: [seEmbed] });
			await giveRandomItem(message.author, message.channel, language, entity);
		}
		else {
			// winMoney
			const moneyWon = draftbotRandom.integer(SMALL_EVENT.MINIMUM_MONEY_WON_CLASS, SMALL_EVENT.MAXIMUM_MONEY_WON_CLASS);
			seEmbed.setDescription(base + format(trans.basic.winMoney[draftbotRandom.integer(0, trans.basic.winMoney.length - 1)], {money: moneyWon}));
			await message.channel.send({ embeds: [seEmbed] });
			await entity.Player.addMoney(entity, moneyWon, message.channel, language);
		}
	}
	else if (JsonReader.smallEvents.class.otherEligible.includes(classId)) {
		if (draftbotRandom.bool()) {
			// winItem
			seEmbed.setDescription(base + trans.other.winItem[draftbotRandom.integer(0, trans.other.winItem.length - 1)]);
			await message.channel.send({ embeds: [seEmbed] });
			await giveRandomItem(message.author, message.channel, language, entity);
		}
		else {
			// winHealth
			const healthWon = draftbotRandom.integer(SMALL_EVENT.MINIMUM_HEALTH_WON_CLASS, SMALL_EVENT.MAXIMUM_HEALTH_WON_CLASS);
			seEmbed.setDescription(base + format(trans.other.winHealth[draftbotRandom.integer(0, trans.other.winHealth.length - 1)], {health: healthWon}));
			await message.channel.send({ embeds: [seEmbed] });
			await entity.addHealth(healthWon);
		}
	}
	else {
		console.log("This user has an unknown class : " + entity.discordUserId);
	}

	await entity.Player.save();
	log(entity.discordUserId + " got class small event.");
};

module.exports = {
	executeSmallEvent: executeSmallEvent
};