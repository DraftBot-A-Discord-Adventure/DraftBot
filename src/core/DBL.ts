import {Entities} from "./database/game/models/Entity";
import {botConfig, draftBotClient, draftBotInstance} from "./bot";
import {Constants} from "./Constants";
import {TextChannel} from "discord.js";
import {Webhook} from "@top-gg/sdk";
import express, {Express} from "express";

/**
 * DBL is an API that allows players to vote for rewards in game
 */
export class DBL {
	/**
	 * Starts the DBL webhook and initiates the several actions it should make depending on the situation
	 */
	static startDBLWebhook(): void {
		if (botConfig.DBL_WEBHOOK_URL === "" || botConfig.DBL_WEBHOOK_PORT === 0 || !botConfig.DBL_TOKEN) {
			console.info("DBL Webhook not configured, skipped.");
			return;
		}

		// Rest API URL
		const app: Express = express();
		app.post(botConfig.DBL_WEBHOOK_URL, new Webhook().listener(vote => {
			DBL.userDBLVote(vote.user).then();
		}));
		app.listen(botConfig.DBL_WEBHOOK_PORT);
		console.log(`Webhook running at http://0.0.0.0:${botConfig.DBL_WEBHOOK_PORT}${botConfig.DBL_WEBHOOK_URL}`);
	}

	/**
	 * Make the user vote
	 * @param {string} discordId - The id
	 * @returns {Promise<void>}
	 */
	static async userDBLVote(discordId: string): Promise<void> {
		const [voter] = await Entities.getOrRegister(discordId);
		voter.Player.topggVoteAt = new Date();
		await voter.Player.save();
		draftBotInstance.logsDatabase.logVote(discordId).then();
		await draftBotClient.shard.broadcastEval((client, context) => {
			const guild = client.guilds.cache.get(context.config.MAIN_SERVER_ID);
			if (guild && guild.shard) {
				guild.members.fetch(context.discordId).then((member) => {
					guild.roles.fetch(context.config.DBL_VOTE_ROLE).then((roleToAdd) => {
						if (member) {
							try {
								member.roles.add(roleToAdd).then(() => {
									// It is called by node_modules\discord.js\src\client\Client.js, so there is no other choice (found at least)
									require("../../../../dist/src/core/DBL").DBL.programDBLRoleRemoval(context.discordId).then();
								});
							}
							catch (e) {
								console.log(e);
							}
						}
						client.users.fetch(context.discordId).then((dUser) => {
							if (!dUser) {
								return;
							}
							(guild.channels.cache.get(context.config.DBL_LOGS_CHANNEL) as TextChannel).send({
								embeds: [
									// It is called by node_modules\discord.js\src\client\Client.js, so there is no other choice (found at least)
									new (require("../../../../dist/src/core/messages/DraftBotVoteMessage").DraftBotVoteMessage)(dUser, roleToAdd)
								]
							});
						});
					});
				});
			}
		}, {
			context: {
				config: botConfig,
				discordId
			}
		});
	}

	/**
	 * @param {string} userId
	 * @returns {Promise<number>} - time in ms, can be negative if the time already passed
	 */
	static async getTimeBeforeDBLRoleRemove(userId: string): Promise<number> {
		const [user] = await Entities.getOrRegister(userId);
		if (!user) {
			return -1;
		}
		return user.Player.topggVoteAt.valueOf() + Constants.TOPGG.ROLE_DURATION * 60 * 60 * 1000 - Date.now();
	}

	/**
	 * Programs when you should remove the vote role of a user
	 * @param userId
	 */
	static async programDBLRoleRemoval(userId: string): Promise<void> {
		const time = await DBL.getTimeBeforeDBLRoleRemove(userId);
		setTimeout(DBL.removeDBLRole.bind(null, userId), time < 0 ? 0 : time);
	}

	/**
	 * Removes the vote role of a given user
	 * @param userId
	 */
	static async removeDBLRole(userId: string): Promise<void> {
		const [entity] = await Entities.getOrRegister(userId);
		if (new Date().valueOf() - entity.Player.topggVoteAt.valueOf() < Constants.TOPGG.ROLE_DURATION * 60 * 60 * 1000 - 10000) {
			return;
		}
		const member = await (await draftBotClient.guilds.cache.get(botConfig.MAIN_SERVER_ID)).members.fetch(userId);
		try {
			await member.roles.remove(botConfig.DBL_VOTE_ROLE);
		}
		catch (e) {
			console.log(e);
		}
	}

	/**
	 * Verify each member and remove the vote role to those who aren't eligible anymore
	 */
	static async verifyDBLRoles(): Promise<void> {
		const guild = await draftBotClient.guilds.cache.get(botConfig.MAIN_SERVER_ID);
		const members = await guild.members.fetch();
		const removalToWait = [];
		for (const member of members) {
			if (member[1].roles.cache.has(botConfig.DBL_VOTE_ROLE)) {
				removalToWait.push(DBL.programDBLRoleRemoval(member[1].id));
			}
		}
		Promise.all(removalToWait).then();
	}
}