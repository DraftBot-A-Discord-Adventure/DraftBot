import {RandomUtils} from "../utils/RandomUtils";
import {Fighter} from "./fighter/Fighter";
import {Translations} from "../Translations";
import {PlayerFighter} from "./fighter/PlayerFighter";

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

	constructor() {
		this.setRandomWeather();
	}

	public applyWeatherEffect(player: Fighter, turn: number, language: string): string {
		// Applique les effets globaux de la météo
		let damages;
		const isAPlayer = player instanceof PlayerFighter;
		const didWeatherChanged = this.currentWeather !== this.lastWeather;
		let mustSendMessage = didWeatherChanged;
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
			mustSendMessage = true;
			break;
		default:
			break;
		}
		this.lastWeather = this.currentWeather;
		if (mustSendMessage) {
			return this.getWeatherMessage(didWeatherChanged, language)
				+ (isAPlayer && damages > 0 ? Translations.getModule("commands.fight", language).format("weatherDamages", {
					player: player.getName(),
					damages
				}) : "");
		}

		return null;
	}

	setWeather(weatherEnum: FightWeatherEnum, turn: number): void {
		this.currentWeather = weatherEnum;
		this.lastWeatherUpdate = turn;
	}

	getWeatherEmote(): string {
		return this.currentWeather.emote;
	}

	private setRandomWeather(): void {
		// Défini une météo aléatoire
		this.setWeather(RandomUtils.draftbotRandom.pick([FightWeatherEnum.SUNNY, FightWeatherEnum.RAINY]), 0);
	}

	private getWeatherMessage(didWeatherChanged: boolean, language: string): string {
		return Translations.getModule("commands.fight", language).get(`${didWeatherChanged ? "weatherChanges" : "weatherContinues"}.${this.currentWeather.name}`);
	}
}