# Fillblocks Backend API

A Node.js Express backend with MongoDB for the Fillblocks application.

## Features

- Express.js server with middleware
- MongoDB database with Mongoose ODM
- JWT authentication
- User and Organization models
- Rate limiting and security middleware
- Error handling
- Environment configuration

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp env.example .env
```

3. Update `.env` with your configuration:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/fillblocks
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
```

## Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Health Check
- `GET /api/health` - Server health status

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   └── authController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── User.js
│   │   └── Organization.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── index.js
│   └── server.js
├── package.json
├── env.example
└── README.md
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 8080 |
| `NODE_ENV` | Environment | development |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/fillblocks |
| `JWT_SECRET` | JWT secret key | - |
| `JWT_EXPIRE` | JWT expiration | 7d |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:3000 |

## Security Features

- Helmet.js for security headers
- CORS configuration
- Rate limiting
- Password hashing with bcrypt
- JWT authentication
- Input validation with express-validator

## Development

The server runs on `http://localhost:8080` by default. The API is available at `http://localhost:8080/api`.

## Testing

```bash
npm test
```

## Linting

```bash
npm run lint
npm run lint:fix
```
