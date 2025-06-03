const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'internships.json');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Ensure data directory exists
async function ensureDataFile() {
    try {
        await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
        try {
            await fs.access(DATA_FILE);
        } catch {
            await fs.writeFile(DATA_FILE, '[]');
        }
    } catch (error) {
        console.error('Error setting up data file:', error);
    }
}

// API Routes
app.get('/api/internships', async (req, res) => {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        res.status(500).json({ error: 'Failed to read internships' });
    }
});

app.post('/api/internships', async (req, res) => {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        const internships = JSON.parse(data);
        const newInternship = {
            id: Date.now().toString(),
            ...req.body,
            createdAt: new Date().toISOString()
        };
        internships.push(newInternship);
        await fs.writeFile(DATA_FILE, JSON.stringify(internships, null, 2));
        res.status(201).json(newInternship);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create internship' });
    }
});

// Clear all data endpoint - must come before the :id route
app.delete('/api/internships', async (req, res) => {
    try {
        await fs.writeFile(DATA_FILE, '[]');
        res.status(200).json({ message: 'All internships cleared successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to clear internships' });
    }
});

// Individual internship routes
app.delete('/api/internships/:id', async (req, res) => {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        let internships = JSON.parse(data);
        internships = internships.filter(i => i.id !== req.params.id);
        await fs.writeFile(DATA_FILE, JSON.stringify(internships, null, 2));
        res.status(200).json({ message: 'Internship deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete internship' });
    }
});

app.patch('/api/internships/:id', async (req, res) => {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        let internships = JSON.parse(data);
        const index = internships.findIndex(i => i.id === req.params.id);
        if (index === -1) {
            return res.status(404).json({ error: 'Internship not found' });
        }
        internships[index] = { ...internships[index], ...req.body };
        await fs.writeFile(DATA_FILE, JSON.stringify(internships, null, 2));
        res.json(internships[index]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update internship' });
    }
});

// Initialize and start server
ensureDataFile().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
}); 
