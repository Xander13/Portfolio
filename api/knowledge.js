import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // Looks for knowledgeTree.json in your root or private folder safely off the public map
    const filePath = path.join(process.cwd(), 'knowledgeTree.json');
    const fileData = fs.readFileSync(filePath, 'utf8');
    const knowledgeData = JSON.parse(fileData);

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(knowledgeData);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load knowledge data' });
  }
}