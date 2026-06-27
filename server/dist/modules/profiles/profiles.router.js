"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.profilesRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../../middleware/auth");
const errors_1 = require("../../lib/errors");
const validate_1 = require("../../lib/validate");
const svc = __importStar(require("./profiles.service"));
exports.profilesRouter = (0, express_1.Router)();
exports.profilesRouter.use(auth_1.requireAuth);
exports.profilesRouter.get('/kpis', async (req, res, next) => {
    try {
        (0, errors_1.ok)(res, await svc.getDashboardKpis((0, auth_1.getOrgId)(req)));
    }
    catch (e) {
        next(e);
    }
});
exports.profilesRouter.get('/', async (req, res, next) => {
    try {
        const orgId = (0, auth_1.getOrgId)(req);
        const q = (0, validate_1.validateQuery)(validate_1.paginationSchema.extend({
            health: zod_1.z.string().optional(), search: zod_1.z.string().optional(),
        }), req);
        const opts = { health: q.health, search: q.search, page: q.page ?? 1, pageSize: q.pageSize ?? 20 };
        const { profiles, total } = await svc.listProfiles(orgId, opts);
        (0, errors_1.paginated)(res, profiles, total, q.page ?? 1, q.pageSize ?? 20);
    }
    catch (e) {
        next(e);
    }
});
exports.profilesRouter.get('/:id', async (req, res, next) => {
    try {
        (0, errors_1.ok)(res, await svc.getProfile(req.params.id, (0, auth_1.getOrgId)(req)));
    }
    catch (e) {
        next(e);
    }
});
exports.profilesRouter.post('/', async (req, res, next) => {
    try {
        const body = (0, validate_1.validateBody)(zod_1.z.object({
            displayName: zod_1.z.string().min(1).max(200), category: zod_1.z.string().optional(),
            city: zod_1.z.string().optional(), address: zod_1.z.string().optional(),
            phone: zod_1.z.string().optional(), website: zod_1.z.string().url().optional(),
        }), req);
        (0, errors_1.created)(res, await svc.createProfile((0, auth_1.getOrgId)(req), body));
    }
    catch (e) {
        next(e);
    }
});
exports.profilesRouter.patch('/:id', async (req, res, next) => {
    try {
        const body = (0, validate_1.validateBody)(zod_1.z.object({
            displayName: zod_1.z.string().min(1).max(200).optional(), category: zod_1.z.string().optional(),
            city: zod_1.z.string().optional(), phone: zod_1.z.string().optional(),
            website: zod_1.z.string().url().optional(),
        }), req);
        (0, errors_1.ok)(res, await svc.updateProfile(req.params.id, (0, auth_1.getOrgId)(req), body));
    }
    catch (e) {
        next(e);
    }
});
