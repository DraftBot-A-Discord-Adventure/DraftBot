import {Entities} from "./models/Entity";
import {botConfig, draftBotClient} from "./bot";

const DiscordBotList = require("dblapi.js");

class DBL {
	static dbl;

	static startDBLWebhook() {
		if (JsonReader.app.DBL_WEBHOOK_URL === "" || JsonReader.app.DBL_WEBHOOK_PORT === 0 || !JsonReader.app.DBL_TOKEN) {
			console.info("DBL Webhook not configured, skipped.");
			return;
		}
		this.dbl = new DiscordBotList(JsonReader.app.DBL_TOKEN, {
			webhookPort: JsonReader.app.DBL_WEBHOOK_PORT,
			webhookPath: JsonReader.app.DBL_WEBHOOK_URL,
			statsInterval: TOPGG.DBL_SERVER_COUNT_UPDATE_TIME
		}, client);
		this.dbl.webhook.on("vote", async (vote) => {
			await DBL.userDBLVote(vote.user);
		});
		this.dbl.webhook.on("ready", hook => {
			console.log(`Webhook running at http://${hook.hostname}:${hook.port}${hook.path}`);
		});
		this.dbl.on("error", e => {
			console.log(`DBL Error: ${e}`);
		});
		this.dbl.on("posted", () => {
			console.log("Successfully posted servers to DBL");
		});

	}

	/**
	 * Make the user vote
	 * @param {string} user - The id
	 * @returns {Promise<void>}
	 */
	static async userDBLVote(user) {
		const [voter] = await Entities.getOrRegister(user);
		voter.Player.topggVoteAt = new Date();
		await voter.Player.save();
		await draftBotClient.shard.broadcastEval(async (client, context) => {
			const guild = await client.guilds.cache.get(context.config.MAIN_SERVER_ID);
			if (guild) {
				let member;
				if ((member = await guild.members.fetch(context.user)) !== undefined) {
					try {
						const roleToAdd = await guild.roles.fetch(context.config.DBL_VOTE_ROLE);
						await member.roles.add(roleToAdd);
						await require("core/DBL").programDBLRoleRemoval(context.user);
					}
					catch (e) {
						console.log(e);
					}
				}
				const dUser = await client.users.fetch(context.user);
				if (dUser === undefined || dUser === null) {
					return;
				}
				(await guild.channels.cache.get(context.config.DBL_LOGS_CHANNEL)).send({embeds: [
					new (require("core/messages/DraftBotVoteMessage").DraftBotVoteMessage)(dUser, await guild.roles.fetch(context.config.DBL_VOTE_ROLE))
				]});
			}
		}, {
			context: {
				config: botConfig,
				user
			}
		});
	}

	/**
	 * @param {string} userId
	 * @returns {Promise<number>} - time in ms, can be negative if the time already passed
	 */
	static async getTimeBeforeDBLRoleRemove(userId) {
		const [user] = await Entities.getOrRegister(userId);
		if (user === undefined || user === null) {
			return -1;
		}
		return user.Player.topggVoteAt.valueOf() + TOPGG.ROLE_DURATION * 60 * 60 * 1000 - new Date();
	}

	static async programDBLRoleRemoval(userId) {
		const time = await DBL.getTimeBeforeDBLRoleRemove(userId);
		setTimeout(DBL.removeDBLRole.bind(null, userId), time < 0 ? 0 : time);
	}

	static async removeDBLRole(userId) {
		const [entity] = await Entities.getOrRegister(userId);
		if (new Date().valueOf() - entity.Player.topggVoteAt.valueOf() < TOPGG.ROLE_DURATION * 60 * 60 * 1000 - 10000) {
			return;
		}
		const member = await (await client.guilds.cache.get(JsonReader.app.MAIN_SERVER_ID)).members.fetch(userId);
		try {
			await member.roles.remove(JsonReader.app.DBL_VOTE_ROLE);
		}
		catch (e) {
			console.log(e);
		}
	}

	static async verifyDBLRoles() {
		const guild = await client.guilds.cache.get(JsonReader.app.MAIN_SERVER_ID);
		const members = guild.members.cache.entries();
		for (const member of members) {
			if (await member[1].roles.cache.has(JsonReader.app.DBL_VOTE_ROLE)) {
				await DBL.programDBLRoleRemoval(member[1].id);
			}
		}
	}
}

module.exports = {
	startDBLWebhook: DBL.startDBLWebhook,
	verifyDBLRoles: DBL.verifyDBLRoles,
	userDBLVote: DBL.userDBLVote,
	getTimeBeforeDBLRoleRemove: DBL.getTimeBeforeDBLRoleRemove,
	programDBLRoleRemoval: DBL.programDBLRoleRemoval
};