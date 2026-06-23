# RaceStrategist

RaceStrategist is a premium, high-performance web application designed for endurance racing teams to plan, calculate, and optimize stint strategies on the iRacing platform. Built using **Angular 20**, **Angular Signals**, and **Angular Material CDK**, the application provides real-time stint calculation, team driver management, an interactive stint timeline, and **live telemetry integration** via a multi-PC relay system.

---

## Design Philosophy & Aesthetics

RaceStrategist features a custom-built, immersive **"Midnight Track"** design system optimized for low-light endurance racing conditions:
- **Premium Glassmorphism**: Translucent cards utilizing modern CSS backdrop filters (`blur(12px)`) with subtle white borders.
- **Dynamic Micro-Animations**: Smooth entry animations (`fadeInUp`) and ripple effects to enhance interactive elements.
- **Harmonious Palette**: Focused on dark, saturated blues/blacks paired with high-contrast racing accent colors (e.g., **Racing Amber** `#FFB000` and **Track Green** `#00E676`).
- **Modern Typography**: Bold display headings using the **Michroma** font combined with highly legible body text using **Outfit**.

<img width="1029" height="1307" alt="image" src="https://github.com/user-attachments/assets/f3bbfef6-c1a3-43f5-a6c5-edea0ec7c410" />


---

## Core Features

### 1. Static Strategy Calculator
- **Event & Vehicle Catalogs**: Select preset iRacing endurance events (such as *Daytona 24h*, *Sebring 12h*, or *Nürburgring 24h*) and vehicles. The application automatically filters vehicles matching the allowed class specifications (GT3, GTP, LMP2, etc.).
<img width="1087" height="1029" alt="image" src="https://github.com/user-attachments/assets/7861479b-2503-4440-94b0-f175834d386d" />
<img width="1525" height="1296" alt="image" src="https://github.com/user-attachments/assets/13742ea0-fd06-42b4-abe1-81351a1eabe7" />
- **Dynamic Predictions**: Instantly computes maximum laps per stint, estimated stint durations, and total stints required based on fuel consumption rate and average lap times.
<img width="1469" height="704" alt="image" src="https://github.com/user-attachments/assets/77e208fa-2fc1-4f9f-96b2-ccf6a32441c2" />
- **Tank Capacity Override**: Allows quick strategy adjustment by overriding vehicle-default fuel tank capacities.

### 2. Team & Driver Roster Management
- **Centralized Roster**: Manage driver list independently of active strategies.
<img width="1551" height="937" alt="image" src="https://github.com/user-attachments/assets/c1001c5f-1b1c-44b6-b90b-5351acb407ba" />
- **Detailed Profiles**: Save profile metrics including name, nationality, license grade, iRating, role (Primary/Reserve/Coach), and custom signature colors.
<img width="1554" height="1318" alt="image" src="https://github.com/user-attachments/assets/66929f45-799f-49d1-b0c9-7af2f5e589e4" />

- **Driver-Specific Overrides**: Input custom average lap times and fuel consumption rates per driver. If left empty, the application falls back to global strategy averages.
**Roster Statistics**: Automatically tracks team performance, including average iRating computations.

### 3. Dynamic Stint Planner (Timeline)
- **Timeline Recalculation**: A ripple-effect calculation engine adjusts the entire race timeline whenever driver assignments, tyre-change toggles, or pit-lane delays are modified.
- **Tyre & Refueling Customization**: Toggle tyre changes per stint and inject extra pit lane offsets (e.g., penalties or extra service times) on the fly.
- **Drag-and-Drop Reordering**: Rearrange stint orders instantly with smooth, integrated drag-and-drop lists powered by `@angular/cdk/drag-drop`.

### 5. Live Telemetry Integration
- **Real-Time iRacing Data** — Live speed, RPM, gear, fuel level, lap times, track & air temperatures via WebSocket.
- **Multi-PC Relay** — Run the telemetry agent on the gaming PC; connect from any browser via the backend relay (`/ws/telemetry/live`).
- **Agent Token Auth** — Generate `at_` prefixed tokens from the web UI for secure agent connections.
- **HTTP Ingest** — Agents send telemetry via HTTP POST (`/api/telemetry/ingest`) to avoid WebSocket proxy issues (Railway-compatible).
- **Live Adjustments Panel** — Compares PLAN vs REAL fuel consumption, pace, and pit stop times; apply real data to recalculate remaining stints.
- **Auto-Update** — Periodically (default 30s) syncs fuel, pace, and pit data from telemetry into the strategy plan.
- **Pit Stop Detection** — Automatically detects pit entries/exits via speed threshold (<5 km/h), records durations.
- **Driver Badge** — Shows which driver/PC is sending telemetry when connected via relay.

### 6. Interactive Library & Localization
- **Strategy Library**: Save configurations, load historical strategy setups, and clear state parameters inside a local database backed by browser `localStorage`.
- **Bilingual Interface**: Full translation mapping between **English (EN)** and **Spanish (ES)**.
- **State Navigation Protection**: Route guards (`unsavedChangesGuard`) check for unsaved modifications and prompt users prior to leaving active workspace configurations.

---

## System Architecture & Data Flow

The application utilizes Angular's reactive Signals paradigm to cascade inputs into real-time calculations. Changing any value in the roster or calculator immediately ripples updates down the timeline:

