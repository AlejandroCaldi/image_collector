import express from 'express';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import archiver from 'archiver';
import bodyParser from 'body-parser';
import pkg from 'pg'; 
const { Pool } = pkg;
import cors from 'cors';

// Initialize express app
const app = express();
const port = 443;

// PostgreSQL client setup
const dbConfig = {
    connectionString: "postgres://default:ZfS2amTwrB4N@ep-sweet-lab-a4qm3jrc.us-east-1.aws.neon.tech:5432/verceldb?sslmode=require",
};

const pool = new Pool(dbConfig);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

// Route for the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint for registration
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  console.log("Register data:", req.body);

  try {
      const { rows } = await pool.query(
          "SELECT * FROM usuarios WHERE usuario = $1",
          [username]
      );

      console.log("User query result:", rows);

      if (rows.length > 0) {
          return res.status(400).json({ message: "User already exists" });
      }

      await pool.query(
          "INSERT INTO usuarios (usuario, email, password) VALUES ($1, $2, $3)",
          [username, email, password]
      );

      res.status(200).json({ message: "User Registration Successful" });
  } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Server Error" });
  }
});

// Endpoint for login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("Login attempt:", req.body);

  try {
      const { rows } = await pool.query("SELECT usuario, password FROM usuarios WHERE usuario = $1", [email]);

      console.log("Query result:", rows);

      if (rows.length === 0) {
          return res.status(400).json({ message: "User does not exist." });
      }

      if (rows[0].password !== password) {
          return res.status(400).json({ message: "Password is incorrect" });
      }

      res.status(200).json({
          message: "Successful login",
          username: rows[0].usuario,
          redirectTo: `/scraper.html?username=${encodeURIComponent(rows[0].usuario)}`,
      });

  } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({ message: "Server error" });
  }
});

// Function to replace a character in a string
function replaceAfterChar(str, char) {
    const index = str.indexOf(char);
    if (index === -1) {
        return str;
    }
    return str.substring(0, index);
}

// Function to ensure JPG extension
function ensureJpgExtension(filename) {
    if (!filename.includes('.')) {
        return `${filename}.jpg`;
    }
    return filename;
}

// Function to sanitize a filename
function sanitizeFilename(filename) {
    return filename.replace(/[\/\\?%*:|"<>]/g, '_');
}

// Endpoint to scrape images
app.post('/scrape', async (req, res) => {
    const { urls } = req.body;

    if (!urls || !urls.length) {
        return res.status(400).json({ error: 'At least one URL is required' });
    }

    // Fetch username from query parameter
    const username = req.query.username; // Ensure this line exists
    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    const fotosPath = `fotos/${username}`;
    const zipPath = `zips/${username}`;

    const downloadDir = path.join(__dirname, fotosPath);
    const zipDir = path.join(__dirname, zipPath);
    console.log('downloadDir:', downloadDir);
    console.log('zipDir:', zipDir);

    if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, { recursive: true });
    }

    if (!fs.existsSync(zipDir)) {
        fs.mkdirSync(zipDir, { recursive: true });
    }

    const allImageUrls = [];
    const imageUrls = [];
    try {
        for (const url of urls) {
            const response = await fetch(url);
            const html = await response.text();
            const $ = cheerio.load(html);

            $('img').each((index, element) => {
                try {
                    const src = $(element).attr('src');
                    if (src) {
                        const fullUrl = new URL(src, url).href;
                        imageUrls.push(fullUrl);
                    } else {
                        console.warn('Image src attribute is missing for element:', element);
                    }
                } catch (error) {
                    console.error('Error processing image src:', error);
                }
            });

            allImageUrls.push(...imageUrls);
        }

        const downloadPromises = allImageUrls.map(async (imageUrl) => {
            try {
                const imageResponse = await axios({
                    url: imageUrl,
                    responseType: 'stream'
                });

                let parsedUrl = new URL(imageUrl);
                let imageFileName = path.basename(parsedUrl.pathname);
                imageFileName = replaceAfterChar(imageFileName, '?');
                imageFileName = sanitizeFilename(imageFileName);
                imageFileName = ensureJpgExtension(imageFileName);
                const imageFilePath = path.join(downloadDir, imageFileName);

                // Debug line
                return new Promise((resolve, reject) => {
                    const writer = fs.createWriteStream(imageFilePath);
                    imageResponse.data.pipe(writer);
                    writer.on('finish', () => {
                        resolve();
                    });
                    writer.on('error', reject);
                });
            } catch (error) {
                console.error(`Error downloading image ${imageUrl}:`, error);
            }
        });

        await Promise.all(downloadPromises);

        // Create ZIP file in a different directory
        const zipFilePath = path.join(zipDir, 'fotos.zip');
        const output = fs.createWriteStream(zipFilePath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
            console.log(`ZIP file has been finalized. Total bytes: ${archive.pointer()}`);

            fs.access(zipFilePath, fs.constants.F_OK, (err) => {
                if (err) {
                    console.error('ZIP file does not exist:', zipFilePath);
                    return res.status(404).json({ error: 'ZIP file not found' });
                } else {
                    res.download(zipFilePath, 'fotos.zip', (err) => {
                        if (err) {
                            console.error('Error sending file:', err);
                            return res.status(500).json({ error: 'Error sending file' });
                        } else {
                            // Delete the downloaded images folder after sending the ZIP file
                            fs.rm(downloadDir, { recursive: true, force: true }, (unlinkErr) => {
                                if (unlinkErr) {
                                    console.error('Error deleting folder:', unlinkErr);
                                } else {
                                    console.log(`Folder ${downloadDir} deleted successfully.`);
                                }
                            });

                            // Also delete the ZIP file after sending
                            fs.unlink(zipFilePath, (unlinkErr) => {
                                if (unlinkErr) {
                                    console.error('Error deleting ZIP file:', unlinkErr);
                                }
                            });
                        }
                    });
                }
            });
        });

        archive.on('error', (err) => {
            throw err;
        });

        archive.pipe(output);
        archive.directory(downloadDir, false);
        archive.finalize();

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to scrape and download images' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
});
