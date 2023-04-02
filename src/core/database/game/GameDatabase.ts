import {Database} from "../Database";
import {BulkCreateOptions, DataTypes, DestroyOptions} from "sequelize";
import Tag from "./models/Tag";
import Mission from "./models/Mission";
import MapLocation from "./models/MapLocation";
import Armor from "./models/Armor";
import Weapon from "./models/Weapon";
import ObjectItem from "./models/ObjectItem";
import Potion from "./models/Potion";
import Class from "./models/Class";
import Pet from "./models/Pet";
import MapLink from "./models/MapLink";
import {promises} from "fs";
import Monster from "./models/Monster";
import MonsterLocation from "./models/MonsterLocation";
import MonsterAttack from "./models/MonsterAttack";
import {Data} from "../../Data";
import League from "./models/League";

type TagType = {
	textTag: string,
	idObject: number,
	typeObject: string
}
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
	 * Check and insert tags
	 * @param model
	 * @param fileContent
	 * @param tagsToInsert
	 * @private
	 */
	private static populateInsertTags(
		model: ModelType,
		fileContent: { id: number, tags: string[] },
		tagsToInsert: TagType[]
	): void {
		if (fileContent.tags) {
			// If there's tags, populate them into the database
			for (let i = 0; i < fileContent.tags.length; i++) {
				const tagContent = {
					textTag: fileContent.tags[i],
					idObject: fileContent.id,
					typeObject: model.name ?? "ERRORNONAME"
				};
				tagsToInsert.push(tagContent);
			}
			delete fileContent["tags"];
		}
	}

	/**
	 * Populate a generic model
	 * @param model
	 * @param tagsToInsert
	 * @private
	 */
	private static async populateGenericModel(model: { model: ModelType, folder: string }, tagsToInsert: TagType[]): Promise<void> {
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
			GameDatabase.populateInsertTags(model.model, fileContent, tagsToInsert);
			filesContent.push(fileContent);
		}

		model.model.bulkCreate(filesContent);
	}

	private static async populateMissions(): Promise<void> {
		// Handle special case
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
	}

	private static async populateMonsters(): Promise<void> {
		await Monster.destroy({truncate: true});
		await MonsterLocation.destroy({truncate: true});
		await MonsterAttack.destroy({truncate: true});

		const monsterFiles = await promises.readdir("resources/text/monsters");
		const monsters = [];
		const monsterAttacks = [];
		const monsterLocations = [];
		for (const file of monsterFiles) {
			const fileName = file.split(".")[0];
			const fileContent = await import(`resources/text/monsters/${file}`);
			fileContent.id = fileName;
			fileContent.fr = fileContent.translations.fr;
			fileContent.en = fileContent.translations.en;
			monsters.push(fileContent);

			// Monster attacks
			for (const attack of fileContent.attacks) {
				monsterAttacks.push({
					monsterId: fileName,
					attackId: attack.id,
					minLevel: attack.minLevel
				});
			}

			// Monster locations
			for (const location of fileContent.maps) {
				monsterLocations.push({
					monsterId: fileName,
					mapId: location
				});
			}
		}

		await Monster.bulkCreate(monsters);
		await MonsterLocation.bulkCreate(monsterLocations);
		await MonsterAttack.bulkCreate(monsterAttacks);
	}

	/**
	 * Populate the tables with the corresponding JSON ressources
	 * @param models
	 * @private
	 */
	private static async populateJsonFilesTables(models: { model: ModelType, folder: string }[]): Promise<void> {

		await Tag.destroy({truncate: true});

		const tagsToInsert: TagType[] = [];
		for (const model of models) {
			await GameDatabase.populateGenericModel(model, tagsToInsert);
		}

		await GameDatabase.populateMissions();
		await GameDatabase.populateMonsters();

		await Tag.bulkCreate(tagsToInsert);
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
		const mapTypes = Data.getKeys("models.maps.translations.en.types");
		for (const key of keys) {
			const map = dict[key];
			if (!mapTypes.includes(map.type)) {
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
				// eslint-disable-next-line max-len
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
				},
				{
					model: League,
					folder: "leagues"
				}
			]);
			await GameDatabase.verifyMaps();
		}
	}
}