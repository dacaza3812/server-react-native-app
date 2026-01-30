# Testing Setup Guide

## Problem: MongoDB Memory Server Download Issues on Windows

The tests are failing because MongoDB Memory Server cannot download MongoDB binaries for Windows from the official MongoDB download servers.

## Solutions:

### Solution 1: Install MongoDB Locally (Recommended)

1. Download MongoDB Community Edition from: https://www.mongodb.com/try/download/community
2. Install it and add `mongod` to your PATH
3. The tests will automatically use your local MongoDB installation

### Solution 2: Use Docker

Run MongoDB in a Docker container:

```bash
docker run -d -p 27017:27017 --name mongodb-test mongo:6.0
```

Then update `tests/setup.js` to connect to this instance instead of using MongoMemoryServer.

### Solution 3: Use WSL (Windows Subsystem for Linux)

1. Install WSL2 with Ubuntu
2. Run the tests inside WSL - the Linux binaries download correctly

### Solution 4: Manual Download

1. Download MongoDB binaries manually from: https://www.mongodb.com/download-center/community/releases/archive
2. Extract to `./node_modules/.cache/mongodb-memory-server/mongodb-binaries/`
3. Rename the folder to match the expected version (e.g., `6.0.0`)

## Current Workaround

The tests are configured to use MongoDB Memory Server with version 4.4.18, but if the download fails, you'll need to use one of the solutions above.

## Alternative: Skip Integration Tests

If you just want to run unit tests without database:

```bash
npm test -- --testPathIgnorePatterns=models
```
