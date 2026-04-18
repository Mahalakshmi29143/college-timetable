# 📅 AI College Scheduler

An intelligent timetable generator built using React that automatically creates conflict-free academic schedules.

Features

✅ Automatic timetable generation
🤖 AI-powered document scanner (Gemini API)
🧠 Smart scheduling logic (no clashes)
🧪 Lab session handling (3-hour blocks)
📊 Multi-year support (1st–4th Year)
🔄 Dynamic UI updates
📥 Export timetable as image
🖨️ Print-friendly layout

Tech Stack

React.js
Tailwind CSS
Gemini AI API
html2canvas
Lucide Icons

Preview
<img width="1137" height="660" alt="Screenshot 2026-04-18 083505" src="https://github.com/user-attachments/assets/e3bba30d-119a-4746-8502-d030c0e72b3c" />

<img width="1138" height="664" alt="Screenshot 2026-04-18 083533" src="https://github.com/user-attachments/assets/97b7dcaf-5553-4615-9623-919bb8f9d685" />

<img width="1139" height="423" alt="Screenshot 2026-04-18 083610" src="https://github.com/user-attachments/assets/5a40dba7-52d7-4dc4-9f9d-49ec1616e77b" />







How It Works

1. Add staff manually OR upload allocation sheet
2. Define constraints (optional)
3. Click **Generate Master Plan**
4. View timetable by year
5. Export or print timetable

Key Logic

Prevents faculty clashes across years
Limits subject repetition per day
Automatically assigns lab blocks
Fills empty slots with self-study

Installation

```bash
npm install
npm start
