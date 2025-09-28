# Philblocks SDK Backend

A comprehensive Node.js backend service for managing decentralized data storage and retrieval using Arweave blockchain with Ethereum smart contract integration.

## 🏗️ Architecture & Technology Stack

**Core Technologies:**
- **Node.js/Express.js** - Web framework
- **TypeScript** - Type-safe JavaScript
- **MongoDB/Mongoose** - Database and ODM
- **Arweave** - Decentralized storage blockchain
- **Ethereum/Thirdweb** - Smart contract interactions
- **JWT** - Authentication tokens

## 🚀 Features

### 🔐 Authentication System
- **User Management**: Complete user registration/login with bcrypt password hashing
- **JWT-based Authentication**: Token-based auth with middleware protection
- **Organization-based Access**: Users belong to organizations with client/secret key authentication
- **Google OAuth Support**: Integration for Google login

### ⛓️ Blockchain Integration
**Arweave Integration:**
- **Decentralized Storage**: Data uploaded to Arweave blockchain
- **Local Development**: Uses ArLocal for testing
- **Transaction Management**: Automatic wallet generation and transaction signing
- **Data Retrieval**: GraphQL queries to fetch stored data

**Ethereum Smart Contracts:**
- **Student UID Generation**: Creates unique identifiers on-chain
- **Data Stream Initialization**: Sets up student data streams
- **Data Updates**: Tracks data changes on blockchain
- **Thirdweb Integration**: Simplified smart contract interactions

### 📊 Data Management
**SDK Upload System:**
- **Schema-based Uploads**: Data organized by schemas
- **Organization Isolation**: Data separated by organization
- **Dual Storage**: Data stored both on Arweave and blockchain
- **Update Tracking**: Maintains data history and previous hashes

**Data Retrieval:**
- **Schema-based Queries**: Get data by specific schemas
- **User History**: Track individual user data changes
- **Unique Schema Discovery**: Find all available schemas
- **Pagination Support**: Efficient data loading

### 🏢 Organization Management
- **Multi-tenant Architecture**: Each organization has isolated data
- **Client/Secret Authentication**: API key-based access for SDK
- **Wallet Generation**: Automatic blockchain wallet creation
- **Team Management**: Organization size tracking

### 🔒 Security Features
- **CORS Configuration**: Controlled cross-origin access
- **Helmet Security**: HTTP security headers
- **Rate Limiting**: Request throttling capabilities
- **Input Validation**: Data sanitization with HPP
- **Authentication Middleware**: Route protection

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or pnpm
- MongoDB instance
- ArLocal (for development)

## 🛠️ Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment:**
```bash
cp env.example .env
# Edit .env with your configuration
```

3. **Start ArLocal (Arweave local node):**
```bash
npm run arlocal
```

4. **In a separate terminal, start the backend:**
```bash
npm run dev
```

## 🚀 Quick Start (Windows)

Use the provided batch file to start both services:
```bash
start-dev.bat
```

Or use PowerShell:
```powershell
.\start-dev.ps1
```

## 📚 API Documentation

### 🔐 Authentication Routes (`/api/auth`)
- `POST /login` - User login
- `POST /signup` - User registration
- `GET /uid` - Get user ID
- `PUT /update` - Update user profile
- `DELETE /delete` - Delete user account

### 📦 SDK Routes (`/api/sdk`)
- `POST /upload/:schema/data` - Upload data with schema
  - Headers: `clientid`, `secretid`
  - Body: `{ "payload": { ... } }`
- `PUT /update/:schema/data` - Update existing data
  - Headers: `clientid`, `secretid`
  - Body: `{ "payload": { ... } }`

### 🏢 Organization Routes (`/api/organization`)
- `POST /create` - Create new organization
- `GET /get` - Get organization details
- `PUT /update` - Update organization
- `DELETE /delete` - Delete organization

### 🌐 Arweave Routes (`/api/arwaves`)
- `GET /schemas/unique` - Get unique schemas
  - Headers: `Authorization: Bearer <token>`
- `GET /schema/:schema` - Get data by schema
  - Headers: `Authorization: Bearer <token>`
- `GET /schema/:schema/user/:userId/history` - Get user history
  - Headers: `Authorization: Bearer <token>`

## 🔧 Development

The project uses TypeScript and compiles to the `dist/` directory. The development server automatically rebuilds and restarts on file changes.

### Available Scripts
- `npm run build` - Compile TypeScript
- `npm run dev` - Development server with hot reload
- `npm run arlocal` - Start ArLocal node
- `npm start` - Start production server

## 🌟 Key Features

### Decentralized Data Storage
- Data is permanently stored on Arweave blockchain
- Immutable transaction history
- Organization-based data isolation
- Schema-based data organization

### Blockchain Integration
- Student UID generation on Ethereum
- Data stream initialization
- Update tracking with hash chains
- Smart contract event logging

### SDK Authentication
- Client ID/Secret key authentication
- Organization-based access control
- Middleware protection for all SDK routes

### Development Tools
- **ArLocal Integration**: Local Arweave node for development
- **Hot Reload**: TypeScript compilation with file watching
- **Comprehensive Logging**: Detailed error and success logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
