module.exports.help = {
	name: "armorid",
	commandFormat: "<id>",
	typeWaited: {
		id: typeVariable.INTEGER
	},
	messageWhenExecuted: "Vous avez maintenant l'armure {armor} !",
	description: "Change l'armure de votre joueur"
};

/**
 * Set the armor of the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const armorIDTestCommand = async (language, message, args) => {
	const [entity] = await Entities.getOrRegister(message.author.id);

	entity.Player.Inventory.armorId = parseInt(args[0],10);
	let armorText;
	try {
		armorText = await (await entity.Player.Inventory.getArmor()).toFieldObject(language).value;
	}
	catch (e) {
		throw new Error("Armure avec id inexistant : " + args[0] + ". L'id de l'armure doit être compris entre 0 et " + await Armors.getMaxId());
	}
	entity.Player.Inventory.save();

	return format(module.exports.help.messageWhenExecuted, {armor: armorText});
};

module.exports.execute = armorIDTestCommand;