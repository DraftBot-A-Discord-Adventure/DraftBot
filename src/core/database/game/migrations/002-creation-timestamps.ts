import {DataTypes, QueryInterface, Sequelize} from "sequelize";
import {guildsAttributes001, petEntitiesAttributes001} from "./001-initial-database";

export async function up({context}: { context: QueryInterface }): Promise<void> {
	// Guild creation date
	const guildCreationDateAttributes = {
		type: DataTypes.DATE,
		defaultValue: DataTypes.NOW
	};
	await context.addColumn("guilds", "creationDate", guildCreationDateAttributes);
	const guildModel = await context.sequelize.define("guilds",
		Object.assign(
			{},
			guildsAttributes001,
			{ creationDate: guildCreationDateAttributes }
		)); // assign => Merge objects in the first one
	await guildModel.update({ creationDate: Sequelize.literal("createdAt") }, { where: {} });

	// Pet entity creation date
	const petEntityCreationDateAttributes = {
		type: DataTypes.DATE,
		defaultValue: DataTypes.NOW
	};
	await context.addColumn("pet_entities", "creationDate", petEntityCreationDateAttributes);
	const petEntityModel = await context.sequelize.define("pet_entities",
		Object.assign(
			{},
			petEntitiesAttributes001,
			{ creationDate: petEntityCreationDateAttributes }
		)); // assign => Merge objects in the first one
	await petEntityModel.update({ creationDate: Sequelize.literal("createdAt") }, { where: {} });
}

export async function down({context}: { context: QueryInterface }): Promise<void> {
	await context.removeColumn("guilds", "creationDate");
	await context.removeColumn("pet_entities", "creationDate");
}