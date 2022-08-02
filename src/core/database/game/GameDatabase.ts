import {Database} from "../Database";
import {DataTypes} from "sequelize";
import Tag from "./models/Tag";
import * as fs from "fs";
import BigEvent from "./models/BigEvent";
import EventMapLocationId from "./models/EventMapLocationId";
import Possibility from "./models/Possibility";
import Mission from "./models/Mission";
import {format} from "../../utils/StringFormatter";
import {Translations} from "../../Translations";
import {Constants} from "../../Constants";
import MapLocation from "./models/MapLocation";
import {MapConstants} from "../../constants/MapConstants";
import {PlayerConstants} from "../../constants/PlayerConstants";
import Armor from "./models/Armor";
import Weapon from "./models/Weapon";
import ObjectItem from "./models/ObjectItem";
import Potion from "./models/Potion";
import Class from "./models/Class";
import Pet from "./models/Pet";
import MapLink from "./models/MapLink";

type EventJson = { id: string, [key: string]: any };

export class GameDatabase extends Database {

	constructor() {
		super("game");
	}

	async init(isMainShard: boolean): Promise<void> {
		await this.connectDatabase();

		const MigrationTable = this.sequelize.define("migrations", {
			id: {
				type: DataTypes.INTEGER,
				primaryKey: true
			},
			name: DataTypes.STRING,
			up: DataTypes.STRING,
			down: DataTypes.STRING
		});

		try {
			const maxId: number = await MigrationTable.max("id");

			if (maxId !== 27) {
				console.error("This version of DraftBot includes a new version of migrations. " +
				"You have to update the bot to the 3.0.0 version first, and after the migrations, you can upgrade the bot to an older version");
				process.exit();
			}

			await MigrationTable.drop();
		}
		catch { /* Ignore */ }

		await super.init(isMainShard);

		if (isMainShard) {
			await GameDatabase.populateJsonFilesTables([
				{
					model: Armor,
					folder: "armors"
				},
				{
					model: Weapon,
					folder: "weapons"
				},
				{
					model: ObjectItem,
					folder: "objects"
				},
				{
					model: Potion,
					folder: "potions"
				},
				{
					model: Class,
					folder: "classes"
				},
				{
					model: Pet,
					folder: "pets"
				},
				{
					model: MapLink,
					folder: "maplinks"
				},
				{
					model: MapLocation,
					folder: "maplocations"
				}
			]);
			await GameDatabase.verifyMaps();
		}
	}

