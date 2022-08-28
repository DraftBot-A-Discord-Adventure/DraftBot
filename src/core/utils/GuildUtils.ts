import {Guilds} from "../database/game/models/Guild";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {CommandInteraction} from "discord.js";
import Entity from "../database/game/models/Entity";
import {Translations} from "../Translations";
import {Constants} from "../Constants";
import {sendErrorMessage} from "./ErrorUtils";
import {format} from "./StringFormatter";
import {getFoodIndexOf} from "./FoodUtils";
import {NumberChangeReason} from "../database/logs/LogsDatabase";

export const giveFood = async (
	interaction: CommandInteraction,
	language: string,
	entity: Entity,
	selectedFood: string,
	quantity: number,
	reason: NumberChangeReason
) => {
	const tr = Translations.getModule("commands.guildShop", language);
	const foodModule = Translations.getModule("food", language);
	const guild = await Guilds.getById(entity.Player.guildId);
	const selectedFoodIndex = getFoodIndexOf(selectedFood);
	if (guild.isStorageFullFor(selectedFood, quantity)) {
		return await sendErrorMessage(
			interaction.user,
			interaction,
			language,
			tr.get("fullStock")
		);
	}
	guild.addFood(selectedFood, quantity, reason);
	await Promise.all([guild.save()]);
	const successEmbed = new DraftBotEmbed()
		.formatAuthor(tr.get("success"), interaction.user);
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
	return interaction.channel.send({embeds: [successEmbed]});
};
