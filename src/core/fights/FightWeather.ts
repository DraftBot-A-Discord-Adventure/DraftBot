import {RandomUtils} from "../utils/RandomUtils";

enum FightWeatherEnum {
	// Enumération des météos de combat
	SUNNY,
	RAINY,
	SANDSTORM,
	HAIL,
	FOG,
	FIRESTORM,
	STORM,
	TORNADO,
}

export class FightWeather {
	// Gère la météo des combats
	currentWeather: FightWeatherEnum;

	constructor() {
		this.setRandomWeather();
	}

	public appluWeatherEffect(): void {
		// Applique les effets globaux de la météo
		// TODO
	}

	private setRandomWeather(): void {
		// Défini une météo aléatoire
		this.currentWeather = RandomUtils.draftbotRandom.pick([FightWeatherEnum.SUNNY, FightWeatherEnum.RAINY]);
	}
}