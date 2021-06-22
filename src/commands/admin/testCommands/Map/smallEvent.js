let stringDesc = "Force un type de mini event parmis ceux-ci :\n";
Object.keys(JsonReader.smallEvents).forEach(seName => {
	stringDesc += "\n - " + seName;
});

module.exports.help = {
	name: "smallEvent",
	commandFormat: "<seName>",
	typeWaited: {
		seName: typeVariable.STRING
	},
	messageWhenExecuted: "Mini event `{name}` forcé !",
	description: stringDesc
};

/**
 * Force an small event with a given event name
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const smallEvent = (language, message, args) => {
	if (JsonReader.smallEvents[args[0]] === undefined) {
		throw new Error("Erreur smallEvent : le mini-event " + args[0] + " n'existe pas. Veuillez vous référer à la commande \"test help smallEvent\" pour plus d'informations");
	}
	getCommandFromAlias("r").execute(message, language, [], -1, args[0]);
	return format(module.exports.infos.messageWhenExecuted,{name: args[0]});
};

module.exports.execute = smallEvent;