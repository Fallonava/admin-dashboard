"use strict";
/**
 * Automation Queue using BullMQ
 * Handles retry logic, rate limiting, and backoff for doctor updates
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.getAutomationQueue = getAutomationQueue;
exports.initializeAutomationQueue = initializeAutomationQueue;
var bullmq_1 = require("bullmq");
var redis_1 = require("redis");
var circuit_breaker_1 = require("./circuit-breaker");
var AutomationQueueManager = /** @class */ (function () {
    function AutomationQueueManager() {
        this.queue = null;
        this.worker = null;
        this.redis = null;
        this.isInitialized = false;
        this.circuitBreaker = new circuit_breaker_1.CircuitBreaker({
            failureThreshold: 5,
            successThreshold: 3,
            timeout: 30000, // 30 seconds
            name: 'AutomationQueue'
        });
    }
    /**
     * Initialize queue, worker, and scheduler
     * Should be called once on server startup
     */
    AutomationQueueManager.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var redisUrl, errorLogged_1, error_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.isInitialized)
                            return [2 /*return*/];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        // In Vercel or production environments, avoid attempting local Redis connections if no URL
                        if (!process.env.REDIS_URL && (process.env.VERCEL || process.env.VERCEL_ENV || process.env.NODE_ENV === 'production')) {
                            console.log('[AutomationQueue] Skipped initialization (no REDIS_URL in production/vercel). Using direct API fallback.');
                            this.isInitialized = true;
                            return [2 /*return*/];
                        }
                        redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
                        this.redis = (0, redis_1.createClient)({
                            url: redisUrl
                        });
                        errorLogged_1 = false;
                        this.redis.on('error', function (err) {
                            if (!_this.isInitialized && !errorLogged_1) {
                                console.warn('[AutomationQueue] Redis connection error:', err.message);
                                errorLogged_1 = true;
                            }
                        });
                        return [4 /*yield*/, this.redis.connect()];
                    case 2:
                        _a.sent();
                        // Create queue
                        this.queue = new bullmq_1.Queue('doctor-updates', {
                            connection: this.redis
                        });
                        // Create worker with concurrency limit (rate limiting)
                        this.worker = new bullmq_1.Worker('doctor-updates', this.processJob.bind(this), {
                            connection: this.redis,
                            concurrency: 5 // Process max 5 jobs concurrently
                        });
                        // Event handlers
                        this.worker.on('completed', function (job) {
                            console.log("[Queue] Job ".concat(job.id, " completed"));
                        });
                        this.worker.on('failed', function (job, error) {
                            console.warn("[Queue] Job ".concat(job === null || job === void 0 ? void 0 : job.id, " failed:"), error === null || error === void 0 ? void 0 : error.message);
                        });
                        this.worker.on('error', function (error) {
                            console.error('[Queue] Worker error:', error);
                        });
                        this.isInitialized = true;
                        console.log('[AutomationQueue] Initialized successfully');
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        console.error('[AutomationQueue] Initialization failed:', error_1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Add a doctor update job to the queue
     * Returns job ID if queued, throws if queue unavailable
     */
    AutomationQueueManager.prototype.addJob = function (update) {
        return __awaiter(this, void 0, void 0, function () {
            var job;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.queue) {
                            throw new Error('Queue not initialized');
                        }
                        return [4 /*yield*/, this.queue.add('update', update, {
                                attempts: 5, // Retry up to 5 times
                                backoff: {
                                    type: 'exponential',
                                    delay: 2000 // Start with 2s, exponentially increase
                                },
                                removeOnComplete: true,
                                removeOnFail: false
                            })];
                    case 1:
                        job = _a.sent();
                        return [2 /*return*/, job.id || ''];
                }
            });
        });
    };
    /**
     * Batch add multiple jobs
     */
    AutomationQueueManager.prototype.addBatch = function (updates) {
        return __awaiter(this, void 0, void 0, function () {
            var jobs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.queue) {
                            throw new Error('Queue not initialized');
                        }
                        return [4 /*yield*/, this.queue.addBulk(updates.map(function (u) { return ({
                                name: 'update',
                                data: u,
                                opts: {
                                    attempts: 5,
                                    backoff: {
                                        type: 'exponential',
                                        delay: 2000
                                    },
                                    removeOnComplete: true,
                                    removeOnFail: false
                                }
                            }); }))];
                    case 1:
                        jobs = _a.sent();
                        return [2 /*return*/, jobs.map(function (j) { return j.id || ''; })];
                }
            });
        });
    };
    /**
     * Process a doctor update job with circuit breaker protection
     */
    AutomationQueueManager.prototype.processJob = function (job) {
        return __awaiter(this, void 0, void 0, function () {
            var update, error_2;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        update = job.data;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.circuitBreaker.execute(function () { return __awaiter(_this, void 0, void 0, function () {
                                var prisma, result;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('./prisma')); })];
                                        case 1:
                                            prisma = (_a.sent()).prisma;
                                            return [4 /*yield*/, prisma.doctor.update({
                                                    where: { id: String(update.id) },
                                                    data: { status: update.status }
                                                })];
                                        case 2:
                                            result = _a.sent();
                                            console.log("[Queue] Updated doctor ".concat(update.id, " to ").concat(update.status));
                                            return [2 /*return*/, result];
                                    }
                                });
                            }); })];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _a.sent();
                        console.error("[Queue] Failed to process job ".concat(job.id, ":"), error_2);
                        throw error_2; // Re-throw to trigger BullMQ retry
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get queue metrics
     */
    AutomationQueueManager.prototype.getMetrics = function () {
        return __awaiter(this, void 0, void 0, function () {
            var counts;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.queue) {
                            return [2 /*return*/, { active: 0, delayed: 0, failed: 0, completed: 0, waiting: 0 }];
                        }
                        return [4 /*yield*/, this.queue.getJobCounts()];
                    case 1:
                        counts = _a.sent();
                        return [2 /*return*/, {
                                waiting: counts.waiting || 0,
                                active: counts.active || 0,
                                completed: counts.completed || 0,
                                failed: counts.failed || 0,
                                delayed: counts.delayed || 0
                            }];
                }
            });
        });
    };
    /**
     * Get failed jobs for inspection
     */
    AutomationQueueManager.prototype.getFailedJobs = function () {
        return __awaiter(this, arguments, void 0, function (limit) {
            var jobs;
            if (limit === void 0) { limit = 20; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.queue)
                            return [2 /*return*/, []];
                        return [4 /*yield*/, this.queue.getFailed(0, limit)];
                    case 1:
                        jobs = _a.sent();
                        return [2 /*return*/, jobs.map(function (j) { return ({
                                id: j.id,
                                data: j.data,
                                error: j.failedReason,
                                attempts: j.attemptsMade,
                                timestamp: j.finishedOn
                            }); })];
                }
            });
        });
    };
    /**
     * Retry a failed job
     */
    AutomationQueueManager.prototype.retryJob = function (jobId) {
        return __awaiter(this, void 0, void 0, function () {
            var job, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.queue)
                            return [2 /*return*/, false];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, this.queue.getJob(jobId)];
                    case 2:
                        job = _a.sent();
                        if (!job)
                            return [2 /*return*/, false];
                        return [4 /*yield*/, job.retry()];
                    case 3:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 4:
                        error_3 = _a.sent();
                        console.error('Failed to retry job:', error_3);
                        return [2 /*return*/, false];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Cleanup queue resources
     */
    AutomationQueueManager.prototype.close = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.worker) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.worker.close()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        if (!this.queue) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.queue.close()];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        if (!this.redis) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.redis.quit()];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6:
                        this.isInitialized = false;
                        return [2 /*return*/];
                }
            });
        });
    };
    AutomationQueueManager.prototype.getCircuitBreakerState = function () {
        return this.circuitBreaker.getMetrics();
    };
    AutomationQueueManager.prototype.isReady = function () {
        return this.isInitialized && this.queue !== null;
    };
    return AutomationQueueManager;
}());
// Singleton instance
var queueManager = null;
function getAutomationQueue() {
    if (!queueManager) {
        queueManager = new AutomationQueueManager();
    }
    return queueManager;
}
function initializeAutomationQueue() {
    return __awaiter(this, void 0, void 0, function () {
        var queue;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    queue = getAutomationQueue();
                    return [4 /*yield*/, queue.initialize()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
