/** Small values kept on this device and read synchronously, in the keychain. `DeviceStorage.web.ts` replaces it in a browser. */
export {
	getItem, setItem
} from "expo-secure-store";
