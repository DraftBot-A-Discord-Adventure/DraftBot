const CT = require("../../core/CommandsTest");

module.exports.commandInfo = {
	name: "test"
};

/**
 * Cheat command for testers
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const TestCommand = async (message, language, args) => {
	// First, we test if we are in test mode
	if (JsonReader.app.TEST_MODE) {
		// Second, we collect the test command entered
		const testCommand = args[0] ?? "list";
		const argsTest = args.slice(1) ?? [];
		let commandTestCurrent;
		try {
			commandTestCurrent = await CT.getTestCommand(testCommand);
		}
		catch (e) {
			return message.channel.send(":x: | Commande test " + testCommand + " inexistante : ```" + e.stack + "```");
		}
		// Third, we check if the test command has the good arguments
		const testGoodFormat = CT.isGoodFormat(commandTestCurrent, argsTest, message);
		if (testGoodFormat[0]) {
			// Last, we execute the test command
			await CT.executeAndAlertUser(language, message, commandTestCurrent, argsTest);
		}
		else {
			return message.channel.send(testGoodFormat[1]);
		}
	}
};

module.exports.execute = TestCommand;