import {Constants} from "../Constants";
import {EffectsConstants} from "./EffectsConstants";
import {BlockingConstants} from "./BlockingConstants";
import {GuildDailyConstants} from "./GuildDailyConstants";

export type Language = typeof Constants.LANGUAGE[keyof typeof Constants.LANGUAGE]

export type Effect = typeof EffectsConstants.EMOJI_TEXT[keyof typeof EffectsConstants.EMOJI_TEXT]

export type BlockingReason = typeof BlockingConstants.REASONS[keyof typeof BlockingConstants.REASONS]

export type GuildDailyReward = typeof GuildDailyConstants.REWARD_TYPES[keyof typeof GuildDailyConstants.REWARD_TYPES]