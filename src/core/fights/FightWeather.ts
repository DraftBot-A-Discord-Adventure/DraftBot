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
		this.setRandomWeather();
		this.lastWeather = this.currentWeather;
	}

	public applyWeatherEffect(fighter: Fighter, turn: number, language: string): string {
		// Applique les effets globaux de la météo
		let damages;
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
			break;
		default:
			break;
		}
		const didWeatherChanged = this.currentWeather !== this.lastWeather;
		this.lastWeather = this.currentWeather;
		return this.getWeatherMessage(didWeatherChanged, language)
			+ (damages > 0 ? Translations.getModule("commands.fight", language).format("weatherDamages", {
				fighter: fighter.getName(),
				damages
			}) : "");
	}

	setWeather(weatherEnum: FightWeatherEnum, turn: number, weatherInitiator: Fighter): void {
		this.currentWeather = weatherEnum;
		this.lastWeatherUpdate = turn;
		this.weatherInitiator = weatherInitiator;
	}

	getWeatherEmote(): string {
		return this.currentWeather.emote;
	}

	private setRandomWeather(): void {
		// Défini une météo aléatoire
		this.setWeather(RandomUtils.draftbotRandom.pick([FightWeatherEnum.SUNNY, FightWeatherEnum.RAINY]), 0, null);
	}

	private getWeatherMessage(didWeatherChanged: boolean, language: string): string {
		return Translations.getModule("commands.fight", language).get(`${didWeatherChanged ? "weatherChanges" : "weatherContinues"}.${this.currentWeather.name}`);
	}
}