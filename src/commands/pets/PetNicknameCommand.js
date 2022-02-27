import {Entities} from "../../core/models/Entity";

module.exports.commandInfo = {
	name: "petnickname",
	aliases: ["petnick","pnickname","pnick","petname","pname"],
	disallowEffects: [EFFECT.BABY, EFFECT.DEAD]
};

/**
 * Allow to change the nickname of a pet
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";

const PetNicknameCommand = async (message, language, args) => {
	if (await sendBlockedError(message.author, message.channel, language)) {
		return;
	}

	const [entity] = await Entities.getOrRegister(message.author.id);

	const pet = entity.Player.Pet;
	if (!pet) {
		return await sendErrorMessage(message.author, message.channel, language, JsonReader.commands.myPet.getTranslation(language).noPet);
	}

	const successEmbed = new DraftBotEmbed()
		.formatAuthor(JsonReader.commands.petNickname.getTranslation(language).successTitle, message.author);
	if (args.length === 0) {
		pet.nickname = null;
		await pet.save();
		successEmbed.setDescription(JsonReader.commands.petNickname.getTranslation(language).successNoName);
		return await message.channel.send({ embeds: [successEmbed] });
	}

	const petNickname = args.join(" ");
	if (!checkNameString(petNickname, JsonReader.models.pets.nicknameMinLength, JsonReader.models.pets.nicknameMaxLength)) {
		return sendErrorMessage(message.author, message.channel, language,
			format(JsonReader.commands.petNickname.getTranslation(language).invalidName + "\n" + JsonReader.error.getTranslation(language).nameRules, {
				min: JsonReader.models.pets.nicknameMinLength,
				max: JsonReader.models.pets.nicknameMaxLength
			}));
	}
	pet.nickname = petNickname;
	await pet.save();
	successEmbed.setDescription(format(JsonReader.commands.petNickname.getTranslation(language).success, {
		name: petNickname
	}));
	await message.channel.send({ embeds: [successEmbed] });
};

module.exports.execute = PetNicknameCommand;