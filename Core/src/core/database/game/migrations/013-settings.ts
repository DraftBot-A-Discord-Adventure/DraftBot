import {
	DataTypes, QueryInterface
} from "sequelize";
import { shopAttributes001 } from "./001-initial-database";

export async function up({ context }: { context: QueryInterface }): Promise<void> {
	await context.createTable("settings", {
		name: {
			type: DataTypes.STRING,
			primaryKey: true
		},
		dataString: {
			type: DataTypes.STRING,
			allowNull: true
		},
		dataNumber: {
			type: DataTypes.INTEGER,
			allowNull: true
		},
		updatedAt: DataTypes.DATE,
		createdAt: DataTypes.DATE
	});

	const shopPotionId: number = <number> (<{ shopPotionId: number }> (await context.sequelize.query("SELECT shopPotionId FROM shop LIMIT 1"))[0][0])?.shopPotionId;
	if (shopPotionId) {
		await context.sequelize.query(`INSERT INTO settings(name, dataNumber, updatedAt, createdAt) VALUES ('shopPotion', ${shopPotionId}, NOW(), NOW())`);
	}

	await context.dropTable("shop");
}

export async function down({ context }: { context: QueryInterface }): Promise<void> {
	await context.createTable("shop", shopAttributes001);

	const shopPotionId: number = <number> (<{ dataNumber: number }> (await context.sequelize.query("SELECT dataNumber FROM settings WHERE name = 'shopPotion' LIMIT 1"))[0][0]).dataNumber;
	if (shopPotionId) {
		await context.sequelize.query(`INSERT INTO shop(shopPotionId, updatedAt, createdAt) VALUES (${shopPotionId}, NOW(), NOW())`);
	}

	await context.dropTable("settings");
}
