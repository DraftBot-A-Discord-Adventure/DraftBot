import {Constants} from "../Constants";
import {EffectsConstants} from "./EffectsConstants";

export type LanguageType = typeof Constants.LANGUAGE[keyof typeof Constants.LANGUAGE]

export type EffectType = typeof EffectsConstants.EMOJI_TEXT[keyof typeof EffectsConstants.EMOJI_TEXT]