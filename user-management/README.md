# User Management

The `User Management` microservice is responsible for managing user-related operations within the system. It provides functionalities for user login, creation, logout, and notifications when a user connects, using WebSockets.

## Features

1. **User Login**: Allows users to log into the system.
2. **Create User**: Enables the creation of new user accounts.
3. **User Logout**: Allows users to log out of the system.
4. **WebSocket Notifications**: Sends notifications when a user connects to the system via WebSocket.

## Directory Structure

```plaintext
user-management/
│
├── create-user-service/
│   └── App estructure
│
├── login-service/
│   └── App estructure
│
├── logout-user-service/
│   └── App estructure
│
└── websocket-service/
    └── App estructure
