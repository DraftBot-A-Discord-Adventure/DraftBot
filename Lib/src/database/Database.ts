import {
	QueryInterface, Sequelize, Transaction
} from "sequelize";
import {
	SequelizeStorage, Umzug
} from "umzug";
import { promises } from "fs";
import { createConnection } from "mariadb";
import { DatabaseConfiguration } from "./DatabaseConfiguration";
import TYPES = Transaction.TYPES;

export abstract class Database {
	/**
	 * Sequelize instance
	 */
	public sequelize!: Sequelize;

	/**
	 * Umzug instance
	 */
	public umzug!: Umzug<QueryInterface>;

	/**
	 * The path to the models
	 */
	private readonly modelsPath: string;

	/**
	 * The path to the migrations
	 */
	private readonly migrationsPath: string;

	/**
	 * The connection configuration
	 */
	private readonly databaseConfiguration: DatabaseConfiguration;

	protected constructor(connectionConfiguration: DatabaseConfiguration, modelsPath: string, migrationsPath: string) {
		this.modelsPath = modelsPath;
		this.migrationsPath = migrationsPath;
		this.databaseConfiguration = connectionConfiguration;
	}

	/**
	 * Initialize the database. Must be called after the constructor
	 * @param doMigrations
	 */
	public async init(doMigrations: boolean): Promise<void> {
		// Connect to the database
		await this.connectDatabase();

		// Do migration
		if (doMigrations) {
			await this.umzug.up();
		}

		await this.initModels();
	}

	protected async connectDatabase(): Promise<void> {
		// Ignore if already connected
		if (this.sequelize) {
			return;
		}

		const dbName = `${this.databaseConfiguration.prefix}_${this.databaseConfiguration.databaseName}`;

		if (this.databaseConfiguration.rootPassword) {
			// Initialize the connection
			const mariadbConnection = await createConnection({
				host: this.databaseConfiguration.host,
				port: this.databaseConfiguration.port,
				user: this.databaseConfiguration.rootUser,
				password: this.databaseConfiguration.rootPassword
			});
			await mariadbConnection.execute(`CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;`);
			try {
				await mariadbConnection.execute(
					`GRANT ALL PRIVILEGES ON ${dbName}.* TO '${this.databaseConfiguration.user}'@${this.databaseConfiguration.host};`
				);
			}
			catch {
				await mariadbConnection.execute(`GRANT ALL PRIVILEGES ON ${dbName}.* TO '${this.databaseConfiguration.user}';`);
			}
			await mariadbConnection.end();
		}

		this.sequelize = new Sequelize(`${dbName}`, this.databaseConfiguration.user, this.databaseConfiguration.userPassword, {
			dialect: "mariadb",
			host: this.databaseConfiguration.host,
			port: this.databaseConfiguration.port,
			logging: false,
			transactionType: TYPES.IMMEDIATE
		});
		await this.sequelize.authenticate();

		// Create umzug instance. See https://github.com/sequelize/umzug
		this.umzug = new Umzug({
			context: this.sequelize.getQueryInterface(),
			logger: console,
			migrations: {
				glob: ["*.js", { cwd: this.migrationsPath.replace("\\", "/") }]
			},
			storage: new SequelizeStorage({ sequelize: this.sequelize })
		});
	}

	/**
	 * Init the database models
	 */
	private async initModels(): Promise<void> {
		const modelsFiles = await promises.readdir(this.modelsPath);
		const models: {
			initModel: (sequelize: Sequelize) => Promise<void>;
		}[] = [];

		for (const modelFile of modelsFiles) {
			await this.initModelFromFile(modelFile, models);
		}
	}

	/**
	 * Initialize a model from its model file
	 * @param modelFile
	 * @param models
	 */
	private async initModelFromFile(modelFile: string, models: {
		initModel: (sequelize: Sequelize) => Promise<void>;
	}[]): Promise<void> {
		const modelSplit = modelFile.split(".");
		const modelName = modelSplit[0];
		if (modelSplit[1] !== "js" || modelSplit.length !== 2) {
			return;
		}
		const model = await import(`${this.modelsPath}/${modelName}`);
		models.push(model);
		if (model.initModel) {
			await model.initModel(this.sequelize);
		}
	}
}
