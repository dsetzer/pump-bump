import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { config } from 'dotenv';
config();

export default async function getBalance(walletAddress: string) {
    console.log('\n=== Checking Wallet Balance ===');
    console.log('Wallet Address:', walletAddress);
    
    try {
        const connection = new Connection(String(process.env.RPC_URL), 'confirmed');
        const wallet = new PublicKey(walletAddress);
        const info = await connection.getBalance(wallet);
        let lamportBalance = info / LAMPORTS_PER_SOL;

        console.log('Raw Balance (lamports):', info);
        console.log('SOL Balance:', lamportBalance.toFixed(4), 'SOL');
        console.log('================================\n');

        return lamportBalance;
    } catch (error) {
        console.error('Error getting balance:', error);
        throw error;
    }
}
