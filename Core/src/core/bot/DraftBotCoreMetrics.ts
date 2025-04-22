// skipcq: JS-C1003 - prom-client does not expose itself as an ES Module.
import * as client from "prom-client";
import { BlockingUtils } from "../utils/BlockingUtils";

export const draftBotMetricsRegistry = new client.Registry();

export abstract class DraftBotCoreMetrics {
	private static packetsTimeHistogram = new client.Histogram({
		name: "draftbot_packets_time",
		help: "Histogram of packets times",
		labelNames: ["packet"],
		registers: [draftBotMetricsRegistry]
	});

	private static packetsCount = new client.Counter({
		name: "draftbot_packets_count",
		help: "Count of packets",
		labelNames: ["packet"],
		registers: [draftBotMetricsRegistry]
	});

	private static packetsErrorCount = new client.Counter({
		name: "draftbot_packets_error_count",
		help: "Count of packets errors",
		labelNames: ["packet"],
		registers: [draftBotMetricsRegistry]
	});

	private static blockedPlayersCount = new client.Gauge({
		name: "draftbot_blocked_players_count",
		help: "Count of blocked players",
		registers: [draftBotMetricsRegistry]
	});

	private static blockedPlayersTimes = new client.Gauge({
		name: "draftbot_blocked_players_times",
		help: "Times of blocked players",
		labelNames: ["keycloakId", "reason"],
		registers: [draftBotMetricsRegistry]
	});

	static observePacketTime(packetName: string, time: number): void {
		this.packetsTimeHistogram.labels(packetName)
			.observe(time);
	}

	static incrementPacketCount(packetName: string): void {
		this.packetsCount.labels(packetName)
			.inc();
	}

	static incrementPacketErrorCount(packetName: string): void {
		this.packetsErrorCount.labels(packetName)
			.inc();
	}

	static computeSporadicMetrics(): void {
		// Blocked players count
		this.blockedPlayersCount.set(BlockingUtils.getBlockedPlayersCount());

		// Blocked players times
		const now = Date.now();
		this.blockedPlayersTimes.reset();
		BlockingUtils.getBlockedPlayers().forEach((blockingInfo, keycloakId) => {
			blockingInfo.forEach(block => {
				this.blockedPlayersTimes.labels(keycloakId, block.reason)
					.set(now - block.startTimestamp);
			});
		});
	}
}

client.collectDefaultMetrics({
	register: draftBotMetricsRegistry
});
