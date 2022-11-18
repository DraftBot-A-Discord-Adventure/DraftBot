import {Constants} from "../Constants";
import {EffectsConstants} from "./EffectsConstants";
import {BlockingConstants} from "./BlockingConstants";

export type LanguageType = typeof Constants.LANGUAGE[keyof typeof Constants.LANGUAGE]

export type EffectType = typeof EffectsConstants.EMOJI_TEXT[keyof typeof EffectsConstants.EMOJI_TEXT]

export type BlockingReason = typeof BlockingConstants.REASONS[keyof typeof BlockingConstants.REASONS]