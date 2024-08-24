# Front

The `Front` directory contains the frontend application built with React. This application interacts with various microservices, communicates via Axios, and is protected with CORS. The directory is organized to maintain a clean structure with components and a main page.

## Features

1. **React Components**: The application uses React for building user interfaces.
2. **Axios for Communication**: Axios is used to handle HTTP requests to the microservices.
3. **CORS Protection**: Configured to handle CORS issues and ensure secure communication.
4. **Directory Structure**: Components are organized in the `src` folder, with a `Main` page as the entry point.

## Directory Structure

```plaintext
front/
│
├── src/
│   ├── components/
│   │   │   AvailabilityForm/
│   │   │   ├── AvailabilityForm.js
│   │   │   └── AvailabilityForm.css
│   │   │   AvailabilityLogViewer/
│   │   │   ├── AvailabilityLog.js
│   │   │   └── AvailabilityLog.css
│   │   ├── CreateUserForm/
│   │   │   ├── CreateUserForm.js
│   │   │   └── CreateUserForm.css
│   │   ├── Header/
│   │   │   ├── Header.js
│   │   │   └── Header.css
│   │   ├── FacilitiesForm/
│   │   │   ├── FacilitiesForm.js
│   │   │   └── FacilitiesForm.css
│   │   ├── LoginForm/
│   │   │   ├── LoginForm.js
│   │   │   └── LoginForm.css
│   │   └── ReservationForm/
│   │       ├── ReservationForm.js
│   │       └── ReservationForm.css
│   ├── Pages/
│   │   ├── MainPage.js
│   │   └── OtherPages.js
│   ├── App.js
│   └── index.js
│
├── .gitignore
├── package.json
└── README.md
