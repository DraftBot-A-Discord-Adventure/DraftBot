import {Client} from "./Client";
import {WebSocket} from "ws";

export interface WebsocketClient extends Client {
	webSocket: WebSocket;
}