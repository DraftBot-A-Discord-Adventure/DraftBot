import {Guilds} from "../models/Guild";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {TextBasedChannel, User} from "discord.js";
import Entity from "../models/Entity";
import {Translations} from "../Translations";
import {Constants} from "../Constants";
import {sendErrorMessage} from "./ErrorUtils";
import {format} from "./StringFormatter";
import {getFoodIndexOf} from "./FoodUtils";

export const giveFood = async (
	channel: TextBasedChannel,
	language: string,
	entity: Entity,
	author: User,
	selectedFood: string,
	quantity: number
) => {
	const tr = Translations.getModule("commands.guildShop", language);
	const foodModule = Translations.getModule("food", language);
	const guild = await Guilds.getById(entity.Player.guildId);
	const selectedFoodIndex = getFoodIndexOf(selectedFood);
	if (guild.isStorageFullFor(selectedFood, quantity)) {
		return sendErrorMessage(
			author,
			channel,
			language,
			tr.get("fullStock")
		);
	}
	guild.addFood(selectedFood, quantity);
	await Promise.all([guild.save()]);
	const successEmbed = new DraftBotEmbed()
		.formatAuthor(tr.get("success"), author);
	if (quantity === 1) {
		successEmbed.setDescription(
			format(
				tr.get("singleSuccessAddFoodDesc"),
				{
					emote: Constants.PET_FOOD_GUILD_SHOP.EMOTE[selectedFoodIndex],
					quantity: quantity,
					name: foodModule.get(selectedFood + ".name")
						.slice(2, -2)
						.toLowerCase()
				}
			)
		);
	}
	else {
		successEmbed.setDescription(
			format(
				tr.get("multipleSuccessAddFoodDesc"),
				{
					emote: Constants.PET_FOOD_GUILD_SHOP.EMOTE[selectedFoodIndex],
					quantity: quantity,
					name:
						selectedFood === "ultimateFood" && language === "fr"
							? foodModule.get(selectedFood + ".name")
								.slice(2, -2)
								.toLowerCase()
								.replace(
									foodModule.get(selectedFood + ".name")
										.slice(2, -2)
										.toLowerCase()
										.split(" ")[0],
									foodModule.get(selectedFood + ".name")
										.slice(2, -2)
										.toLowerCase()
										.split(" ")[0]
										.concat("s")
								)
							: foodModule.get(selectedFood + ".name")
								.slice(2, -2)
								.toLowerCase()
				}
			)
		);
	}
	return channel.send({embeds: [successEmbed]});
};
