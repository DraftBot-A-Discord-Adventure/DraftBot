import {DraftBotEmbed} from "./DraftBotEmbed";
import {User} from "discord.js";
import {Translations} from "../Translations";

export class DraftBotPrivateMessage extends DraftBotEmbed {
	constructor(user: User, title: string, description: string, language: string) {
		super();
		this.formatAuthor(title, user);
		this.setDescription(description);
		this.setFooter(Translations.getModule("models.players", language).get("dmEnabledFooter"));
	}
}