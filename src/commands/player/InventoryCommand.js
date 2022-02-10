import {DraftBotInventoryEmbedBuilder} from "../../core/messages/DraftBotInventoryEmbed";
import {Entities} from "../../core/models/Entity";

module.exports.commandInfo = {
	name: "inventory",
	aliases: ["inv", "i"],
	disallowEffects: [EFFECT.BABY, EFFECT.DEAD]
};

/**
 * Displays the inventory of a player
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {String[]} args=[] - Additional arguments sent with the command
 */

const InventoryCommand = async (message, language, args) => {
	let [entity] = await Entities.getByArgs(args, message);
	if (!entity) {
		[entity] = await Entities.getOrRegister(message.author.id);
	}

	await (await new DraftBotInventoryEmbedBuilder(message.author, language, entity.Player)
		.build())
		.send(message.channel);
};

module.exports.execute = InventoryCommand;