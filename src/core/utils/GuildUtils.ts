import {Guild, Guilds} from "../models/Guild";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {TextBasedChannel, User} from "discord.js";
import Entity from "../models/Entity";
import {Translations} from "../Translations";
import {Data} from "../Data";
import {Constants} from "../Constants";
import {sendErrorMessage} from "./ErrorUtils";
import {format} from "./StringFormatter";

export const giveFood = async (
	channel: TextBasedChannel,
	language: string,
	entity: Entity,
	author: User,
	selectedFood: string,
	quantity: number
) => {
	const tr = Translations.getModule("commands.guildShop", language);
	const selectedItem: { type: string, emote: string, translations: { fr: { name: string }, en: { name: string } } } = Data.getModule("food").getObject(selectedFood);
	const guild = await Guilds.getById(entity.Player.guildId);
	if (guild.isStorageFullFor(selectedItem.type, quantity)) {
		return sendErrorMessage(
			author,
			channel,
			language,
			tr.get("fullStock")
		);
	}
	guild.addFood(selectedItem.type, quantity);
	await Promise.all([guild.save()]);
	const successEmbed = new DraftBotEmbed()
		.formatAuthor(tr.get("success"), author);
	if (quantity === 1) {
		successEmbed.setDescription(
			format(
				tr.get("singleSuccessAddFoodDesc"),
				{
					emote: selectedItem.emote,
					quantity: quantity,
					name: (language === Constants.LANGUAGE.FRENCH ? selectedItem.translations.fr.name : selectedItem.translations.en.name)
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
					emote: selectedItem.emote,
					quantity: quantity,
					name:
						selectedItem.type === "ultimateFood" && language === "fr" ? selectedItem.translations[language].name
							.slice(2, -2)
							.toLowerCase()
							.replace(
								selectedItem.translations[language].name
									.slice(2, -2)
									.toLowerCase()
									.split(" ")[0],
								selectedItem.translations[language].name
									.slice(2, -2)
									.toLowerCase()
									.split(" ")[0]
									.concat("s")
							)
							: (language === Constants.LANGUAGE.FRENCH ? selectedItem.translations.fr.name : selectedItem.translations.en.name)
								.slice(2, -2)
								.toLowerCase()
				}
			)
		);
	}
	return channel.send({ embeds: [successEmbed] });
};

export const isStorageFullFor = (name: string, quantity: number, guild: Guild): boolean => guild.getDataValue(name) + quantity > Data.getModule("commands.guildShop").getNumber("max." + name);