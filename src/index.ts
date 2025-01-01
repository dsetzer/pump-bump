import { config } from 'dotenv';
config();
import BumpCommand from './command/bump-command';

async function main() {
    try {
        console.log('Starting Pump Bump Trading Bot...');
        
        // Get command line arguments
        const args = process.argv.slice(2);
        const command = args[0]?.toLowerCase();

        // Initialize bot with configuration from environment variables
        const bumper = new BumpCommand();

        // Handle different commands
        switch (command) {
            case 'liquidate':
                console.log('Liquidating all tokens...');
                await bumper.liquidate();
                break;
            
            case 'bump':
            case undefined:
                console.log('Starting bump trading...');
                await bumper.main();
                break;
            
            default:
                console.log('Invalid command. Available commands:');
                console.log('  - bump (default): Start bump trading');
                console.log('  - liquidate: Sell all tokens and return SOL to wallet');
                process.exit(1);
        }
        
        console.log('Operation completed successfully');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

// Handle any unhandled promise rejections
main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
