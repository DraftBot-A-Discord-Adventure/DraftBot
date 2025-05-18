import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	CacheType,
	ComponentType,
	InteractionCollector,
	Message
} from "discord.js";
import { DraftbotInteraction } from "./DraftbotInteraction";
import { DraftBotEmbed } from "./DraftBotEmbed";
import i18n from "../translations/i18n"; // For button labels if needed
import { PacketContext } from "../../../Lib/src/packets/DraftBotPacket";
import { DraftBotIcons } from "../../../Lib/src/DraftBotIcons";

export type FormatEmbedFunction<TResponseData> = (
	data: TResponseData,
	currentPage: number,
	totalPages: number,
	interaction: DraftbotInteraction,
	playerUsername: string
) => Promise<{
	embeds: DraftBotEmbed[]; files?: any[];
}>;

export type FetchDataFunction = (
	page: number,
	context: PacketContext,
	interaction: DraftbotInteraction
) => Promise<void>;

// Define a base type for response data that includes necessary pagination fields
export interface PaginatedResponseData {
	totalElements: number;
	elementsPerPage: number;
	minRank: number; // Used to calculate current page
	// Add any other common fields needed by the paginator or formatting function
}

export class InteractivePaginatedEmbed<TResponseData extends PaginatedResponseData> {
	private interaction: DraftbotInteraction;

	private message: Message;

	private fetchDataCb: FetchDataFunction;

	private formatEmbedCb: FormatEmbedFunction<TResponseData>;

	private cache: Map<number, TResponseData>;

	private currentPage: number;

	private totalPages: number;

	private collector?: InteractionCollector<ButtonInteraction<CacheType>>;

	private userKeycloakId: string;

	private playerUsername: string;

	public readonly uniqueId: string; // Used as key in activePaginators

	public static activePaginators = new Map<string, InteractivePaginatedEmbed<any>>();

	constructor(
		interaction: DraftbotInteraction,
		message: Message,
		initialData: TResponseData,
		fetchDataCb: FetchDataFunction,
		formatEmbedCb: FormatEmbedFunction<TResponseData>,
		userKeycloakId: string,
		playerUsername: string
	) {
		this.interaction = interaction;
		this.message = message;
		this.fetchDataCb = fetchDataCb;
		this.formatEmbedCb = formatEmbedCb;
		this.cache = new Map<number, TResponseData>();
		this.userKeycloakId = userKeycloakId;
		this.playerUsername = playerUsername;
		this.uniqueId = this.message.id;

		this.currentPage = this.calculatePageNumber(initialData.minRank, initialData.elementsPerPage);
		this.totalPages = initialData.totalElements > 0 ? Math.ceil(initialData.totalElements / initialData.elementsPerPage) : 1;
		this.cache.set(this.currentPage, initialData);

		// Ensure totalPages is at least 1, even if totalElements is 0
		if (this.totalPages === 0 && initialData.totalElements === 0) {
			this.totalPages = 1;
		}
	}

	private calculatePageNumber(minRank: number, elementsPerPage: number): number {
		if (elementsPerPage <= 0) {
			return 1;
		} // Avoid division by zero
		return Math.floor(minRank / elementsPerPage) + 1;
	}

	public async start(): Promise<void> {
		const currentData = this.cache.get(this.currentPage);
		if (!currentData) {
			console.error("InteractivePaginatedEmbed: No data for current page on start.");
			return;
		}
		const editOptions = await this.formatEmbedCb(currentData, this.currentPage, this.totalPages, this.interaction, this.playerUsername);
		const components = this.totalPages <= 1 ? [] : [this.createPrevNextActionRow()];
		await this.message.edit({
			...editOptions, components
		});

		InteractivePaginatedEmbed.activePaginators.set(this.uniqueId, this);
		this.setupCollector();
	}

	public async updateWithNewPageData(data: TResponseData): Promise<void> {
		const newPageNumber = this.calculatePageNumber(data.minRank, data.elementsPerPage);
		this.cache.set(newPageNumber, data);
		this.currentPage = newPageNumber;
		this.totalPages = data.totalElements > 0 ? Math.ceil(data.totalElements / data.elementsPerPage) : 1;
		if (this.totalPages === 0 && data.totalElements === 0) {
			this.totalPages = 1;
		}

		const editOptions = await this.formatEmbedCb(data, this.currentPage, this.totalPages, this.interaction, this.playerUsername);
		const components = this.totalPages <= 1 ? [] : [this.createPrevNextActionRow()];
		try {
			await this.message.edit({
				...editOptions, components
			});
			if (!this.collector || this.collector.ended) {
				this.setupCollector();
			}
		}
		catch (error) {
			console.error("Failed to edit message in updateWithNewPageData:", error);
			this.stop(); // Stop if message is inaccessible
		}
	}

