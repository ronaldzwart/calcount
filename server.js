const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
require('dotenv').config(); // Zorg ervoor dat de omgevingsvariabelen correct geladen worden

const app = express();

// Lijst om toegevoegde etenswaren bij te houden in het geheugen
let foodList = [];

// Zorg ervoor dat de server statische bestanden kan serveren vanuit de "public" map
app.use(express.static(path.join(__dirname, 'public')));

// Stel de server in om JSON-verzoeken te accepteren
app.use(express.json({ limit: '10mb' }));

// Route om afbeeldingen te analyseren
app.post('/analyze-image', async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ error: 'Geen afbeelding ontvangen' });
    }

    // Verzend een verzoek naar de OpenAI API om de afbeelding te analyseren
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "user",
            content: `Geef een korte omschrijving van het gerecht of drankje op de foto en schat het aantal calorieën.`
          }
        ],
        max_tokens: 300
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API fout:', response.status, errorData);
      return res.status(response.status).json({ error: 'Er is iets misgegaan bij de analyse van de afbeelding' });
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Simpele parsing van de OpenAI respons (kan aangepast worden afhankelijk van hoe de API antwoordt)
    const [descriptionPart, caloriesPart] = content.split('Calorieën:');
    const description = descriptionPart.replace('Omschrijving:', '').trim();
    const calories = parseInt(caloriesPart.trim());

    // Voeg het eten en de calorieën toe aan de foodList
    foodList.push({ description, calories });

    // Bereken het totaal aantal calorieën
    const totalCalories = foodList.reduce((sum, food) => sum + food.calories, 0);

    res.json({ description, calories, foodList, totalCalories });
  } catch (error) {
    console.error('Fout in /analyze-image:', error);
    res.status(500).json({ error: 'Er is een fout opgetreden bij het analyseren van de afbeelding' });
  }
});

// Route om het laatst toegevoegde item te verwijderen
app.post('/remove-last-item', (req, res) => {
  if (foodList.length === 0) {
    return res.status(400).json({ error: 'Geen items om te verwijderen' });
  }

  const removedItem = foodList.pop(); // Verwijder het laatste item
  const totalCalories = foodList.reduce((acc, item) => acc + item.calories, 0); // Herbereken totale calorieën

  res.json({
    message: 'Laatst toegevoegde item verwijderd',
    removedItem,
    foodList,
    totalCalories
  });
});

// Route voor alle andere verzoeken (zorgt ervoor dat de index.html geladen wordt bij root route)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Zet de server aan op de aangegeven poort (of gebruik 8080 als geen poort is ingesteld)
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server draait op poort ${PORT}`);
});