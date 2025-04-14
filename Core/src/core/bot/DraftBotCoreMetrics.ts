// skipcq: JS-C1003 - prom-client does not expose itself as an ES Module.
import * as client from "prom-client";

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
}

client.collectDefaultMetrics({
	register: draftBotMetricsRegistry
});
