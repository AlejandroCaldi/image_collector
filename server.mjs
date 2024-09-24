import express from 'express';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import archiver from 'archiver';
import bodyParser from 'body-parser';
import mysql from 'mysql2/promise'; // Import mysql2 with promise support

// Initialize express app
const app = express();
const port = 443;


// MySQL client setup
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "Amallas12.",
  database: "scraper"
};

const pool = mysql.createPool(dbConfig);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); 

// Route for the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint for registration
app.post("/register", async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await pool.query(
      "SELECT * FROM usuarios WHERE usuario = ?",
      [email]
    );

    if (rows.length > 0) {
      return res.status(400).json({ message: "El usuario ya existe" });
    }

    await pool.query(
      "INSERT INTO usuarios (usuario, password, VALUES (?, ?)",
      [email, password, new Date()]
    );

    res.status(200).json({ message: "Registro exitoso" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error del servidor" });
  }
});

// Endpoint for login
app.post("/login", async (req, res) => {
  console.log("Login attempt:", req.body); // Log the incoming request body

  const { email, password } = req.body;

  try {
    const [rows] = await pool.query("SELECT * FROM scraper.usuarios WHERE usuario = ?", [
      email,
    ]);

    console.log("Query result:", rows); // Log the result of the query

    if (rows.length === 0) {
      return res.status(400).json({ message: "El usuario no existe." });
    }

    if (rows[0].password !== password) {
      return res.status(400).json({ message: "Password is incorrect" });
    }

    res.status(200).json({ message: "Succesful login", redirectTo: "/scraper.html" });
  } catch (error) {
    console.error("Database error:", error); // Log any database errors
    res.status(500).json({ message: "Server error" });
  }
});


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function replaceAfterChar(str, char) {
    const index = str.indexOf(char);
    if (index === -1) {
        return str;
    }
    return str.substring(0, index);
}

function ensureJpgExtension(filename) {
    if (!filename.includes('.')) {
        return `${filename}.jpg`;
    }
    return filename;
}

function sanitizeFilename(filename) {
    return filename.replace(/[\/\\?%*:|"<>]/g, '_');
}

app.post('/scrape', async (req, res) => {
    const { urls } = req.body;

    if (!urls || !urls.length) {
        return res.status(400).json({ error: 'At least one URL is required' });
    }

    const downloadDir = path.join(__dirname, 'fotos/' + );
    const zipDir = path.join(__dirname, 'zips');
    console.log('downloadDir:', downloadDir);

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

                console.log(`Downloading ${imageUrl} to ${imageFilePath}`); // Debug line

                return new Promise((resolve, reject) => {
                    const writer = fs.createWriteStream(imageFilePath);
                    imageResponse.data.pipe(writer);
                    writer.on('finish', () => {
                        console.log(`Downloaded ${imageFilePath}`); // Debug line
                        resolve();
                    });
                    writer.on('error', reject);
                });
            } catch (error) {
                console.error(`Error downloading image ${imageUrl}:`, error);
            }
        });

        await Promise.all(downloadPromises);

        // Check the downloaded files
        fs.readdir(downloadDir, (err, files) => {
            if (err) {
                console.error('Error reading download directory:', err);
            } else {
                console.log('Files in download directory:', files);
            }
        });

        // Create ZIP file in a different directory
        const zipPath = path.join(zipDir, 'fotos.zip');
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
            console.log(`ZIP file has been finalized and the output file descriptor has closed. Total bytes: ${archive.pointer()}`);

            fs.access(zipPath, fs.constants.F_OK, (err) => {
                if (err) {
                    console.error('ZIP file does not exist:', zipPath);
                    res.status(404).json({ error: 'ZIP file not found' });
                } else {
                    res.download(zipPath, 'fotos.zip', (err) => {
                        if (err) {
                            console.error('Error sending file:', err);
                            res.status(500).json({ error: 'Error sending file' });
                        } else {
                            fs.unlink(zipPath, (unlinkErr) => {
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
