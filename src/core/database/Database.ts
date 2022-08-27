import {Sequelize, Transaction} from "sequelize";
import {botConfig} from "../bot";
import {SequelizeStorage, Umzug} from "umzug";
import {promises} from "fs";
import {createConnection} from "mariadb";
import TYPES = Transaction.TYPES;

export abstract class Database {
	/**
	 * Sequelize instance
	 */
	public sequelize: Sequelize;

	/**
	 * Umzug instance
	 * @private
	 */
	public umzug: Umzug;

	/**
	 * The database name
	 * @private
	 */
	private readonly databaseName: string;

	protected constructor(databaseName: string) {
		this.databaseName = databaseName;
	}

	/**
	 * Initialize the database. Must be called after the constructor
	 */
	public async init(isMainShard: boolean): Promise<void> {
		// Connect to the database
		await this.connectDatabase();

		// Migrate if it's the main shard, we don't want to migrate multiple times
		if (isMainShard) {
			// Do migration
			await this.umzug.up();
		}

		await this.initModels();
	}

	protected async connectDatabase(): Promise<void> {
		// Ignore if already connected
		if (this.sequelize) {
			return;
		}

		// Initialize the connection
		const mariadbConnection = await createConnection({
			host: botConfig.MARIADB_HOST,
			port: botConfig.MARIADB_PORT,
			user: "root",
			password: botConfig.MARIADB_ROOT_PASSWORD
		});
		await mariadbConnection.execute(`CREATE DATABASE IF NOT EXISTS draftbot_${this.databaseName} CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;`);
		await mariadbConnection.execute(`GRANT ALL PRIVILEGES ON draftbot_${this.databaseName}.* TO '${botConfig.MARIADB_USER}'@${botConfig.MARIADB_HOST};`);
		await mariadbConnection.end();

		this.sequelize = new Sequelize(`draftbot_${this.databaseName}`, botConfig.MARIADB_USER, botConfig.MARIADB_PASSWORD, {
			dialect: "mariadb",
			host: botConfig.MARIADB_HOST,
			port: botConfig.MARIADB_PORT,
			logging: false,
			transactionType: TYPES.IMMEDIATE
		});
		await this.sequelize.authenticate();
		await this.sequelize.query("SET SESSION sql_mode='NO_AUTO_VALUE_ON_ZERO';");

		// Create umzug instance. See https://github.com/sequelize/umzug
		this.umzug = new Umzug({
			context: this.sequelize.getQueryInterface(),
			logger: console,
			migrations: {
				glob: `${__dirname}/${this.databaseName}/migrations/*.js`
			},
			storage: new SequelizeStorage({sequelize: this.sequelize})
		});
	}

	/**
	 * Init the database models
	 * @private
	 */
	private async initModels(): Promise<void> {
		const modelsFiles = await promises.readdir(`${__dirname}/${this.databaseName}/models`);
		const models: { initModel: (sequelize: Sequelize) => Promise<void>, setAssociations: () => Promise<void> }[] = [];

		for (const modelFile of modelsFiles) {
			await this.initModelFromFile(modelFile, models);
		}

		// Do it after because models need to be initialized before setting associations
		for (const model of models) {
			if (model.setAssociations) {
				await model.setAssociations();
			}
		}
	}

	/**
	 * Initialize a model from its model file
	 * @param modelFile
	 * @param models
	 * @private
	 */
	private async initModelFromFile(modelFile: string, models: { initModel: (sequelize: Sequelize) => Promise<void>; setAssociations: () => Promise<void> }[]) {
		const modelSplit = modelFile.split(".");
		const modelName = modelSplit[0];
		if (modelSplit[1] !== "js" || modelSplit.length !== 2) {
			return;
		}
		const model = await import(`./${this.databaseName}/models/${modelName}`);
		models.push(model);
		if (model.initModel) {
			await model.initModel(this.sequelize);
		}
	}
}