const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/analyze-image', async (req, res) => {
  try {
    const { imageUrl, date } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ error: 'Geen afbeelding ontvangen' });
    }

    console.log('Sending request to OpenAI API');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "chatgpt-4o-latest",
        messages: [
          {
            role: "user",
            content: [
              { 
                type: "text", 
                text: "Geef een korte omschrijving van het gerecht of drankje op de foto en schat het aantal calorieën. Antwoord in het volgende format: 'Omschrijving: [omschrijving]. Calorieën: [aantal]'" 
              },
              { 
                type: "image_url", 
                image_url: { url: imageUrl }
              }
            ]
          }
        ],
        max_tokens: 300
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', response.status, JSON.stringify(errorData, null, 2));
      throw new Error(`OpenAI API responded with status ${response.status}: ${errorData.error.message}`);
    }

    const data = await response.json();
    console.log('OpenAI API response:', JSON.stringify(data, null, 2));

    const content = data.choices[0].message.content;
    const [descriptionPart, caloriesPart] = content.split('Calorieën:');
    const description = descriptionPart.replace('Omschrijving:', '').trim();
    const calories = parseInt(caloriesPart.trim());

    res.json({ description, calories });
  } catch (error) {
    console.error('Error in /analyze-image:', error);
    res.status(500).json({ error: 'Er is een fout opgetreden bij het analyseren van de afbeelding', details: error.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server draait op poort ${PORT}`);
});