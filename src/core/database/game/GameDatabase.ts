import {Database} from "../Database";
import {BulkCreateOptions, DataTypes, DestroyOptions} from "sequelize";
import Tag from "./models/Tag";
import BigEvent from "./models/BigEvent";
import EventMapLocationId from "./models/EventMapLocationId";
import Possibility from "./models/Possibility";
import Mission from "./models/Mission";
import {format} from "../../utils/StringFormatter";
import {Translations} from "../../Translations";
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
import {promises} from "fs";
import {EffectsConstants} from "../../constants/EffectsConstants";

type IssueType = {
	[key: string]: unknown,
	restrictedMaps: string,
	effect: string
}

type EventJson = {
	id: string,
	possibilities?: {
		[key: string]: {
			translations?: {
				fr?: string,
				en?: string
			},
			issues?: IssueType[]
		}
	},
	translations?: {
		[key: string]: {
			fr?: string,
			en?: string
		}
	}
	restrictedMaps?: string
};
type ModelType = {
	destroy: (options?: DestroyOptions<unknown>) => Promise<number>;
	name: string;
	bulkCreate: (records: readonly unknown[], options?: BulkCreateOptions<unknown>) => unknown;
}

export class GameDatabase extends Database {

	constructor() {
		super("game");
	}

	/**
	 * Populate the tables with the corresponding JSON ressources
	 * @param models
	 * @private
	 */
	private static async populateJsonFilesTables(models: { model: ModelType, folder: string }[]): Promise<void> {

		await Tag.destroy({truncate: true});

		const tagsToInsert = [];
		for (const model of models) {
			await model.model.destroy({truncate: true});

			const files = await promises.readdir(
				`resources/text/${model.folder.toLowerCase()}`
			);

			const filesContent = [];
			for (const file of files) {
				const fileName = file.split(".")[0];
				const fileContent = await import(`resources/text/${model.folder.toLowerCase()}/${file}`);
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
					// If there's tags, populate them into the database
					for (let i = 0; i < fileContent.tags.length; i++) {
						const tagContent = {
							textTag: fileContent.tags[i],
							idObject: fileContent.id,
							typeObject: model.model.name ?? "ERRORNONAME"
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
		await BigEvent.destroy({truncate: true});
		await EventMapLocationId.destroy({truncate: true});
		await Possibility.destroy({truncate: true});
		await Mission.destroy({truncate: true});

		const missionFiles = await promises.readdir("resources/text/missions");
		const missions = [];
		for (const file of missionFiles) {
			const fileName = file.split(".")[0];
			const fileContent = await import(`resources/text/missions/${file}`);
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

		const files = await promises.readdir("resources/text/events");
		const eventsContent = [];
		const eventsMapLocationsContent = [];
		const possibilitiesContent = [];
		const reportTranslationsFr = Translations.getModule("commands.report", "fr");
		const reportTranslationsEn = Translations.getModule("commands.report", "en");
		for (const file of files) {
			const fileName = file.split(".")[0];
			const fileContent = await import(`resources/text/events/${file}`);

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
			fileContent.fr = `${fileContent.translations.fr}\n\n`;
			fileContent.en = `${fileContent.translations.en}\n\n`;
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
				// If there's tags, populate them into the database
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
						// If there's tags, populate them into the database
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

	/**
	 * Sends an error if something has gone wrong during the check of a BigEvent
	 * @param event
	 * @param message
	 * @private
	 */
	private static sendEventLoadError(event: EventJson, message: string): void {
		console.warn(`Error while loading event ${event.id}: ${message}`);
	}

	/**
	 * Check the end part of a BigEvent
	 * @param event
	 * @param possibilityKey
	 * @private
	 */
	private static checkEventEnd(event: EventJson, possibilityKey: string): boolean {
		if (Object.keys(event.possibilities[possibilityKey])
			.includes("translations")) {
			GameDatabase.sendEventLoadError(event,
				`Key present in possibility ${possibilityKey}: `);
			return false;
		}
		if (!Object.keys(event.possibilities[possibilityKey])
			.includes("issues")) {
			GameDatabase.sendEventLoadError(event,
				`Key missing in possibility ${possibilityKey}: `);
			return false;
		}
		return true;
	}

	/**
	 * Check the keys of a BigEvent
	 * @param event
	 * @private
	 */
	private static checkEventRootKeys(event: EventJson): boolean {
		if (!GameDatabase.checkEventMainKeys(event)) {
			return false;
		}
		if (event.translations.fr === undefined) {
			GameDatabase.sendEventLoadError(event, "French translation missing");
			return false;
		}
		if (event.translations.en === undefined) {
			GameDatabase.sendEventLoadError(event, "English translation missing");
			return false;
		}
		return event.restrictedMaps === undefined ? true : GameDatabase.checkRestrictedMaps(event);
	}

	/**
	 * Check the keys of a possibility
	 * @param event
	 * @param possibilityKey
	 * @private
	 */
	private static checkPossibilityKeys(event: EventJson, possibilityKey: string): boolean {
		if (possibilityKey === "end") {
			return GameDatabase.checkEventEnd(event, possibilityKey);
		}
		const possibilityFields = [
			"translations",
			"issues"
		];
		for (let i = 0; i < possibilityFields.length; ++i) {
			if (!Object.keys(event.possibilities[possibilityKey])
				.includes(possibilityFields[i])) {
				GameDatabase.sendEventLoadError(event,
					`Key missing in possibility ${possibilityKey}: `);
				return false;
			}
		}
		if (event.possibilities[possibilityKey].translations.fr === undefined) {
			GameDatabase.sendEventLoadError(
				event,
				`French translation missing in possibility ${possibilityKey}`
			);
			return false;
		}
		if (event.possibilities[possibilityKey].translations.en === undefined) {
			GameDatabase.sendEventLoadError(
				event,
				`English translation missing in possibility ${possibilityKey}`
			);
			return false;
		}
		return true;
	}

	/**
	 * Check the issues of a possibility
	 * @param event
	 * @param possibilityKey
	 * @param issue
	 * @private
	 */
	private static checkPossibilityIssues(event: EventJson, possibilityKey: string, issue: IssueType): boolean {
		const issuesFields = [
			"lostTime",
			"health",
			"effect",
			"experience",
			"money",
			"item",
			"translations"
		];
		if (!GameDatabase.checkPossibilityIssuesKey(issuesFields, event, possibilityKey, issue)) {
			return false;
		}
		if (issue.lostTime < 0) {
			GameDatabase.sendEventLoadError(
				event,
				`Lost time must be positive in issue ${possibilityKey} `
			);
			return false;
		}
		if (
			issue.lostTime > 0 &&
			issue.effect !== EffectsConstants.EMOJI_TEXT.OCCUPIED
		) {
			GameDatabase.sendEventLoadError(
				event,
				`Time lost and no clock2 effect in issue ${possibilityKey} `
			);
			return false;
		}
		if (!Object.keys(PlayerConstants.EFFECT_MALUS).includes(issue.effect)) {
			GameDatabase.sendEventLoadError(
				event,
				`Unknown effect "${issue.effect}" in issue ${possibilityKey} `
			);
			return false;
		}
		return issue.restricted_map === undefined || GameDatabase.checkPossibilityIssuesRestrictedMap(event, possibilityKey, issue);
	}

	/**
	 * Check the validity of a BigEvent
	 * @param event
	 * @private
	 */
	private static isEventValid(event: EventJson): boolean {
		if (!GameDatabase.checkEventRootKeys(event)) {
			return false;
		}

		for (const possibilityKey of Object.keys(event.possibilities)) {
			if (!GameDatabase.checkPossibilityRecursively(event, possibilityKey)) {
				return false;
			}
		}

		if (!Object.keys(event.possibilities).includes("end")) {
			GameDatabase.sendEventLoadError(
				event,
				"End possibility is not present"
			);
			return false;
		}
		return true;
	}

	/**
	 * Check the MapLocation links
	 * @private
	 */
	private static async verifyMaps(): Promise<void> {
		const dict: { [key: string]: MapLocation } = {};
		for (const mapl of await MapLocation.findAll()) {
			dict[mapl.id] = mapl;
		}
		const keys = Object.keys(dict);
		const dirs: (keyof MapLocation)[] = ["northMap", "southMap", "westMap", "eastMap"] as unknown as (keyof MapLocation)[];
		for (const key of keys) {
			const map = dict[key];
			if (!MapConstants.TYPES.includes(map.type)) {
				console.error(`Type of map ${map.id} doesn't exist`);
			}
			for (const dir1 of dirs) {
				this.checkLinkOfMap(map, dir1, dict, dirs);
			}
		}
	}

	/**
	 * Check the given link of a given MapLocation
	 * @param map
	 * @param dir1
	 * @param dict
	 * @param dirs
	 * @private
	 */
	private static checkLinkOfMap(map: MapLocation, dir1: keyof MapLocation, dict: { [key: string]: MapLocation }, dirs: (keyof MapLocation)[]): void {
		if (!map[dir1]) {
			return;
		}
		const otherMap = dict[map[dir1]];
		if (otherMap.id === map.id) {
			console.error(`Map ${map.id} is connected to itself`);
		}
		let valid = false;
		for (const dir2 of dirs) {
			if (otherMap[dir2] === map.id) {
				valid = true;
				break;
			}
		}
		if (!valid) {
			console.error(`Map ${map.id} is connected to ${otherMap.id} but the latter is not`);
		}
	}

	/**
	 * Check the keys of the issues of a possibility
	 * @param issuesFields
	 * @param event
	 * @param possibilityKey
	 * @param issue
	 * @private
	 */
	private static checkPossibilityIssuesKey(issuesFields: string[], event: EventJson, possibilityKey: string, issue: IssueType): boolean {
		for (let i = 0; i < issuesFields.length; ++i) {
			if (!Object.keys(issue)
				.includes(issuesFields[i])) {
				GameDatabase.sendEventLoadError(
					event,
					`Key missing in possibility ${possibilityKey} : ${issuesFields[i]}`
				);
				return false;
			}
		}
		return true;
	}

	/**
	 * Check the restricted_map of the issues of a possibility
	 * @param event
	 * @param possibilityKey
	 * @param issue
	 * @private
	 */
	private static checkPossibilityIssuesRestrictedMap(event: EventJson, possibilityKey: string, issue: IssueType): boolean {
		const types = issue.restrictedMaps.split(",");
		for (let i = 0; i < types.length; ++i) {
			if (!MapConstants.TYPES.includes(types[i])) {
				GameDatabase.sendEventLoadError(event, `Map type of issue${possibilityKey}  doesn't exist`);
				return false;
			}
		}
		return true;
	}

	/**
	 * Check if the main keys of an event are here
	 * @param event
	 * @private
	 */
	private static checkEventMainKeys(event: EventJson): boolean {
		const eventFields = ["translations", "possibilities"];
		for (let i = 0; i < eventFields.length; ++i) {
			if (!Object.keys(event)
				.includes(eventFields[i])) {
				GameDatabase.sendEventLoadError(event, `Key missing: ${eventFields[i]}`);
				return false;
			}
		}
		return true;
	}

	/**
	 * Check if the restricted maps of an event are valid
	 * @param event
	 * @private
	 */
	private static checkRestrictedMaps(event: EventJson): boolean {
		const types: string[] = event.restrictedMaps.split(",");
		for (let i = 0; i < types.length; ++i) {
			if (!MapConstants.TYPES.includes(types[i])) {
				GameDatabase.sendEventLoadError(event, "Event map type doesn't exist");
				return false;
			}
		}
		return true;
	}

	/**
	 * Check a possibility of an event and its issues
	 * @param event
	 * @param possibilityKey
	 * @private
	 */
	private static checkPossibilityRecursively(event: EventJson, possibilityKey: string): boolean {
		if (!GameDatabase.checkPossibilityKeys(event, possibilityKey)) {
			return false;
		}
		for (const issue of event.possibilities[possibilityKey].issues) {
			if (!GameDatabase.checkPossibilityIssues(event, possibilityKey, issue)) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Initialize a GameDatabase instance
	 * @param isMainShard
	 */
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

			if (maxId !== 28) {
				console.error("This version of DraftBot includes a new version of migrations. You have to update the bot to the 3.0.0 version first, and after the migrations, you can upgrade the bot to an older version");
				process.exit();
			}

			await MigrationTable.drop();
		}
		catch { /* Ignore */
		}

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
}