const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const sequelizeLogger = require("sequelize/lib/utils/logger");

/**
 * @class
 */
class Database {
	/**
	 * @return {Promise<void>}
	 */
	static async init() {
		Database.replaceWarningLogger();

		Database.Sequelize = new Sequelize({
			dialect: "sqlite",
			storage: "database/database.sqlite",
			logging: false
		});

		await Database.migrate();

		const modelsFiles = await fs.promises.readdir("src/core/models");
		for (const modelFile of modelsFiles) {
			const modelName = modelFile.split(".")[0];
			global[modelName] = Database.Sequelize["import"](
				`models/${modelName}`
			);
		}

		await Database.setAssociations();
		await Database.populateJsonFilesTables([
			"Armors",
			"Weapons",
			"Objects",
			"Potions",
			"Classes",
			"Pets",
			"MapLocations"
		]);
		await Database.verifyMaps();
		await Database.setEverybodyAsUnOccupied();
		await Database.updatePlayersRandomMap();
	}

	/**
	 * @return {Promise<void>}
	 */
	static async migrate() {
		const table = "migrations";
		const migrationsPath = "database/migrations";
		const location = path.resolve(migrationsPath);
		const migrations = await new Promise((resolve, reject) => {
			fs.readdir(location, (err, files) => {
				if (err) {
					return reject(err);
				}
				resolve(
					files
						.map((x) => x.match(/^(\d+).(.*?)\.sql$/))
						.filter((x) => x !== null)
						.map((x) => ({
							id: Number(x[1]),
							name: x[2],
							filename: x[0]
						}))
						.sort((a, b) => Math.sign(a.id - b.id))
				);
			});
		});
		if (!migrations.length) {
			throw new Error(`No migration files found in '${location}'.`);
		}
		await Promise.all(
			migrations.map(
				(migration) =>
					new Promise((resolve, reject) => {
						const filename = path.join(
							location,
							migration.filename
						);
						fs.readFile(filename, "utf-8", (err, data) => {
							if (err) {
								return reject(err);
							}
							const [up, down] = data.split(/^--\s+?down\b/im);
							if (!down) {
								const message = `The ${migration.filename} file does not contain '-- Down' separator.`;
								return reject(new Error(message));
							}
							/* eslint-disable no-param-reassign */
							migration.up = up.replace(/^-- .*?$/gm, "").trim(); // Remove comments
							migration.up = migration.up.replace(/\r\n/g, "\n"); // Replace CRLF with LF (in the case both are present)
							migration.up = migration.up.replace(/\n/g, "\r\n"); // Replace LF with CRLF
							migration.down = down.trim(); // and trim whitespaces
							/* eslint-enable no-param-reassign */
							resolve();
						});
					})
			)
		);
		await Database.Sequelize.query(`CREATE TABLE IF NOT EXISTS "${table}" (
      id   INTEGER PRIMARY KEY,
      name TEXT    NOT NULL,
      up   TEXT    NOT NULL,
      down TEXT    NOT NULL
    )`);
		const dbMigrations = await Database.Sequelize.query(
			`SELECT id, name, up, down FROM "${table}" ORDER BY id ASC`
		);

		const lastMigrationId = dbMigrations[0].length ? dbMigrations[0][dbMigrations[0].length - 1].id : 0;
		for (const migration of migrations) {
			if (migration.id > lastMigrationId) {
				await Database.Sequelize.query("BEGIN");
				try {
					const queries = migration.up.split(require("os").EOL);
					for (const entry of queries) {
						if (entry !== "") {
							Database.Sequelize.query(entry);
						}
					}
					await Database.Sequelize.query(
						`INSERT INTO "${table}" (id, name, up, down) VALUES ("${migration.id}", "${migration.name}", "${migration.up}", "${migration.down}")`
					);
					await Database.Sequelize.query("COMMIT");
				}
				catch (err) {
					await Database.Sequelize.query("ROLLBACK");
					throw err;
				}
			}
		}
	}

