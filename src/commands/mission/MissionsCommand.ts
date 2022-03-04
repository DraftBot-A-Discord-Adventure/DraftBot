import {Constants} from "../../core/Constants";
import {Message, TextChannel, User} from "discord.js";
import {Entities} from "../../core/models/Entity";
import {Campaign} from "../../core/missions/Campaign";
import {MissionsController} from "../../core/missions/MissionsController";
import {DraftBotMissionsMessageBuilder} from "../../core/messages/DraftBotMissionsMessage";
import {draftBotClient} from "../../core/bot";

declare function sendBlockedError(user: User, channel: TextChannel, language: string): Promise<boolean>;

export const commandInfo = {
	name: "missions",
	aliases: ["m", "mission", "quests", "quest", "q"],
	disallowEffects: [Constants.EFFECT.BABY, Constants.EFFECT.DEAD]
};

const MissionsCommand = async (message: Message, language: string, args: string[]) => {
	if (await sendBlockedError(message.author, <TextChannel>message.channel, language)) {
		return;
	}
	let [entity] = await Entities.getOrRegister(message.author.id);
	let [entityToLook] = await Entities.getByArgs(args, message);
	let userToPrint = message.author;
	if (entityToLook !== null) {
		userToPrint = await draftBotClient.users.fetch(entityToLook.discordUserId);
	}
	else {
		entityToLook = entity;
	}

	await MissionsController.update(entity.discordUserId, <TextChannel>message.channel, language, "commandMission");
	entity = await Entities.getById(entity.id);

	await Campaign.updateCampaignAndSendMessage(entity, <TextChannel>message.channel, language);
	if (entityToLook.discordUserId === entity.discordUserId) {
		[entityToLook] = await Entities.getOrRegister(entityToLook.discordUserId);
	}
	message.channel.send({
		embeds: [
			await new DraftBotMissionsMessageBuilder(
				entityToLook.Player,
				userToPrint,
				language
			).build()
		]
	});
};

export const execute = MissionsCommand;