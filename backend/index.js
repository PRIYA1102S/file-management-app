const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const BASE_DIR = path.join(__dirname, 'uploaded_folders');
if (!fs.existsSync(BASE_DIR)) fs.mkdirSync(BASE_DIR);

// Multer setup for folder upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folderName = req.body.folderName || req.folderName;
    if (!folderName) return cb(new Error("Missing folder name"));
    const folderPath = path.join(BASE_DIR, folderName);
    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
    cb(null, folderPath);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage });

// Upload folder (multiple files)
app.post('/upload-folder', upload.fields([
  { name: 'files', maxCount: 100 },
  { name: 'folderName', maxCount: 1 }
]), (req, res) => {
  const folderName = req.body.folderName?.[0]; 
  if (!folderName) return res.status(400).json({ error: 'Missing folder name' });
  res.json({ message: `Folder '${folderName}' uploaded successfully.` });
});


// Create file
app.post('/create-file', async (req, res) => {
  const { folderName, fileName, content } = req.body;

  if (!folderName || !fileName) {
    return res.status(400).json({ error: 'Missing folderName or fileName in request body' });
  }

  const uploadFolder = path.join(BASE_DIR, folderName);
  const filePath = path.join(uploadFolder, fileName);

  try {
    await fs.promises.mkdir(uploadFolder, { recursive: true });
    await fs.promises.writeFile(filePath, content || '');
    res.status(200).json({ message: 'File created successfully', file: fileName });
  } catch (err) {
    console.error('Error writing file:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Edit file
app.post('/edit-file', (req, res) => {
  const { folderName, fileName, content } = req.body;
  const filePath = path.join(BASE_DIR, folderName, fileName);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found.' });
  fs.writeFileSync(filePath, content, 'utf8');
  res.json({ message: 'File edited successfully.' });
});

// Delete file
app.post('/delete-file', (req, res) => {
  const { folderName, fileName } = req.body;
  const filePath = path.join(BASE_DIR, folderName, fileName);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found.' });
  fs.unlinkSync(filePath);
  res.json({ message: 'File deleted successfully.' });
});

// List files in folder
app.get('/list-files', (req, res) => {
  const { folderName } = req.query;
  const folderPath = path.join(BASE_DIR, folderName);
  if (!fs.existsSync(folderPath)) return res.status(404).json({ error: 'Folder not found.' });
  const files = fs.readdirSync(folderPath);
  res.json({ files });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 