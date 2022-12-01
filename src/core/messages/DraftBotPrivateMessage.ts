import {DraftBotEmbed} from "./DraftBotEmbed";
import {User} from "discord.js";
import {Translations} from "../Translations";
import {Language} from "../constants/TypeConstants";

export class DraftBotPrivateMessage extends DraftBotEmbed {
	constructor(user: User, title: string, description: string, language: Language) {
		super();
		this.formatAuthor(title, user);
		this.setDescription(description);
		this.setFooter({text: Translations.getModule("models.players", language).get("dmEnabledFooter")});
	}
}