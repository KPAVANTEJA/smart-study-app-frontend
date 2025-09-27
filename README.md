# Frontend-Project
# Smart Study Planner

A web-based productivity tool designed to help students organize study schedules, track tasks, and visualize progress. The planner comes with reminders, a Pomodoro timer, mini calendar, and a progress dashboard — all stored locally, so no sign-up is needed.

---

## Features

- Add, edit, and delete study tasks with deadlines  
- Mark tasks as completed and track progress  
- Visual timeline of upcoming tasks  
- Pomodoro Timer for focused study sessions  
- Progress bar and charts for motivation  
- Mini calendar with highlighted task days  
- Badge system for milestones  
- Light & Dark mode toggle  
- Fully responsive design (works on mobile & desktop)  
- Data stored locally in the browser (no external DB needed)  

---

## Tech Stack

- Frontend: HTML5, CSS3, JavaScript (Vanilla JS)  
- Storage: Browser LocalStorage  
- Charts: Chart.js (for progress visualization)  
- Design: Responsive grid layout with custom CSS variables  

---

## System Development Approach

1. UI/UX Design – Designed with responsive layout for desktop & mobile  
2. Task Management Module – Add, update, delete, complete tasks  
3. Visualization Module – Progress bar, timeline, and charts  
4. Reminder & Timer Module – Pomodoro-based timer for productivity  
5. Local Storage Integration – Save user data/tasks directly in browser  

---

## Algorithm & Deployment

### Algorithm (Task Flow)
1. Input task details (title, deadline, priority, estimated time).  
2. Store task in LocalStorage.  
3. Render task on UI (list + timeline + calendar).  
4. On completion → update status, recalculate progress, update charts.  
5. Auto-refresh badges and progress bar.  

### Deployment Steps
1. Clone the repository:  
   ```bash
   git clone https://github.com/your-username/smart-study-planner.git
