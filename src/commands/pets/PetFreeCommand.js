import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Entities} from "../../core/models/Entity";
import {Guilds} from "../../core/models/Guild";

module.exports.commandInfo = {
	name: "petfree",
	aliases: ["petf","pfree", "freepet", "freep"],
	allowEffects: EFFECT.SMILEY
};

/**
 * Allow to free a pet
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const PetFreeCommand = async (message, language) => {
	const [entity] = await Entities.getOrRegister(message.author.id);
	let guild;
	if (await sendBlockedError(message.author, message.channel, language)) {
		return;
	}
	// search for a user's guild
	try {
		guild = await Guilds.getById(entity.Player.guildId);
	}
	catch (error) {
		guild = null;
	}

	const pPet = entity.Player.Pet;
	if (!pPet) {
		return await sendErrorMessage(message.author, message.channel, language, JsonReader.commands.myPet.getTranslation(language).noPet);
	}

	const cooldownTime = PETS.FREE_COOLDOWN - (new Date().getTime() - entity.Player.lastPetFree);
	if (cooldownTime > 0) {
		return sendErrorMessage(message.author, message.channel, language, format(JsonReader.commands.petFree.getTranslation(language).cooldown, {
			time: minutesToString(millisecondsToMinutes(cooldownTime))
		}));
	}

	if (pPet.lovePoints < PETS.LOVE_LEVELS[0]) {
		if (entity.Player.money < PETFREE.FREE_FEISTY_COST) {
			return sendErrorMessage(message.author, message.channel, language, format(JsonReader.commands.petFree.getTranslation(language).noMoney, {
				money: PETFREE.FREE_FEISTY_COST - entity.Player.money
			}));
		}
	}

	const confirmEmbed = new DraftBotEmbed();
	const petField = pPet.getPetEmote() + " " + (pPet.nickname ? pPet.nickname : pPet.getPetTypeName(language));
	confirmEmbed.formatAuthor(JsonReader.commands.petFree.getTranslation(language).successTitle, message.author);
	confirmEmbed.setDescription(format(JsonReader.commands.petFree.getTranslation(language).confirmDesc, {
		pet: petField
	}));

	if (pPet.lovePoints < PETS.LOVE_LEVELS[0]) {
		confirmEmbed.setFooter(JsonReader.commands.petFree.getTranslation(language).isFeisty);
	}

	const confirmMessage = await message.channel.send({ embeds: [confirmEmbed] });

	const filter = (reaction, user) => (reaction.emoji.name === MENU_REACTION.ACCEPT || reaction.emoji.name === MENU_REACTION.DENY) && user.id === message.author.id;

	const collector = confirmMessage.createReactionCollector({
		filter,
		time: 30000,
		max: 1
	});

	addBlockedPlayer(entity.discordUserId, "freepet", collector);

	collector.on("end", async (reaction) => {
		removeBlockedPlayer(entity.discordUserId);
		if (reaction.first()) {
			if (reaction.first().emoji.name === MENU_REACTION.ACCEPT) {
				if (pPet.lovePoints < PETS.LOVE_LEVELS[0]) {
					entity.Player.money -= PETFREE.FREE_FEISTY_COST;
				}
				pPet.destroy();
				entity.Player.petId = null;
				entity.Player.lastPetFree = Date();
				entity.Player.save();
				const freedEmbed = new DraftBotEmbed();
				freedEmbed.formatAuthor(JsonReader.commands.petFree.getTranslation(language).successTitle, message.author);
				freedEmbed.setDescription(format(JsonReader.commands.petFree.getTranslation(language).petFreed, {
					pet: petField
				}));

				if (pPet.lovePoints < PETS.LOVE_LEVELS[0]) {
					freedEmbed.setDescription(freedEmbed.description + "\n\n" + format(JsonReader.commands.petFree.getTranslation(language).wasFeisty, {}
					));
				}
				if (guild !== null
					&& guild.carnivorousFood + 1 <= JsonReader.commands.guildShop.max.carnivorousFood
					&& draftbotRandom.realZeroToOneInclusive() <= PETFREE.GIVE_MEAT_PROBABILITY
					&& pPet.lovePoints > PETS.LOVE_LEVELS[0]) {
					guild.carnivorousFood += PETFREE.MEAT_GIVEN;
					guild.save();
					freedEmbed.setDescription(freedEmbed.description + "\n\n" + format(JsonReader.commands.petFree.getTranslation(language).giveMeat, {}));
				}

				return await message.channel.send({ embeds: [freedEmbed] });
			}
		}
		await sendErrorMessage(message.author, message.channel, language, JsonReader.commands.petFree.getTranslation(language).canceled, true);
	});

	try {
		await Promise.all([
			confirmMessage.react(MENU_REACTION.ACCEPT),
			confirmMessage.react(MENU_REACTION.DENY)
		]);
	}
	catch (e) {
		log("Cannot react to pet free message: " + e);
	}
};

module.exports.execute = PetFreeCommand;