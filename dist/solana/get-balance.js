"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = getBalance;
const web3_js_1 = require("@solana/web3.js");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
async function getBalance(walletAddress) {
    console.log('\n=== Checking Wallet Balance ===');
    console.log('Wallet Address:', walletAddress);
    try {
        const connection = new web3_js_1.Connection(String(process.env.RPC_URL), 'confirmed');
        const wallet = new web3_js_1.PublicKey(walletAddress);
        const info = await connection.getBalance(wallet);
        let lamportBalance = info / web3_js_1.LAMPORTS_PER_SOL;
        console.log('Raw Balance (lamports):', info);
        console.log('SOL Balance:', lamportBalance.toFixed(4), 'SOL');
        console.log('================================\n');
        return lamportBalance;
    }
    catch (error) {
        console.error('Error getting balance:', error);
        throw error;
    }
}
