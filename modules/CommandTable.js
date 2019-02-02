const Help = require('./commands/Help');
const Ping = require('./commands/Ping');
const Invite = require('./commands/Invite');
const Profile = require('./commands/Profile');
const Respawn = require('./commands/Respawn');
const Report = require('./commands/Report');
const Inventory = require('./commands/Inventory');
const Test = require('./commands/Test');


const InitDatabase = require('./commands/admin/initDatabase');
const Give = require('./commands/admin/give');

const CommandTable = new Map(
    [
        ["help", Help.HelpCommand],
        ["aide", Help.HelpCommand],
        ["ping", Ping.PingCommand],
        ["invite", Invite.InviteCommand],
        ["profile", Profile.ProfileCommand],
        ["report", Report.ReportCommand],
        ["respawn", Respawn.RespawnCommand],
        ["inventory", Inventory.InventoryCommand],
        ["inv", Inventory.InventoryCommand],
        ["test", Test.TestCommand],

        ["init", InitDatabase.InitDatabaseCommand],
        ["give", Give.GiveCommand],
        
    ]
);

module.exports = CommandTable;