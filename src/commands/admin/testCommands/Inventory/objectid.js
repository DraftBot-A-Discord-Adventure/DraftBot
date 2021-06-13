module.exports.infos = {
	name: "objectid",
	commandFormat: "<id>",
	typeWaited: {
		id: typeVariable.INTEGER
	},
	messageWhenExecuted: "Vous avez maintenant l'objet actif {object} !",
	description: "Change l'objet actif de votre joueur"
};

/**
 * Set the active object of the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
async function objectid(language, message, args) {
	const [entity] = await Entities.getOrRegister(message.author.id);

	entity.Player.Inventory.objectId = parseInt(args[0]);
	let objectText;
	try {
		objectText = await (await entity.Player.Inventory.getActiveObject()).toFieldObject(language, "").value;
	}
	catch (e) {
		throw new Error("Objet avec id inexistant : " + args[0]);
	}
	entity.Player.Inventory.save();

	return format(module.exports.infos.messageWhenExecuted, {object: objectText});
}

module.exports.execute = objectid;