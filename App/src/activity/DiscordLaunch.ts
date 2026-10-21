import type { DiscordSDK } from "@discord/embedded-app-sdk";

/*
 * Discord only launches the web build. The SDK reads the browser's address as soon as it is loaded, so the
 * native builds never load it: `DiscordLaunch.web.ts` replaces this file in the web bundle.
 */

export function captureDiscordLaunch(): void {
	// Nothing launches the native app from Discord.
}

export function isDiscordActivity(): boolean {
	return false;
}

export function discordSdk(): DiscordSDK {
	throw new Error("The app was not launched as a Discord Activity.");
}
