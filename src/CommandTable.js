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
const TopServ = require('./commands/TopServ');
const Sell = require('./commands/Sell');
const Fight = require('./commands/Fight');
const Shop = require('./commands/Shop');

const Guild = require('./commands/guilds/Guild');
const GuildAdd = require('./commands/guilds/GuildAdd');
const GuildLeave = require('./commands/guilds/GuildLeave');
const GuildCreate = require('./commands/guilds/GuildCreate');
const GuildKick = require('./commands/guilds/GuildKick');
const GuildDaily = require('./commands/guilds/GuildDaily');

const Reset = require('./commands/admin/Reset');
const Give = require('./commands/admin/Give');
const ListItems = require('./commands/admin/ListItems');
const Servers = require('./commands/admin/Servers');
const GiveBadge = require('./commands/admin/GiveBadge');
const ResetBadge = require('./commands/admin/ResetBadge');
const ChangePrefix = require('./commands/admin/ChangePrefix');
const SendData = require('./commands/admin/SendData');
const Points = require('./commands/admin/Points');
const PointsWeek = require('./commands/admin/PointsWeek');
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
        ["tops", TopServ.TopServCommand],
        ["topserv", TopServ.TopServCommand],
        ["tw", TopWeek.TopWeekCommand],
        ["sell", Sell.SellCommand],
        ["fight", Fight.FightCommand],
        ["f", Fight.FightCommand],
        ["s", Shop.ShopCommand],
        ["shop", Shop.ShopCommand],
        ["prefix", ChangePrefix.ChangePrefixCommand],
        ["language", Language.ChangeLanguageCommand],

        ["list", ListItems.ListItemsCommand],
        ["destroy", Reset.ResetCommand],
        ["points", Points.PointsCommand],
        ["pointsw", PointsWeek.PointsWeekCommand],
        ["servs", Servers.ServersCommand],
        ["gb", GiveBadge.GiveBadgeCommand],
        ["give", Give.GiveCommand],
        ["cp", ChangePrefix.ChangePrefixCommand],
        ["rb", ResetBadge.ResetBadgeCommand],
        ["senddata", SendData.SendDataCommand],
        ["dm", Send.SendCommand],

        ["guild", Guild.guildCommand],
        ["g", Guild.guildCommand],
        ["guildadd", GuildAdd.guildAddCommand],
        ["gadd", GuildAdd.guildAddCommand],
        ["ga", GuildAdd.guildAddCommand],
        ["guildleave", GuildLeave.guildLeaveCommand],
        ["gleave", GuildLeave.guildLeaveCommand],
        ["guildcreate", GuildCreate.guildCreateCommand],
        ["gcreate", GuildCreate.guildCreateCommand],
        ["guildkick", GuildKick.guildKickCommand],
        ["gkick", GuildKick.guildKickCommand],
        ["gdaily", GuildDaily.guildDailyCommand],
        ["guilddaily", GuildDaily.guildDailyCommand],
        ["gd", GuildDaily.guildDailyCommand],
    ]
);

module.exports = CommandTable;