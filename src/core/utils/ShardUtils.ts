import {botConfig, draftBotClient} from "../bot";

export const isOnMainServer = async function(discordId: string): Promise<boolean> {
	const response = (await draftBotClient.shard.broadcastEval((client, context) => {
		const mainServer = client.guilds.cache.get(context.mainServerId);
		if (mainServer) {
			return mainServer.members.fetch(context.discordId) !== undefined;
		}
		return false;
	}, {
		context: {
			discordId,
			mainServerId: botConfig.MAIN_SERVER_ID
		}
	}));
	return response.includes(true);
};