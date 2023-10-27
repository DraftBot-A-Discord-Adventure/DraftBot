import {RandomUtils} from "../utils/RandomUtils";
import {Fighter} from "./fighter/Fighter";

export class FightWeatherEnum {
	public static readonly SUNNY = new FightWeatherEnum("☀️", "sunny");

	public static readonly RAINY = new FightWeatherEnum("🌧", "rainy");

	public static readonly HAIL = new FightWeatherEnum("🌨", "hail");

	public static readonly FOG = new FightWeatherEnum("🌫", "fog");

	public static readonly FIRESTORM = new FightWeatherEnum("🌋", "firestorm");

	public static readonly STORM = new FightWeatherEnum("🌩", "storm");

	public static readonly TORNADO = new FightWeatherEnum("🌪", "tornado");

	private constructor(public readonly emote: string, public readonly name: string) {
	}
}

export enum FightWeatherState {
	CHANGE,
	CONTINUE,
	END
}

export interface FightWeatherResult {
	weatherState: FightWeatherState;
	currentWeather: FightWeatherEnum;
	damages: number;
}

export class FightWeather {
	// Gère la météo des combats
	currentWeather: FightWeatherEnum;

	lastWeather: FightWeatherEnum;

	lastWeatherUpdate: number;

	weatherInitiator: Fighter;

	constructor() {
		this.lastWeather = this.currentWeather = FightWeatherEnum.SUNNY;
	}

	public applyWeatherEffect(fighter: Fighter, turn: number, language: string): FightWeatherResult {
		// Applique les effets globaux de la météo
		let damages = 0;
		const didWeatherChanged = this.currentWeather !== this.lastWeather;
		let mustSendMessage = didWeatherChanged;
		switch (this.currentWeather) {
		case FightWeatherEnum.FIRESTORM:
			if (this.weatherInitiator === fighter) {
				break;
			}
			mustSendMessage = true;
			if (turn - this.lastWeatherUpdate >= 8) {
				this.setWeather(FightWeatherEnum.SUNNY, turn, null);
				break;
			}
			damages = Math.round(fighter.getMaxFightPoints() * RandomUtils.randInt(3, 8) / 100);
			fighter.damage(damages);
			break;
		default:
			break;
		}

		this.lastWeather = this.currentWeather;
		return {
			weatherState: didWeatherChanged ? (this.currentWeather === FightWeatherEnum.SUNNY ? FightWeatherState.END : FightWeatherState.CHANGE) : FightWeatherState.CONTINUE,
			currentWeather: this.currentWeather === FightWeatherEnum.SUNNY && didWeatherChanged ? this.lastWeather : this.currentWeather,
			damages
		};
	}

	setWeather(weatherEnum: FightWeatherEnum, turn: number, weatherInitiator: Fighter): void {
		this.currentWeather = weatherEnum;
		this.lastWeatherUpdate = turn;
		this.weatherInitiator = weatherInitiator;
	}

	getWeatherEmote(): string {
		return this.currentWeather.emote;
	}
}
