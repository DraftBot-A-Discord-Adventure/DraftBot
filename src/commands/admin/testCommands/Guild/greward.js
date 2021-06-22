let stringDesc = "Force un gd avec une sortie donnée. Liste des sorties possibles : ";
Object.entries(REWARD_TYPES).forEach((v) => stringDesc += "\n - " + v[1]); // eslint-disable-line no-return-assign
module.exports.help = {
	name: "greward",
	commandFormat: "<reward>",
	typeWaited: {
		reward: typeVariable.STRING
	},
	messageWhenExecuted: "Reward {reward} forcé !",
	description: stringDesc
};

/**
 * Force a gd with a given out
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const greward = async (language, message, args) => {

	const [entity] = await Entities.getOrRegister(message.author.id);

	const guild = await Guilds.findOne({where: {id: entity.Player.guildId}});
	if (guild === null) {
		throw new Error("Erreur greward : vous n'êtes pas dans une guilde !");
	}

	const rewardValues = Object.keys(REWARD_TYPES).map(function(key){
		return REWARD_TYPES[key];
	});
	if (!rewardValues.includes(args[0])) {
		throw new Error("Erreur greward : reward donné n'existe pas. Veuillez vous référer à la commande \"test help greward\" pour plus d'informations");
	}

	await getCommandFromAlias("gd").execute(message, language, [], args[0]);
	return format(module.exports.infos.messageWhenExecuted, {reward: args[0]});
};

module.exports.execute = greward;