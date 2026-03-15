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
exports.automationBroadcaster = void 0;
exports.notifyDoctorUpdates = notifyDoctorUpdates;
var events_1 = require("events");
// simple in-memory broadcaster for doctor-update notifications
var Broadcaster = /** @class */ (function (_super) {
    __extends(Broadcaster, _super);
    function Broadcaster() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return Broadcaster;
}(events_1.EventEmitter));
exports.automationBroadcaster = new Broadcaster();
// helper to notify after automation run
function notifyDoctorUpdates(updates) {
    exports.automationBroadcaster.emit('doctors', updates);
}
