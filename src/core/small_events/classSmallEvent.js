/**
 * Main function of small event
 * @param {module:"discord.js".Message} message
 * @param {"fr"|"en"} language
 * @param {Entities} entity
 * @param {module:"discord.js".MessageEmbed} seEmbed - The template embed to send. The description already contains the emote so you have to get it and add your text
 * @returns {Promise<>}
 */
const executeSmallEvent = async function (message, language, entity, seEmbed) {
	let classId = entity.Player.class;
	let trans = JsonReader.small_events.class.getTranslation(language);
	let base = JsonReader.small_events.class.emote + " " + JsonReader.smallEventsIntros.getTranslation(language).intro[randInt(0, JsonReader.smallEventsIntros.getTranslation(language).intro.length)] + " ";
	let msg;
	if (JsonReader.small_events.class.attackEligible.includes(classId)) {
		let outRand = draftbotRandom.integer(0, 2);
		switch (outRand) {
			case 0:
				// winAttackPotion
				seEmbed.setDescription(base + trans.attack.winPotion[draftbotRandom.integer(0, trans.attack.winPotion.length - 1)]);
				msg = await message.channel.send(seEmbed);
				let p = await entity.Player.Inventory.generateRandomPotion(3);
				await giveItem(entity, p, language, message.author, message.channel);
				break;
			case 1:
				// winAttackObject
				seEmbed.setDescription(base + trans.attack.winObject[draftbotRandom.integer(0, trans.attack.winObject.length - 1)]);
				msg = await message.channel.send(seEmbed);
				let o = await entity.Player.Inventory.generateRandomObject(3);
				await giveItem(entity, o, language, message.author, message.channel);
				break;
			default:
				// winWeapon
				seEmbed.setDescription(base + trans.attack.winWeapon[draftbotRandom.integer(0, trans.attack.winWeapon.length - 1)]);
				msg = await message.channel.send(seEmbed);
				let w = await entity.Player.Inventory.generateRandomItem(8, ITEMTYPE.WEAPON);
				await giveItem(entity, w, language, message.author, message.channel);
				break;
		}
	} else if (JsonReader.small_events.class.defenseEligible.includes(classId)) {
		let outRand = draftbotRandom.integer(0, 2);
		switch (outRand) {
			case 0:
				// winDefensePotion
				seEmbed.setDescription(base + trans.defense.winPotion[draftbotRandom.integer(0, trans.defense.winPotion.length - 1)]);
				msg = await message.channel.send(seEmbed);
				let p = await entity.Player.Inventory.generateRandomPotion(4);
				await giveItem(entity, p, language, message.author, message.channel);
				break;
			case 1:
				// winDefenseObject
				seEmbed.setDescription(base + trans.defense.winObject[draftbotRandom.integer(0, trans.defense.winObject.length - 1)]);
				msg = await message.channel.send(seEmbed);
				let o = await entity.Player.Inventory.generateRandomObject(4);
				await giveItem(entity, o, language, message.author, message.channel);
				break;
			default:
				// winArmor
				seEmbed.setDescription(base + trans.defense.winArmor[draftbotRandom.integer(0, trans.defense.winArmor.length - 1)]);
				msg = await message.channel.send(seEmbed);
				let a = await entity.Player.Inventory.generateRandomItem(8, ITEMTYPE.ARMOR);
				await giveItem(entity, a, language, message.author, message.channel);
				break;
		}
	} else if (JsonReader.small_events.class.basicEligible.includes(classId)) {
		if (draftbotRandom.bool()) {
			// winItem
			seEmbed.setDescription(base + trans.basic.winItem[draftbotRandom.integer(0, trans.basic.winItem.length - 1)]);
			msg = await message.channel.send(seEmbed);
			let i = await entity.Player.Inventory.generateRandomItem();
			await giveItem(entity, i, language, message.author, message.channel);
		} else {
			// winMoney
			let moneyWon = draftbotRandom.integer(SMALL_EVENT.MINIMUM_MONEY_WON_CLASS, SMALL_EVENT.MAXIMUM_MONEY_WON_CLASS);
			seEmbed.setDescription(base + format(trans.basic.winMoney[draftbotRandom.integer(0, trans.basic.winMoney.length - 1)], {money: moneyWon}));
			msg = await message.channel.send(seEmbed);
			await entity.Player.addMoney(moneyWon);
		}
	} else if (JsonReader.small_events.class.otherEligible.includes(classId)) {
		if (draftbotRandom.bool()) {
			// winItem
			seEmbed.setDescription(base + trans.other.winItem[draftbotRandom.integer(0, trans.other.winItem.length - 1)]);
			msg = await message.channel.send(seEmbed);
			let i = await entity.Player.Inventory.generateRandomItem();
			await giveItem(entity, i, language, message.author, message.channel);
		} else {
			// winHealth
			let healthWon = draftbotRandom.integer(SMALL_EVENT.MINIMUM_HEALTH_WON_CLASS, SMALL_EVENT.MAXIMUM_HEALTH_WON_CLASS);
			seEmbed.setDescription(base + format(trans.other.winHealth[draftbotRandom.integer(0, trans.other.winHealth.length - 1)], {health: healthWon}));
			msg = await message.channel.send(seEmbed);
			await entity.addHealth(healthWon);
		}
	} else {
		console.log("This user has an unknown class : " + entity.discordUser_id);
	}

	await entity.Player.save();
	log(entity.discordUser_id + " got class small event.");
}

module.exports = {
	executeSmallEvent: executeSmallEvent
};