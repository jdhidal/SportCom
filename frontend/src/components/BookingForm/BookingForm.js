import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './BookingForm.css';

const ReservationForm = () => {
  const [reservations, setReservations] = useState([]);
  const [newReservation, setNewReservation] = useState({ facility_name: '', user_name: '', reservation_date: '', status: 'Pendiente' });
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch reservations on component mount
    axios.get('https://microservice-list-reservation-9e286342001c.herokuapp.com/reservations')
      .then(response => setReservations(response.data))
      .catch(error => console.error('Error fetching reservations:', error));
  }, []);

  useEffect(() => {
    // Set the default reservation_date to the current date and time
    const now = new Date();
    const formattedDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    const formattedTime = now.toTimeString().split(' ')[0]; // HH:MM:SS format
    setNewReservation(prevState => ({
      ...prevState,
      reservation_date: `${formattedDate}T${formattedTime}`
    }));
  }, []);

  const handleCreate = () => {
    if (newReservation.facility_name && newReservation.user_name && newReservation.reservation_date && newReservation.status) {
      axios.post('http://localhost:3008/reservations', newReservation)
        .then(response => {
          setReservations([...reservations, response.data]);
          setNewReservation({ facility_name: '', user_name: '', reservation_date: '', status: 'Pendiente' });
        })
        .catch(error => console.error('Error creating reservation:', error));
    } else {
      alert('Please fill in all fields before creating a reservation.');
    }
  };

  const handleCancel = (id) => {
    axios.put(`https://microservice-canc-reservation-ee059cd96c68.herokuapp.com/reservations/${id}`)
      .then(() => {
        setReservations(reservations.map(reservation =>
          reservation.id === id ? { ...reservation, status: 'canceled' } : reservation
        ));
      })
      .catch(error => console.error('Error canceling reservation:', error));
  };

  const handleDelete = (id) => {
    fetch(`http://localhost:3010/reservations/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(() => {
        setReservations(reservations.filter(reservation => reservation.id !== id));
      })
      .catch(error => {
        console.error('Error deleting reservation:', error);
      });
  };
 
  return (
    <div className="reservation-form">
      <h2>Reservations</h2>

      <div className="instructions">
        <h3>Instructions</h3>
        <p>
          <strong>Facility Name:</strong> Enter the name of the facility.<br />
          <strong>User Name:</strong> Provide the name of the user.<br />
          <strong>Reservation Date:</strong> Specify the reservation date and time.<br />
          <strong>Status:</strong> Specify the status of the reservation.
        </p>
      </div>

      <div>
        <h3>Create Reservation</h3>
        <input
          type="text"
          placeholder="Facility Name"
          value={newReservation.facility_name}
          onChange={(e) => setNewReservation({ ...newReservation, facility_name: e.target.value })}
        />
        <input
          type="text"
          placeholder="User Name"
          value={newReservation.user_name}
          onChange={(e) => setNewReservation({ ...newReservation, user_name: e.target.value })}
        />
        <input
          type="datetime-local"
          value={newReservation.reservation_date}
          onChange={(e) => setNewReservation({ ...newReservation, reservation_date: e.target.value })}
          readOnly // Make the field read-only
        />
        <select
          value={newReservation.status}
          onChange={(e) => setNewReservation({ ...newReservation, status: e.target.value })}
        >
          <option value="Pendiente">Pendiente</option>
          <option value="Confirmado">Confirmado</option>
        </select>
        <button onClick={handleCreate}>Create</button>
      </div>

      <div>
        <h3>Reservations List</h3>
        <ul>
          {reservations.map(reservation => (
            <li key={reservation.id}>
              {reservation.facility_name} - {reservation.user_name} - {reservation.reservation_date} - {reservation.status}
              <button onClick={() => handleCancel(reservation.id)}>Cancel</button>
              <button onClick={() => handleDelete(reservation.id)}>Delete</button>
            </li>
          ))}
        </ul>
      </div>

      <button className="back-button" onClick={() => navigate('/main')}>Back to Main</button>
    </div>
  );
};

export default ReservationForm;