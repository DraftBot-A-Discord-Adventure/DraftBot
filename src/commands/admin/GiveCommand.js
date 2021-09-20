import {DraftBotErrorEmbed} from "../../core/messages/DraftBotErrorEmbed";

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
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Constants} from "../../core/Constants";
import {Translations} from "../../core/Translations";

const GiveCommand = async (message, language, args) => {
	const tr = Translations.getModule("commands.giveCommand", language);
	const player = getUserFromMention(args[0]);
	const [entity] = await Entities.getOrRegister(player.id);
	const itemId = parseInt(args[2],10);
	const category = parseInt(args[1], 10);
	if (category < 0 || category > 3) {
		return await message.channel.send(new DraftBotErrorEmbed(player, language, tr.get("unknownCategory")));
	}
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
		return await message.channel.send(new DraftBotErrorEmbed(player, language, tr.get("wrongItemId")));
	}
	if (!await entity.Player.giveItem(item)) {
		return await message.channel.send(new DraftBotErrorEmbed(player, language, tr.get("noAvailableSlot")));
	}

	return await message.channel.send(new DraftBotEmbed()
		.formatAuthor(JsonReader.commands.giveCommand.getTranslation(language).giveSuccess, message.author)
		.setDescription(format(JsonReader.commands.giveCommand.getTranslation(language).descGive, {
			item: item.getName(language),
			player: player
		})));
};

function getUserFromMention(mention) {
	if (!mention) {
		return;
	}

	if (mention.startsWith("<@") && mention.endsWith(">")) {
		mention = mention.slice(2, -1);

		if (mention.startsWith("!")) {
			mention = mention.slice(1);
		}

		return client.users.cache.get(mention);
	}
}

module.exports.execute = GiveCommand;