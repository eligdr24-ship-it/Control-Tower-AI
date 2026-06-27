"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
const errors_1 = require("../lib/errors");
const logger_1 = require("../lib/logger");
function errorHandler(err, req, res, _next) {
    if (err instanceof errors_1.AppError) {
        res.status(err.statusCode).json({ error: { code: err.code ?? 'ERROR', message: err.message } });
        return;
    }
    if (err instanceof zod_1.ZodError) {
        res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details: err.issues } });
        return;
    }
    // Prisma unique constraint / not found — detect by error code property
    if (err && typeof err === 'object' && 'code' in err) {
        const prismaErr = err;
        if (prismaErr.code === 'P2002') {
            res.status(409).json({ error: { code: 'CONFLICT', message: 'A record with that value already exists.' } });
            return;
        }
        if (prismaErr.code === 'P2025') {
            res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Record not found.' } });
            return;
        }
    }
    logger_1.logger.error('Unhandled error', { err, method: req.method, path: req.path });
    res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred. Please try again.' },
    });
}
