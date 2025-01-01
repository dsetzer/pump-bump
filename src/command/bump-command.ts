//import PumpFunTrader from '@degenfrends/solana-pumpfun-trader';
import getBalance from '../solana/get-balance';
import getTokenAccount from '../solana/get-token-account';
import getTokenBalance from '../solana/get-token-balance';
import { DEFAULT_DECIMALS, PumpFunSDK } from 'pumpdotfun-sdk';
import { AnchorProvider } from '@coral-xyz/anchor';
import { Wallet } from "@coral-xyz/anchor";
import { config } from 'dotenv';
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, Transaction, VersionedTransaction, TransactionConfirmationStrategy } from '@solana/web3.js';
import bs58 from 'bs58';
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from '@solana/spl-token';
config();

export default class BumpCommand {
    private bumperPrivateKey: string;
    private mintAddress: string;
    private walletAddress: string;
    private provider: AnchorProvider;
    private sdk: PumpFunSDK;
    private adaptiveInterval: number = 10; // Default interval in seconds
    private readonly SLIPPAGE_BASIS_POINTS: bigint = 100n;
    private readonly MAX_RETRIES: number = 3;
    private readonly UNIT_LIMIT: number = 250000;
    private readonly UNIT_PRICE: number = 250000;
    private readonly MIN_BUY_AMOUNT: number = 0.01;
    private readonly BUY_PERCENTAGE: number = 0.1;
    private readonly SELL_PERCENTAGE: number = 0.3; // Sell 30% at a time
    private readonly MIN_BUYS_BEFORE_SELL: number = 4; // Wait for at least 4 buys before selling
    private readonly MAX_BUYS_BEFORE_SELL: number = 8; // Force sell after 8 buys
    private buysCount: number = 0;
    private retryCount: number = 0;

    constructor() {
        // Check for required environment variables
        if (!process.env.WALLET_PRIVATE_KEY) {
            throw new Error('WALLET_PRIVATE_KEY is required in .env file');
        }
        if (!process.env.TOKEN_MINT_ADDRESS) {
            throw new Error('TOKEN_MINT_ADDRESS is required in .env file');
        }

        // Handle private key that might be in array format
        let privateKey = process.env.WALLET_PRIVATE_KEY;
        if (privateKey.startsWith('[') && privateKey.endsWith(']')) {
            try {
                const privateKeyArray = JSON.parse(privateKey);
                const uint8Array = new Uint8Array(privateKeyArray);
                privateKey = bs58.encode(uint8Array);
            } catch (e) {
                throw new Error('Invalid private key format');
            }
        }

        // Derive public key from private key
        const keypair = Keypair.fromSecretKey(
            new Uint8Array(JSON.parse(process.env.WALLET_PRIVATE_KEY))
        );
        this.walletAddress = keypair.publicKey.toString();
        
        console.log('\n=== Wallet Information ===');
        console.log('Using wallet address:', this.walletAddress);
        console.log('================================\n');

        this.bumperPrivateKey = privateKey;
        this.mintAddress = process.env.TOKEN_MINT_ADDRESS;
        this.provider = this.getProvider();
        this.sdk = new PumpFunSDK(this.provider);
    }

    private getProvider = (): AnchorProvider => {
        if (!process.env.RPC_URL) {
            throw new Error('Please set RPC_URL in .env file');
        }

        const connection = new Connection(process.env.RPC_URL, {
            commitment: 'confirmed'
        });
        
        const wallet = new Wallet(new Keypair());
        return new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
    };

    private async buyTokens(sdk: PumpFunSDK, testAccount: Keypair, mint: PublicKey, solAmount: number): Promise<boolean> {
        try {
            // Convert SOL to lamports and round to ensure we have an integer
            const lamports = Math.round(solAmount * LAMPORTS_PER_SOL);
            console.log(`Converting ${solAmount} SOL to ${lamports} lamports`);
            
            const buyResults = await sdk.buy(
                testAccount,
                mint,
                BigInt(lamports),
                this.SLIPPAGE_BASIS_POINTS,
                {
                    unitLimit: this.UNIT_LIMIT,
                    unitPrice: this.UNIT_PRICE
                }
            );
            console.log('Buy results:', buyResults);
            return buyResults.success;
        } catch (error) {
            console.error('Error executing buy order:', error);
            return false;
        }
    }

