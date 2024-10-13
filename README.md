# Chemical Translator

Welcome to the **Chemical Translator**! This website helps you translate chemical names into their respective formulas (and vice versa).

## Getting Started

### How to Use

1. **Enter a Chemical Name or Formula**: Type in a chemical name (like "Water") or its formula (like "H2O") in the input box.
   
2. **Click "Translate"**: Hit the button to get your translation.

3. **Language Translation**: You can choose whether you want to see the translated name in Arabic by toggling the "Show Translated" checkbox.

### File Structure
```
Folder Structure:
|
|- index.html       # The main HTML file
|- script.js        # The JavaScript that makes everything work
```

## How It Works

- The website uses the **PubChem API** to fetch compound data based on user input.
- It checks if the input is a chemical formula or name and retrieves the necessary details.
- If the input matches a chemical name or formula, you’ll see the translation and its formatted formula. If not, it’ll let you know that the compound wasn’t found.

## 🌐 APIs Used

- **PubChem API**: For accessing chemical information by name or formula.
- **MyMemory Translation API**: To provide translations to Arabic when selected.

## 💡 Features

- Input validation to ensure meaningful requests.
- Pretty spinner while waiting for the results.
- Responsive design for a (hopefully) smooth experience on most devices.

## ⚠️ Troubleshooting

- **Slow Responses**: Sometimes, the API might take a bit longer to respond. Just wait for the spinner to do its thing!
