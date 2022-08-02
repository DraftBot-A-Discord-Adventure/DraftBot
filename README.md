<center>
<img src="https://cdn.discordapp.com/attachments/456120666874183680/575235193384861716/couronne.png" style="border-radius: 50%; width: 300px">

DraftBot is a bot developed in Node.js by [@BastLast](https://github.com/BastLast) based on a text adventure game. The story takes place in a medieval world, and the player embodies an adventurer who wants to win a competition launched by the king, to win the princess' hand. To achieve this, he must travel and earn points by going through a lot of danger, including thieves, wilderness, and scary children. Every few hours, the player can get a random event by using the `report` command: they interact with a multiple choice system, using reactions below the report. Each choice has multiple issues, which could hurt the character, heal them, or even give them some stuff. During the journey, they earn money, stuff, and points, and can use them to buy potions, stuff or effects in the shop, fight other players, and ascend the leaderboard.

<br>

[![](https://img.shields.io/discord/429765017332613120.svg)](https://discord.gg/5JqrMtZ)
[![Discord Bots](https://top.gg/api/widget/status/448110812801007618.svg)](https://top.gg/bot/448110812801007618)
[![Discord Bots](https://top.gg/api/widget/upvotes/448110812801007618.svg)](https://top.gg/bot/448110812801007618)
[![Discord Bots](https://top.gg/api/widget/owner/448110812801007618.svg)](https://top.gg/bot/448110812801007618)
[![Discord Bots](https://top.gg/api/widget/servers/448110812801007618.svg)](https://top.gg/bot/448110812801007618)
[![](https://img.shields.io/github/stars/BastLast/DraftBot-A-Discord-Adventure.svg?label=Stars&style=social)](https://github.com/BastLast/DraftBot-A-Discord-Adventure)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FDraftBot-A-Discord-Adventure%2FDraftBot.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2FDraftBot-A-Discord-Adventure%2FDraftBot?ref=badge_shield)

</center>

<br>

# How to launch the bot

_Before creating your own instance, please note that you can add the bot to your server through the link available on the bot's discord_
**If you decide to work on the creation of your own instance of the bot, you are supposed to have a minimum of computer skills. Bot support team will prioritize players of the main instance and will only provide very limited assistance. We will fix bugs you report, but we will not teach you how to code a discord bot.**

Only the code available in the "release" tab is considered "stable".

## Without docker

### Here is a short start guide. (windows)

- install git : https://git-scm.com/download/win
- download the bot : `git clone https://github.com/BastLast/DraftBot-A-Discord-Adventure`
- install NodeJS http://nodejs.org/fr/ (nodejs 12 minimum is required)
- install Yarn `npm install --global yarn`
- install the bot : `yarn install`
- create the config file by copying the file app.json.default in a new file app.json
- Edit the file app.json with the correct data
- Launch the bot : `yarn start`

### Here is the same guide for linux (or if you have a git terminal on Windows)

- install git : `apt-get install git`
- download the bot : `git clone https://github.com/BastLast/DraftBot-A-Discord-Adventure`
- install NodeJS `apt-get install nodejs` (nodejs 12 minimum is required)
- install yarn `npm install -g yarn` (you may have to install npm and use sudo)
- install the bot : `yarn install`
- create the config file : `cp config/app.json.default config/app.json`
- Edit the file app.json with the correct data
- Launch the bot : `yarn start`

### Updating the bot

- Be sure to use `yarn install` and `yarn start` each time you update the bot.
- Migrations will run automatically, but be sure to check them as they are created for our database, they may cause issues in yours.

## With docker

Make sure to have docker installed on your machine.

### Compile the docker image

In the project folder (previously downloaded with git), run:

`docker build . -t draftbot/draftbot`

### Install a database

sqlite doesn't work with a docker image, so you probably want to create a mariadb database with the following command :

` docker run -d --name mariadb -e MARIADB_USER=draftbot -e MARIADB_PASSWORD=secret_password -e MARIADB_ROOT_PASSWORD=super_secret_password -v D:/draftbot/database:/var/lib/mysql -p 3306:3306 mariadb:latest`

# Screenshots

![image](https://user-images.githubusercontent.com/56274541/120916573-ad599000-c6aa-11eb-9e6f-ccc804bc63b2.png)

# Links

- [Website](https://draftbot.com)
- [Discord server _(in french)_](https://discord.gg/5JqrMtZ)
- [Suggestion board _(in french)_](https://feedback.draftbot.com/)
- [Player guide](https://guide.draftbot.com)
- [Twitter account _(in french)_](https://twitter.com/DraftBot_?s=09)

# Get a dropbox token

- First go to https://www.dropbox.com/developers/apps/create
- Select 1. "Scoped access", 2. "App folder", 3. The name you want (DraftBot for e.g.)
- Go to the "Permissions" tab and check the *files.metadata.write*, *files.content.write* and *files.content.read* permissions
- In the "Settings" tab, set "Access token expiration" to "Not expiration" and then generate a token with the button above
- Put this token in config/config.json

## License
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FDraftBot-A-Discord-Adventure%2FDraftBot.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2FDraftBot-A-Discord-Adventure%2FDraftBot?ref=badge_large)
