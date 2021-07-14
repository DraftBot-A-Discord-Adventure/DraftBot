module.exports.help = {
	name: "initplayer",
	aliases: ["init"],
	commandFormat: "",
	messageWhenExecuted: "Vous avez initialisé votre joueur !",
	description: "Initialise votre joueur pour des tests"
};

const Maps = require("../../../../core/Maps");

/**
 * Initialize the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @return {String} - The successful message formatted
 */
const initPlayerTestCommand = async (language, message) => {
	const [entity] = await Entities.getOrRegister(message.author.id);
	entity.Player.level = 1;
	entity.Player.score = 2000;
	entity.Player.weeklyScore = 0;
	entity.Player.experience = 0;
	entity.Player.money = 0;
	entity.Player.badges = null;
	entity.Player.effectEndDate = Date.now();
	entity.Player.effectDuration = 0;
	await Maps.removeEffect(entity.Player);
	entity.Player.startTravelDate = new Date();
	entity.Player.save();

	entity.maxHealth = 100;
	entity.health = 100;
	entity.attack = 50;
	entity.defense = 20;
	entity.speed = 10;
	entity.save();

	entity.Player.Inventory.weaponId = 0;
	entity.Player.Inventory.armorId = 0;
	entity.Player.Inventory.objectId = 0;
	entity.Player.Inventory.backupId = 0;
	entity.Player.Inventory.save();
	return module.exports.help.messageWhenExecuted;
};

module.exports.execute = initPlayerTestCommand;