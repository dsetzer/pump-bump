# Pump Bump - A pump.fun Automated Trading Bot

A command-line tool for automated trading on pump.fun platform with advanced features and dynamic trading capabilities.

![Static Badge](https://img.shields.io/badge/status-active-green)

> [!WARNING]
> **RUG PULL RISK**: This bot provides NO PROTECTION against rug pulls, which are EXTREMELY common on pump.fun. If a rug pull occurs:
> - Your entire investment will likely be lost
> - The bot cannot detect or prevent rug pulls
> - There is no way to recover lost funds
> 
> Only trade with funds you are willing to lose completely. Rug pulls can happen at any time without warning.

> [!CAUTION] 
> This is experimental software. Use at your own risk. Never use your main wallet with this bot, as you'll need to expose your private key. Always use a fresh wallet with only the funds you intend to trade.

## Features
* Smart Dynamic Trading
  * Automatic buy amounts based on wallet balance
  * Adaptive trading intervals (2-8 seconds) based on market conditions
  * Price increase streak monitoring
  * Market activity and liquidity scoring
* Advanced Sell Strategy
  * Dynamic sell percentages (25-80%) based on market activity
  * Intelligent profit-taking after 2-5 buy cycles
  * Increased sell likelihood on consecutive price increases
* Risk Management
  * Configurable slippage protection
  * Transaction retry mechanism
  * Unit and price limits
  * Minimum buy amount protection
* Market Analysis
  * Real-time price monitoring
  * Volume and liquidity tracking
  * Automatic market activity scoring
* Helius RPC support for reliable transactions

## Requirements
* NodeJS Version >= 20 ([Download here](https://nodejs.org/))
* A dedicated Solana wallet for trading
* Helius RPC endpoint ([Get API key](https://dev.helius.xyz/))

## Required Keys and Addresses

### Wallet Setup
1. Create a new Solana wallet specifically for trading (DO NOT use your main wallet)
2. Export your wallet's private key:
   - In Phantom: Settings → Security & Privacy → Export Private Key
   - In Solflare: Settings → Security → Export Private Key
3. Your wallet address is your public key, visible in your wallet as "Receive" address

### Token Mint Address
The token mint address can be found in the URL when viewing the token on pump.fun:
```
https://pump.fun/token/[TOKEN_MINT_ADDRESS]
```
Copy the mint address from the URL - this is what you'll use for `TOKEN_MINT_ADDRESS`.

### Helius RPC URL
1. Sign up at [Helius](https://dev.helius.xyz/)
2. Create a new API key
3. Use the provided RPC URL in this format:
```
https://mainnet.helius-rpc.com/?api-key=YOUR-API-KEY
```

> [!CAUTION]
> Never share your private key or API keys with anyone. Keep them secure and never commit them to version control.

## Installation

Clone the repository:
```bash
git clone https://github.com/dsetzer/pump-bump.git pump-bump
cd pump-bump
```

Install dependencies:
```bash
pnpm install
```

## Building and Packaging

### Development Build
To build the TypeScript code:
```bash
pnpm run build
```

To run in development mode with auto-reload:
```bash
pnpm run dev
```

### Creating an Executable
The bot can be packaged into a standalone executable:
```bash
pnpm run package
```
This will:
1. Build the TypeScript code
2. Package the application into an executable
3. Copy the configuration template
4. Output everything to the `executable` directory

The packaged executable includes all dependencies and can be run without Node.js installed.

## Configuration
1. Copy the example environment file:
```bash
mv .env.example .env
```

2. Configure the following parameters in `.env`:
```python
# Required Command Arguments
WALLET_PRIVATE_KEY="your-private-key-here"
TOKEN_MINT_ADDRESS="token-mint-address-here"
WALLET_ADDRESS="your-wallet-address-here"

# Trading Parameters
BUY_PERCENTAGE=0.1                # Percentage of wallet balance per trade (0.1 = 10%)
MIN_BUY_AMOUNT=0.01              # Minimum SOL amount per trade
MAX_RETRIES=3                    # Maximum transaction retry attempts

# Trading Intervals (seconds)
MIN_INTERVAL=2                   # Minimum trading interval
MAX_INTERVAL=8                   # Maximum trading interval
DEFAULT_INTERVAL=4               # Default trading interval

# Market Activity Thresholds
VOLUME_THRESHOLD=1000            # Minimum volume threshold
PRICE_CHANGE_THRESHOLD=0.05      # Price change threshold (0.05 = 5%)

# Transaction Parameters
SLIPPAGE_BASIS_POINTS=100        # Slippage tolerance (100 = 1%)
PRIORITY_FEE=0                   # Priority fee in SOL (if needed)

# Trading Limits
UNIT_LIMIT=250000               # Maximum units per trade
UNIT_PRICE=250000               # Maximum price per unit

# Sell Strategy Configuration
MAX_SELL_PERCENTAGE=0.8         # Maximum sell percentage (80%)
BASE_SELL_PERCENTAGE=0.4        # Base sell percentage (40%)
MIN_SELL_PERCENTAGE=0.25        # Minimum sell percentage (25%)
MIN_BUYS_BEFORE_SELL=2         # Minimum buys before allowing sells
MAX_BUYS_BEFORE_SELL=5         # Force sell after this many buys

# RPC Configuration
RPC_URL="https://mainnet.helius-rpc.com/?api-key=YOUR-API-KEY"
```

> [!NOTE]
> - The bot uses dynamic buy amounts based on your wallet balance
> - Trading intervals automatically adjust based on market conditions
> - Sell percentages adapt to market activity and price movements
> - Priority fees are optional and were not needed in testing
> - A Helius RPC endpoint is recommended for reliable transaction execution

## Usage

Run the bot with:
```bash
node dist/index.js --walletAddress=YOUR_WALLET_ADDRESS --tokenAddress=TOKEN_MINT_ADDRESS
```

If your configuration is not in the `.env` file, include it as arguments:
```bash
node dist/index.js --privateKey=YOUR_PRIVATE_KEY --walletAddress=YOUR_WALLET_ADDRESS --tokenAddress=TOKEN_MINT_ADDRESS
```

To stop the bot, press `Ctrl+C` in the terminal.

## Advanced Features

### Dynamic Trading
- Buy amounts automatically adjust based on wallet balance (default 10%)
- Trading intervals vary between 2-8 seconds based on:
  - Market liquidity score
  - Price increase streaks
  - Overall market activity
- Transactions are monitored and retried on failure (up to 3 times)

### Smart Sell Strategy
- Base sell percentage: 40% of holdings
- Adjusts between 25-80% based on:
  - Market activity score
  - Price increase streaks
  - Trading volume
- Forces sells after:
  - 5 consecutive buys
  - 3 consecutive price increases
  - High market activity detection

### Market Monitoring
- Real-time price tracking
- Liquidity scoring based on token supply distribution
- Market activity scoring (0-1 range)
- Volume threshold monitoring
- Price change streak detection

### Emergency Liquidation
The bot includes an emergency liquidation function that can be triggered to sell all holdings immediately if needed.

## Issues and Support
If you encounter any issues, please open an issue in the GitHub repository with detailed information about the problem.
