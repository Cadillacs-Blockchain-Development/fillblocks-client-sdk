# Philblocks Frontend Dashboard

A modern React-based dashboard application for displaying decentralized data storage and retrieval using Arweave blockchain with Flow smart contract integration.

## 🏗️ Architecture & Technology Stack

**Core Technologies:**
- **React 19.1.1** - Latest React with modern features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS 4.1.13** - Modern utility-first CSS framework
- **Redux Toolkit** - State management
- **React Router DOM** - Client-side routing
- **Firebase** - Authentication and analytics
- **Axios** - HTTP client for API calls

## 🚀 Features

### 🔐 Authentication System
- **Dual Authentication**: Firebase + Custom API authentication
- **Multiple Login Methods**: Email/password and Google OAuth
- **JWT Token Management**: Automatic token storage and validation
- **Protected Routes**: Route-level authentication with redirects
- **Persistent Sessions**: localStorage-based session management

### 📊 Dashboard Interface
- **Multi-tab Interface**: Dashboard, Create Organization, Show Schema, Show Data
- **Real-time Data**: Live updates from blockchain and API
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Interactive Elements**: Modals, forms, and data tables

### 🏢 Organization Management
- **Create Organizations**: Full CRUD operations
- **API Key Management**: Client ID and Secret Key generation
- **Wallet Integration**: Blockchain wallet creation
- **Team Management**: Organization size and member tracking

### ⛓️ Blockchain Integration
- **Arweave Integration**: Direct blockchain data retrieval
- **Schema Discovery**: Automatic schema detection from DB
- **Transaction History**: Complete audit trail of data changes
- **Student UID Tracking**: On-chain unique identifier management
- **Real-time Updates**: Live data refresh and synchronization

### 📋 Data Visualization
- **Schema Management**: Dynamic schema detection and display
- **Student Data Tables**: Comprehensive data visualization
- **History Tracking**: Individual student history with blockchain transactions
- **Transaction Verification**: Real-time transaction status checking

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or pnpm
- Firebase project (for authentication)
- Backend API running

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

3. **Configure Firebase:**
   - Create a Firebase project
   - Enable Authentication
   - Update `src/firebase/config.ts` with your Firebase credentials
   - See `FIREBASE_SETUP.md` for detailed instructions

4. **Start development server:**
```bash
npm run dev
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🏗️ Project Structure

```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── Dashboard.tsx    # Main dashboard interface
│   │   ├── Login.tsx       # Authentication interface
│   │   ├── SignUp.tsx      # User registration
│   │   ├── ProtectedRoute.tsx # Route protection
│   │   ├── Sidebar.tsx     # Navigation component
│   │   ├── OrganizationKeysModal.tsx # API key display
│   │   └── StudentHistoryModal.tsx # Student data history
│   ├── contexts/           # React contexts
│   │   └── AuthContext.tsx # Authentication context
│   ├── firebase/           # Firebase configuration
│   │   └── config.ts       # Firebase setup
│   ├── hooks/              # Custom React hooks
│   │   └── useAuth.ts      # Authentication hook
│   ├── store/              # Redux store and slices
│   │   ├── index.ts        # Store configuration
│   │   ├── authSlice.ts    # Authentication state
│   │   └── hooks.ts        # Typed Redux hooks
│   └── utils/              # Utility functions and API services
│       ├── organizationApi.ts # Organization API calls
│       ├── storage.ts       # Local storage utilities
│       └── googleAuth.ts   # Google authentication
├── public/                 # Static assets
└── package.json           # Dependencies & scripts
```

## 🎨 UI Components

### Core Components

#### **Dashboard Component**
- Multi-tab navigation interface
- Real-time data display
- Organization management
- Schema visualization
- Student data tables

#### **Authentication Components**
- **Login**: Email/password and Google OAuth for Web2 users
- **SignUp**: User registration with validation
- **ProtectedRoute**: Route-level authentication

#### **Modal Components**
- **OrganizationKeysModal**: Secure API key display
- **StudentHistoryModal**: Blockchain transaction history

## 🗄️ Data Management

### Blockchain Integration
- **Arweave Integration**: Direct blockchain data retrieval
- **Schema Discovery**: Automatic schema detection
- **Transaction History**: Complete audit trail
- **Student UID Tracking**: On-chain unique identifiers

### Data Visualization
- **Real-time Updates**: Live data refresh
- **Schema Management**: Dynamic schema detection
- **Student Data Tables**: Comprehensive data display
- **History Tracking**: Individual student history

## 🔧 Development

### Build System
- **Vite Configuration**: Fast development and building
- **TypeScript**: Full type safety
- **ESLint**: Code quality and consistency
- **Hot Reload**: Instant development feedback

### Environment Configuration
- **Environment Variables**: VITE_BASE_URL for API endpoints
- **Firebase Config**: Centralized authentication setup
- **Development Tools**: React DevTools integration

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Environment Variables
Create a `.env` file with the following variables:

```env
# API Configuration
VITE_BASE_URL=http://localhost:8080/api
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.