    private async sellTokens(sdk: PumpFunSDK, testAccount: Keypair, mint: PublicKey, tokenAmount: number): Promise<boolean> {
        try {
            const sellResults = await sdk.sell(
                testAccount,
                mint,
                BigInt(tokenAmount * Math.pow(10, DEFAULT_DECIMALS)),
                this.SLIPPAGE_BASIS_POINTS,
                {
                    unitLimit: this.UNIT_LIMIT,
                    unitPrice: this.UNIT_PRICE
                }
            );
            return sellResults.success;
        } catch (error) {
            console.error('Error executing sell order:', error);
            return false;
        }
    }

    async main(): Promise<void> {
        console.log('\n=== Starting Bump Trading Operation ===');
        console.log('Wallet Address:', this.walletAddress);
        console.log('Token Mint:', this.mintAddress);
        console.log('RPC URL:', process.env.RPC_URL);
        
        try {
            let tokenAccount = await getTokenAccount(this.walletAddress, this.mintAddress);
            
            if (!tokenAccount) {
                console.log('No token account found. Creating associated token account...');
                try {
                    // Create keypair from private key
                    const keypair = Keypair.fromSecretKey(
                        new Uint8Array(JSON.parse(process.env.WALLET_PRIVATE_KEY))
                    );

                    // Get associated token account address
                    const associatedTokenAddress = await getAssociatedTokenAddress(
                        new PublicKey(this.mintAddress),
                        keypair.publicKey
                    );

                    // Create the account
                    const transaction = new Transaction().add(
                        createAssociatedTokenAccountInstruction(
                            keypair.publicKey,
                            associatedTokenAddress,
                            keypair.publicKey,
                            new PublicKey(this.mintAddress)
                        )
                    );

                    // Convert to VersionedTransaction
                    const latestBlockhash = await this.provider.connection.getLatestBlockhash();
                    transaction.recentBlockhash = latestBlockhash.blockhash;
                    transaction.feePayer = keypair.publicKey;
                    
                    const versionedTransaction = new VersionedTransaction(
                        transaction.compileMessage()
                    );
                    versionedTransaction.sign([keypair]);

                    const signature = await this.provider.connection.sendTransaction(
                        versionedTransaction
                    );

                    await this.provider.connection.confirmTransaction({
                        signature,
                        blockhash: latestBlockhash.blockhash,
                        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
                    });
                    console.log('Token account created successfully!');
                    tokenAccount = associatedTokenAddress.toString();
                } catch (error) {
                    console.error('Error creating token account:', error);
                    throw error;
                }
            }

            const balance = await getBalance(this.walletAddress);
            console.log('Current SOL Balance:', balance.toFixed(4), 'SOL');

            if (tokenAccount) {
                const tokenBalance = await getTokenBalance(tokenAccount);
                console.log('Current Token Balance:', tokenBalance);
            }

            await this.executeBump();
        } catch (error) {
            console.error('Error in main operation:', error);
            throw error;
        }
    }

    async executeBump(): Promise<void> {
        console.log('\n=== Starting Bump Execution ===');
        console.log('Initial Settings:');
        console.log('Buy Percentage:', this.BUY_PERCENTAGE * 100 + '%');
        console.log('Min Buy Amount:', this.MIN_BUY_AMOUNT, 'SOL');
        console.log('Slippage:', this.SLIPPAGE_BASIS_POINTS.toString(), 'basis points');

        const tokenAccount = await getTokenAccount(this.walletAddress, this.mintAddress);

        // Initialize market monitoring
        setInterval(async () => {
            await this.calculateOptimalInterval();
        }, 30 * 1000);

        // Main trading loop with dynamic interval
        const executeBump = async () => {
            try {
                await this.bump(tokenAccount);
                this.retryCount = 0; // Reset retry count on success
            } catch (error) {
                console.error('Error in trading cycle:', error);
                if (this.retryCount < this.MAX_RETRIES) {
                    this.retryCount++;
                    console.log(`Retrying... Attempt ${this.retryCount} of ${this.MAX_RETRIES}`);
                } else {
                    console.error('Max retries reached. Waiting for next interval.');
                    this.retryCount = 0;
                }
            }
            setTimeout(executeBump, this.adaptiveInterval * 1000);
        };

        executeBump();
    }

