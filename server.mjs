import express from 'express';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('__filename:', __filename);
console.log('__dirname:', __dirname);

const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Function to remove everything after and including a specific character
function replaceAfterChar(str, char) {
    const index = str.indexOf(char);
    if (index === -1) {
        return str; // Return the original string if the character is not found
    }
    return str.substring(0, index);
}

function ensureJpgExtension(filename) {
    // Check if the filename already contains a period
    if (!filename.includes('.')) {
        // Add '.jpg' if no period is found
        return `${filename}.jpg`;
    }
    // Return the original filename if it already has an extension
    return filename;
}

// Function to sanitize filenames for the filesystem
function sanitizeFilename(filename) {
    return filename.replace(/[\/\\?%*:|"<>]/g, '_');
}

app.post('/scrape', async (req, res) => {
    const { urls } = req.body;

    if (!urls || !urls.length) {
        return res.status(400).json({ error: 'At least one URL is required' });
    }

    const downloadDir = path.join(__dirname, 'fotos');

    console.log('downloadDir:', downloadDir);

    if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, { recursive: true });
    }

    const allImageUrls = [];

    try {
        // Process each URL
        for (const url of urls) {
            const response = await fetch(url);
            const html = await response.text();
            const $ = cheerio.load(html);
            let imageUrls = [];

            $('img').each((index, element) => {
                const src = $(element).attr('src');
                console.log('Image src:', src); // Add this line to debug
            
                if (src) {
                    const fullUrl = new URL(src, url).href;
                    imageUrls.push(fullUrl);
                }
            });

            allImageUrls.push(...imageUrls);
        }

        // Download each image
        const downloadPromises = allImageUrls.map(async (imageUrl) => {
            try {
                const imageResponse = await axios({
                    url: imageUrl,
                    responseType: 'stream'
                });

                // Extract filename and sanitize
                let parsedUrl = new URL(imageUrl);
                let imageFileName = path.basename(parsedUrl.pathname);
                imageFileName = replaceAfterChar(imageFileName, '?'); // Remove query parameters from filename
                imageFileName = sanitizeFilename(imageFileName); // Sanitize the filename
                imageFileName = ensureJpgExtension(imageFileName); // add extension if needed
                const imageFilePath = path.join(downloadDir, imageFileName);
                return new Promise((resolve, reject) => {
                    const writer = fs.createWriteStream(imageFilePath);
                    imageResponse.data.pipe(writer);
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });
            } catch (error) {
                console.error(`Error downloading image ${imageUrl}:`, error);
            }
        });

        await Promise.all(downloadPromises);

        res.json({ message: 'Images downloaded successfully', imageUrls: allImageUrls });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to scrape and download images' });
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
