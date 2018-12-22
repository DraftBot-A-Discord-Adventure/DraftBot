const Help = require('./commands/Help');
const Ping = require('./commands/Ping');
const Invite = require('./commands/Invite');

const CommandTable = new Map(
    [
        ["help", Help.HelpCommand],
        ["aide", Help.HelpCommand],
        ["ping", Ping.PingCommand],
        ["invite", Invite.InviteCommand]
    ]
);

module.exports = CommandTable;