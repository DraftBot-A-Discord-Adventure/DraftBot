import {DraftBotEmbed} from "./DraftBotEmbed";
import {EmbedFieldData} from "discord.js";

declare const JsonReader: any;
declare function format(s: string, replacement: any): string;

/**
 * Shelter embed
 */
export class DraftBotShelterMessage extends DraftBotEmbed {
	/**
	 * Default constructor
	 * @param title
	 * @param description
	 * @param fields
	 * @param thumbnail
	 */
	constructor(title: string, description: string, fields: EmbedFieldData[], thumbnail: string) {
		super();
		this.setTitle(title);
		this.setDescription(description);
		this.addFields(fields);
		this.setThumbnail(thumbnail);
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
	private readonly _guild: any;

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
	constructor(guild: any, language: string) {
		this._guild = guild;
		this._language = language;
	}

	/**
	 * Creates the {@link DraftBotShelterMessage}
	 */
	async build(): Promise<DraftBotShelterMessage> {
		const tr = JsonReader.commands.guildShelter.getTranslation(this._language);
		const title = format(tr.embedTitle, {
			guild: this._guild.name,
			count: this._guild.GuildPets.length,
			max: JsonReader.models.pets.slots
		});
		const thumbnail = JsonReader.commands.guild.icon;
		let description = "";
		const fields: EmbedFieldData[] = [];

		if (this._guild.GuildPets.length === 0) {
			description = JsonReader.commands.guildShelter.getTranslation(this._language).noPetMessage;
		}
		else {
			for (let i = 0; i < this._guild.GuildPets.length; ++i) {
				const pet = this._guild.GuildPets[i];
				fields.push({
					name: pet.PetEntity.getPetTitle(this._language, i + 1),
					value: await pet.PetEntity.getPetDisplay(this._language),
					inline: true
				});
			}
		}

		if (this._guild.isPetShelterFull()) {
			description = JsonReader.commands.guildShelter.getTranslation(this._language).warningFull;
		}

		return new DraftBotShelterMessage(title, description, fields, thumbnail);
	}
}