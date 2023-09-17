"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPCServer = void 0;
var NodeIPC = require("node-ipc");
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
var IPCServer = exports.IPCServer = /** @class */ (function (_super) {
    __extends(IPCServer, _super);
    /**
     * Starts the IPC server
     */
    function IPCServer() {
        var _this = _super.call(this) || this;
        // The limitTimestamp is the date when the blocking is finished
        _this.blockedPlayers = new Map();
        _this.spamPlayers = new Map();
        _this.config.id = "draftbot";
        _this.config.retry = 1500;
        _this.config.silent = true; // You can set this to false in order to debug, it's very useful
        _this.serve(function () {
            _this.prepareBlockAnswer();
            _this.prepareUnblockAnswer();
            _this.prepareIsBlockedAnswer();
            _this.prepareSpamAnswer();
            _this.prepareIsSpammingAnswer();
            _this.prepareConnexionSocketAnswer();
            _this.prepareDisconnectionSocketAnswer();
            _this.prepareMaintenanceCommand();
        });
        _this.server.start();
        return _this;
    }
    /**
     * Get the count of blocked players
     */
    IPCServer.prototype.getBlockedPlayersCount = function () {
        var count = 0;
        var now = Date.now();
        for (var _i = 0, _a = this.blockedPlayers.entries(); _i < _a.length; _i++) {
            var blockedPlayer = _a[_i];
            for (var _b = 0, _c = blockedPlayer[1]; _b < _c.length; _b++) {
                var block = _c[_b];
                if (block.limitTimestamp === 0 || block.limitTimestamp > now) {
                    count++;
                    break;
                }
            }
        }
        return count;
    };
    /**
     * Remove the specified block reason from the given user
     * @param discordId
     * @param reason
     */
    IPCServer.prototype.removeBlockedReason = function (discordId, reason) {
        var blockedPlayer = this.blockedPlayers.get(discordId);
        if (blockedPlayer) {
            this.blockedPlayers.set(discordId, blockedPlayer.filter(function (v) { return v.reason !== reason; }));
            if (this.blockedPlayers.get(discordId).length === 0) {
                this.blockedPlayers.delete(discordId);
            }
        }
    };
    /**
     * Answer to call when you want to block a player from doing another command
     */
    IPCServer.prototype.prepareBlockAnswer = function () {
        var _this = this;
        this.server.on("block", function (data) {
            if (!_this.blockedPlayers.get(data.discordId)) {
                _this.blockedPlayers.set(data.discordId, []);
            }
            _this.blockedPlayers.get(data.discordId).push({
                reason: data.reason,
                limitTimestamp: data.time !== 0 ? Date.now() + data.time : 0
            });
        });
    };
    /**
     * Answer to call when you want to unblock a player
     */
    IPCServer.prototype.prepareUnblockAnswer = function () {
        var _this = this;
        this.server.on("unblock", function (data) {
            _this.removeBlockedReason(data.discordId, data.reason);
        });
    };
    /**
     * Get the reasons for why the player is blocked, if exists
     */
    IPCServer.prototype.prepareIsBlockedAnswer = function () {
        var _this = this;
        this.server.on("isBlocked", function (data, socket) {
            var blockedPlayer = _this.blockedPlayers.get(data.discordId);
            var response = [];
            if (blockedPlayer) {
                for (var _i = 0, blockedPlayer_1 = blockedPlayer; _i < blockedPlayer_1.length; _i++) {
                    var block = blockedPlayer_1[_i];
                    if (block.limitTimestamp !== 0 && block.limitTimestamp < Date.now()) {
                        _this.removeBlockedReason(data.discordId, block.reason);
                    }
                    else {
                        response.push(block.reason);
                    }
                }
            }
            _this.server.emit(socket, "isBlocked", {
                packet: data.packet,
                reason: response
            });
        });
    };
    /**
     * Save when the last command has been entered, to avoid spam
     */
    IPCServer.prototype.prepareSpamAnswer = function () {
        var _this = this;
        this.server.on("spam", function (data) {
            _this.spamPlayers.set(data.discordId, Date.now() + IPCServer.spamDelay);
        });
    };
    /**
     * Check if the player is spamming
     */
    IPCServer.prototype.prepareIsSpammingAnswer = function () {
        var _this = this;
        this.server.on("isSpamming", function (data, socket) {
            var spamPlayerLimitTimestamp = _this.spamPlayers.get(data.discordId);
            var response = false;
            if (spamPlayerLimitTimestamp) {
                if (spamPlayerLimitTimestamp < Date.now()) {
                    _this.spamPlayers.delete(data.discordId);
                }
                else {
                    response = true;
                }
            }
            _this.server.emit(socket, "isSpamming", {
                packet: data.packet,
                spamming: response
            });
        });
    };
    /**
     * Socket connection
     */
    IPCServer.prototype.prepareConnexionSocketAnswer = function () {
        var _this = this;
        this.server.on("socket.connected", function (socket, socketID) {
            _this.log("client ".concat(socketID, " has connected!"));
        });
    };
    /**
     * Socket disconnection
     */
    IPCServer.prototype.prepareDisconnectionSocketAnswer = function () {
        var _this = this;
        this.server.on("socket.disconnected", function (socket, destroyedSocketID) {
            _this.log("client ".concat(destroyedSocketID, " has disconnected!"));
        });
    };
    /**
     * Maintenance command
     */
    IPCServer.prototype.prepareMaintenanceCommand = function () {
        var _this = this;
        this.server.on("maintenanceCommand", function (data) {
            _this.broadcastMaintenance(data.enable, true);
        });
    };
    /**
     * Ask for maintenance
     * @param enable
     */
    IPCServer.prototype.broadcastMaintenance = function (enable, fromCommand) {
        this.server.broadcast("maintenance", {
            enable: enable,
            fromCommand: fromCommand
        });
    };
    IPCServer.spamDelay = 1000;
    return IPCServer;
}(NodeIPC.IPCModule));
