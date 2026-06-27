"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConflictError = exports.ValidationError = exports.ForbiddenError = exports.UnauthorizedError = exports.NotFoundError = exports.AppError = void 0;
exports.ok = ok;
exports.created = created;
exports.paginated = paginated;
// ── Error classes ─────────────────────────────────────────────
class AppError extends Error {
    constructor(statusCode, message, code) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.name = 'AppError';
    }
}
exports.AppError = AppError;
class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(404, `${resource} not found`, 'NOT_FOUND');
    }
}
exports.NotFoundError = NotFoundError;
class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(401, message, 'UNAUTHORIZED');
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError {
    constructor(message = 'Forbidden') {
        super(403, message, 'FORBIDDEN');
    }
}
exports.ForbiddenError = ForbiddenError;
class ValidationError extends AppError {
    constructor(message) {
        super(400, message, 'VALIDATION_ERROR');
    }
}
exports.ValidationError = ValidationError;
class ConflictError extends AppError {
    constructor(message) {
        super(409, message, 'CONFLICT');
    }
}
exports.ConflictError = ConflictError;
// ── Response helpers ──────────────────────────────────────────
function ok(res, data, statusCode = 200) {
    return res.status(statusCode).json({ data });
}
function created(res, data) {
    return ok(res, data, 201);
}
function paginated(res, data, total, page, pageSize) {
    return res.json({
        data,
        meta: {
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        },
    });
}
