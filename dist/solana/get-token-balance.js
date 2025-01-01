"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = getTokenBalance;
const web3_js_1 = require("@solana/web3.js");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
async function getTokenBalance(tokenAccount) {
    console.log('\n=== Checking Token Balance ===');
    console.log('Token Account:', tokenAccount);
    try {
        const connection = new web3_js_1.Connection(String(process.env.RPC_URL), 'confirmed');
        const account = await connection.getParsedAccountInfo(new web3_js_1.PublicKey(tokenAccount));
        if (!account.value) {
            console.log('No token account found');
            return 0;
        }
        const parsedData = account.value.data.parsed;
        const balance = parsedData.info.tokenAmount.uiAmount;
        console.log('Token Balance:', balance);
        console.log('Token Decimals:', parsedData.info.tokenAmount.decimals);
        console.log('================================\n');
        return balance;
    }
    catch (error) {
        console.error('Error getting token balance:', error);
        throw error;
    }
}
