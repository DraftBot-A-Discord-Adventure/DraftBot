import {DraftBotEmbed} from "./DraftBotEmbed";
import {Role, User} from "discord.js";
import {Constants} from "../Constants";
import {draftBotClient} from "../bot";

/**
 * A embed with for the DiscordBotList votes
 */
export class DraftBotVoteMessage extends DraftBotEmbed {
	/**
	 * Default constructor
	 * @param user
	 * @param role
	 */
	constructor(user: User, role: Role) {
		super();
		this.setAuthor("SOMEONE HAS VOTED FOR " + draftBotClient.user.username.toUpperCase() + "", null, DraftBotVoteMessage.getTopGGUrl());
		this.setThumbnail(user.avatarURL());
		let desc = "**" + user.tag + "** is now a " + role.toString() + " for `";
		if (Constants.TOPGG.ROLE_DURATION === 24) {
			desc += "1 day";
		}
		else {
			desc += Constants.TOPGG.ROLE_DURATION + " hours";
		}
		this.setDescription(desc + "` and got the badge " + Constants.TOPGG.BADGE + " for `" + Constants.TOPGG.BADGE_DURATION + " hours` :tada:"
			+ "\n\nYou can vote [here](" + DraftBotVoteMessage.getTopGGUrl() + ") every 12 hours!\n||User ID: " + user.id + "||"
		);
		this.setImage("https://i.imgur.com/3PrpILu.png");
	}

	private static getTopGGUrl(): string {
		return "https://top.gg/bot/" + draftBotClient.user.id;
	}
}