	private static async populateJsonFilesTables(models: { model: any , folder: string }[]) {

		await Tag.destroy({ truncate: true });

		const tagsToInsert = [];
		for (const model of models) {
			await model.model.destroy({ truncate: true });

			const files = await fs.promises.readdir(
				`resources/text/${model.folder.toLowerCase()}`
			);

			const filesContent = [];
			for (const file of files) {
				const fileName = file.split(".")[0];
				const fileContent = require(`resources/text/${model.folder.toLowerCase()}/${file}`);
				fileContent.id = fileName;
				if (fileContent.translations) {
					if (
						fileContent.translations.en &&
						typeof fileContent.translations.fr === "string"
					) {
						fileContent.fr = fileContent.translations.fr;
						fileContent.en = fileContent.translations.en;
					}
					else {
						const keys = Object.keys(fileContent.translations.en);
						for (let i = 0; i < keys.length; ++i) {
							const key = keys[i];
							fileContent[key + "En"] =
								fileContent.translations.en[key];
							fileContent[key + "Fr"] =
								fileContent.translations.fr[key];
						}
					}
				}
				if (fileContent.tags) {
					// If theres tags, populate them into the database
					for (let i = 0; i < fileContent.tags.length; i++) {
						const tagContent = {
							textTag: fileContent.tags[i],
							idObject: fileContent.id,
							// eslint-disable-next-line no-prototype-builtins
							typeObject: model.model.hasOwnProperty("name") ? model.model.name : "ERRORNONAME"
						};
						tagsToInsert.push(tagContent);
					}
					delete fileContent["tags"];
				}
				filesContent.push(fileContent);
			}

			await model.model.bulkCreate(filesContent);
		}

		// Handle special case Events & Possibilities
		await BigEvent.destroy({ truncate: true });
		await EventMapLocationId.destroy({ truncate: true });
		await Possibility.destroy({ truncate: true });
		await Mission.destroy({ truncate: true });

		const missionFiles = await fs.promises.readdir("resources/text/missions");
		const missions = [];
		for (const file of missionFiles) {
			const fileName = file.split(".")[0];
			const fileContent = require(`resources/text/missions/${file}`);
			fileContent.id = fileName;
			fileContent.descEn = fileContent.translations.en.desc;
			fileContent.descFr = fileContent.translations.fr.desc;
			fileContent.canBeDaily = fileContent.campaignOnly ? false : fileContent.dailyIndexes.length !== 0;
			fileContent.canBeEasy = fileContent.campaignOnly ? false : fileContent.difficulties.easy.length !== 0;
			fileContent.canBeMedium = fileContent.campaignOnly ? false : fileContent.difficulties.medium.length !== 0;
			fileContent.canBeHard = fileContent.campaignOnly ? false : fileContent.difficulties.hard.length !== 0;
			missions.push(fileContent);
		}
		await Mission.bulkCreate(missions);

		const files = await fs.promises.readdir("resources/text/events");
		const eventsContent = [];
		const eventsMapLocationsContent = [];
		const possibilitiesContent = [];
		const reportTranslationsFr = Translations.getModule("commands.report", "fr");
		const reportTranslationsEn = Translations.getModule("commands.report", "en");
		for (const file of files) {
			const fileName = file.split(".")[0];
			const fileContent = require(`resources/text/events/${file}`);

			fileContent.id = fileName;

			if (!GameDatabase.isEventValid(fileContent)) {
				continue;
			}

			if (fileContent.map_location_ids) {
				for (const mapLocationsId of fileContent.map_location_ids) {
					eventsMapLocationsContent.push({
						eventId: fileContent.id,
						mapLocationId: mapLocationsId
					});
				}
			}
			fileContent.fr = fileContent.translations.fr + "\n\n";
			fileContent.en = fileContent.translations.en + "\n\n";
			for (const possibilityKey of Object.keys(fileContent.possibilities)) {
				if (possibilityKey !== "end") {
					fileContent.fr += format(reportTranslationsFr.get("doChoice"), {
						emoji: possibilityKey,
						choiceText: fileContent.possibilities[possibilityKey].translations.fr
					});
					fileContent.en += format(reportTranslationsEn.get("doChoice"), {
						emoji: possibilityKey,
						choiceText: fileContent.possibilities[possibilityKey].translations.en
					});
				}
			}
			if (fileContent.tags) {
				// If theres tags, populate them into the database
				for (let i = 0; i < fileContent.tags.length; i++) {
					const tagContent = {
						textTag: fileContent.tags[i],
						idObject: fileContent.id,
						typeObject: BigEvent.name
					};
					tagsToInsert.push(tagContent);
				}
				delete fileContent["tags"];
			}
			eventsContent.push(fileContent);

			for (const possibilityKey of Object.keys(
				fileContent.possibilities
			)) {
				for (const possibility of fileContent.possibilities[possibilityKey].issues) {
					const possibilityContent = {
						possibilityKey: possibilityKey,
						lostTime: possibility.lostTime,
						health: possibility.health,
						oneshot: possibility.oneshot,
						effect: possibility.effect,
						experience: possibility.experience,
						money: possibility.money,
						item: possibility.item,
						fr: possibility.translations.fr,
						en: possibility.translations.en,
						eventId: fileName,
						nextEvent: possibility.nextEvent ? possibility.nextEvent : null,
						restrictedMaps: possibility.restrictedMaps
					};
					if (possibility.tags) {
						// If theres tags, populate them into the database
						for (let i = 0; i < possibility.tags.length; i++) {
							const tagContent = {
								textTag: possibility.tags[i],
								idObject: possibilitiesContent.length + 1,
								typeObject: Possibility.name
							};
							tagsToInsert.push(tagContent);
						}
						delete possibility["tags"];
					}
					possibilitiesContent.push(possibilityContent);
				}
			}
		}

		await BigEvent.bulkCreate(eventsContent);
		await EventMapLocationId.bulkCreate(eventsMapLocationsContent);
		await Possibility.bulkCreate(possibilitiesContent);
		await Tag.bulkCreate(tagsToInsert);
	}

	private static sendEventLoadError(event: EventJson, message: string) {
		console.warn("Error while loading event " + event.id + ": " + message);
	}

