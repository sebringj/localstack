# Todo App with LocalStack

A full-stack todo application running entirely on LocalStack with:
- **Frontend**: React 19 + Vite
- **Backend**: Python AWS Lambda
- **Database**: DynamoDB
- **API**: API Gateway
- **AI Testing**: [Autonomo MCP](https://github.com/sebringj/autonomo) for AI-driven UX validation

## Autonomo Integration

This project includes [Autonomo](https://github.com/sebringj/autonomo) integration, allowing AI assistants (GitHub Copilot, Claude, Cursor, etc.) to interact with and validate the running app in real-time.

**What the AI can do:**
- See current screen and all interactive elements
- Fill in forms (login, add todos)
- Press buttons (submit, toggle, delete)
- Verify state changes after actions
- Run full validation scenarios

**Setup:**
1. MCP config is in `.vscode/mcp.json`
2. Frontend uses `useAutonomo` hook from `@autonomo/react`
3. Set `VITE_AUTONOMO_PORT=9876` in `frontend/.env`

**Example AI prompt:**
> "Login with testuser/testpass, add a todo called 'Test item', mark it complete, then delete it"

The AI will execute each step and verify the results automatically.

## Prerequisites

- [LocalStack](https://localstack.cloud/) installed (`pip install localstack`)
- [AWS CLI](https://aws.amazon.com/cli/) installed
- Node.js 22+ (use `nvm use` if you have nvm)
- LocalStack Pro/Team auth token (for Pro features)

## Setup

### 1. Configure LocalStack Auth Token

Get your auth token from [LocalStack Dashboard](https://app.localstack.cloud/account/apikeys).

**Option A: Shell profile (recommended)**
```bash
# Add to ~/.zshrc or ~/.bashrc
export LOCALSTACK_AUTH_TOKEN="your-token-here"
```

**Option B: Create local env file**
```bash
# Create .localstack.env (gitignored)
echo 'LOCALSTACK_AUTH_TOKEN=your-token-here' > .localstack.env

# Source before running tasks
source .localstack.env
```

### 2. Install Dependencies

```bash
cd frontend && npm install
```

## Quick Start

### Option 1: VS Code Tasks (Recommended)

1. Press **⇧⌘B** (Shift+Cmd+B) to run "Start Local Dependencies"
2. After deployment completes, run task "Start Frontend"

Or use the compound task "Start All (LocalStack + Frontend)" to run both sequentially.

### Option 2: Command Line

```bash
# Start LocalStack and deploy
./scripts/start-all.sh

# In another terminal, start the frontend
cd frontend && npm install && npm run dev
```

## Access the App

1. Open http://localhost:3000
2. Login with test credentials:
   - Username: `testuser`
   - Password: `testpass`

## Project Structure

```
localstack/
├── .nvmrc                  # Node.js version (22)
├── .vscode/
│   ├── mcp.json            # Autonomo MCP server config
│   └── tasks.json          # VS Code tasks for development
├── backend/
│   ├── auth/
│   │   └── handler.py      # Authentication Lambda
│   ├── todos/
│   │   └── handler.py      # Todo CRUD Lambda
│   └── requirements.txt
├── frontend/
│   ├── .env                # Autonomo port config (VITE_AUTONOMO_PORT)
│   ├── src/
│   │   ├── App.jsx         # Main React app with useAutonomo hook
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── scripts/
│   ├── deploy.sh           # Deploy Lambda + DynamoDB + API Gateway
│   ├── start-all.sh        # Start LocalStack and deploy
│   └── stop-all.sh         # Stop LocalStack
└── README.md
```

## VS Code Tasks

| Task | Shortcut | Description |
|------|----------|-------------|
| Start Local Dependencies | ⇧⌘B | Start LocalStack and deploy backend |
| Start Frontend | - | Start Vite dev server |
| Deploy to LocalStack | - | Re-deploy backend (if LocalStack already running) |
| Stop Local Dependencies | - | Stop LocalStack |
| Start All | - | Run both LocalStack and Frontend sequentially |

## API Endpoints

All endpoints are proxied through Vite during development:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth | Login |
| GET | /api/todos | List todos |
| POST | /api/todos | Create todo |
| PUT | /api/todos/:id | Update todo |
| DELETE | /api/todos/:id | Delete todo |

## Troubleshooting

### LocalStack not starting
Make sure your auth token is set:
```bash
echo $LOCALSTACK_AUTH_TOKEN  # Should print your token
# If empty, export it or source your .localstack.env file
```

### API calls failing
1. Ensure LocalStack is running: `localstack status`
2. Re-deploy: `./scripts/deploy.sh`

### Reset everything
```bash
./scripts/stop-all.sh
localstack start
./scripts/deploy.sh
```