	/**
	 * @return {Promise<void>}
	 */
	static setAssociations() {
		Entities.hasOne(Players, {
			foreignKey: "entity_id",
			as: "Player"
		});

		Players.belongsTo(Entities, {
			foreignKey: "entity_id",
			as: "Entity"
		});
		Players.belongsTo(Guilds, {
			foreignKey: "guild_id",
			as: "Guild"
		});
		Players.belongsTo(Guilds, {
			foreignKey: "id",
			targetKey: "chief_id",
			as: "Chief"
		});
		Players.hasOne(Inventories, {
			foreignKey: "player_id",
			as: "Inventory"
		});
		Players.hasOne(PetEntities, {
			foreignKey: "id",
			sourceKey: "pet_id",
			as: "Pet"
		});
		Players.hasMany(PlayerSmallEvents, {
			foreignKey: "player_id",
			as: "PlayerSmallEvents"
		});

		Guilds.hasMany(Players, {
			foreignKey: "guild_id",
			as: "Members"
		});
		Guilds.hasOne(Players, {
			foreignKey: "id",
			sourceKey: "chief_id",
			as: "Chief"
		});
		Guilds.hasMany(GuildPets, {
			foreignKey: "guild_id",
			as: "GuildPets"
		});
		GuildPets.hasOne(PetEntities, {
			foreignKey: "id",
			sourceKey: "pet_entity_id",
			as: "PetEntity"
		});

		Inventories.belongsTo(Players, {
			foreignKey: "player_id",
			as: "Player"
		});
		Inventories.hasOne(Weapons, {
			foreignKey: "id",
			sourceKey: "weapon_id",
			as: "Weapon"
		});
		Inventories.hasOne(Armors, {
			foreignKey: "id",
			sourceKey: "armor_id",
			as: "Armor"
		});
		Inventories.hasOne(Potions, {
			foreignKey: "id",
			sourceKey: "potion_id",
			as: "Potion"
		});
		Inventories.hasOne(Objects, {
			foreignKey: "id",
			sourceKey: "object_id",
			as: "ActiveObject"
		});
		Inventories.hasOne(Objects, {
			foreignKey: "id",
			sourceKey: "backup_id",
			as: "BackupObject"
		});

		Events.hasMany(Possibilities, {
			foreignKey: "event_id",
			as: "Possibilities"
		});

		Possibilities.belongsTo(Events, {
			foreignKey: "event_id",
			as: "Event"
		});

		PetEntities.hasOne(Pets, {
			foreignKey: "id",
			sourceKey: "pet_id",
			as: "PetModel"
		});
	}

