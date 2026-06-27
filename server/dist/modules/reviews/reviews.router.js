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
exports.reviewsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../../middleware/auth");
const errors_1 = require("../../lib/errors");
const validate_1 = require("../../lib/validate");
const svc = __importStar(require("./reviews.service"));
exports.reviewsRouter = (0, express_1.Router)();
exports.reviewsRouter.use(auth_1.requireAuth);
exports.reviewsRouter.get('/', async (req, res, next) => {
    try {
        const orgId = (0, auth_1.getOrgId)(req);
        const q = (0, validate_1.validateQuery)(validate_1.paginationSchema.extend({ status: zod_1.z.string().optional(), profileId: zod_1.z.string().optional() }), req);
        const { reviews, total } = await svc.listReviews(orgId, { status: q.status, profileId: q.profileId, page: q.page ?? 1, pageSize: q.pageSize ?? 20 });
        (0, errors_1.paginated)(res, reviews, total, q.page ?? 1, q.pageSize ?? 20);
    }
    catch (e) {
        next(e);
    }
});
exports.reviewsRouter.post('/:id/reply', async (req, res, next) => {
    try {
        const orgId = (0, auth_1.getOrgId)(req);
        const userId = req.user?.sub ?? 'demo-user-id';
        const body = (0, validate_1.validateBody)(zod_1.z.object({ text: zod_1.z.string().min(1).max(4000), isAiDraft: zod_1.z.boolean().default(false) }), req);
        (0, errors_1.ok)(res, await svc.createReply(req.params.id, orgId, userId, body.text, body.isAiDraft === true));
    }
    catch (e) {
        next(e);
    }
});
exports.reviewsRouter.patch('/:id/status', async (req, res, next) => {
    try {
        const orgId = (0, auth_1.getOrgId)(req);
        const body = (0, validate_1.validateBody)(zod_1.z.object({ status: zod_1.z.string() }), req);
        (0, errors_1.ok)(res, await svc.updateReviewStatus(req.params.id, orgId, body.status));
    }
    catch (e) {
        next(e);
    }
});
