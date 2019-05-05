const Help = require('./commands/Help');
const Ping = require('./commands/Ping');
const Invite = require('./commands/Invite');
const Profile = require('./commands/Profile');
const Respawn = require('./commands/Respawn');
const Report = require('./commands/Report');
const Inventory = require('./commands/Inventory');
const Switch = require('./commands/Switch');
const Drink = require('./commands/Drink');
const Daily = require('./commands/Daily');
const Top = require('./commands/Top');
const Sell = require('./commands/Sell');
const Fight = require('./commands/Fight');

const Give = require('./commands/admin/Give');
const Servers = require('./commands/admin/Servers');
const GiveBadge = require('./commands/admin/GiveBadge');
const ChangePrefix = require('./commands/admin/ChangePrefix');

const CommandTable = new Map(
    [
        ["help", Help.HelpCommand],
        ["ping", Ping.PingCommand],
        ["invite", Invite.InviteCommand],
        ["profile", Profile.ProfileCommand],
        ["p", Profile.ProfileCommand],
        ["report", Report.ReportCommand],
        ["r", Report.ReportCommand],
        ["respawn", Respawn.RespawnCommand],
        ["inventory", Inventory.InventoryCommand],
        ["inv", Inventory.InventoryCommand],
        ["switch", Switch.SwitchCommand],
        ["drink", Drink.DrinkCommand],
        ["daily", Daily.DailyCommand],
        ["top", Top.TopCommand],
        ["sell", Sell.SellCommand],
        ["fight", Fight.FightCommand],
        ["f", Fight.FightCommand],

        ["servs", Servers.ServersCommand],
        ["gb", GiveBadge.GiveBadgeCommand],
        ["give", Give.GiveCommand],
        ["cp", ChangePrefix.ChangePrefixCommand],

    ]
);

module.exports = CommandTable;