	/**
	 * @param {String[]} folders
	 * @return {Promise<void>}
	 */
	static async populateJsonFilesTables(folders) {
		for (const folder of folders) {
			await global[folder].destroy({truncate: true});

			const files = await fs.promises.readdir(
				`resources/text/${folder.toLowerCase()}`
			);

			const filesContent = [];
			for (const file of files) {
				const fileName = file.split(".")[0];
				const fileContent = require(`resources/text/${folder.toLowerCase()}/${file}`);
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
							fileContent[key + "_en"] =
								fileContent.translations.en[key];
							fileContent[key + "_fr"] =
								fileContent.translations.fr[key];
						}
					}
				}
				filesContent.push(fileContent);
			}

			await global[folder].bulkCreate(filesContent);
		}

		// Handle special case Events & Possibilities
		await Events.destroy({truncate: true});
		await EventMapLocationIds.destroy({truncate: true});
		await Possibilities.destroy({truncate: true});

		const files = await fs.promises.readdir("resources/text/events");
		const eventsContent = [];
		const eventsMapLocationsContent = [];
		const possibilitiesContent = [];
		for (const file of files) {
			const fileName = file.split(".")[0];
			const fileContent = require(`resources/text/events/${file}`);

			fileContent.id = fileName;

			if (!Database.isEventValid(fileContent)) {
				continue;
			}

			if (fileContent.map_location_ids) {
				for (const mapLocationsId of fileContent.map_location_ids) {
					eventsMapLocationsContent.push({
						event_id: fileContent.id,
						map_location_id: mapLocationsId
					});
				}
			}
			fileContent.fr = fileContent.translations.fr + "\n\n";
			fileContent.en = fileContent.translations.en + "\n\n";
			for (const possibilityKey of Object.keys(fileContent.possibilities)) {
				if (possibilityKey !== "end") {
					fileContent.fr += format(JsonReader.commands.report.getTranslation("fr").doChoice, {
						emoji: possibilityKey,
						choiceText: fileContent.possibilities[possibilityKey].translations.fr
					});
					fileContent.en += format(JsonReader.commands.report.getTranslation("en").doChoice, {
						emoji: possibilityKey,
						choiceText: fileContent.possibilities[possibilityKey].translations.en
					});
				}
			}
			eventsContent.push(fileContent);

			for (const possibilityKey of Object.keys(
				fileContent.possibilities
			)) {
				for (const possibility of fileContent.possibilities[
					possibilityKey
				].issues) {
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
						event_id: fileName,
						nextEvent: possibility.nextEvent ? possibility.nextEvent : null,
						restricted_maps: possibility.restricted_maps
					};
					possibilitiesContent.push(possibilityContent);
				}
			}
		}

		await Events.bulkCreate(eventsContent);
		await EventMapLocationIds.bulkCreate(eventsMapLocationsContent);
		await Possibilities.bulkCreate(possibilitiesContent);
	}

	static sendEventLoadError(event, message) {
		console.warn("Error while loading event " + event.id + ": " + message);
	}

	static isEventValid(event) {
		const eventFields = ["translations", "possibilities"];
		for (let i = 0; i < eventFields.length; ++i) {
			if (!Object.keys(event).includes(eventFields[i])) {
				Database.sendEventLoadError(event, "Key missing: " + field);
				return false;
			}
		}
		if (event.translations.fr === undefined) {
			Database.sendEventLoadError(event, "French translation missing");
			return false;
		}
		if (event.translations.en === undefined) {
			Database.sendEventLoadError(event, "English translation missing");
			return false;
		}
		if (event.restricted_maps !== undefined) {
			const types = event.restricted_maps.split(",");
			for (let i = 0; i < types.length; ++i) {
				if (!JsonReader.models.maps.types.includes(types[i])) {
					Database.sendEventLoadError(event, "Event map type doesn't exist");
					return false;
				}
			}
		}
		let endPresent = false;
		const effects = JsonReader.models.players.effectMalus;
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
				if (Object.keys(event.possibilities[possibilityKey]).includes(possibilityFields[0])) {
					Database.sendEventLoadError(event,
						"Key present in possibility " +
						possibilityKey +
						": " +
						possibilityFields[i]);
					return false;
				}
				if (!Object.keys(event.possibilities[possibilityKey]).includes(possibilityFields[1])) {
					Database.sendEventLoadError(event,
						"Key missing in possibility " +
						possibilityKey +
						": " +
						possibilityFields[i]);
					return false;
				}
			}
			else {
				for (let i = 0; i < possibilityFields.length; ++i) {
					if (!Object.keys(event.possibilities[possibilityKey]).includes(possibilityFields[i])) {
						Database.sendEventLoadError(event,
							"Key missing in possibility " +
							possibilityKey +
							": " +
							possibilityFields[i]);
						return false;
					}
				}
				if (event.possibilities[possibilityKey].translations.fr === undefined) {
					Database.sendEventLoadError(
						event,
						"French translation missing in possibility " +
						possibilityKey
					);
					return false;
				}
				if (event.possibilities[possibilityKey].translations.en === undefined) {
					Database.sendEventLoadError(
						event,
						"English translation missing in possibility " +
						possibilityKey
					);
					return false;
				}
			}
			for (const issue of event.possibilities[possibilityKey].issues) {
				for (let i = 0; i < issuesFields.length; ++i) {
					if (!Object.keys(issue).includes(issuesFields[i])) {
						Database.sendEventLoadError(
							event,
							"Key missing in possibility " +
							possibilityKey + " " + str(i) +
							": " +
							issuesFields[i]
						);
						return false;
					}
				}
				if (issue.lostTime < 0) {
					Database.sendEventLoadError(
						event,
						"Lost time must be positive in issue " +
						possibilityKey + " " + str(i)
					);
					return false;
				}
				if (
					issue.lostTime > 0 &&
					issue.effect !== EFFECT.OCCUPIED
				) {
					Database.sendEventLoadError(
						event,
						"Time lost and no clock2 effect in issue " +
						possibilityKey + " " + str(i)
					);
					return false;
				}
				if (
					effects[issue.effect] === null ||
					effects[issue.effect] === undefined
				) {
					Database.sendEventLoadError(
						event,
						"Unknown effect \"" +
						issue.effect +
						"\" in issue " +
						possibilityKey + " " + str(i)
					);
					return false;
				}
				if (issue.restricted_map !== undefined) {
					const types = issue.restricted_maps.split(",");
					for (let i = 0; i < types.length; ++i) {
						if (!JsonReader.models.maps.types.includes(types[i])) {
							Database.sendEventLoadError(event, "Map type of issue" + possibilityKey + " " + str(i) + " doesn't exist");
							return false;
						}
					}
				}
			}
		}
		if (!endPresent) {
			Database.sendEventLoadError(
				event,
				"End possibility is not present"
			);
			return false;
		}
		return true;
	}

	static async verifyMaps() {
		const dict = {};
		for (const map of await MapLocations.findAll()) {
			dict[map.id] = map;
		}
		const keys = Object.keys(dict);
		for (const key of keys) {
			const map = dict[key];
			if (!JsonReader.models.maps.types.includes(map.type)) {
				console.error("Type of map " + map.id + " doesn't exist");
			}
			for (const dir1 of ["north_map", "south_map", "west_map", "east_map"]) {
				if (map[dir1]) {
					const other_map = dict[map[dir1]];
					if (other_map.id === map.id) {
						console.error("Map " + map.id + " is connected to itself");
					}
					let valid = false;
					for (const dir2 of ["north_map", "south_map", "west_map", "east_map"]) {
						if (other_map[dir2] === map.id) {
							valid = true;
							break;
						}
					}
					if (!valid) {
						console.error("Map " + map.id + " is connected to " + other_map.id + " but the latter is not");
					}
				}
			}
		}
	}

	/**
	 * @return {Promise<void>}
	 */
	static setEverybodyAsUnOccupied() {
		Entities.update(
			{
				effect: EFFECT.SMILEY
			},
			{
				where: {
					effect: EFFECT.AWAITING_ANSWER
				}
			}
		);
	}

	static replaceWarningLogger() {
		sequelizeLogger.logger.warn = function(message) {
			if (
				message ===
				"Unknown attributes (Player) passed to defaults option of findOrCreate"
			) {
				return;
			}
			console.warn(`(sequelize) Warning: ${message}`);
		};
	}

	static async updatePlayersRandomMap() {
		const query = "UPDATE players SET map_id = (abs(random()) % (SELECT MAX(id) FROM map_locations) + 1) WHERE map_id = -1;";
		await Database.Sequelize.query(query, {
			type: Sequelize.QueryTypes.UPDATE
		});
	}
}

module.exports = {
	init: Database.init
};
