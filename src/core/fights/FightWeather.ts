import {RandomUtils} from "../utils/RandomUtils";
import {Fighter} from "./fighter/Fighter";
import {Translations} from "../Translations";
import {FightConstants} from "../constants/FightConstants";
import {PlayerFighter} from "./fighter/PlayerFighter";

export enum FightWeatherEnum {
	// Enumération des météos de combat
	SUNNY,
	RAINY,
	HAIL,
	FOG,
	FIRESTORM,
	STORM,
	TORNADO,
}

export class FightWeather {
	// Gère la météo des combats
	currentWeather: FightWeatherEnum;

	lastWeather: FightWeatherEnum;

	lastWeatherUpdate: number;

	constructor() {
		this.setRandomWeather();
		this.lastWeather = this.currentWeather;
	}

	public applyWeatherEffect(player: Fighter, turn: number, language: string): string {
		// Applique les effets globaux de la météo
		let damages;
		const isAPlayer = player instanceof PlayerFighter;
		switch (this.currentWeather) {
		case FightWeatherEnum.FIRESTORM:
			if (turn - this.lastWeatherUpdate >= 8) {
				this.setWeather(FightWeatherEnum.SUNNY, turn);
			}
			if (!isAPlayer) {
				break;
			}
			damages = Math.round(player.getMaxFightPoints() * RandomUtils.randInt(5, 15) / 100);
			player.damage(damages);
			break;
		default:
			break;
		}
		const didWeatherChanged = this.currentWeather !== this.lastWeather;
		this.lastWeather = this.currentWeather;
		return this.getWeatherMessage(didWeatherChanged, language)
			+ (isAPlayer && damages > 0 ? Translations.getModule("commands.fight", language).format("weatherDamages", {
				player: player.getName(),
				damages
			}) : "");
	}

	setWeather(weatherEnum: FightWeatherEnum, turn: number): void {
		this.currentWeather = weatherEnum;
		this.lastWeatherUpdate = turn;
	}

	getWeatherEmote(): string {
		return FightConstants.WEATHER_EMOTES[this.currentWeather];
	}

	private setRandomWeather(): void {
		// Défini une météo aléatoire
		this.setWeather(RandomUtils.draftbotRandom.pick([FightWeatherEnum.SUNNY, FightWeatherEnum.RAINY]), 0);
	}

	private getWeatherMessage(didWeatherChanged: boolean, language: string): string {
		return Translations.getModule("commands.fight", language).get(`${didWeatherChanged ? "weatherChanges" : "weatherContinues"}.${FightWeatherEnum[this.currentWeather].toLowerCase()}`);
	}
}