	private static isEventValid(event: EventJson) {
		const eventFields = ["translations", "possibilities"];
		for (let i = 0; i < eventFields.length; ++i) {
			if (!Object.keys(event)
				.includes(eventFields[i])) {
				GameDatabase.sendEventLoadError(event, "Key missing: " + eventFields[i]);
				return false;
			}
		}
		if (event.translations.fr === undefined) {
			GameDatabase.sendEventLoadError(event, "French translation missing");
			return false;
		}
		if (event.translations.en === undefined) {
			GameDatabase.sendEventLoadError(event, "English translation missing");
			return false;
		}
		if (event.restrictedMaps !== undefined) {
			const types: string[] = event.restrictedMaps.split(",");
			for (let i = 0; i < types.length; ++i) {
				if (!MapConstants.TYPES.includes(types[i])) {
					GameDatabase.sendEventLoadError(event, "Event map type doesn't exist");
					return false;
				}
			}
		}
		let endPresent = false;
		const issuesFields = [
			"lostTime",
			"health",
			"effect",
			"experience",
			"money",
			"item",
			"translations"
		];
		const possibilityFields = [
			"translations",
			"issues"
		];
		for (const possibilityKey of Object.keys(event.possibilities)) {
			if (possibilityKey === "end") {
				endPresent = true;
				if (Object.keys(event.possibilities[possibilityKey])
					.includes(possibilityFields[0])) {
					GameDatabase.sendEventLoadError(event,
						"Key present in possibility " +
						possibilityKey +
						": ");
					return false;
				}
				if (!Object.keys(event.possibilities[possibilityKey])
					.includes(possibilityFields[1])) {
					GameDatabase.sendEventLoadError(event,
						"Key missing in possibility " +
						possibilityKey +
						": ");
					return false;
				}
			}
			else {
				for (let i = 0; i < possibilityFields.length; ++i) {
					if (!Object.keys(event.possibilities[possibilityKey])
						.includes(possibilityFields[i])) {
						GameDatabase.sendEventLoadError(event,
							"Key missing in possibility " +
							possibilityKey +
							": ");
						return false;
					}
				}
				if (event.possibilities[possibilityKey].translations.fr === undefined) {
					GameDatabase.sendEventLoadError(
						event,
						"French translation missing in possibility " +
						possibilityKey
					);
					return false;
				}
				if (event.possibilities[possibilityKey].translations.en === undefined) {
					GameDatabase.sendEventLoadError(
						event,
						"English translation missing in possibility " +
						possibilityKey
					);
					return false;
				}
			}
			for (const issue of event.possibilities[possibilityKey].issues) {
				for (let i = 0; i < issuesFields.length; ++i) {
					if (!Object.keys(issue)
						.includes(issuesFields[i])) {
						GameDatabase.sendEventLoadError(
							event,
							"Key missing in possibility " +
							possibilityKey + " " +
							": " +
							issuesFields[i]
						);
						return false;
					}
				}
				if (issue.lostTime < 0) {
					GameDatabase.sendEventLoadError(
						event,
						"Lost time must be positive in issue " +
						possibilityKey + " "
					);
					return false;
				}
				if (
					issue.lostTime > 0 &&
					issue.effect !== Constants.EFFECT.OCCUPIED
				) {
					GameDatabase.sendEventLoadError(
						event,
						"Time lost and no clock2 effect in issue " +
						possibilityKey + " "
					);
					return false;
				}
				if (!Object.keys(PlayerConstants.EFFECT_MALUS).includes(issue.effect)) {
					GameDatabase.sendEventLoadError(
						event,
						"Unknown effect \"" +
						issue.effect +
						"\" in issue " +
						possibilityKey + " "
					);
					return false;
				}
				if (issue.restricted_map !== undefined) {
					const types = issue.restrictedMaps.split(",");
					for (let i = 0; i < types.length; ++i) {
						if (!MapConstants.TYPES.includes(types[i])) {
							GameDatabase.sendEventLoadError(event, "Map type of issue" + possibilityKey + " " + " doesn't exist");
							return false;
						}
					}
				}
			}
		}
		if (!endPresent) {
			GameDatabase.sendEventLoadError(
				event,
				"End possibility is not present"
			);
			return false;
		}
		return true;
	}

	private static async verifyMaps() {
		const dict: { [key: string]: MapLocation } = {};
		for (const map of await MapLocation.findAll()) {
			dict[map.id] = map;
		}
		const keys = Object.keys(dict);
		for (const key of keys) {
			const map: any = dict[key];
			if (!MapConstants.TYPES.includes(map.type)) {
				console.error("Type of map " + map.id + " doesn't exist");
			}
			for (const dir1 of ["northMap", "southMap", "westMap", "eastMap"]) {
				if (map[dir1]) {
					const otherMap: any = dict[map[dir1]];
					if (otherMap.id === map.id) {
						console.error("Map " + map.id + " is connected to itself");
					}
					let valid = false;
					for (const dir2 of ["northMap", "southMap", "westMap", "eastMap"]) {
						if (otherMap[dir2] === map.id) {
							valid = true;
							break;
						}
					}
					if (!valid) {
						console.error("Map " + map.id + " is connected to " + otherMap.id + " but the latter is not");
					}
				}
			}
		}
	}
}