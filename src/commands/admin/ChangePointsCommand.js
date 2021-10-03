module.exports.commandInfo = {
	name: "points",
	aliases: [],
	userPermissions: ROLES.USER.BOT_OWNER
};

/**
 * Allow the bot owner to give points to 1 or more people
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";

const ChangePointsCommand = async (message, language, args) => {
	if (args.length < 3) {
		return await sendErrorMessage(
			message.author,
			message.channel,
			language,
			JsonReader.commands.points.getTranslation(language).errors.invalidNumberOfArgs
		);
	}
	if (args.length > 52) {
		return await sendErrorMessage(
			message.author,
			message.channel,
			language,
			JsonReader.commands.points.getTranslation(language).errors.tooMuchPeople
		);
	}
	const amount = parseInt(args[1]);
	if (isNaN(amount) || amount > 10 ** 17) {
		return await sendErrorMessage(
			message.author,
			message.channel,
			language,
			JsonReader.commands.points.getTranslation(language).errors.invalidAmountFormat
		);
	}
	const users = new Set();
	for (let i = 2; i < args.length; i++) {
		let mention = args[i];
		if (!isAMention(mention) && (parseInt(mention) < 10 ** 17 || parseInt(mention) >= 10 ** 18)) {
			return await sendErrorMessage(
				message.author,
				message.channel,
				language,
				format(JsonReader.commands.points.getTranslation(language).errors.invalidIdOrMention, {
						position: i - 1,
						wrongText: args[i]
					}
				)
			);
		}
		users.add(isAMention(mention) ? getIdFromMention(mention) : mention);
	}

	let descString = "";
	for (const user of users) {
		let entityToEdit;
		try {
			[entityToEdit] = await Entities.getOrRegister(user);
		} catch (e) {
			return await sendErrorMessage(
				message.author,
				message.channel,
				language,
				format(JsonReader.commands.points.getTranslation(language).errors.invalidIdOrMentionDoesntExist, {
						position: (args.indexOf(user) - 1),
						wrongText: user
					}
				)
			);
		}
		const pointsBefore = entityToEdit.Player.score;
		try {
			givePointsTo(entityToEdit, amount, args);
		} catch (e) {
			if (e.message === "mauvais paramètre don points") {
				return await sendErrorMessage(
					message.author,
					message.channel,
					language,
					JsonReader.commands.points.getTranslation(language).errors.invalidDonationParameter
				);
			} else {
				console.error(e.stack);
			}
		}
		entityToEdit.Player.save();
		descString += format(JsonReader.commands.points.getTranslation(language).desc, {
			player: entityToEdit.getMention(),
			points: entityToEdit.Player.score
		});
		if (entityToEdit.Player.dmNotification) {
			sendDirectMessage(
				(await client.users.fetch(user)),
				JsonReader.commands.points.getTranslation(language).dm.title,
				format(JsonReader.commands.points.getTranslation(language).dm.description, {
					pointsGained: entityToEdit.Player.score - pointsBefore,
				}),
				JsonReader.bot.embed.default,
				language
			);
		}
	}
	return await message.channel.send({ embeds: [new DraftBotEmbed()
		.formatAuthor(JsonReader.commands.points.getTranslation(language).title, message.author)
		.setDescription(descString)] });
};

function givePointsTo(entityToEdit, amount, args) {
	if (args[0] === "set") {
		entityToEdit.Player.score = amount;
	} else if (args[0] === "add") {
		entityToEdit.Player.score += amount;
	} else {
		throw new Error("mauvais paramètre don points")
	}
}

module.exports.execute = ChangePointsCommand;