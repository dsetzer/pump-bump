"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const bump_command_1 = __importDefault(require("./command/bump-command"));
async function main() {
    try {
        console.log('Starting Pump Bump Trading Bot...');
        // Initialize bot with configuration from environment variables
        const bumper = new bump_command_1.default();
        await bumper.main();
        console.log('Bot initialized successfully');
    }
    catch (error) {
        console.error('Error initializing bot:', error);
        process.exit(1);
    }
}
// Handle any unhandled promise rejections
main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
