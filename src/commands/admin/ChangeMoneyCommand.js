module.exports.commandInfo = {
	name: "money",
	aliases: [],
	userPermissions: ROLES.USER.BOT_OWNER
};

/**
 * Allow the bot owner to give money to 1 or more people
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";

const ChangeMoneyCommand = async (message, language, args) => {
	if (args.length < 3) {
		return await sendErrorMessage(
			message.author,
			message.channel,
			language,
			JsonReader.commands.money.getTranslation(language).errors.invalidNumberOfArgs
		);
	}
	if (args.length > 52) {
		return await sendErrorMessage(
			message.author,
			message.channel,
			language,
			JsonReader.commands.money.getTranslation(language).errors.tooMuchPeople
		);
	}
	const amount = parseInt(args[1]);
	if (isNaN(amount) || amount > 10 ** 17) {
		return await sendErrorMessage(
			message.author,
			message.channel,
			language,
			JsonReader.commands.money.getTranslation(language).errors.invalidAmountFormat
		);
	}
	const users = new Set();
	for (let i = 2; i < args.length; i++) {
		const mention = args[i];
		if (!isAMention(mention) && (parseInt(mention) < 10 ** 17 || parseInt(mention) >= 10 ** 18)) {
			return await sendErrorMessage(
				message.author,
				message.channel,
				language,
				format(JsonReader.commands.money.getTranslation(language).errors.invalidIdOrMention, {
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
		}
		catch (e) {
			return await sendErrorMessage(
				message.author,
				message.channel,
				language,
				format(JsonReader.commands.money.getTranslation(language).errors.invalidIdOrMentionDoesntExist, {
					position: args.indexOf(user) - 1,
					wrongText: user
				}
				)
			);
		}
		const moneyBefore = entityToEdit.Player.money;
		try {
			giveMoneyTo(entityToEdit, amount, args);
		}
		catch (e) {
			if (e.message === "mauvais paramètre don monnaie") {
				return await sendErrorMessage(
					message.author,
					message.channel,
					language,
					JsonReader.commands.money.getTranslation(language).errors.invalidDonationParameter
				);
			}
			console.error(e.stack);

		}
		entityToEdit.Player.save();
		descString += format(JsonReader.commands.money.getTranslation(language).desc, {
			player: entityToEdit.getMention(),
			money: entityToEdit.Player.money
		});
		if (entityToEdit.Player.dmNotification) {
			sendDirectMessage(
				await client.users.fetch(user),
				JsonReader.commands.money.getTranslation(language).dm.title,
				format(JsonReader.commands.money.getTranslation(language).dm.description, {
					moneyGained: entityToEdit.Player.money - moneyBefore
				}),
				JsonReader.bot.embed.default,
				language
			);
		}
	}
	return await message.channel.send(new DraftBotEmbed()
		.formatAuthor(JsonReader.commands.money.getTranslation(language).title, message.author)
		.setDescription(descString));
};

function giveMoneyTo(entityToEdit, amount, args) {
	if (args[0] === "set") {
		entityToEdit.Player.money = amount;
	}
	else if (args[0] === "add") {
		entityToEdit.Player.money += amount;
	}
	else {
		throw new Error("mauvais paramètre don monnaie");
	}
}

module.exports.execute = ChangeMoneyCommand;