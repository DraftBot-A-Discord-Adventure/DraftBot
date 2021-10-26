import {Constants} from "../../core/Constants";
import {format} from "../../core/utils/StringFormatter";
import {DraftBotValidateReactionMessage} from "../../core/messages/DraftBotValidateReactionMessage";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Translations} from "../../core/Translations";
import {DraftBotErrorEmbed} from "../../core/messages/DraftBotErrorEmbed";
import {Armors} from "../../core/models/Armor";

module.exports.commandInfo = {
	name: "give",
	aliases: [],
	userPermissions: ROLES.USER.BOT_OWNER
};

/**
 * Allow the bot owner to give an item to somebody
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {String[]} args=[] - Additional arguments sent with the command
 */

const GiveCommand = async (message, language, args) => {
	const tr = Translations.getModule("commands.giveCommand", language);
	if (args.length < 3) {
		return await sendErrorMessage(
			message.author,
			message.channel,
			language,
			tr.get("errors.invalidNumberOfArgs")
		);
	}
	if (args.length > 52) {
		return await sendErrorMessage(
			message.author,
			message.channel,
			language,
			tr.get("errors.tooMuchPeople")
		);
	}
	const category = parseInt(args[0], 10);
	if (isNaN(category) || category < 0 || category > 3) {
		return await message.channel.send({ embeds: [new DraftBotErrorEmbed(message.author, language, tr.get("errors.unknownCategory"))] });
	}
	const itemId = parseInt(args[1],10);
	let item = null;
	switch (category) {
	case Constants.ITEM_CATEGORIES.WEAPON:
		item = itemId <= await Weapons.getMaxId() && itemId > 0 ? await Weapons.getById(itemId) : null;
		break;
	case Constants.ITEM_CATEGORIES.ARMOR:
		item = itemId <= await Armors.getMaxId() && itemId > 0 ? await Armors.getById(itemId) : null;
		break;
	case Constants.ITEM_CATEGORIES.POTION:
		item = itemId <= await Potions.getMaxId() && itemId > 0 ? await Potions.getById(itemId) : null;
		break;
	case Constants.ITEM_CATEGORIES.OBJECT:
		item = itemId <= await Objects.getMaxId() && itemId > 0 ? await Objects.getById(itemId) : null;
		break;
	default:
		break;
	}
	if (item === null) {
		return await message.channel.send({ embeds: [new DraftBotErrorEmbed(message.author, language, tr.get("errors.wrongItemId"))] });
	}

	const users = new Set();
	for (let i = 2; i < args.length; i++) {
		const mention = args[i];
		if (!isAMention(mention) && (parseInt(mention) < 10 ** 17 || parseInt(mention) >= 10 ** 18)) {
			return await sendErrorMessage(
				message.author,
				message.channel,
				language,
				tr.format("errors.invalidIdOrMention", {
					position: i - 1,
					wrongText: args[i]
				})
			);
		}
		users.add(isAMention(mention) ? getIdFromMention(mention) : mention);
	}

	new DraftBotValidateReactionMessage(
		message.author,
		async (validateMessage) => {
			if (validateMessage.isValidated()) {
				let descString = "";
				for (const user of users) {
					let entityToEdit;
					try {
						entityToEdit = await Entities.getByDiscordUserId(user);
						if (!entityToEdit) {
							throw new Error();
						}
					}
					catch (e) {
						descString += tr.format("giveError.baseText", {
							user,
							mention: idToMention(user),
							reason: tr.get("giveError.reasons.invalidMention")
						});
						continue;
					}
					if (!await entityToEdit.Player.giveItem(item)) {
						descString += tr.format("giveError.baseText", {
							user,
							mention: idToMention(user),
							reason: tr.get("giveError.reasons.noSpace")
						});
						continue;
					}
					descString += format(tr.get("giveSuccess"), {
						user,
						mention: idToMention(user)
					});
					if (entityToEdit.Player.dmNotification) {
						sendDirectMessage(
							await client.users.fetch(user),
							tr.get("dm.title"),
							tr.format("dm.description", {
								item: item.toString(language)
							}),
							JsonReader.bot.embed.default,
							language
						);
					}
				}
				await message.channel.send({ embeds: [new DraftBotEmbed()
					.formatAuthor(tr.get("resultTitle"), message.author)
					.setDescription(descString)]});
			}
			else {
				await sendErrorMessage(
					message.author,
					message.channel,
					language,
					tr.get("errors.commandCanceled")
				);
			}
		}
	)
		.formatAuthor(
			tr.get("confirmTitle"),
			message.author
		)
		.setDescription(format(tr.get("confirmDesc"), {
			item: item.toString(language),
			usersCount: users.size
		}))
		.send(message.channel);
};

module.exports.execute = GiveCommand;