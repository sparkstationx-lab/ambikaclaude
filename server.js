import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
const host = '0.0.0.0';

const distPath = path.join(__dirname, 'dist');
const staticDir = fs.existsSync(distPath) ? distPath : __dirname;

app.use(express.static(staticDir));

app.get('*', (req, res) => {
  const indexPath = fs.existsSync(distPath) ? path.join(distPath, 'index.html') : path.join(__dirname, 'index.html');
  res.sendFile(indexPath);
});

app.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}`);
});
