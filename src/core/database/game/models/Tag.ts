import {DataTypes, Model, QueryTypes, Sequelize} from "sequelize";
import moment = require("moment");

export class Tag extends Model {
	public readonly id!: number;

	public textTag!: string;

	public idObject!: number;

	public typeObject!: string;

	public updatedAt!: Date;

	public createdAt!: Date;
}

export class Tags {
	static findTagsFromObject(idObject: number, model: string): Promise<Tag[]> {
		const query = `SELECT *
                       FROM tags
                       WHERE idObject = :idObject
                         AND typeObject = :typeObject`;
		return Tag.sequelize.query(query, {
			replacements: {
				idObject: idObject,
				typeObject: model
			},
			type: QueryTypes.SELECT
		});
	}
}

export function initModel(sequelize: Sequelize): void {
	Tag.init({
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		textTag: {
			type: DataTypes.STRING
		},
		idObject: {
			type: DataTypes.INTEGER
		},
		typeObject: {
			type: DataTypes.STRING
		},
		updatedAt: {
			type: DataTypes.DATE,
			defaultValue: moment().format("YYYY-MM-DD HH:mm:ss")
		},
		createdAt: {
			type: DataTypes.DATE,
			defaultValue: moment().format("YYYY-MM-DD HH:mm:ss")
		}
	}, {
		sequelize,
		tableName: "tags",
		freezeTableName: true
	});

	Tag.beforeSave(instance => {
		instance.updatedAt = moment().toDate();
	});
}

export default Tag;