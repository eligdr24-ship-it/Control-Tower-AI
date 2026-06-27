"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = requestLogger;
const logger_1 = require("../lib/logger");
function requestLogger(req, res, next) {
    const start = Date.now();
    res.on('finish', () => {
        const ms = Date.now() - start;
        const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
        logger_1.logger[level](`${req.method} ${req.path} ${res.statusCode} ${ms}ms`, {
            method: req.method,
            path: req.path,
            status: res.statusCode,
            ms,
            ip: req.ip,
        });
    });
    next();
}
