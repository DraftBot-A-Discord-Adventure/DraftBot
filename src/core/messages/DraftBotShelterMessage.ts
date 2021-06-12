import {DraftBotEmbed} from "./DraftBotEmbed";
import {EmbedFieldData} from "discord.js";

declare const JsonReader: any;
declare function format(s: string, replacement: any): string;
declare const PetEntities: any;
declare const Guilds: any;

export class DraftBotShelterMessage extends DraftBotEmbed {
	constructor(title: string, description: string, fields: EmbedFieldData[], thumbnail: string) {
		super();
		this.setTitle(title);
		this.setDescription(description);
		this.addFields(fields);
		this.setThumbnail(thumbnail);
	}
}

export class DraftBotShelterMessageBuilder {
	private readonly _guild: any;

	private readonly _language: string;

	constructor(guild: any, language: string) {
		this._guild = guild;
		this._language = language;
	}

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
					name: PetEntities.getPetTitle(pet.PetEntity, this._language, i + 1),
					value: await PetEntities.getPetDisplay(pet.PetEntity, this._language),
					inline: true
				});
			}
		}

		if (Guilds.isPetShelterFull(this._guild)) {
			description = JsonReader.commands.guildShelter.getTranslation(this._language).warningFull;
		}

		return new DraftBotShelterMessage(title, description, fields, thumbnail);
	}
}