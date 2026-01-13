# Suchana - A simplified Notifications Dashboard

This project implements a Notifications Dashboard as per the functional requirements, using Angular 14 (TypeScript) for the frontend and a Node.js + Express (TypeScript) mock API for the backend.

<hr>

### Quick Demonstration: 



https://github.com/user-attachments/assets/c34a1519-13fa-41b1-89f1-650817007b01

<br>

<hr>

### ✨ Features Implemented

#### Core Requirements

- View a list of notifications

   - Displays title, message, type, timestamp, read/unread state

- Filter notifications

    - Filter by notification type (info / warning / error / success)

- Search notifications

  - Search across title, message, and category

- Pagination

  - Server-side pagination

  - UI pagination using Angular Material paginator

- Mark as read / unread

  - Individual notification actions

- Delete notifications

  - Individual delete action

- Unread count

  - Displayed in the header and kept in sync

- Empty states

  - Proper UI handling for:
    - No notifications
    - No results after filter/search
    - Loading and error states

- Responsive UI

   - Desktop and mobile-friendly layout using Angular Material

- State management

  - Centralized store using `RxJS (vm$ view-model pattern)`
  - Clean separation of UI and business logic


<hr>


### 🚀 Bonus Features

#### **Bulk actions**

- Select notifications (per page)
- Bulk mark as read / unread
- Bulk delete selected notifications
- “Delete all” support


#### **Real-time notifications (Bonus branch)**

- Implemented using Server-Sent Events (SSE)
- Live notifications pushed from server to UI
- Automatic UI refresh when new notifications arrive

<hr>

<br>

### 🌐 Real-time Notifications (Bonus)

Real-time functionality is implemented in a separate branch:

```
feat-real-time-notifs
```

### Why Server-Sent Events (SSE)?

Notifications are one-way (server → client) only

SSE is:

- Simpler than WebSockets
- Built-in browser support
- Automatically reconnects

Better architectural choice for notification streams where the client does not need to send messages back

In this branch:

- Server emits notifications at intervals (demo-limited)
- Client subscribes via EventSource
- UI updates live without manual refresh

<br>
<hr>


### 🧩 Tech Stack
***Frontend***

- Angular 14
- TypeScript
- Angular Material
- RxJS (state management via ViewModel pattern)

***Backend***

- Node.js
- Express
- TypeScript
- In-memory mock data store
- REST APIs + SSE stream

<br>
<hr>

### How to run locally

#### 1. Start the backend Server: 

```
cd server
npm install
npm run dev
```

```
It will be running at localhost:4000
```

#### 2. Start the Angular frontend: 

```
cd notifications-app
npm install
npm run start
```
```
Suchana App will be running at localhost:4000
```


<hr>
<br>

## 🏗️ Architecture Decisions

### 💻 The Tech Stack & Logic
I prioritized a clean, lightweight, and scalable architecture by making a few key trade-offs:

- **Angular 14 + Material**:  Chosen for speed and accessibility. It allowed me to focus on logic rather than reinventing the wheel on UI components.

- **RxJS ViewModel (vm$)**: I skipped the overhead of NgRx. Instead, I used a custom RxJS store pattern. This keeps the state predictable and easy to debug without the boilerplate of a massive library.

- **Server-Sent Events (SSE)**: Since notifications are one-way (Server → Client), I opted for SSE over WebSockets. It’s lighter, more reliable for this use case, and much easier to maintain.

- **Real-World API Design**: Even though the backend is a mock Express server, I implemented server-side pagination and filtering to simulate how a production-grade app actually handles data at scale.



### 🧠 Challenges & "Aha!" Moments
- **State vs. UI**: Handling bulk actions and filters simultaneously can get messy. Centralizing everything into a single ViewModel (vm$) made the UI logic much easier to reason about.

- **CSS Flexbox Hurdles**: Getting a fixed-height scroll to work perfectly across different screen sizes required some deep-diving into flexbox edge cases—specifically managing min-height: 0 to prevent layout breaks.

- **Ordering Routes**: I hit some early conflicts with Express routes (like /all vs /:id). I fixed this by refining the endpoint hierarchy and avoiding ambiguous patterns.



### 🚀 Scaling & Next Steps
 If this were heading to a production environment tomorrow, here’s how I’d level it up:

- **Better Data Persistence**: Swap the in-memory mock for a real database like PostgreSQL or MongoDB.

- **Testing**: Build out a robust suite of unit and integration tests for the store and API.

- **Enhanced Real-Time**: As the user base grows, I’d move to a dedicated event system and potentially upgrade to WebSockets if we need two-way communication.

- **UX Polish**: Add confirmation dialogs for bulk deletes and persist user preferences (like "dark mode" or "items per page") across sessions.