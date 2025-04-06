const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Missing search query' });

    const browser = await puppeteer.launch({ 
        headless: true, // Run in the background
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Set a user-agent to mimic a real browser
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36');

    try {
        // Open Bing search page
        await page.goto(`https://www.bing.com/search?q=${encodeURIComponent(query)}`, { waitUntil: 'domcontentloaded' });

        // Extract search results
        const results = await page.evaluate(() => {
            let items = [];
            document.querySelectorAll('.b_algo').forEach((el) => {
                const title = el.querySelector('h2')?.innerText || 'No title';
                const link = el.querySelector('h2 a')?.href || '#';
                const description = el.querySelector('.b_caption p')?.innerText || 'No description available';
                items.push({ title, link, description });
            });
            return items;
        });

        await browser.close();
        res.json(results.length > 0 ? results : [{ title: 'No results found', link: '#', description: 'Try another search term.' }]);
    } catch (error) {
        console.error('Scraping error:', error);
        await browser.close();
        res.status(500).json({ error: 'Failed to fetch search results' });
    }
});

app.listen(3001, () => console.log('✅ Server running on http://localhost:3001'));
