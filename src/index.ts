import { config } from 'dotenv';
config();
import BumpCommand from './command/bump-command';

async function main() {
    try {
        console.log('Starting Pump Bump Trading Bot...');
        
        // Initialize bot with configuration from environment variables
        const bumper = new BumpCommand();
        await bumper.main();
        
        console.log('Bot initialized successfully');
    } catch (error) {
        console.error('Error initializing bot:', error);
        process.exit(1);
    }
}

// Handle any unhandled promise rejections
main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
