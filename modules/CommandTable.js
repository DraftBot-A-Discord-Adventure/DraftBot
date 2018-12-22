const Help = require('./commands/Help');
const Ping = require('./commands/Ping');

const CommandTable = new Map(
    [
        ["help", Help.HelpCommand],
        ["aide", Help.HelpCommand],
        ["ping", Ping.PingCommand]
    ]
);

module.exports = CommandTable;