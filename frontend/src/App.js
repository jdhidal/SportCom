import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
//Import Viws of Front
import LoginForm from './components/LoginForm/LoginForm';
import CreateUserForm from './components/CreateUserForm/CreateUserForm';
import MainPage from './Pages/MainPage';
import FacilitiesForm from './components/FacilitiesForm/FacilitiesForm';
import BookingForm from './components/BookingForm/BookingForm';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';

const App = () => {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<LoginForm />} />
          <Route path="/create" element={<CreateUserForm />} />
          <Route path="/main" element={<ProtectedRoute element={<MainPage />} />} />
          <Route path="/facilities" element={<ProtectedRoute element={<FacilitiesForm />} />} />
          <Route path="/reservations" element={<ProtectedRoute element={<BookingForm />} />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
