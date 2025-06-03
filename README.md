# Internship Tracking System

A modern, full-stack web application to help you manage and track your internship applications. Built with Node.js, Express, HTML, CSS (TailwindCSS), and JavaScript, this app provides a clean, responsive UI, dark/light mode, and insightful analytics to keep your job search organized and motivating.

---

## Features

- Add, edit, and delete internship applications
- Track company, role, platform, location, status, date applied, and notes
- Color-coded status labels (Applied, Interview, Offer, Rejected)
- Responsive UI with both **dark mode** and **light mode** (toggle in settings)
- Analytics dashboard with:
  - Application status distribution (doughnut chart)
  - Applications over time (bar chart)
  - Monthly application summary (with improved visibility in both themes)
  - Success rate by platform
- Export your data to CSV
- Clear all data with one click (from settings)
- All data stored locally in a JSON file (no external database required)
- Accessible and visually clear in both dark and light themes

---

## Tech Stack

- **Backend:** Node.js, Express
- **Frontend:** HTML, CSS (TailwindCSS), JavaScript
- **Charts:** Chart.js
- **Data Storage:** Local JSON file (`data/internships.json`)

---

## Project Structure

```
.
├── data/
│   └── internships.json         # Local data storage for applications
├── public/
│   ├── app.js                  # Main frontend logic (handles all UI and API)
│   ├── index.html              # Main dashboard and single-page app entry
│   └── styles.css              # Custom and theme styles
├── server.js                   # Express backend API and static file server
├── package.json                # Project dependencies and scripts
└── README.md                   # This file
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher recommended)
- npm (comes with Node.js)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd <your-repo-directory>
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Start the server:**
   ```bash
   npm start
   ```
4. **Open your browser:**
   Visit [http://localhost:3000](http://localhost:3000)

---

## Usage

- Use the form to add new internship applications.
- View, update, or delete applications in the "Your Applications" section.
- See analytics and trends in the dashboard below.
- Export your data to CSV for backup or analysis.
- Toggle between dark and light mode in the settings modal (top right gear icon).
- Clear all data from the settings modal if needed.

---

## API Overview

The app exposes a RESTful API at `/api/internships`:
- `GET /api/internships` — List all applications
- `POST /api/internships` — Add a new application
- `PATCH /api/internships/:id` — Update an application status or details
- `DELETE /api/internships/:id` — Delete an application
- `DELETE /api/internships` — **Clear all applications**

Data is stored locally in `data/internships.json`.

---

## Notes

- **Single Page App:** All main features are in `index.html`. Other HTML files (like `applications.html` and `analytics.html`) are not used in the current version.
- **Theme Support:** All UI elements are styled for both dark and light mode, including charts, forms, and analytics.
- **Accessibility:** Colors and contrast have been tuned for visibility in both themes.

---

## Screenshots

![Internship Tracker Screenshot](screenshot.png)

---

## License

This project is licensed under the MIT License.

---

Created by Sahil Choudhari
