# AgentHub: EVM Security Risk Oracle

This is the MVP for the AgentHub EVM Security Risk Oracle, a paid API service monetized via the **x402 Protocol**. It is designed for Agent-to-Agent commerce, allowing AI agents to request security audits of Ethereum Virtual Machine (EVM) smart contracts.

## How it Works

1. The service exposes a POST `/api/v1/audit` endpoint.
2. If an agent calls this endpoint without a payment receipt, the server responds with an HTTP `402 Payment Required` status and standard x402 headers detailing the payment requirements ($1.00 USDC on Base).
3. The calling agent uses its wallet (e.g., Coinbase CDP Agentic Wallet) to send $1.00 USDC to the specified address.
4. The agent retries the request, including the transaction hash in the `x402-receipt` header.
5. The Oracle verifies the payment and returns the smart contract audit results.

## Setup & Running the Server

### Prerequisites

- Node.js (v18+)
- npm

### Installation

```bash
cd agenthub/evm-oracle
npm install
```

### Running the Server

You can set a custom wallet address to receive payments via the `PAYMENT_ADDRESS` environment variable.

```bash
export PAYMENT_ADDRESS="0xYourCoinbaseWalletAddress"
node index.js
```

The server will start on port `3000` by default.

## Agentic Integration (How Agents Pay)

Agents equipped with the Coinbase CDP Agentic Wallet (`x402-coinbase` skills) can automatically discover and pay for this service. 

### Step 1: Initial Request
An agent makes a POST request to the API without payment:

```bash
curl -X POST http://localhost:3000/api/v1/audit \
  -H "Content-Type: application/json" \
  -d '{"contractAddress": "0x123...", "chainId": 8453}'
```

**Response:**
```http
HTTP/1.1 402 Payment Required
x402-payment-required: true
x402-price: 1.00
x402-currency: USDC
x402-network: base
x402-address: 0xYourCoinbaseWalletAddress

{
  "error": "Payment Required",
  "message": "This is a paid x402 service. Please pay 1.00 USDC on base..."
}
```

### Step 2: Payment Execution
The agent reads the `x402-*` headers. Using the Coinbase Agentic Wallet, the agent executes an on-chain transfer of 1.00 USDC on the Base network to the provided address.

### Step 3: Paid Request
The agent receives a transaction hash (`0xabcdef...`) from the blockchain and attaches it to the retry request using the `x402-receipt` header.

```bash
curl -X POST http://localhost:3000/api/v1/audit \
  -H "Content-Type: application/json" \
  -H "x402-receipt: 0xabcdef1234567890" \
  -d '{"contractAddress": "0x123...", "chainId": 8453}'
```

**Response:**
```http
HTTP/1.1 200 OK

{
  "contractAddress": "0x123...",
  "chainId": 8453,
  "riskScore": 85,
  "status": "Audit completed",
  "vulnerabilities": [
    {
      "severity": "High",
      "type": "Reentrancy",
      "description": "Potential reentrancy vulnerability..."
    }
  ],
  "paymentReceiptProvided": "0xabcdef1234567890"
}
```

## Future Enhancements
- Implement real-time on-chain transaction verification to ensure the `x402-receipt` corresponds to a valid, fresh $1.00 USDC transfer to the Oracle's wallet.
- Integrate a real AI agent (e.g. OpenAI/Gemini/Anthropic) to dynamically generate the contract risk assessment based on bytecode/source code.
