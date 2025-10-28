# 🚗 Vehicle Movement Map (Frontend Only)

A web-based simulation showing a vehicle moving on a map using **Leaflet.js** and **dummy GPS data**.
This project displays real-time movement updates, coordinates, elapsed time, and path visualization.

## ✅ No Backend Required
Everything runs on frontend only. GPS data is loaded from `dummy-route.json`.

---

## 📌 Features

✔ Map rendering using Leaflet.js  
✔ Car icon moves along route every few seconds  
✔ Shows GPS coordinates during movement  
✔ Route drawn visually on the map  
✔ Start / Pause / Reset buttons  
✔ Dummy route data stored locally

---

## 🗂 Project Structure

project-folder/
│
├── index.html
├── styles.css
├── app.js
├── dummy-route.json
└── assets/
    └── vehicle.svg

---

## 🛠 Installation & Setup

### ✅ Option 1 — Python Local Server (Recommended)

```bash
cd project-folder
python -m http.server 5173
```

Then open in browser:

http://localhost:5173

### ✅ Option 2 — VS Code Live Server

Right-click `index.html` → "Open with Live Server"

---

## ▶️ How to Use

1. Load the webpage in browser
2. Click **Play** button to start vehicle movement
3. View vehicle information panel:
   - GPS Latitude & Longitude
   - Timestamp
   - Speed (m/s)
   - Elapsed time
4. Pause anytime, or press Reset to restart journey

---

## 📡 Data Source

Dummy GPS route stored locally in `dummy-route.json`

---

## 🎯 Learning Outcomes

- Leaflet map integration
- Updating marker positions in real-time
- Working with simulated GPS data
- Creating UI controls with JavaScript
- Styling with CSS

---

## 🧪 Future Enhancements

- Backend live GPS tracking
- Speed & distance analytics
- Multi-vehicle tracking
- Dark mode UI
