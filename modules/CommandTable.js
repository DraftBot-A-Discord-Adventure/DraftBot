const Help = require('./commands/Help');
const Ping = require('./commands/Ping');
const Invite = require('./commands/Invite');
const Profile = require('./commands/Profile');
const Respawn = require('./commands/Respawn');
const Report = require('./commands/Report');
const Inventory = require('./commands/Inventory');
const Test = require('./commands/Test');
const Switch = require('./commands/Switch');
const Drink = require('./commands/Drink');
const Top = require('./commands/Top');


const InitDatabase = require('./commands/admin/InitDatabase');
const Give = require('./commands/admin/Give');

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
        ["switch", Switch.SwitchCommand],
        ["drink", Drink.DrinkCommand],
        ["top", Top.TopCommand],

        ["init", InitDatabase.InitDatabaseCommand],
        ["give", Give.GiveCommand],
        
    ]
);

module.exports = CommandTable;