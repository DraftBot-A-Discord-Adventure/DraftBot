import {Guild, Guilds} from "../models/Guild";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {Message, TextChannel, User} from "discord.js";
import Entity from "../models/Entity";
import {Translations} from "../Translations";
import {Data} from "../Data";
import {Constants} from "../Constants";

declare function sendErrorMessage(user: User, channel: TextChannel, language: string, reason: string, isCancelling?: boolean): void;

export const giveFood = async (message: Message, language: string, entity: Entity, author: User, name: string, quantity: number) => {
	const guild = await Guilds.getById(entity.Player.guildId);
	const foodModule = Translations.getModule("food", language);
	const gsModule = Translations.getModule("commands.guildShop", language);
	const indexFood = Constants.PET_FOOD.TYPE.indexOf(name);
	if (isStorageFullFor(name, quantity, guild)) {
		return sendErrorMessage(
			author,
			<TextChannel>message.channel,
			language,
			gsModule.get("fullStock")
		);
	}
	guild.setDataValue(name, guild.getDataValue(name) + quantity);
	await Promise.all([guild.save()]);
	const successEmbed = new DraftBotEmbed()
		.formatAuthor(gsModule.get("success"), author);
	if (quantity === 1) {
		successEmbed.setDescription(
			Translations.getModule("commands.guildShop", language).format(
				"singleSuccessAddFoodDesc",
				{
					emote: Constants.PET_FOOD.EMOTE[indexFood],
					quantity: quantity,
					name: foodModule.get(name + ".name")
						.slice(2, -2)
						.toLowerCase()
				}
			)
		);
	}
	else {
		successEmbed.setDescription(
			gsModule.format("multipleSuccessAddFoodDesc",
				{
					emote: Constants.PET_FOOD.EMOTE[indexFood],
					quantity: quantity,
					name:
						name === "ultimateFood" && language === "fr" ? foodModule.get(name + ".name")
							.slice(2, -2)
							.toLowerCase()
							.replace(
								foodModule.get(name + ".name")
									.slice(2, -2)
									.toLowerCase()
									.split(" ")[0],
								foodModule.get(name + ".name")
									.slice(2, -2)
									.toLowerCase()
									.split(" ")[0]
									.concat("s")
							)
							: foodModule.get(name + ".name")
								.slice(2, -2)
								.toLowerCase()
				}
			)
		);
	}
	return message.channel.send({embeds: [successEmbed]});
};

export const isStorageFullFor = (name: string, quantity: number, guild: Guild): boolean => guild.getDataValue(name) + quantity > Data.getModule("commands.guildShop").getNumber("max." + name);