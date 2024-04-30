import {DraftBotEmbed} from "./DraftBotEmbed";
import {DraftBotIcons} from "../../../Lib/src/DraftBotIcons";

export class DraftbotSmallEventEmbed extends DraftBotEmbed {
	constructor(smallEventId: keyof typeof DraftBotIcons.small_events, description: string) {
		super();
		this.setDescription(`${DraftBotIcons.small_events[smallEventId]} ${description}`);
	}
}