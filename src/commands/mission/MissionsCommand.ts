import {Constants} from "../../core/Constants";
import {Message, TextChannel} from "discord.js";
import {Entities} from "../../core/models/Entity";
import {Campaign} from "../../core/missions/Campaign";
import {MissionsController} from "../../core/missions/MissionsController";
import {DraftBotMissionsMessageBuilder} from "../../core/messages/DraftBotMissionsMessage";

export const commandInfo = {
	name: "missions",
	aliases: ["m", "mission"],
	disallowEffects: [Constants.EFFECT.BABY, Constants.EFFECT.DEAD]
};

const MissionsCommand = async (message: Message, language: string, args: string[]) => {
	let [entity] = await Entities.getByArgs(args, message);
	if (!entity) {
		[entity] = await Entities.getOrRegister(message.author.id);
	}

	await MissionsController.update(entity.discordUserId, <TextChannel> message.channel, language, "commandMission");
	entity = await Entities.getById(entity.id);

	await Campaign.updateCampaignAndSendMessage(entity.discordUserId, entity.Player, <TextChannel> message.channel, language);
	[entity] = await Entities.getOrRegister(entity.discordUserId);
	message.channel.send({ embeds: [
		await new DraftBotMissionsMessageBuilder(
			entity.Player,
			message.author,
			language
		).build()
	]});
};

export const execute = MissionsCommand;