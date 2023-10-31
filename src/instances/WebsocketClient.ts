import {Client} from "./Client";

export interface WebsocketClient extends Client {
	webSocket: WebSocket;
}