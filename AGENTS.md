# AGENTS.md - Instructions for Coding Agents

## Build/Lint/Test Commands

### Development
- **Start development server**: `npm start` (uses nodemon for hot-reload)
- **Run tests**: `npm test` (runs all tests with Jest)
- **Run tests in watch mode**: `npm run test:watch` (runs tests on file changes)
- **Run specific test**: `npx jest tests/models/user.test.js`

### Production
- **Start server**: `node app.js`

### Dependencies
- **Install dependencies**: `npm install`
- **Install dev dependencies**: `npm install --save-dev <package>`
- **Auto-formatting**: No automated formatter currently configured
- **Type checking**: No TypeScript configuration

## Code Style Guidelines

### Import/Require Structure
- Use `require()` for all imports (CommonJS modules)
- Group imports in this order:
  1. Built-in Node.js modules (fs, path, events, etc.)
  2. Third-party libraries (express, mongoose, socket.io, etc.)
  3. Custom modules (use relative paths: `./`, `../`)

### File Organization
- **Routes**: `/routes/` - Express route handlers
- **Controllers**: `/controllers/` - Business logic and request handling
- **Models**: `/models/` - Mongoose schemas and models
- **Middleware**: `/middleware/` - Express middleware functions
- **Errors**: `/errors/` - Custom error classes
- **Utils**: `/utils/` - Helper functions and utilities
- **Config**: `/config/` - Configuration files

### Naming Conventions
- **Files**: kebab-case (e.g., `ride-controller.js`)
- **Variables**: camelCase (e.g., `userName`, `phoneNumber`)
- **Classes/Constructors**: PascalCase (e.g., `User`, `Ride`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `ACCESS_TOKEN_SECRET`)
- **Function/Method Names**: camelCase (e.g., `createAccessToken`, `calculateFare`)

### Error Handling
- Use custom error classes from `/errors/`:
  - `CustomAPIError` - Generic API errors
  - `UnauthenticatedError` - Authentication failures
  - `NotFoundError` - Resource not found
  - `BadRequestError` - Invalid request data
- Always wrap async operations in try-catch blocks
- Use `express-async-errors` package for automatic error handling
- Error responses should follow: `{ msg: "error message" }` format

### Database Models
- Use Mongoose schemas with proper validation
- Include `timestamps: true` for all models
- Define indexes for frequently queried fields
- Use enums for role/permission fields
- Keep schemas focused and avoid embedding when possible

### API Response Format
- Success responses: `res.status(200).json({ data })`
- Error responses: `res.status(statusCode).json({ msg: "message" })`
- Use HTTP status codes from `http-status-codes` package

### Authentication & Authorization
- Use JWT tokens stored in Authorization header
- Apply `auth` middleware to protected routes
- Token structure: `Bearer <token>`
- Include user context in req object: `req.user = { id, phone }`

### Socket.IO Integration
- Attach socket instance to request: `req.io = io`
- Use socket rooms for targeted messaging
- Handle socket disconnections gracefully
- Store socket IDs in Redis for connection persistence

### File Uploads
- Use `multer` for file handling
- Store uploads in `/uploads/` directory
- Serve static files via `express.static("uploads")`
- Use Cloudinary for image processing/cloud storage

### Redis Usage
- Use `ioredis` for Redis client
- Store driver locations as geospatial data
- Cache frequently accessed data
- Use consistent naming conventions for Redis keys

### Environment Variables
- Use `.env` file for configuration
- Never commit environment variables to version control
- Required variables: `MONGO_URI`, `ACCESS_TOKEN_SECRET`, `PORT`

### Code Quality
- Keep functions focused and under 50 lines
- Use meaningful variable names
- Comment complex business logic
- Follow existing patterns in the codebase
- Use destructuring for imports when appropriate

### Testing
- **Test Framework**: Jest with MongoDB Memory Server
- **Test Location**: All tests in `/tests/` directory
- **Test Structure**:
  - `tests/models/` - Model unit tests
  - `tests/controllers/` - Controller tests
  - `tests/routes/` - Route integration tests
  - `tests/utils/` - Test utilities and helpers
- **Test Utilities**: Use `tests/utils/generateTestData.js` for mock data generation
- **Coverage**: Run tests with coverage using `npm test`
- **Best Practices**:
  - Clear database after each test using `afterEach`
  - Use MongoDB Memory Server for isolated test database
  - Generate unique test data to avoid conflicts
  - Test both success and error cases