    private async bump(tokenAccount: string | undefined): Promise<void> {
        if (!tokenAccount) {
            console.warn('No token account found');
            return;
        }

        console.log('Bumping token:', tokenAccount);
        const walletPrivateKey = await Keypair.fromSecretKey(
            new Uint8Array(bs58.decode(this.bumperPrivateKey))
        );

        // Calculate dynamic buy amount
        const solIn = await this.calculateBuyAmount();
        if (solIn <= 0) {
            throw new Error('Invalid buy amount calculated');
        }

        let tokenBalance = await getTokenBalance(tokenAccount);
        console.log('Current token balance:', tokenBalance);
            
        // Decide whether to buy or sell
        const shouldSell = this.buysCount >= this.MIN_BUYS_BEFORE_SELL && 
            (this.buysCount >= this.MAX_BUYS_BEFORE_SELL || Math.random() < 0.3); // 30% chance to sell if we're past minimum buys

        if (shouldSell && tokenBalance > 0) {
            console.log(`Selling ${this.SELL_PERCENTAGE * 100}% of tokens after ${this.buysCount} buys`);
            const sellAmount = Math.floor(tokenBalance * this.SELL_PERCENTAGE);
            
            if (sellAmount > 0) {
                console.log('Selling token amount:', sellAmount);
                const sellSuccess = await this.sellTokens(
                    this.sdk,
                    walletPrivateKey,
                    new PublicKey(this.mintAddress),
                    sellAmount
                );
                
                if (!sellSuccess) {
                    throw new Error('Sell operation failed');
                }
                console.log('Sell operation successful');
                this.buysCount = 0; // Reset buy counter after successful sell
            }
        } else {
            // Buy operation
            console.log('Buying token with dynamic amount:', solIn);
            const buySuccess = await this.buyTokens(
                this.sdk,
                walletPrivateKey,
                new PublicKey(this.mintAddress),
                solIn
            );

            if (!buySuccess) {
                throw new Error('Buy operation failed');
            }
            console.log('Buy operation successful');
            this.buysCount++;
        }
    }

    private async calculateOptimalInterval(): Promise<void> {
        try {
            // Get token account info
            const connection = this.provider.connection;
            const mintPubKey = new PublicKey(this.mintAddress);
            
            // Get token supply info
            const tokenSupply = await connection.getTokenSupply(mintPubKey);
            const supply = Number(tokenSupply.value.amount) / Math.pow(10, tokenSupply.value.decimals);
            
            // Get recent token balance changes as a proxy for liquidity
            const tokenAccounts = await connection.getTokenLargestAccounts(mintPubKey);
            const totalHoldings = tokenAccounts.value.reduce((acc, account) => 
                acc + Number(account.amount), 0);
            
            // Calculate liquidity score based on supply distribution
            const liquidityScore = (totalHoldings / Math.pow(10, tokenSupply.value.decimals)) / supply;
            
            // Adjust interval based on liquidity score
            if (liquidityScore > 0.5) {
                // High concentration of tokens (lower liquidity)
                // Use longer intervals to avoid congestion in thin liquidity
                this.adaptiveInterval = 30; // 30 seconds
            } else if (liquidityScore > 0.3) {
                // Medium distribution
                // Moderate frequency for balanced approach
                this.adaptiveInterval = 20; // 20 seconds
            } else {
                // Well distributed (higher liquidity)
                // More frequent trades but still maintaining reasonable spacing
                this.adaptiveInterval = 15; // 15 seconds
            }

            console.log(`Liquidity score: ${liquidityScore}`);
            console.log(`Adjusted interval to ${this.adaptiveInterval} seconds`);
            
        } catch (error) {
            console.error('Error calculating optimal interval:', error);
            // Fallback to default interval - using conservative approach
            this.adaptiveInterval = 20;
        }
    }

    private async calculateBuyAmount(): Promise<number> {
        try {
            const connection = this.provider.connection;
            
            // Use the actual wallet address instead of provider's wallet
            const walletPublicKey = new PublicKey(this.walletAddress);

            // Get wallet's current SOL balance
            const balanceLamports = await connection.getBalance(walletPublicKey);
            const balanceSol = balanceLamports / LAMPORTS_PER_SOL;

            // Use 10% of the wallet balance for trading
            const buyAmount = balanceSol * this.BUY_PERCENTAGE;

            console.log('\n=== Buy Amount Calculation ===');
            console.log('Wallet Balance:', balanceSol.toFixed(4), 'SOL');
            console.log('Buy Percentage:', (this.BUY_PERCENTAGE * 100) + '%');
            console.log('Calculated Buy Amount:', buyAmount.toFixed(4), 'SOL');
            console.log('Minimum Buy Amount:', this.MIN_BUY_AMOUNT, 'SOL');
            console.log('Final Buy Amount:', Math.max(buyAmount, this.MIN_BUY_AMOUNT).toFixed(4), 'SOL');
            console.log('================================\n');

            // Ensure minimum buy amount
            return Math.max(buyAmount, this.MIN_BUY_AMOUNT);
        } catch (error) {
            console.error("Error calculating buy amount:", error);
            return 0;
        }
    }
}
