import {DraftBotEmbed} from "./DraftBotEmbed";
import {format} from "../utils/StringFormatter";
import {Translations} from "../Translations";
import Guild from "../database/game/models/Guild";
import {PetEntityConstants} from "../constants/PetEntityConstants";
import {GuildConstants} from "../constants/GuildConstants";
import {EmbedField} from "discord.js";

/**
 * Shelter embed
 */
export class DraftBotShelterMessage extends DraftBotEmbed {
	/**
	 * Default constructor
	 * @param title
	 * @param description
	 * @param fields
	 */
	constructor(title: string, description: string, fields: EmbedField[]) {
		super();
		this.setTitle(title);
		this.setDescription(description);
		this.addFields(fields);
		this.setThumbnail(GuildConstants.ICON);
	}
}

/**
 * Builder for {@link DraftBotShelterMessage}
 */
export class DraftBotShelterMessageBuilder {
	/**
	 * The guild for this shelter
	 * @private
	 */
	private readonly _guild: Guild;

	/**
	 * The language to display the shelter
	 * @private
	 */
	private readonly _language: string;

	/**
	 * Default constructor
	 * @param guild
	 * @param language
	 */
	constructor(guild: Guild, language: string) {
		this._guild = guild;
		this._language = language;
	}

	/**
	 * Creates the {@link DraftBotShelterMessage}
	 */
	build(): DraftBotShelterMessage {
		const tr = Translations.getModule("commands.guildShelter", this._language);
		const title = format(tr.get("embedTitle"), {
			guild: this._guild.name,
			count: this._guild.GuildPets.length,
			max: PetEntityConstants.SLOTS
		});
		let description = "";
		const fields: EmbedField[] = [];

		if (this._guild.GuildPets.length === 0) {
			description = tr.get("noPetMessage");
		}
		else {
			for (let i = 0; i < this._guild.GuildPets.length; ++i) {
				const pet = this._guild.GuildPets[i];
				fields.push({
					name: pet.PetEntity.getPetTitle(this._language, i + 1),
					value: pet.PetEntity.getPetDisplay(this._language),
					inline: true
				});
			}
		}

		if (this._guild.isPetShelterFull()) {
			description = tr.get("warningFull");
		}

		return new DraftBotShelterMessage(title, description, fields);
	}
}