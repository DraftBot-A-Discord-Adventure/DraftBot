module.exports.help = {
	name: "mypet",
	aliases: ["pet", "pp"],
	disallowEffects: [EFFECT.BABY, EFFECT.DEAD, EFFECT.LOCKED]
};

/**
 * Displays information about the pet of a user
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";

const MyPetCommand = async (message, language, args) => {
	let [entity] = await Entities.getByArgs(args, message);
	if (!entity) {
		[entity] = await Entities.getOrRegister(message.author.id);
	}

	const authorPet = entity.Player.Pet;
	const tr = JsonReader.commands.myPet.getTranslation(language);

	if (authorPet) {
		const user = message.mentions.users.last() ? message.mentions.users.last() : message.author;
		return await message.channel.send(new DraftBotEmbed()
			.setAuthor(
				format(tr.embedTitle, {
					pseudo: await entity.Player.getPseudo(language)
				}),
				user.displayAvatarURL()
			)
			.setDescription(
				await PetEntities.getPetDisplay(authorPet, language)
			));
	}

	if (entity.discordUserId === message.author.id) {
		await sendErrorMessage(
			message.author,
			message.channel,
			language,
			tr.noPet
		);
	}
	else {
		await sendErrorMessage(
			message.author,
			message.channel,
			language,
			tr.noPetOther
		);
	}
};

module.exports.execute = MyPetCommand;