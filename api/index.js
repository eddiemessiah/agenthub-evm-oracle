const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    // Send the beautiful AgentHub Landing Page
    const htmlPath = path.join(process.cwd(), 'index.html');
    try {
        const html = fs.readFileSync(htmlPath, 'utf8');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.status(200).send(html);
    } catch (e) {
        res.status(500).send('Error loading landing page: ' + e.message);
    }
};