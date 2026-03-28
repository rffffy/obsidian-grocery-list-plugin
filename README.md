# Grocery List — Obsidian Plugin

A simple, persistent grocery list embedded directly inside your notes.

Add a grocery list to any note using a single fenced code block. Items are saved automatically and persist across sessions. The list lives inside your note, so it syncs wherever your vault syncs.

---

## Features

- **Persistent lists** — items are saved to your vault and survive restarts
- **Quick-add suggestions** — items you've added before appear as one-click pills so you can re-add them instantly
- **Quantity control** — adjust the quantity of each item with `−` and `+` buttons (session only, not saved)
- **Filter suggestions** — typing in the input field filters the "Add again" pills in real time
- **Remove from suggestions** — permanently remove items from your suggestion history
- **Clear checked** — remove all ticked items from the list in one click
- **Light and dark mode** — fully adapts to Obsidian's theme using CSS variables

---

## Usage

Add the following code block to any note:

````markdown
```grocery
```
````

Switch to **Reading view** or **Live Preview** and the interactive grocery list will appear inline. On first render, a unique list ID is automatically written into the code block — this is how the list knows which items belong to it.

### Adding items

Type an item name into the input field and press **Enter** or click **Add**. The item is added to the list and saved immediately.

### Checking items off

Click the checkbox next to any item to mark it as done. Checked items are visually dimmed with a strikethrough. Click again to uncheck.

### Adjusting quantity

Each item has a `−` and `+` button to set the quantity. Quantities are session-only and are not saved — they reset when you reload the plugin.

### Removing items

Click the red **×** button on the right of any item to remove it from the list. This does not remove it from your suggestion history.

### Add again (suggestions)

Below the list, an **Add again** section shows items from your suggestion history that are not currently in the list. Click any pill to instantly re-add it.

As you type in the input field, the suggestions filter in real time to match what you're typing.

To permanently remove an item from suggestions, click the red **×** on its pill.

### Clear checked

Once you have checked items, a **Clear checked** button appears at the bottom. Clicking it removes all checked items from the list at once. They remain in your suggestion history.

---

## How data is stored

All data is saved in your vault at:

```
.obsidian/plugins/grocery-list/data.json
```

Two things are stored:

- **`library`** — every item name you have ever added, used to power the suggestion pills
- **`lists`** — each grocery list keyed by its auto-generated ID, containing the item names and their checked state

Because this file lives inside your vault, it syncs automatically if you use iCloud, Obsidian Sync, or any other vault sync solution.

---

## Installation

### Manual installation

1. Download `main.js` and `manifest.json` from the latest release
2. Create a folder at `<your-vault>/.obsidian/plugins/grocery-list/`
3. Copy both files into that folder
4. Open Obsidian → **Settings → Community Plugins** → reload and enable **Grocery List**

### Building from source

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode (rebuilds on save)
npm run dev
```

---

## Author

Made by [Raafay Alam](https://github.com/raafayalam)
