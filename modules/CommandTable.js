const Config = require('./utils/Config');
const Start = require('./commands/StartCommand');
const Help = require('./commands/HelpCommand');

const CommandTable = new Map(
    [
        [Config.commandNames.START_COMMAND, Start.StartCommand],
        [Config.commandNames.HELP_COMMAND, Help.HelpCommand]
    ]
);

module.exports = CommandTable;