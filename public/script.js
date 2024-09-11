// Selecteer de benodigde elementen uit de DOM
const foodListElement = document.getElementById('food-list');
const totalCaloriesElement = document.getElementById('total-calories');
const imageForm = document.getElementById('image-form');
const removeLastItemBtn = document.getElementById('remove-last-item-btn');

// Functie om de lijst van etenswaren bij te werken
function updateFoodList(foodList, totalCalories) {
  // Leeg de lijst voordat deze opnieuw gevuld wordt
  foodListElement.innerHTML = '';

  // Loop door elk item in de lijst en voeg het toe aan de UI
  foodList.forEach(food => {
    const listItem = document.createElement('li');
    listItem.textContent = `${food.description} - ${food.calories} calorieën`;
    foodListElement.appendChild(listItem);
  });

  // Werk het totale aantal calorieën bij
  totalCaloriesElement.textContent = totalCalories;
}

// Functie voor het verzenden van een afbeelding voor analyse
imageForm.addEventListener('submit', async (e) => {
  e.preventDefault(); // Voorkom de standaard form submission

  const imageUrl = document.getElementById('image-url').value;

  try {
    const response = await fetch('/analyze-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ imageUrl })
    });

    const data = await response.json();

    if (response.ok) {
      alert(`Toegevoegd: ${data.description} - ${data.calories} calorieën`);
      updateFoodList([...data.foodList], data.totalCalories);  // Veronderstelt dat de backend de hele lijst retourneert
    } else {
      alert(`Fout bij toevoegen: ${data.error}`);
    }
  } catch (error) {
    console.error('Er is een fout opgetreden:', error);
    alert('Er is iets misgegaan bij het toevoegen van het eten.');
  }
});

// Functie voor het verwijderen van het laatst toegevoegde item
removeLastItemBtn.addEventListener('click', async () => {
  try {
    const response = await fetch('/remove-last-item', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (response.ok) {
      alert(`Laatst toegevoegde item verwijderd: ${data.removedItem.description}`);
      updateFoodList([...data.foodList], data.totalCalories);  // Veronderstelt dat de backend de hele lijst retourneert
    } else {
      alert(`Fout bij verwijderen: ${data.error}`);
    }
  } catch (error) {
    console.error('Er is een fout opgetreden:', error);
    alert('Er is iets misgegaan bij het verwijderen van het item.');
  }
});