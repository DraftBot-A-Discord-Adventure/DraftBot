import {DraftBotEmbed} from "../DraftBotEmbed";
import {CommandInteraction} from "discord.js";
import {TopConstants} from "../../constants/TopConstants";
import {format} from "../../utils/StringFormatter";
import {DraftBotErrorEmbed} from "../DraftBotErrorEmbed";

/**
 * Badge color if none found beforehand
 */
export enum TopBadgeColorEnum {
	NO_COLOR,
	BLUE
}

/**
 * A line of the tpo
 */
export type TopElement = { name: string, attributes: TopElementAttribute[], badge: TopBadgeColorEnum };

/**
 * An attribute of a line of the top
 */
export type TopElementAttribute = { value: string, formatted: boolean }

/**
 * Top data
 */
export type TopData = {
	topElements: TopElement[],
	elementRank: number,
	rankText: string
};

/**
 * A top message abstract class. Needs to be extended and need to implement functions
 */
export abstract class DraftBotTopMessage extends DraftBotEmbed {
	/**
	 * Embed title
	 * @private
	 */
	private readonly _title: string;

	/**
	 * Message shown when there is nothing in the top
	 * @private
	 */
	private readonly _noElementMessage: string;

	/**
	 * The text above the ranking message
	 * @private
	 */
	private readonly _rankTextTitle: string;

	/**
	 * The icon of the footer or null if no footer
	 * @private
	 */
	private readonly _footerIcon: string;

	/**
	 * The text of the footer or null if no footer
	 * @private
	 */
	private readonly _footerText: string;

	/**
	 * Language
	 * @private
	 */
	private readonly _language: string;

	/**
	 * Page number to show
	 * @protected
	 */
	protected readonly _pageNumber: number;

	/**
	 * Size of a page
	 * @protected
	 */
	protected readonly _pageSize: number;

	/**
	 * @param pageParameters
	 * @param langParameters
	 * @protected
	 */
	protected constructor(
		pageParameters: { pageNumber: number, pageSize: number },
		langParameters: { language: string, title: string, noElementMessage: string, rankTextTitle: string, footerIcon: string, footerText: string }
	) {
		super();
		this._language = langParameters.language;
		this._title = langParameters.title;
		this._noElementMessage = langParameters.noElementMessage;
		this._rankTextTitle = langParameters.rankTextTitle;
		this._footerIcon = langParameters.footerIcon;
		this._footerText = langParameters.footerText;
		this._pageNumber = pageParameters.pageNumber;
		this._pageSize = pageParameters.pageSize;
	}

	/**
	 * Get the total of elements in the top
	 */
	abstract getTotalElements(): Promise<number>;

	/**
	 * Get the data of the top
	 * @param minRank Current page smaller rank
	 * @param maxRank Current page greater rank
	 * @param totalRanks The total number of elements
	 */
	abstract getTopData(minRank: number, maxRank: number, totalRanks: number): Promise<TopData>;

	/**
	 * Get the badge corresponding to a rank, or the default one if none found
	 * @param rank Rank to get the badge from
	 * @param elementRank The rank of the command initiator's element (player or guild)
	 * @param defaultColor The default badge if none found
	 * @protected
	 */
	protected getBadge(rank: number, elementRank: number, defaultColor: TopBadgeColorEnum): string {
		if (rank === elementRank) {
			return TopConstants.TOP_POSITION_BADGE.WHITE;
		}

		switch (rank) {
		case 1:
			return TopConstants.TOP_POSITION_BADGE.FIRST;
		case 2:
			return TopConstants.TOP_POSITION_BADGE.SECOND;
		case 3:
			return TopConstants.TOP_POSITION_BADGE.THIRD;
		case 4:
		case 5:
			return TopConstants.TOP_POSITION_BADGE.MILITARY;
		default:
			switch (defaultColor) {
			case TopBadgeColorEnum.BLUE:
				return TopConstants.TOP_POSITION_BADGE.BLUE;
			default:
				return TopConstants.TOP_POSITION_BADGE.BLACK;
			}
		}
	}

	/**
	 * Format the attributes of a top element
	 * @param attributes
	 * @private
	 */
	private getAttributesString(attributes: TopElementAttribute[]): string {
		let str = "";
		for (let i = 0; i < attributes.length; ++i) {
			if (attributes[i].formatted) {
				str += ` | \`${attributes[i].value}\``;
			}
			else {
				str += ` | ${attributes[i].value}`;
			}
		}
		return str;
	}

	/**
	 * Get the top description
	 * @param topData
	 * @param minRank
	 * @param maxRank
	 * @param total
	 * @private
	 */
	private getTopDescription(topData: TopData, minRank: number, maxRank: number, total: number): string {
		// If no element, return the no element message
		if (total <= 0) {
			return this._noElementMessage;
		}

		// Build the description
		let desc = "";
		for (let rank = minRank; rank <= maxRank; ++rank) {
			const arrayElement = topData.topElements[rank - minRank];
			desc += `${this.getBadge(rank, topData.elementRank, arrayElement.badge)} **${arrayElement.name}**${this.getAttributesString(arrayElement.attributes)}`;
			if (rank !== maxRank) {
				desc += "\n";
			}
		}

		return desc;
	}

	/**
	 * Reply to an interaction with the top
	 * @param interaction
	 */
	async reply(interaction: CommandInteraction): Promise<void> {
		// Defer reply
		await interaction.deferReply();

		// Get number of elements in the top
		const total = await this.getTotalElements();

		if (total === 0) {
			// Error: no element in top
			const errorEmbed = new DraftBotErrorEmbed(
				interaction.user,
				interaction,
				this._language,
				this._noElementMessage
			);

			// Reply to interaction
			await interaction.editReply({ embeds: [errorEmbed] });
		}
		else {
			// If the page is less than 1, then take the first one available
			// If the page is more than the last rank, take the last available page
			let pageNumber = this._pageNumber;
			if (this._pageNumber < 1) {
				pageNumber = 1;
			}
			else if ((this._pageNumber - 1) * this._pageSize >= total) {
				pageNumber = Math.ceil(total / this._pageSize);
			}

			// Compute the min and max rank
			const minRank = (pageNumber - 1) * this._pageSize + 1;
			const maxRank = Math.min(pageNumber * this._pageSize, total);

			// Get top data
			const data = await this.getTopData(minRank, maxRank, total);

			// Build top message strings
			const desc = this.getTopDescription(data, minRank, maxRank, total);
			const title = format(this._title, {
				minRank,
				maxRank
			});

			// Fill embed with values
			this.setTitle(title);
			this.setDescription(desc);
			this.addFields({
				name: this._rankTextTitle,
				value: data.rankText
			});
			if (this._footerText) {
				this.setFooter({
					text: this._footerText,
					iconURL: this._footerIcon
				});
			}

			// Reply to interaction
			await interaction.editReply({ embeds: [this] });
		}
	}
}