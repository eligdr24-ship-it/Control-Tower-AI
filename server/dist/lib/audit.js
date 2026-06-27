"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeAuditLog = writeAuditLog;
const prisma_1 = require("../db/prisma");
const logger_1 = require("./logger");
async function writeAuditLog(params) {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await prisma_1.prisma.auditLog.create({ data: params });
    }
    catch (err) {
        logger_1.logger.error('Failed to write audit log', { err, params });
    }
}
