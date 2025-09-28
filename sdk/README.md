# Fillblocks SDK

A Node.js SDK for automatic blockchain synchronization of educational data. Automatically syncs your Mongoose models to blockchain storage with zero configuration.

## Features

- **Automatic Data Sync**: Syncs all Mongoose models to blockchain every 5 seconds
- **Hash Verification**: SHA-256 data integrity checking
- **File Export**: Exports data to JSON files for external processing
- **Zero Configuration**: Works out of the box with existing MongoDB setups

## Installation

```bash
npm install fillblocks-sdk
```

## Quick Start

```typescript
import { ConnectFillblocks } from 'fillblocks-sdk';
import mongoose from 'mongoose';

// Connect to your MongoDB database
await mongoose.connect('mongodb://localhost:27017/your-database');

// Initialize the SDK
const sdk = new ConnectFillblocks({
  clientId: 'your-client-id',
  secretId: 'your-secret-key',
  dbName: 'your-database-name',
  mongooseInstance: mongoose
});

// That's it! Your data will automatically sync to blockchain every 5 seconds
```

## API Reference

### ConnectFillblocks

The main SDK class that handles automatic data synchronization.

#### Constructor Options

```typescript
interface ConnectOptions {
  clientId: string;        // Your organization client ID
  secretId: string;        // Your secret key
  dbName: string;          // Database name
  mongooseInstance: any;    // Mongoose instance
}
```

#### Methods

- `getDbConfigStatus()` - Returns database connection status
  - `"🟢 Connected"` - Database is connected
  - `"🔴 Disconnected"` - Database is disconnected
  - `"🟡 Connecting..."` - Connection in progress

## What It Does

The SDK automatically:

1. **Monitors all Mongoose models** in your database
2. **Syncs data every 5 seconds** to blockchain storage
3. **Generates SHA-256 hashes** for data integrity verification
4. **Exports data to JSON files** in `../data/` directory
5. **Creates credentials file** in `../config/credentials.json`
6. **Stores hash data** in `../data/hash/schema_hashes.json`

## File Structure

The SDK creates the following files:

```
../config/
  └── credentials.json          # Your API credentials

../data/
  ├── Student.json             # Exported student data
  ├── Course.json              # Exported course data
  ├── [SchemaName].json        # All your Mongoose models
  └── hash/
      └── schema_hashes.json   # Data integrity hashes
```

## Monitoring

Check your database connection status:

```typescript
const status = sdk.getDbConfigStatus();
console.log(`Database Status: ${status}`);
// Output: 🟢 Connected, 🔴 Disconnected, 🟡 Connecting...
```

Monitor console output for sync status:
- `✅ Credentials file created`
- `✅ Cron job started (every 5s)`
- `🔄 Running scheduled schema upload...`
- `✅ Hash stored/updated for schema "Student"`

## Requirements

- Node.js 14+
- MongoDB database
- Mongoose ODM
- Valid client credentials from Fillblocks dashboard
