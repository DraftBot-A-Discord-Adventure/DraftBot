import {DataTypes, Model, Op, Sequelize} from "sequelize";
import {format} from "../../../utils/StringFormatter";
import * as moment from "moment";
import {Constants} from "../../../Constants";
import {LeagueInfoConstants} from "../../../constants/LeagueInfoConstants";

export class League extends Model {
	public readonly id!: number;

	public readonly minGlory!: number;

	public readonly maxGlory!: number;

	public readonly emoji!: string;

	public readonly fr!: string;

	public readonly en!: string;

	public updatedAt!: Date;

	public createdAt!: Date;

	/**
	 * display the information of the class
	 * @param language
	 */
	public toString(language: string): string {
		return format(LeagueInfoConstants.FIELDS_VALUE, {
			emoji: this.emoji,
			name: this.getName(language),
			minGlory: this.minGlory,
			maxGlory: this.maxGlory
		});
	}

	/**
	 * get the name of the class in the given language
	 * @param language
	 */
	public getName(language: string): string {
		return language === Constants.LANGUAGE.FRENCH ? this.fr : this.en;
	}
}

export class Leagues {

	/**
	 * get the league by its id
	 * @param id
	 */
	static getById(id: number): Promise<League | null> {
		return Promise.resolve(League.findOne({
			where: {
				id
			}
		}));
	}

	/**
	 * get the league by its emoji
	 * @param emoji
	 */
	static getByEmoji(emoji: string): Promise<League | null> {
		return Promise.resolve(League.findOne({
			where: {
				emoji
			}
		}));
	}

	static getByGlory(gloryPoints: number): Promise<League | null> {
		return Promise.resolve(League.findOne({
			where: {
				minGlory: {
					[Op.lt]: gloryPoints
				},
				maxGlory: {
					[Op.gt]: gloryPoints
				}
			}
		}));
	}
}

export function initModel(sequelize: Sequelize): void {
	League.init(
		{
			id: {
				type: DataTypes.INTEGER,
				primaryKey: true
			},
			minGlory: {
				type: DataTypes.INTEGER
			},
			maxGlory: {
				type: DataTypes.INTEGER
			},
			emoji: {
				type: DataTypes.STRING
			},
			fr: {
				type: DataTypes.TEXT
			},
			en: {
				type: DataTypes.TEXT
			},
			updatedAt: {
				type: DataTypes.DATE,
				defaultValue: moment().format("YYYY-MM-DD HH:mm:ss")
			},
			createdAt: {
				type: DataTypes.DATE,
				defaultValue: moment().format("YYYY-MM-DD HH:mm:ss")
			}
		},
		{
			sequelize,
			tableName: "leagues",
			freezeTableName: true
		});

	League.beforeSave(instance => {
		instance.updatedAt = moment().toDate();
	});
}

export default League;