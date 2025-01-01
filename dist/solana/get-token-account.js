"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = getTokenAccount;
const web3_js_1 = require("@solana/web3.js");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
async function getTokenAccount(walletAddress, mintAddress) {
    console.log('\n=== Checking Token Account ===');
    console.log('Wallet:', walletAddress);
    console.log('Token Mint:', mintAddress);
    try {
        // Validate addresses
        try {
            new web3_js_1.PublicKey(walletAddress);
            new web3_js_1.PublicKey(mintAddress);
        }
        catch (e) {
            console.error('Invalid address format:', e.message);
            return undefined;
        }
        const connection = new web3_js_1.Connection(String(process.env.RPC_URL), 'confirmed');
        const wallet = new web3_js_1.PublicKey(walletAddress);
        const mint = new web3_js_1.PublicKey(mintAddress);
        // Get token mint info first to validate it exists
        console.log('\nValidating token on chain...');
        const mintInfo = await connection.getAccountInfo(mint);
        if (!mintInfo) {
            console.error('❌ Token mint not found on chain. Please verify the address on Solscan:');
            console.error(`https://solscan.io/token/${mintAddress}`);
            return undefined;
        }
        console.log('✓ Token exists on chain');
        console.log('\nChecking wallet...');
        const walletInfo = await connection.getAccountInfo(wallet);
        if (!walletInfo) {
            console.error('❌ Wallet not found on chain. Please verify the address on Solscan:');
            console.error(`https://solscan.io/account/${walletAddress}`);
            return undefined;
        }
        console.log('✓ Wallet exists on chain');
        console.log('\nLooking for token accounts...');
        const accounts = await connection.getParsedTokenAccountsByOwner(wallet, {
            mint: mint
        });
        console.log(`Found ${accounts.value.length} token account(s)`);
        if (!accounts.value || accounts.value.length === 0) {
            console.log('❌ No token account found for this token in your wallet');
            console.log('You need to create a token account before you can hold or trade this token');
            return undefined;
        }
        // Log all token accounts and their balances
        for (const acc of accounts.value) {
            const balance = acc.account.data.parsed.info.tokenAmount.uiAmount;
            console.log(`Token Account: ${acc.pubkey.toString()}`);
            console.log(`Balance: ${balance}`);
        }
        const tokenAccount = accounts.value[0]?.pubkey?.toString();
        console.log('\n✓ Using token account:', tokenAccount);
        console.log('================================\n');
        return tokenAccount;
    }
    catch (error) {
        console.error('Error in getTokenAccount:', error);
        throw error;
    }
}
