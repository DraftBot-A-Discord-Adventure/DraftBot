import {EffectsConstants} from "./EffectsConstants";

export abstract class PlayersConstants {
	static readonly PLAYER_DEFAULT_VALUES = {
		SCORE: 0,
		WEEKLY_SCORE: 0,
		LEVEL: 0,
		EXPERIENCE: 0,
		MONEY: 0,
		CLASS: 0,
		BADGES: null as string,
		GUILD_ID: null as number,
		TOP_GG_VOTE_AT: new Date(0),
		LAST_PET_FREE: new Date(0),
		EFFECT: EffectsConstants.EMOJI_TEXT.BABY,
		EFFECT_DURATION: EffectsConstants.DURATION[":baby:"],
		START_TRAVEL_DATE: 0,
		DM_NOTIFICATION: true
	};
}