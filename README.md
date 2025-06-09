# Time Tracker App

A simple and efficient time tracking application built with React, TailwindCSS, Vite, and Supabase for backend and authentication. This app allows users to clock in and out, track weekly and monthly work hours, add notes, and generate PDF reports of their time logs.

---

## Features

- **User Authentication:** Secure signup, login, and session management using Supabase Auth.
- **Clock In/Clock Out:** Track multiple work sessions per day with precise timestamps.
- **Automatic 8-Hour Clock-Out:** To prevent unclosed sessions, the app automatically clocks you out after 8 hours of continuous clock-in time.
- **Daily Notes:** Add notes to each clock-out event to record details or reflections about the work session.
- **Weekly Reset:** Weekly summaries reset every Sunday at 11:59 PM, aligning reports to a Sunday–Saturday workweek.
- **Weekly & Monthly Reports:** Generate and download PDF reports summarizing logged hours and notes.
- **Time Zone Awareness:** All timestamps and calculations respect the user's local timezone.
- **Responsive UI:** Clean, modern interface built with TailwindCSS to work across devices.
- **Real-Time Sync:** Leverages Supabase’s real-time features for instant updates on logs and notes.

---

## Tech Stack

| Technology         | Purpose                            |
| ------------------ | -----------------------------------|
| React              | Frontend UI                        |
| TailwindCSS        | Styling and layout                 |
| Vite               | Development server and build tool  |
| Supabase           | Backend (Auth, Database, Realtime) |
| pdf-lib            | PDF report generation              |
| Recharts           | Data visualization (charts)        |

---

## Live Demo

Try the app live at: [https://fpfrances-time-tracker.vercel.app/](https://fpfrances-time-tracker.vercel.app/)

---