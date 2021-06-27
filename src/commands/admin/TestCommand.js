const CT = require("../../core/CommandsTest");

module.exports.help = {
	name: "test"
};

/**
 * Cheat command for testers
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const TestCommand = async (message, language, args) => {

	// First test : check if we are in test mode
	if (JsonReader.app.TEST_MODE !== true) {
		return;
	}

	// Second test : check if we have a command entered, if not, send the help message
	let testCommand, argsTest;
	if (args.length === 0) {
		testCommand = "list";
		argsTest = [];
	}
	else {
		testCommand = args[0];
		argsTest = args.slice(1);
	}

	// Third test : try to find that command
	let commandTestCurrent;
	try {
		commandTestCurrent = await CT.getTestCommand(testCommand);
	}
	catch (e) {
		return message.channel.send(":x: | Commande test " + testCommand + " inexistante : ```" + e.stack + "```");
	}

	// Fourth test : see if we have the right format for that command
	const testGoodFormat = CT.isGoodFormat(commandTestCurrent, argsTest, message);
	if (!testGoodFormat[0]) {
		return message.channel.send(testGoodFormat[1]);
	}

	// Fifth test : try to launch the command
	await CT.executeAndAlertUser(language, message, commandTestCurrent, argsTest);
};

module.exports.execute = TestCommand;