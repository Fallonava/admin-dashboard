"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
var client_1 = require("@prisma/client");
var pg_1 = require("pg");
var adapter_pg_1 = require("@prisma/adapter-pg");
// Validate all required env vars on first import (throws if missing)
require("./env");
// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices
// ─── Soft-Delete Extension ───────────────────────────────────────────────────
// Intercepts read/delete queries on Doctor, Shift, and User:
//   - Reads: automatically appends `where: { deletedAt: null }`
//   - Deletes: convert hard-delete to soft-delete (set deletedAt = now())
//
// To bypass (e.g. admin restore): use `(prisma as any).$executeRawUnsafe(...)`
// or an explicit query without going through the extended client.
// ─────────────────────────────────────────────────────────────────────────────
var addSoftDelete = function (client) {
    return client.$extends({
        query: {
            doctor: {
                findMany: function (_a) {
                    var args = _a.args, query = _a.query;
                    return query(__assign(__assign({}, args), { where: __assign({ deletedAt: null }, args.where) }));
                },
                findFirst: function (_a) {
                    var args = _a.args, query = _a.query;
                    return query(__assign(__assign({}, args), { where: __assign({ deletedAt: null }, args.where) }));
                },
                findFirstOrThrow: function (_a) {
                    var args = _a.args, query = _a.query;
                    return query(__assign(__assign({}, args), { where: __assign({ deletedAt: null }, args.where) }));
                },
                count: function (_a) {
                    var args = _a.args, query = _a.query;
                    return query(__assign(__assign({}, args), { where: __assign({ deletedAt: null }, args.where) }));
                },
                delete: function (_a) {
                    return __awaiter(this, arguments, void 0, function (_b) {
                        var args = _b.args;
                        return __generator(this, function (_c) {
                            return [2 /*return*/, client.doctor.update(__assign(__assign({}, args), { data: { deletedAt: new Date() } }))];
                        });
                    });
                },
                deleteMany: function (_a) {
                    return __awaiter(this, arguments, void 0, function (_b) {
                        var args = _b.args;
                        return __generator(this, function (_c) {
                            return [2 /*return*/, client.doctor.updateMany(__assign(__assign({}, args), { data: { deletedAt: new Date() } }))];
                        });
                    });
                },
            },
            shift: {
                findMany: function (_a) {
                    var args = _a.args, query = _a.query;
                    return query(__assign(__assign({}, args), { where: __assign({ deletedAt: null }, args.where) }));
                },
                findFirst: function (_a) {
                    var args = _a.args, query = _a.query;
                    return query(__assign(__assign({}, args), { where: __assign({ deletedAt: null }, args.where) }));
                },
                findFirstOrThrow: function (_a) {
                    var args = _a.args, query = _a.query;
                    return query(__assign(__assign({}, args), { where: __assign({ deletedAt: null }, args.where) }));
                },
                count: function (_a) {
                    var args = _a.args, query = _a.query;
                    return query(__assign(__assign({}, args), { where: __assign({ deletedAt: null }, args.where) }));
                },
                delete: function (_a) {
                    return __awaiter(this, arguments, void 0, function (_b) {
                        var args = _b.args;
                        return __generator(this, function (_c) {
                            return [2 /*return*/, client.shift.update(__assign(__assign({}, args), { data: { deletedAt: new Date() } }))];
                        });
                    });
                },
                deleteMany: function (_a) {
                    return __awaiter(this, arguments, void 0, function (_b) {
                        var args = _b.args;
                        return __generator(this, function (_c) {
                            return [2 /*return*/, client.shift.updateMany(__assign(__assign({}, args), { data: { deletedAt: new Date() } }))];
                        });
                    });
                },
            },
            user: {
                findMany: function (_a) {
                    var args = _a.args, query = _a.query;
                    return query(__assign(__assign({}, args), { where: __assign({ deletedAt: null }, args.where) }));
                },
                findFirst: function (_a) {
                    var args = _a.args, query = _a.query;
                    return query(__assign(__assign({}, args), { where: __assign({ deletedAt: null }, args.where) }));
                },
                findFirstOrThrow: function (_a) {
                    var args = _a.args, query = _a.query;
                    return query(__assign(__assign({}, args), { where: __assign({ deletedAt: null }, args.where) }));
                },
                count: function (_a) {
                    var args = _a.args, query = _a.query;
                    return query(__assign(__assign({}, args), { where: __assign({ deletedAt: null }, args.where) }));
                },
                delete: function (_a) {
                    return __awaiter(this, arguments, void 0, function (_b) {
                        var args = _b.args;
                        return __generator(this, function (_c) {
                            return [2 /*return*/, client.user.update(__assign(__assign({}, args), { data: { deletedAt: new Date() } }))];
                        });
                    });
                },
                deleteMany: function (_a) {
                    return __awaiter(this, arguments, void 0, function (_b) {
                        var args = _b.args;
                        return __generator(this, function (_c) {
                            return [2 /*return*/, client.user.updateMany(__assign(__assign({}, args), { data: { deletedAt: new Date() } }))];
                        });
                    });
                },
            },
        },
    });
};
var prismaClientSingleton = function () {
    var connectionString = "".concat(process.env.DATABASE_URL);
    var pool = new pg_1.Pool({
        connectionString: connectionString,
        max: 20, // Connection pool size: maximum 20 connections
        idleTimeoutMillis: 10000, // Close idle connections after 10 seconds to free up DB resources
        connectionTimeoutMillis: 5000, // Return an error after 5 seconds if connection could not be established
    });
    var adapter = new adapter_pg_1.PrismaPg(pool);
    var base = new client_1.PrismaClient({ adapter: adapter });
    return addSoftDelete(base);
};
var globalForPrisma = globalThis;
exports.prisma = (_a = globalForPrisma.prisma) !== null && _a !== void 0 ? _a : prismaClientSingleton();
if (process.env.NODE_ENV !== 'production')
    globalForPrisma.prisma = exports.prisma;
