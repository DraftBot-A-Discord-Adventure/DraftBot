import {Database} from "../Database";
import {DataTypes} from "sequelize";

export class GameDatabase extends Database {

	constructor() {
		super("game");
	}

	/**
	 * Initialize a GameDatabase instance
	 */
	async init(): Promise<void> {
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

		await super.init();
	}
}