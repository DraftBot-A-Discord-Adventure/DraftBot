import {DraftBotEmbed} from "./DraftBotEmbed";
import {format} from "../utils/StringFormatter";
import {Translations} from "../Translations";
import Guild from "../database/game/models/Guild";
import {PetEntityConstants} from "../constants/PetEntityConstants";
import {GuildConstants} from "../constants/GuildConstants";
import {EmbedField} from "discord.js";
import {GuildPets} from "../database/game/models/GuildPet";
import {PetEntities} from "../database/game/models/PetEntity";
import {Pets} from "../database/game/models/Pet";

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
		if (description !== "") {
			this.setDescription(description);
		}
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
	async build(): Promise<DraftBotShelterMessage> {
		const tr = Translations.getModule("commands.guildShelter", this._language);
		const guildPets = await GuildPets.getOfGuild(this._guild.id);
		const title = format(tr.get("embedTitle"), {
			guild: this._guild.name,
			count: guildPets.length,
			max: PetEntityConstants.SLOTS
		});
		let description = "";
		const fields: EmbedField[] = [];

		if (guildPets.length === 0) {
			description = tr.get("noPetMessage");
		}
		else {
			for (let i = 0; i < guildPets.length; ++i) {
				const pet = guildPets[i];
				const petEntity = await PetEntities.getById(pet.petEntityId);
				const petModel = await Pets.getById(petEntity.petId);
				fields.push({
					name: petEntity.getPetTitle(this._language, i + 1),
					value: petEntity.getPetDisplay(petModel, this._language),
					inline: true
				});
			}
		}

		if (this._guild.isPetShelterFull(guildPets)) {
			description = tr.get("warningFull");
		}

		return new DraftBotShelterMessage(title, description, fields);
	}
}