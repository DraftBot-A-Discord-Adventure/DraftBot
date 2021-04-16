/**
 * Allow to change the nickname of a pet
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const PetNicknameCommand = async function (language, message, args) {
	const [entity] = await Entities.getOrRegister(message.author.id);

	if ((await canPerformCommand(message, language, PERMISSION.ROLE.ALL,
		[EFFECT.BABY, EFFECT.DEAD, EFFECT.LOCKED], entity)) !== true) {
		return;
	}
	if (await sendBlockedError(message.author, message.channel, language)) {
		return;
	}

	const pet = entity.Player.Pet;
	if (!pet) {
		return await sendErrorMessage(message.author, message.channel, language, JsonReader.commands.myPet.getTranslation(language).noPet);
	}

	const successEmbed = new discord.MessageEmbed();
	successEmbed.setAuthor(format(JsonReader.commands.petNickname.getTranslation(language).successTitle, {
		pseudo: message.author.username
	}), message.author.displayAvatarURL());
	if (args.length === 0) {
		pet.nickname = null;
		await pet.save();
		successEmbed.setDescription(JsonReader.commands.petNickname.getTranslation(language).successNoName);
		return await message.channel.send(successEmbed);
	}

	const petNickname = args.join(" ");
	if (!checkNameString(petNickname, JsonReader.models.pets.nicknameMinLength, JsonReader.models.pets.nicknameMaxLength)) {
		return sendErrorMessage(message.author, message.channel, language,
			format(JsonReader.commands.petNickname.getTranslation(language).invalidName + "\n" + JsonReader.error.getTranslation(language).nameRules, {
				min: JsonReader.models.pets.nicknameMinLength,
				max: JsonReader.models.pets.nicknameMaxLength,
			}));
	}
	pet.nickname = petNickname;
	await pet.save();
	successEmbed.setDescription(format(JsonReader.commands.petNickname.getTranslation(language).success, {
		name: petNickname
	}));
	await message.channel.send(successEmbed);
};

module.exports = {
	commands: [
		{
			name: 'petnickname',
			func: PetNicknameCommand,
			aliases: ['petnick', 'pnickname', 'pnick', 'petname', 'pname']
		}
	]
};
