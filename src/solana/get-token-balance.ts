import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { config } from 'dotenv';
config();

export default async function getTokenBalance(tokenAccount: string) {
    console.log('\n=== Checking Token Balance ===');
    console.log('Token Account:', tokenAccount);

    try {
        const connection = new Connection(String(process.env.RPC_URL), 'confirmed');
        const account = await connection.getParsedAccountInfo(new PublicKey(tokenAccount));
        
        if (!account.value) {
            console.log('No token account found');
            return 0;
        }

        const parsedData = (account.value.data as any).parsed;
        const balance = parsedData.info.tokenAmount.uiAmount;
        
        console.log('Token Balance:', balance);
        console.log('Token Decimals:', parsedData.info.tokenAmount.decimals);
        console.log('================================\n');
        
        return balance;
    } catch (error) {
        console.error('Error getting token balance:', error);
        throw error;
    }
}
