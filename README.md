<div style="text-align: center;">
<img src="https://cdn.discordapp.com/attachments/456120666874183680/575235193384861716/couronne.png" style="border-radius: 50%; width: 300px" alt="Couronne DraftBot">

DraftBot is a bot developed in Node.js by [@BastLast](https://github.com/BastLast) based on a text adventure game. The
story takes place in a medieval world, and the player embodies an adventurer who wants to win a competition launched by
the king, to win the princess' hand. To achieve this, he must travel and earn points by going through a lot of danger,
including thieves, wilderness, and scary children. Every few hours, the player can get a random event by using
the `/report` command: they interact with a multiple choice system, using reactions below the report. Each choice has
multiple issues, which could hurt the character, heal them, or even give them some stuff. During the journey, they earn
money, stuff, and points, and can use them to buy potions, stuff or effects in the shop, fight other players, and ascend
the leaderboard.

[![](https://img.shields.io/discord/429765017332613120.svg)](https://discord.gg/5JqrMtZ)
[![](https://img.shields.io/github/stars/BastLast/DraftBot-A-Discord-Adventure.svg?label=Stars&style=social)](https://github.com/BastLast/DraftBot-A-Discord-Adventure)

</div>

<br>

# How to launch the bot

_Before creating your own instance, please note that you can add the bot to your server through the link available on
the bot's discord_

**If you decide to work on the creation of your own instance of the bot, you are supposed to have a minimum of computer
skills. Bot support team will prioritize players of the main instance and will only provide very limited assistance. We
will fix bugs you report, but we will not teach you how to code a discord bot.**

Please do not copy and paste the commands we provide in this readme without :
- Understanding the command
- Replacing the relevant parts with your data
- Having read the whole document

**Only the code available in the "release" tab is considered "stable".**

## Dev environment setup

For development, we recommend that you run the bot on your computer. This way, you can test your changes without having to build the docker image each time you make a change.
However, we still recommend you to use docker for the database, as it is easier to setup and maintain.

We provide all the necessary guides below. If you have any questions, feel free to ask them on our discord server.

### Running the bot on your computer. (windows)

- Install git : https://git-scm.com/download/win
- Download the bot : `git clone https://github.com/BastLast/DraftBot-A-Discord-Adventure`
- Install NodeJS http://nodejs.org/fr/ 
  - Check package.json for the minimal required version
  - Our docker image is based on node alpine (see the DockerFile for the exact version)
  - We recommend that you use nvm to manage your node versions If you use nvm, you can use `nvm install` to install the correct version If you don't have nvm already install, you can use `npm install -g nvm` to install it
- Install Yarn `npm install --global yarn`
- Install the bot : `yarn install`
- Install and launch a mariadb database. Keep the credentials for the config file. We provide a tutorial below for this step.
- Create the config file by copying the file config.default.toml in a new file config.toml
- Edit the file config.toml with the correct data
- Launch the bot : `yarn start`

### Here is the same guide for debian based linux distributions (or WSL and git bash on windows)

- Install git : `apt-get install git`
- Download the bot : `git clone https://github.com/BastLast/DraftBot-A-Discord-Adventure`
- Install NodeJS `apt-get install nodejs`
  - Install npm `apt-get install npm`
  - Check package.json for the minimal required version
  - Our docker image is based on node alpine (see the DockerFile for the exact version)
  - We recommend that you use nvm to manage your node versions If you use nvm, you can use `nvm install` to install the correct version If you don't have nvm already install, you can use `npm install -g nvm` to install it
- Install yarn `npm install -g yarn` (you may have to install npm and use sudo)
- Install the bot : `yarn install`
- Install and launch a mariadb database. Keep the credentials for the config file. We provide a tutorial below for this step.
- Create the config file : `cp config/config.default.toml config/config.toml`
- Edit the file config.toml with the correct data
- Launch the bot : `yarn start`

### Updating the bot

- Be sure to use `yarn install` and `yarn start` each time you update the bot.
- Migrations will run automatically, but be sure to check them as they are created for our database, they may cause
  issues in yours.

Make sure to have docker installed on your machine.
Here is a link to the windows installation guide : https://docs.docker.com/desktop/install/windows-install/
Here is a link to the linux installation guide : https://docs.docker.com/engine/install/ubuntu/

Please follow the "without docker" steps until the `yarn install` step (you don't need to do it).

### Compile the docker image

This step is only necessary if you want to compile the image yourself. You do not need to do this for the bot to work. This is only if you want to deploy your own image to a server.
We have a docker hub account, so you may not need to compile the image yourself! You can find it there: https://hub.docker.com/u/draftbot. If you really want to compile it yourself, follow the next step.

In the project folder (previously downloaded with git), run:

`docker build . -t draftbot/draftbot`

### Install a database

First, you will need to create a new folder to store the database data. We recommend you to create a folder outside of the project folder, to avoid any issues with git. Copy the path of this folder, you will need in the following command. This is the "path/to/volumes/mariadb"

Create a docker mariadb database with the following command : 

`docker run -d --name mariadb -e MARIADB_USER=draftbot -e MARIADB_PASSWORD=secret_password -e MARIADB_ROOT_PASSWORD=super_secret_password -v /path/to/volumes/mariadb:/var/lib/mysql -p 3306:3306 mariadb:latest`

or with docker compose :

```
services:
  mariadb:
    image: mariadb
    container_name: mariadb
    ports:
      - 3306:3306
    volumes:
      - /path/to/volumes/mariadb:/var/lib/mysql
    environment:
      MARIADB_USER: draftbot
      MARIADB_PASSWORD: secret_password
      MARIADB_ROOT_PASSWORD: super_secret_password
```

You can also just run a local mariadb server, but we recommend you to use docker. If you want more information about how to install mariadb, you can visit their website : https://mariadb.org/download/

## Deployment

Building or downloading a docker image of the bot is the recommended way to set up DraftBot in production.

You need to have a config.toml file filled. The config template can be found at config/config.default.toml

Here is the command that will start the DraftBot docker container:

`docker run -d --name draftbot -v /path/to/config.toml:/draftbot/config/config.toml:ro -v /path/to/logs:/draftbot/logs draftbot/draftbot`

or with docker compose :

```
services:
  draftbot:
    image: draftbot/draftbot
    container_name: draftbot
    volumes:
      - /path/to/config.toml:/draftbot/config/config.toml:ro
      - /path/to/logs:/draftbot/logs
```

# Screenshots

![image](https://user-images.githubusercontent.com/56274541/120916573-ad599000-c6aa-11eb-9e6f-ccc804bc63b2.png)

# Links

- [Website](https://draftbot.com)
- [Discord server _(in French)_](https://discord.gg/5JqrMtZ)
- [Suggestion board _(in French)_](https://feedback.draftbot.com/)
- [Player guide](https://guide.draftbot.com)
- [Twitter account _(in French)_](https://twitter.com/DraftBot_?s=09)
