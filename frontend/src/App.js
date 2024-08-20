import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
// Import Views of Front
import LoginForm from './components/LoginForm/LoginForm';
import CreateUserForm from './components/CreateUserForm/CreateUserForm';
import MainPage from './Pages/MainPage';
import FacilitiesForm from './components/FacilitiesForm/FacilitiesForm';
import BookingForm from './components/BookingForm/BookingForm';
import AvailabilityForm from './components/AvailabilityForm/AvailabilityForm';
import AvailabilityLogViewer from './components/AvailabilityLogViewer/AvailabilityLogViewer';
import FacilityLogs from './components/FacilityLogs/FacilityLogs';
import ReservationLogs from './components/ReservationLogs/ReservationLogs';
import UserLogs from './components/UserLogs/UserLogs';
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
          <Route path="/availability" element={<ProtectedRoute element={<AvailabilityForm />} />} />
          <Route path="/availability-logs" element={<ProtectedRoute element={<AvailabilityLogViewer />} />} />
          <Route path="/facility-logs" element={<ProtectedRoute element={<FacilityLogs />} />} />
          <Route path="/reservation-logs" element={<ProtectedRoute element={<ReservationLogs />} />} />
          <Route path="/user-logs" element={<ProtectedRoute element={<UserLogs />} />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
