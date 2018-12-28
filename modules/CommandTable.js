const Help = require('./commands/Help');
const Ping = require('./commands/Ping');
const Invite = require('./commands/Invite');
const Profile = require('./commands/Profile');
const Respawn = require('./commands/Respawn');

const InitDatabase = require('./commands/admin/initDatabase');

const CommandTable = new Map(
    [
        ["help", Help.HelpCommand],
        ["aide", Help.HelpCommand],
        ["ping", Ping.PingCommand],
        ["invite", Invite.InviteCommand],
        ["profile", Profile.ProfileCommand],
        ["init", InitDatabase.InitDatabaseCommand],
        ["respawn", Respawn.RespawnCommand]
    ]
);

module.exports = CommandTable;