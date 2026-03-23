"use strict";
/**
 * Circuit Breaker pattern implementation
 * Prevents cascading failures by failing fast when service is unhealthy
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreaker = exports.CircuitState = void 0;
var CircuitState;
(function (CircuitState) {
    CircuitState["CLOSED"] = "CLOSED";
    CircuitState["OPEN"] = "OPEN";
    CircuitState["HALF_OPEN"] = "HALF_OPEN";
})(CircuitState || (exports.CircuitState = CircuitState = {}));
var CircuitBreaker = /** @class */ (function () {
    function CircuitBreaker(config) {
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
        this.lastFailureTime = null;
        this.config = config;
    }
    /**
     * Execute function with circuit breaker protection
     */
    CircuitBreaker.prototype.execute = function (fn) {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.state === CircuitState.OPEN) {
                            if (this.shouldAttemptReset()) {
                                this.state = CircuitState.HALF_OPEN;
                                console.log("[CircuitBreaker ".concat(this.config.name, "] Attempting reset (HALF_OPEN)"));
                            }
                            else {
                                throw new Error("Circuit breaker ".concat(this.config.name, " is OPEN"));
                            }
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, fn()];
                    case 2:
                        result = _a.sent();
                        this.onSuccess();
                        return [2 /*return*/, result];
                    case 3:
                        error_1 = _a.sent();
                        this.onFailure();
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    CircuitBreaker.prototype.onSuccess = function () {
        this.failureCount = 0;
        if (this.state === CircuitState.HALF_OPEN) {
            this.successCount++;
            if (this.successCount >= this.config.successThreshold) {
                this.close();
            }
        }
    };
    CircuitBreaker.prototype.onFailure = function () {
        this.lastFailureTime = Date.now();
        this.failureCount++;
        if (this.failureCount >= this.config.failureThreshold) {
            this.open();
        }
    };
    CircuitBreaker.prototype.open = function () {
        this.state = CircuitState.OPEN;
        console.warn("[CircuitBreaker ".concat(this.config.name, "] OPEN \u2014 requests will fail fast"));
    };
    CircuitBreaker.prototype.close = function () {
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
        console.log("[CircuitBreaker ".concat(this.config.name, "] CLOSED \u2014 recovered"));
    };
    CircuitBreaker.prototype.shouldAttemptReset = function () {
        if (this.lastFailureTime === null)
            return true;
        return Date.now() - this.lastFailureTime >= this.config.timeout;
    };
    CircuitBreaker.prototype.getState = function () {
        return this.state;
    };
    CircuitBreaker.prototype.getMetrics = function () {
        return {
            state: this.state,
            failureCount: this.failureCount,
            successCount: this.successCount,
            lastFailureTime: this.lastFailureTime ? new Date(this.lastFailureTime) : null
        };
    };
    return CircuitBreaker;
}());
exports.CircuitBreaker = CircuitBreaker;
