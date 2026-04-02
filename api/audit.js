const { GoogleGenerativeAI } = require('@google/genai');

const X402_PRICE = "1.00";
const X402_CURRENCY = "USDC";
const X402_NETWORK = "base";
const X402_ADDRESS = process.env.PAYMENT_ADDRESS || "0x0000000000000000000000000000000000000000";

module.exports = async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { contractAddress, chainId } = req.body || {};

    if (!contractAddress || !chainId) {
        return res.status(400).json({ error: "Missing contractAddress or chainId in request body" });
    }

    const paymentReceipt = req.headers['x402-receipt'];

    if (!paymentReceipt) {
        res.setHeader('x402-payment-required', 'true');
        res.setHeader('x402-price', X402_PRICE);
        res.setHeader('x402-currency', X402_CURRENCY);
        res.setHeader('x402-network', X402_NETWORK);
        res.setHeader('x402-address', X402_ADDRESS);
        
        return res.status(402).json({
            error: "Payment Required",
            message: `This is a paid x402 service. Please pay ${X402_PRICE} ${X402_CURRENCY} on ${X402_NETWORK} to ${X402_ADDRESS} and include the transaction hash in the 'x402-receipt' header.`,
            paymentDetails: { price: X402_PRICE, currency: X402_CURRENCY, network: X402_NETWORK, address: X402_ADDRESS }
        });
    }

    // REAL EVM AUDIT LOGIC WIRED UP
    try {
        if (!process.env.GEMINI_API_KEY) {
            return res.status(200).json({
                contractAddress, chainId, riskScore: 85, status: "Mock Audit Completed (Add GEMINI_API_KEY to Vercel for real audits)",
                vulnerabilities: [{ severity: "High", type: "Reentrancy", description: "Mock reentrancy vulnerability detected." }]
            });
        }

        const scannerApiUrl = chainId === 8453 
            ? `https://api.basescan.org/api?module=contract&action=getsourcecode&address=${contractAddress}&apikey=${process.env.BASESCAN_API_KEY || ''}`
            : `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${contractAddress}&apikey=${process.env.ETHERSCAN_API_KEY || ''}`;

        const sourceRes = await fetch(scannerApiUrl);
        const sourceData = await sourceRes.json();
        
        if (sourceData.status !== "1" || !sourceData.result[0].SourceCode) {
             return res.status(400).json({ error: "Could not fetch verified source code from block explorer." });
        }

        const sourceCode = sourceData.result[0].SourceCode;

        const ai = new GoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
        
        const prompt = `You are a Senior Smart Contract Auditor. Audit the following Solidity code and return a JSON object with: 
        1. riskScore (0-100) 
        2. vulnerabilities (array of objects with 'severity', 'type', 'description'). 
        Return ONLY valid JSON.\n\nCode:\n${sourceCode.substring(0, 15000)}`;

        const model = ai.getGenerativeModel({ model: "gemini-3-pro-preview" });
        const result = await model.generateContent(prompt);
        let auditResult = result.response.text();
        
        // Strip markdown blocks
        auditResult = auditResult.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();

        const finalPayload = {
            contractAddress,
            chainId,
            status: "Audit completed successfully",
            paymentReceiptProvided: paymentReceipt,
            ...JSON.parse(auditResult)
        };

        return res.status(200).json(finalPayload);
    } catch (e) {
        console.error("Audit error:", e);
        return res.status(500).json({ error: "Audit execution failed", details: e.message });
    }
};
