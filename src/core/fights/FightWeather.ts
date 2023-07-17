import {RandomUtils} from "../utils/RandomUtils";
import {Fighter} from "./fighter/Fighter";
import {Translations} from "../Translations";

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

export class FightWeather {
	// Gère la météo des combats
	currentWeather: FightWeatherEnum;

	lastWeather: FightWeatherEnum;

	lastWeatherUpdate: number;

	weatherInitiator: Fighter;

	constructor() {
		this.lastWeather = this.currentWeather = FightWeatherEnum.SUNNY;
	}

	public applyWeatherEffect(fighter: Fighter, turn: number, language: string): string {
		// Applique les effets globaux de la météo
		let damages;
		const didWeatherChanged = this.currentWeather !== this.lastWeather;
		let mustSendMessage = didWeatherChanged;
		switch (this.currentWeather) {
		case FightWeatherEnum.FIRESTORM:
			if (turn - this.lastWeatherUpdate >= 8) {
				this.setWeather(FightWeatherEnum.SUNNY, turn, null);
			}
			if (this.weatherInitiator === fighter) {
				break;
			}
			damages = Math.round(fighter.getMaxFightPoints() * RandomUtils.randInt(5, 15) / 100);
			fighter.damage(damages);
			mustSendMessage = true;
			break;
		default:
			break;
		}

		this.lastWeather = this.currentWeather;
		if (didWeatherChanged && this.currentWeather === FightWeatherEnum.SUNNY) {
			return this.getWeatherMessage(didWeatherChanged, language);
		}
		else if (mustSendMessage) {
			return this.getWeatherMessage(didWeatherChanged, language)
				+ (damages > 0 ? Translations.getModule("commands.fight", language).format("weatherDamages", {
					fighter: fighter.getName(),
					damages
				}) : "");
		}

		return null;
	}

	setWeather(weatherEnum: FightWeatherEnum, turn: number, weatherInitiator: Fighter): void {
		this.currentWeather = weatherEnum;
		this.lastWeatherUpdate = turn;
		this.weatherInitiator = weatherInitiator;
	}

	getWeatherEmote(): string {
		return this.currentWeather.emote;
	}

	private getWeatherMessage(didWeatherChanged: boolean, language: string): string {
		const module = Translations.getModule("commands.fight", language);
		if (this.currentWeather === FightWeatherEnum.SUNNY && didWeatherChanged) {
			return module.get(`weatherEnd.${this.lastWeather.name}`);
		}
		return module.get(`${didWeatherChanged ? "weatherChanges" : "weatherContinues"}.${this.currentWeather.name}`);
	}
}