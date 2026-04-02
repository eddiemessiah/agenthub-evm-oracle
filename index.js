const express = require('express');
const path = require('path');
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// x402 Protocol Configuration
const X402_PRICE = "1.00";
const X402_CURRENCY = "USDC";
const X402_NETWORK = "base";
const X402_ADDRESS = process.env.PAYMENT_ADDRESS || "0x0000000000000000000000000000000000000000"; // Replace with actual Coinbase CDP wallet address

app.post('/api/v1/audit', (req, res) => {
    const { contractAddress, chainId } = req.body;

    if (!contractAddress || !chainId) {
        return res.status(400).json({ error: "Missing contractAddress or chainId in request body" });
    }

    // Check for payment receipt (transaction hash)
    // The x402 specification typically expects the client to provide proof of payment
    const paymentReceipt = req.headers['x402-receipt'];

    if (!paymentReceipt) {
        // Return standard 402 Payment Required x402 headers
        res.set({
            'x402-payment-required': 'true',
            'x402-price': X402_PRICE,
            'x402-currency': X402_CURRENCY,
            'x402-network': X402_NETWORK,
            'x402-address': X402_ADDRESS
        });
        
        return res.status(402).json({
            error: "Payment Required",
            message: `This is a paid x402 service. Please pay ${X402_PRICE} ${X402_CURRENCY} on ${X402_NETWORK} to ${X402_ADDRESS} and include the transaction hash in the 'x402-receipt' header.`,
            paymentDetails: {
                price: X402_PRICE,
                currency: X402_CURRENCY,
                network: X402_NETWORK,
                address: X402_ADDRESS
            }
        });
    }

    // Stub: In a production environment, verify the paymentReceipt (transaction hash) 
    // on the specified network (Base) to ensure it was sent to X402_ADDRESS, 
    // matches the required amount, and hasn't been used before.
    
    // Stub: Actual audit logic would go here
    const mockAuditResponse = {
        contractAddress,
        chainId,
        riskScore: 85, // Scale of 0-100 (100 being highest risk)
        status: "Audit completed",
        vulnerabilities: [
            {
                severity: "High",
                type: "Reentrancy",
                description: "Potential reentrancy vulnerability detected in the 'withdraw' function. Consider implementing the Checks-Effects-Interactions pattern or a ReentrancyGuard."
            },
            {
                severity: "Medium",
                type: "Unchecked External Call",
                description: "External call return value is not checked on line 142. Execution may proceed even if the call fails."
            }
        ],
        paymentReceiptProvided: paymentReceipt
    };

    return res.status(200).json(mockAuditResponse);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`AgentHub EVM Security Risk Oracle listening on port ${PORT}`);
    console.log(`x402 Payment Config: ${X402_PRICE} ${X402_CURRENCY} on ${X402_NETWORK}`);
});
