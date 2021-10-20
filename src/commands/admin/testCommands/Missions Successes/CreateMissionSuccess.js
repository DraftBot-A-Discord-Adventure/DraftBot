module.exports.commandInfo = {
	name: "createmissionsuccess",
	aliases: ["cms", "createms"],
	commandFormat: "<id> <isMission> <strength>",
	typeWaited: {
		id: typeVariable.INTEGER,
		isMission: typeVariable.INTEGER,
		strength: typeVariable.INTEGER
	},
	messageWhenExecuted: "Mission Succès d'id {id} de force {strength} créé !",
	description: "Crée une mission succès"
};

/**
 * Create a MissionSuccess with a given event id
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const createMissionSuccessCommand = async (language, message, args) => {
	const [entity] = await Entities.getOrRegister(message.author.id);
	const ms = await MissionsSuccesses.getById(parseInt(args[0]));
	const pms = parseInt(args[1]) === 1 ?
		await PlayerMissionsSuccesses.createPlayerMission(entity.Player, ms, parseInt(args[2])) :
		await PlayerMissionsSuccesses.createPlayerSuccess(entity.Player, ms, parseInt(args[2]), 0);
	pms.save();
	return format(module.exports.commandInfo.messageWhenExecuted,{id: args[0], strength: args[2]});
};

module.exports.execute = createMissionSuccessCommand;