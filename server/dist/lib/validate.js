"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginationSchema = void 0;
exports.validate = validate;
exports.validateBody = validateBody;
exports.validateQuery = validateQuery;
const zod_1 = require("zod");
const errors_1 = require("./errors");
function validate(schema, data) {
    const result = schema.safeParse(data);
    if (!result.success) {
        const message = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
        throw new errors_1.ValidationError(message);
    }
    return result.data;
}
function validateBody(schema, req) { return validate(schema, req.body); }
function validateQuery(schema, req) { return validate(schema, req.query); }
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    pageSize: zod_1.z.coerce.number().int().min(1).max(100).default(20),
}).required();