	private async handleNavigation(targetPage: number, buttonInteraction: ButtonInteraction): Promise<void> {
		if (targetPage < 1 || targetPage > this.totalPages || targetPage === this.currentPage) {
			await buttonInteraction.deferUpdate().catch(console.error);
			return;
		}

		if (this.cache.has(targetPage)) {
			this.currentPage = targetPage;
			const currentData = this.cache.get(targetPage);
			if (!currentData) {
				await buttonInteraction.deferUpdate().catch(console.error);
				console.error("InteractivePaginatedEmbed: Data expected in cache but not found.");
				return;
			}
			const editOptions = await this.formatEmbedCb(currentData, this.currentPage, this.totalPages, this.interaction, this.playerUsername);
			const components = this.totalPages <= 1 ? [] : [this.createPrevNextActionRow()];
			await buttonInteraction.update({
				...editOptions, components
			}).catch(console.error);
		}
		else {
			await buttonInteraction.deferUpdate().catch(console.error);
			const tempContext: PacketContext = {
				discord: {
					interaction: this.interaction.id,
					user: buttonInteraction.user.id,
					channel: this.message.channelId,
					language: DraftbotInteraction.cast(buttonInteraction).userLanguage,
					shardId: this.interaction.guild?.shardId ?? 0
				},
				keycloakId: this.userKeycloakId,
				frontEndOrigin: "DISCORD",
				frontEndSubOrigin: "pagination"
			};
			await this.fetchDataCb(targetPage, tempContext, this.interaction);
		}
	}

	private createPrevNextActionRow(): ActionRowBuilder<ButtonBuilder> {
		const row = new ActionRowBuilder<ButtonBuilder>();

		row.addComponents(
			new ButtonBuilder()
				.setCustomId(`pagination_${this.uniqueId}_prev`)
				.setEmoji(DraftBotIcons.collectors.previousPage)
				.setStyle(ButtonStyle.Secondary)
				.setDisabled(this.currentPage === 1),
			new ButtonBuilder()
				.setCustomId(`pagination_${this.uniqueId}_next`)
				.setEmoji(DraftBotIcons.collectors.nextPage)
				.setStyle(ButtonStyle.Secondary)
				.setDisabled(this.currentPage === this.totalPages)
		);
		return row;
	}

	private setupCollector(): void {
		if (this.collector && !this.collector.ended) {
			this.collector.stop("new_collector");
		}
		this.collector = this.message.createMessageComponentCollector({
			componentType: ComponentType.Button,
			time: 300000 // 5 minutes
		});

		this.collector.on("collect", async (i: ButtonInteraction) => {
			if (i.user.id !== this.interaction.user.id) {
				await i.reply({
					content: i18n.t("common:cannotUseButton", { lng: DraftbotInteraction.cast(i).userLanguage }),
					ephemeral: true
				});
				return;
			}

			const parts = i.customId.split("_");
			if (parts.length < 3 || parts[0] !== "pagination" || parts[1] !== this.uniqueId) {
				await i.deferUpdate().catch(console.error);
				return;
			}
			const action = parts[2];

			let targetPage = this.currentPage;
			if (action === "prev") {
				targetPage = this.currentPage - 1;
			}
			else if (action === "next") {
				targetPage = this.currentPage + 1;
			}
			else {
				await i.deferUpdate().catch(console.error);
				return;
			}

			await this.handleNavigation(targetPage, i);
		});

		this.collector.on("end", (_collected, reason) => {
			InteractivePaginatedEmbed.activePaginators.delete(this.uniqueId);
			if (reason !== "new_collector") {
				this.message.edit({ components: [] }).catch(() => { /* Ignore if message is already deleted */
				});
			}
		});
	}

	public stop(reason: string = "manual"): void {
		if (this.collector && !this.collector.ended) {
			this.collector.stop(reason);
		}
		else {
			InteractivePaginatedEmbed.activePaginators.delete(this.uniqueId);
		}
	}
}
