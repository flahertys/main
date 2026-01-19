# Automated Task System

A comprehensive task automation system built on top of the TradeHax backend, enabling scheduled and manual execution of various types of tasks from a database.

## Features

- **Task Types**: Script execution, API calls, webhooks, and custom logic
- **Scheduling**: Cron-like scheduling with support for intervals and specific times
- **Dependencies**: Task dependencies to ensure proper execution order
- **Retry Logic**: Automatic retries with configurable limits
- **Logging**: Comprehensive execution logs and audit trails
- **REST API**: Full CRUD operations via REST endpoints
- **Authentication**: JWT-based authentication with role-based access
- **Real-time Monitoring**: Task status tracking and statistics

## Architecture

### Core Components

1. **Task Model** (`models/Task.js`)
   - Defines task structure and lifecycle methods
   - Handles scheduling calculations and status management

2. **TaskManager** (`models/TaskManager.js`)
   - Database operations and task persistence
   - Scheduler for automatic task execution
   - Execution engine for different task types

3. **Task Routes** (`routes/tasks.js`)
   - REST API endpoints for task management
   - Authentication and authorization middleware

4. **Auth Middleware** (`middleware/auth.js`)
   - JWT verification and role-based access control

## API Endpoints

### Task Management

```
GET    /api/tasks              # List all tasks (with optional filters)
GET    /api/tasks/stats        # Get task statistics
POST   /api/tasks              # Create a new task
GET    /api/tasks/:id          # Get task details
PUT    /api/tasks/:id          # Update task
DELETE /api/tasks/:id          # Delete task
POST   /api/tasks/:id/execute  # Execute task manually
GET    /api/tasks/:id/logs     # Get task execution logs
```

### Authentication Required

All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

## Task Types

### 1. Script Execution
Execute shell commands or Node.js scripts.

```json
{
  "name": "Log Cleanup",
  "type": "script",
  "config": {
    "command": "node",
    "args": ["scripts/cleanup.js"],
    "cwd": "/app",
    "env": { "NODE_ENV": "production" }
  },
  "schedule": "daily at 2:00"
}
```

### 2. API Call
Make HTTP requests to external services.

```json
{
  "name": "Health Check",
  "type": "api_call",
  "config": {
    "method": "GET",
    "url": "https://api.example.com/health",
    "headers": { "Authorization": "Bearer token" },
    "timeout": 30000
  },
  "schedule": "every 5 minutes"
}
```

### 3. Webhook
Send HTTP POST requests with custom payloads.

```json
{
  "name": "Discord Notification",
  "type": "webhook",
  "config": {
    "url": "https://discord.com/api/webhooks/...",
    "method": "POST",
    "headers": { "Content-Type": "application/json" },
    "body": { "content": "Task completed!" }
  }
}
```

### 4. Custom Logic
Execute custom JavaScript functions.

```json
{
  "name": "Custom Processor",
  "type": "custom",
  "config": {
    "function": "processData",
    "params": { "source": "database", "target": "cache" }
  }
}
```

## Scheduling

### Supported Formats

- **Intervals**: `"every 5 minutes"`, `"every 2 hours"`, `"every 1 day"`
- **Daily**: `"daily at 9:00"`, `"daily at 14:30"`
- **Manual**: `null` (manual execution only)

### Examples

```javascript
"every 10 minutes"    // Every 10 minutes
"every 2 hours"       // Every 2 hours
"daily at 3:00"       // Every day at 3:00 AM
"every 7 days"        // Every 7 days
```

## Usage Examples

### Creating a Task via API

```bash
curl -X POST http://localhost:3001/api/tasks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Database Backup",
    "description": "Daily database backup task",
    "type": "script",
    "config": {
      "command": "pg_dump",
      "args": ["-U", "user", "-h", "localhost", "mydb", ">", "backup.sql"],
      "cwd": "/backups"
    },
    "schedule": "daily at 2:00",
    "priority": "high"
  }'
```

### Listing Tasks

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3001/api/tasks?status=pending&type=script
```

### Manual Execution

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3001/api/tasks/TASK_ID/execute
```

## Task Lifecycle

1. **Created**: Task is created and stored
2. **Pending**: Waiting for execution (manual or scheduled)
3. **Running**: Currently executing
4. **Completed**: Successfully finished
5. **Failed**: Execution failed (may retry)
6. **Cancelled**: Manually cancelled

## Dependencies

Tasks can depend on other tasks. A task will only execute when all its dependencies are completed.

```json
{
  "name": "Deploy Application",
  "dependencies": ["task_build_app", "task_run_tests"],
  "schedule": "manual"
}
```

## Error Handling & Retries

- **Automatic Retries**: Failed tasks retry up to `maxRetries` times
- **Exponential Backoff**: Retry delays increase exponentially
- **Timeout Protection**: Tasks timeout after `timeout` milliseconds
- **Error Logging**: All errors are logged with timestamps and context

## Monitoring & Logging

### Task Logs

Each task maintains a log of execution attempts:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "ERROR",
  "message": "Database connection failed",
  "data": { "error": "ECONNREFUSED" }
}
```

### Statistics

Get system-wide task statistics:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3001/api/tasks/stats
```

Response:
```json
{
  "total": 25,
  "byStatus": { "pending": 5, "running": 2, "completed": 18 },
  "byType": { "script": 15, "api_call": 8, "webhook": 2 },
  "byPriority": { "low": 10, "normal": 12, "high": 3 },
  "running": 2,
  "scheduled": 8
}
```

## Security

- **Authentication**: JWT tokens required for all operations
- **Authorization**: Users can only access tasks they created or are assigned to
- **Rate Limiting**: API endpoints protected against abuse
- **Input Validation**: All inputs validated and sanitized
- **Audit Trail**: All operations logged for compliance

## Configuration

### Environment Variables

```env
# Task System Configuration
TASK_DATA_DIR=./data
TASK_SCHEDULER_INTERVAL=60000
TASK_DEFAULT_TIMEOUT=300000
TASK_MAX_RETRIES=3
```

### File Structure

```
backend/
├── models/
│   ├── Task.js              # Task model
│   └── TaskManager.js       # Task database operations
├── routes/
│   └── tasks.js             # Task API routes
├── middleware/
│   └── auth.js              # Authentication middleware
├── scripts/
│   └── example-task.js      # Example task scripts
├── data/
│   └── tasks.json           # Task persistence
└── TASK_SYSTEM_README.md    # This documentation
```

## Development

### Running Tests

```bash
cd backend
npm test
```

### Adding New Task Types

1. Add the task type to the validation in `routes/tasks.js`
2. Implement the execution logic in `TaskManager.runTaskLogic()`
3. Update this documentation

### Custom Task Functions

For `custom` task types, implement functions in a separate module:

```javascript
// custom-tasks.js
export async function myCustomTask(params) {
  // Your custom logic here
  return { result: 'success' };
}
```

Then reference it in the task config:
```json
{
  "type": "custom",
  "config": {
    "function": "myCustomTask",
    "params": { "key": "value" }
  }
}
```

## Troubleshooting

### Common Issues

1. **Task not executing**: Check dependencies and schedule
2. **Permission denied**: Verify JWT token and user permissions
3. **Script failures**: Check script paths and permissions
4. **Timeout errors**: Increase timeout in task config

### Logs

Check task execution logs:
```bash
curl http://localhost:3001/api/tasks/TASK_ID/logs
```

### Debug Mode

Enable debug logging:
```env
DEBUG=task:*
```

## Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Ensure backward compatibility

## License

This task system is part of the TradeHax backend and follows the same licensing terms.
