const Help = require('./commands/Help');
const Ping = require('./commands/Ping');
const Invite = require('./commands/Invite');

const InitDatabase = require('./commands/admin/initDatabase');

const CommandTable = new Map(
    [
        ["help", Help.HelpCommand],
        ["aide", Help.HelpCommand],
        ["ping", Ping.PingCommand],
        ["invite", Invite.InviteCommand],
        ["init", InitDatabase.InitDatabaseCommand]
    ]
);

module.exports = CommandTable;