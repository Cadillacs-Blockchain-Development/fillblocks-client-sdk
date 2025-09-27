# SDK Backend

A Node.js backend service for managing data uploads and retrieval using Arweave blockchain.

## Prerequisites

- Node.js (v16 or higher)
- npm or pnpm

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start ArLocal (Arweave local node):
```bash
npm run arlocal
```

3. In a separate terminal, start the backend:
```bash
npm run dev
```

## Quick Start (Windows)

Use the provided batch file to start both services:
```bash
start-dev.bat
```

Or use PowerShell:
```powershell
.\start-dev.ps1
```

## API Endpoints

### Upload Data
- **POST** `/api/sdk/upload/:schema/data`
- Headers: `clientid`, `secretid`
- Body: `{ "payload": { ... } }`

### Get Unique Schemas
- **GET** `/api/arwaves/schemas/unique`
- Headers: `Authorization: Bearer <token>`

### Get Data by Schema
- **GET** `/api/arwaves/schema/:schema`
- Headers: `Authorization: Bearer <token>`

### Get User History
- **GET** `/api/arwaves/schema/:schema/user/:userId/history`
- Headers: `Authorization: Bearer <token>`

## Troubleshooting

### "fetch failed" Error
This error occurs when ArLocal is not running. Make sure to:
1. Start ArLocal first: `npm run arlocal`
2. Wait for it to fully start (you should see "ArLocal is ready!")
3. Then start the backend: `npm run dev`

### Port 1984 Already in Use
If port 1984 is already in use:
1. Kill the process using the port
2. Or change the port in `src/arwaves/arwaves.ts` and restart ArLocal with the new port

### Empty Data Responses
If GET routes return empty data:
1. Ensure data has been uploaded first
2. Check that the organization ID matches between upload and retrieval
3. Verify the schema name is correct
4. Check the server logs for detailed error messages

## Development

The project uses TypeScript and compiles to the `dist/` directory. The development server automatically rebuilds and restarts on file changes.

## Logs

Server logs are written to the `logs` file in the project root. Check this file for detailed error information.
