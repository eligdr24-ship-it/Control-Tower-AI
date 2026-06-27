"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleOAuthEnabled = exports.config = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.coerce.number().default(4000),
    DATABASE_URL: zod_1.z.string().min(1, 'DATABASE_URL is required'),
    DIRECT_URL: zod_1.z.string().optional(),
    JWT_SECRET: zod_1.z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    JWT_EXPIRES_IN: zod_1.z.string().default('7d'),
    CLIENT_ORIGIN: zod_1.z.string().default('http://localhost:3000'),
    LOG_LEVEL: zod_1.z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    // Phase 2 — Google OAuth (optional; routes return 501 if not set)
    GOOGLE_CLIENT_ID: zod_1.z.string().optional(),
    GOOGLE_CLIENT_SECRET: zod_1.z.string().optional(),
    GOOGLE_REDIRECT_URI: zod_1.z.string().optional(),
    // Encryption key for storing OAuth tokens: 64 hex chars (32 bytes)
    // node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
    ENCRYPTION_KEY: zod_1.z.string().optional(),
    // Phase 3
    ANTHROPIC_API_KEY: zod_1.z.string().optional(),
});
function parseConfig() {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
        console.error('❌ Invalid environment variables:');
        result.error.issues.forEach(issue => {
            console.error(`   ${issue.path.join('.')}: ${issue.message}`);
        });
        process.exit(1);
    }
    return result.data;
}
exports.config = parseConfig();
exports.googleOAuthEnabled = Boolean(exports.config.GOOGLE_CLIENT_ID) &&
    Boolean(exports.config.GOOGLE_CLIENT_SECRET) &&
    Boolean(exports.config.GOOGLE_REDIRECT_URI);
