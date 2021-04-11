const BADGE = "💞";

/**
 * Main function of small event
 * @param {module:"discord.js".Message} message
 * @param {"fr"|"en"} language
 * @param {Entities} entity
 * @param {module:"discord.js".MessageEmbed} seEmbed - The template embed to send. The description already contains the emote so you have to get it and add your text
 * @returns {Promise<>}
 */
const executeSmallEvent = async function (message, language, entity, seEmbed) {

	if (!entity.Player.Pet) {
		//TODO TODO TODO TOOZFJOZJZOZHPOZHO
		return await message.channel.send("TODO: no pet -> redirect to nothing");
	}
	const pet = entity.Player.Pet;
	let interaction = pickRandomInteraction(entity.Player.Pet);
	let amount = 0;
	let food = null;
	switch (interaction) {
		case "money":
			amount = randInt(20, 70);
			entity.Player.money += amount;
			await entity.Player.save();
			break;
		case "item":
			giveRandomItem(message.author, message.channel, language, entity);
			break;
		case "gainLife":
			amount = randInt(1, 5);
			await entity.addHealth(amount);
			await entity.save();
			break;
		case "gainLove":
			amount = randInt(1, 3);
			pet.lovePoints += amount;
			if (pet.lovePoints > PETS.MAX_LOVE_POINTS) {
				pet.lovePoints = PETS.MAX_LOVE_POINTS;
			}
			await pet.save();
			break;
		case "food":
			if (entity.Player.guild_id) {
				food = draftbotRandom.pick([JsonReader.food.commonFood, JsonReader.food.herbivorousFood, JsonReader.food.carnivorousFood, JsonReader.food.ultimateFood]);
				await require("../../commands/guild/GuildShopCommand").giveFood(message, language, entity, message.author, food, 1);
			}
			else {
				interaction = "nothing";
			}
			break;
		case "gainTime":
			amount = randInt(5, 20);
			//TODO A FAAAAAAAAAAAAAAAAAIRE
			await message.channel.send("gainTime possibility to do. If you see this message, Nysvaa probably forgot to implement it, please report this.");
			break;
		case "points":
			amount = randInt(20, 70);
			entity.Player.score += amount;
			await entity.Player.save();
			break;
		case "badge":
			if (entity.Player.badges.includes(BADGE)) {
				interaction = "nothing";
			}
			else {
				entity.Player.addBadge(BADGE);
				entity.Player.save();
			}
			break;
		case "loseLife":
			amount = randInt(1, 5);
			await entity.addHealth(-amount);
			await entity.Player.killIfNeeded(entity, message.channel, language);
			await entity.save();
			break;
		case "loseMoney":
			amount = randInt(20, 70);
			entity.Player.money -= amount;
			entity.Player.save();
			break;
		case "loseTime":
			amount = randInt(5, 20);
			//TODO A FAAAAAAAAAAAAAAAAAIRE
			await message.channel.send("loseTime possibility to do. If you see this message, Nysvaa probably forgot to implement it, please report this.");
			break;
		case "petFlee":
			pet.destroy();
			entity.Player.pet_id = null;
			entity.Player.save();
			break;
		case "loseLove":
			amount = randInt(1, 3);
			pet.lovePoints -= amount;
			if (pet.lovePoints < 0) {
				pet.lovePoints = 0;
			}
			await pet.save();
			break;
	}
	const tr = JsonReader.small_events.pet.getTranslation(language);
	const sentence = tr[interaction][randInt(0, tr[interaction].length)];
	const random_animal = sentence.includes("{random_animal}") ? await PetEntities.generateRandomPetEntity() : null;
	seEmbed.setDescription(format(sentence, {
		pet: PetEntities.getPetEmote(pet) + " " + (pet.nickname ? pet.nickname : PetEntities.getPetTypeName(pet, language)),
		nominative: tr.nominative[pet.sex],
		nominativeShift: tr.nominative[pet.sex].charAt(0).toUpperCase() + tr.nominative[pet.sex].slice(1),
		accusative: tr.accusative[pet.sex],
		accusativeShift: tr.accusative[pet.sex].charAt(0).toUpperCase() + tr.accusative[pet.sex].slice(1),
		determinant: tr.determinant[pet.sex],
		determinantShift: tr.determinant[pet.sex].charAt(0).toUpperCase() + tr.determinant[pet.sex].slice(1),
		amount: amount,
		food: food ? food.translations[language].name.toLowerCase() + " " + food.emote + " " : "",
		badge: BADGE,
		feminine: pet.sex === "f" ? "e" : "",
		random_animal: random_animal ? (PetEntities.getPetEmote(random_animal) + " " + PetEntities.getPetTypeName(random_animal, language)) : "",
		random_animal_feminine: random_animal ? (random_animal.sex === "f" ? "e" : "") : ""
	}));
	await message.channel.send(seEmbed);
};

const pickRandomInteraction = function(pet_entity) {
	const section = pet_entity.lovePoints <= PETS.LOVE_LEVELS[0] ? JsonReader.small_events.pet.rarities.feisty : JsonReader.small_events.pet.rarities.normal;
	const level = pet_entity.PetModel.rarity + (PetEntities.getLoveLevelNumber(pet_entity) === 5 ? 1 : 0);

	let total = 0;
	for (let key in section) {
		if (section.hasOwnProperty(key)) {
			if (section[key].minLevel) {
				if (section[key].minLevel <= level) {
					total += section[key].probabilityWeight;
				}
			} else {
				total += section[key].probabilityWeight;
			}
		}
	}

	const pickedNumber = randInt(0, total);
	let cumulative = 0;

	for (let key in section) {
		if (section.hasOwnProperty(key)) {
			if (section[key].minLevel) {
				if (section[key].minLevel <= level) {
					if (pickedNumber < cumulative + section[key].probabilityWeight) {
						return key;
					}
					cumulative += section[key].probabilityWeight;
				}
			} else if (pickedNumber < cumulative + section[key].probabilityWeight) {
				return key
			}
			else {
				cumulative += section[key].probabilityWeight;
			}
		}
	}

	return null;
}

module.exports = {
	executeSmallEvent: executeSmallEvent
};