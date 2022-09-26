import {DraftBotEmbed} from "./DraftBotEmbed";
import {Role, User} from "discord.js";
import {Constants} from "../Constants";
import {draftBotClient} from "../bot";
import {format} from "../utils/StringFormatter";
import {BotConstants} from "../constants/BotConstants";

/**
 * An embed with for the DiscordBotList votes
 */
export class DraftBotVoteMessage extends DraftBotEmbed {
	/**
	 * Default constructor
	 * @param user
	 * @param role
	 */
	constructor(user: User, role: Role) {
		super();
		this.setAuthor({
			name: `SOMEONE HAS VOTED FOR ${draftBotClient.user.username.toUpperCase()}`,
			url: DraftBotVoteMessage.getTopGGUrl()
		});
		this.setThumbnail(user.avatarURL());
		let desc = `**${user.tag}** is now a <@&${role.id}> for \``;
		if (Constants.TOPGG.ROLE_DURATION === 24) {
			desc += "1 day";
		}
		else {
			desc += Constants.TOPGG.ROLE_DURATION + " hours";
		}
		this.setDescription(
			format(BotConstants.NEW_VOTE, {
				descStart: desc,
				voteBadge: Constants.TOPGG.BADGE,
				badgeDuration: Constants.TOPGG.BADGE_DURATION,
				voteUrl: DraftBotVoteMessage.getTopGGUrl(),
				userId: user.id
			})
		);
		this.setImage("https://i.imgur.com/3PrpILu.png");
	}

	private static getTopGGUrl(): string {
		return `https://top.gg/bot/${draftBotClient.user.id}`;
	}
}