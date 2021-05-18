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
	let base = JsonReader.small_events.classInteraction.emote + JsonReader.smallEventsIntros.getTranslation(language).intro[randInt(0, JsonReader.smallEventsIntros.getTranslation(language).intro.length)];

	if (JsonReader.small_events.classInteraction.attackEligible.includes(classId)) {
		let outRand = draftbotRandom.integer(0, 2);
		switch (outRand) {
			case 0:
				// winAttackPotion
				let pRand = entity.Player.Inventory.generateRandomPotion(3);
				break;
			case 1:
				// winAttackObject
				break;
			default:
				// winWeapon
				break;
		}
	} else if (JsonReader.small_events.classInteraction.defenseEligible.includes(classId)) {
		let outRand = draftbotRandom.integer(0, 2);
	} else if (JsonReader.small_events.classInteraction.basicEligible.includes(classId)) {
		let outRand = draftbotRandom.bool();
	} else if (JsonReader.small_events.classInteraction.otherEligible.includes(classId)) {
		let outRand = draftbotRandom.bool();
	} else {
		console.log("This user has an unknown class : " + entity.discordUser_id);
	}

	const msg = await message.channel.send(seEmbed);
	log(entity.discordUser_id + " got class small event.");
}

module.exports = {
	executeSmallEvent: executeSmallEvent
};