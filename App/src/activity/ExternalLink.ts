import { Linking } from "react-native";
import {
	discordSdk, isDiscordActivity
} from "@/src/activity/DiscordLaunch";

/** Inside Discord, the Activity cannot leave its frame: Discord asks the player before opening the page itself. */
export async function openExternalUrl(url: string): Promise<void> {
	if (isDiscordActivity()) {
		await discordSdk().commands.openExternalLink({ url });
		return;
	}
	await Linking.openURL(url);
}