```mermaid
flowchart TD
    subgraph Inputs [Reactive Input State]
        EC[Selected iRacing Event]
        VH[Selected Vehicle]
        FL[Global Fuel per Lap]
        LT[Global Lap Time]
        DR[Driver Roster Overrides]
    end

    subgraph Engine [Strategy Service Calculation Engine]
        SS[recalculateTimeline]
    end

    subgraph Output [Computed Timeline Output]
        SL[Stint Laps Allocation]
        SD[Stint Durations]
        ST[Start/End Pit Stop Times]
    end

    EC -->|Event duration / Classes| SS
    VH -->|Default tank capacity| SS
    FL -->|Fallback consumption| SS
    LT -->|Fallback pace| SS
    DR -->|Driver-specific lap times & consumption| SS

    SS -->|Generates & updates stint array| SL
    SS -->|Computes timeline offsets| SD
    SS -->|Accumulates times| ST
```

---

## Repository Structure

### Frontend (`src/`)

```text
src/
├── app/
│   ├── app.config.ts          # Global configuration (routing, providers)
│   ├── app.routes.ts          # Protected application routing rules
│   ├── app.ts                 # Core app layout / Shell component
│   ├── app.css                # Base styling variables and layouts
│   ├── core/
│   │   ├── guards/            # Router guard definitions (Auth, Unsaved Changes)
│   │   ├── models/            # Interfaces & Enums (RaceStrategy, DriverProfile, TelemetryPacket)
│   │   └── services/          # Strategy Engine, Catalog, Auth, Team, Translation,
│   │                            TelemetryService (WS client), TelemetryApiService
│   └── features/
│       ├── home/              # Dashboard landing, telemetry alerts & team log events
│       ├── login/             # User authentication screen
│       ├── strategies-list/   # Strategy library overview and search
│       ├── strategy-calculator/ # Core stint planner + Live Adjustments + Agent Token UI
│       ├── telemetry-panel/   # Live gauges, fuel bar, lap info, pit status, race timer
│       └── team/              # Team settings and Driver roster editor
└── styles.css                 # "Midnight Track" design system theme tokens and utilities
```

### Backend (`backend/`)

```text
backend/
├── src/
│   ├── index.ts               # Express + HTTP server, WS relay registration
│   ├── db.ts                  # SQLite initialization (better-sqlite3)
│   ├── seed.ts                # Default data seeding
│   ├── middleware/
│   │   ├── auth.ts            # JWT authentication middleware
│   │   └── error.ts           # Error handler
│   ├── models/                # Database models (User, Strategy, Team, Catalog)
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── strategies.routes.ts
│   │   ├── catalog.routes.ts
│   │   ├── team.routes.ts
│   │   ├── teams.routes.ts
│   │   ├── admin.routes.ts
│   │   └── telemetry.routes.ts   # Agent token CRUD + HTTP /api/telemetry/ingest
│   └── services/
│       ├── telemetry.service.ts       # Token generation, validation, DB ops
│       └── telemetry-relay.service.ts # WebSocket relay (live clients) + HTTP ingest
└── Dockerfile                  # Multi-stage build for Railway deployment
```

---

## Development & Running Locally

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) and the [Angular CLI](https://github.com/angular/angular-cli) installed.

### Installation
Clone the repository and install all dependencies:
```bash
npm install
```

### Run Development Server
To launch the server locally on `http://localhost:4200/`:
```bash
npm run start
# or
ng serve
```

### Production Build
To build the application for deployment:
```bash
npm run build
# or
ng build
```
Production assets will be output to the `dist/` directory.

### Testing
Execute unit tests via Karma runner:
```bash
npm run test
# or
ng test
```

## Telemetry Relay Architecture

```
iRacing (Sim)
  → sdk-worker.js (reads telemetry via irsdk-node)
  → server.js (agent, HTTP POST /api/telemetry/ingest every 200ms)
  → Railway (Express backend)
  → TelemetryRelayService (broadcasts to live WebSocket clients)
  → Browser (TelemetryService receives via /ws/telemetry/live)
```

### Agent Token Setup
1. Navigate to **Strategy Calculator > TELEMETRY AGENTS**
2. Enter a driver name and click **GENERATE**
3. Copy the token (`at_xxx`) using the **TOKEN** button
4. On the gaming PC, run:
   ```bash
   node server.js --relay=wss://your-server.com/ws/telemetry/agent --driver=MyName --token=at_xxx
   ```

### Environment Configuration

| Variable | File | Description |
|---|---|---|
| `telemetryRelayUrl` | `environments/environment.ts` / `environment.prod.ts` | WebSocket URL for live telemetry relay |
| `apiUrl` | `environments/environment.ts` / `environment.prod.ts` | Backend API base URL |
| `JWT_SECRET` | Backend `.env` | Secret for JWT signing |
| `RELAY_URL` | Backend (optional) | Override agent relay URL returned by `/api/telemetry/config` |

### Multi-PC Setup
- **Gaming PC**: Run [parts-tel-desktop](https://github.com/JesusPartal/parts-tel-desktop) (Electron GUI) or `node server.js` with `--relay` flag
- **Any PC**: Open the web app and click **CONNECT RELAY** (or the unified **CONNECT** button when logged in)
