require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
// const geminiRoutes = require('./routes/geminiRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('client'));
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

app.use('/api/users', userRoutes);
// app.use('/api/gemini', geminiRoutes);

// Root route
app.get('/', (req, res) => {
    res.send('Server is running!');
});


// Endpoint to handle generating content
app.post('/api/generate-content', async (req, res) => {
    const { userMessage } = req.body;

    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'API key is not set' });
    }

    try {
        // Dynamically import node-fetch
        const fetch = (await import('node-fetch')).default;

        // Send request to Gemini API using the API key from the environment variables
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    role: 'user',
                    parts: [{ text: userMessage }]
                }]
            }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error.message);

        // Respond with the data from Gemini API
        res.status(200).json(data);
    } catch (error) {
        // Log the error for debugging purposes
        console.error(error);
        // Handle errors and respond with a generic error message
        res.status(500).json({ error: 'An error occurred while generating content' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
