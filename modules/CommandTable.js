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
const TopWeek = require('./commands/TopWeek');
const Sell = require('./commands/Sell');
const Fight = require('./commands/Fight');
const Shop = require('./commands/Shop');

const Items = require('./commands/Items');

const Guild = require('./commands/guild/Guild');
const GuildAdd = require('./commands/guild/GuildAdd');
const GuildCreate = require('./commands/guild/GuildCreate');

const Reset = require('./commands/admin/Reset');
const Give = require('./commands/admin/Give');
const Servers = require('./commands/admin/Servers');
const GiveBadge = require('./commands/admin/GiveBadge');
const ResetBadge = require('./commands/admin/ResetBadge');
const ChangePrefix = require('./commands/admin/ChangePrefix');
const SendData = require('./commands/admin/SendData');
const Invitations = require('./commands/admin/Invitations');
const Points = require('./commands/admin/Points');
const Send = require('./commands/admin/Send');
const Language = require('./commands/admin/Language');

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
        ["dr", Drink.DrinkCommand],
        ["daily", Daily.DailyCommand],
        ["da", Daily.DailyCommand],
        ["top", Top.TopCommand],
        ["topweek", TopWeek.TopWeekCommand],
        ["topw", TopWeek.TopWeekCommand],
        ["tw", TopWeek.TopWeekCommand],
        ["sell", Sell.SellCommand],
        ["fight", Fight.FightCommand],
        ["f", Fight.FightCommand],
        ["s", Shop.ShopCommand],
        ["shop", Shop.ShopCommand],
        ["prefix", ChangePrefix.ChangePrefixCommand],
        ["language", Language.ChangeLanguageCommand],

        ["guild", Guild.guildCommand],
        ["g", Guild.guildCommand],
        ["guildadd", GuildAdd.guildAddCommand],
        ["gadd", GuildAdd.guildAddCommand],
        ["guildcreate", GuildCreate.guildCreateCommand],
        ["gcreate", GuildCreate.guildCreateCommand],

        ["items", Items.displayItems],

        ["reset", Reset.ResetCommand],
        ["invi", Invitations.InvitationsCommand],
        ["points", Points.PointsCommand],
        ["servs", Servers.ServersCommand],
        ["gb", GiveBadge.GiveBadgeCommand],
        ["give", Give.GiveCommand],
        ["cp", ChangePrefix.ChangePrefixCommand],
        ["rb", ResetBadge.ResetBadgeCommand],
        ["senddata", SendData.SendDataCommand],
        ["dm", Send.SendCommand],
    ]
);

module.exports = CommandTable;