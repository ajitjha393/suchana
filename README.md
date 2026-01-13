# Suchana - A simplified Notifications Dashboard

This project implements a Notifications Dashboard as per the functional requirements, using Angular 14 (TypeScript) for the frontend and a Node.js + Express (TypeScript) mock API for the backend.

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