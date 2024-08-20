import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AvailabilityForm.css';

const AvailabilityForm = () => {
  const [availabilities, setAvailabilities] = useState([]);
  const [newAvailability, setNewAvailability] = useState({ start_date: '', end_date: '', spots: '', cost: '' });
  const [updateAvailability, setUpdateAvailability] = useState({ id: '', start_date: '', end_date: '', spots: '', cost: '' });
  const navigate = useNavigate();

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    axios.get('http://localhost:3015/availability')
      .then(response => setAvailabilities(response.data))
      .catch(error => console.error('Error fetching availabilities:', error));
  }, []);

  const handleCreate = () => {
    if (newAvailability.start_date && newAvailability.end_date && newAvailability.spots && newAvailability.cost) {
      axios.post('http://localhost:3012/availability', newAvailability)
        .then(response => {
          setAvailabilities([...availabilities, response.data]);
          setNewAvailability({ start_date: '', end_date: '', spots: '', cost: '' });
          window.location.reload();
        })
        .catch(error => console.error('Error creating availability:', error));
    } else {
      alert('Please fill in all fields before creating an availability.');
    }
  };

  const handleUpdate = () => {
    if (updateAvailability.start_date && updateAvailability.end_date && updateAvailability.spots && updateAvailability.cost) {
      axios.put(`http://localhost:3013/availability/${updateAvailability.id}`, updateAvailability)
        .then(response => {
          setAvailabilities(availabilities.map(availability => 
            availability.id === updateAvailability.id ? response.data : availability
          ));
          setUpdateAvailability({ id: '', start_date: '', end_date: '', spots: '', cost: '' });
          window.location.reload();
        })
        .catch(error => console.error('Error updating availability:', error));
    } else {
      alert('Please fill in all fields before updating an availability.');
    }
  };

  const handleDelete = (id) => {
    axios.delete(`http://localhost:3014/availability/${id}`)
      .then(() => {
        setAvailabilities(availabilities.filter(availability => availability.id !== id));
      })
      .catch(error => console.error('Error deleting availability:', error));
  };

  const handleEditClick = (availability) => {
    setUpdateAvailability(availability);
  };

  return (
    <div className="availability-form">
      <h2>Availability</h2>

      <div className="instructions">
        <h3>Instructions</h3>
        <p>
          <strong>Start Date:</strong> Enter the start date of the availability.<br />
          <strong>End Date:</strong> Enter the end date of the availability.<br />
          <strong>Spots:</strong> Enter the number of spots available.<br />
          <strong>Cost:</strong> Enter the cost per spot.
        </p>
      </div>

      <div>
        <h3>Create Availability</h3>
        <input
          type="date"
          placeholder="Start Date"
          value={newAvailability.start_date}
          onChange={(e) => setNewAvailability({ ...newAvailability, start_date: e.target.value })}
          min={today}
        />
        <input
          type="date"
          placeholder="End Date"
          value={newAvailability.end_date}
          onChange={(e) => setNewAvailability({ ...newAvailability, end_date: e.target.value })}
          min={today}
        />
        <input
          type="number"
          placeholder="Spots"
          value={newAvailability.spots}
          onChange={(e) => setNewAvailability({ ...newAvailability, spots: e.target.value })}
        />
        <input
          type="number"
          placeholder="Cost"
          value={newAvailability.cost}
          onChange={(e) => setNewAvailability({ ...newAvailability, cost: e.target.value })}
        />
        <button onClick={handleCreate}>Create</button>
      </div>

      <div>
        <h3>Update Availability</h3>
        <input
          type="text"
          placeholder="ID"
          value={updateAvailability.id}
          readOnly
        />
        <input
          type="date"
          placeholder="Start Date"
          value={updateAvailability.start_date}
          onChange={(e) => setUpdateAvailability({ ...updateAvailability, start_date: e.target.value })}
          min={today}
        />
        <input
          type="date"
          placeholder="End Date"
          value={updateAvailability.end_date}
          onChange={(e) => setUpdateAvailability({ ...updateAvailability, end_date: e.target.value })}
          min={today}
        />
        <input
          type="number"
          placeholder="Spots"
          value={updateAvailability.spots}
          onChange={(e) => setUpdateAvailability({ ...updateAvailability, spots: e.target.value })}
        />
        <input
          type="number"
          placeholder="Cost"
          value={updateAvailability.cost}
          onChange={(e) => setUpdateAvailability({ ...updateAvailability, cost: e.target.value })}
        />
        <button onClick={handleUpdate}>Update</button>
      </div>

      <div>
        <h3>Availability List</h3>
        <ul>
          {availabilities.map(availability => (
            <li key={availability.id}>
              {availability.start_date} - {availability.end_date} - {availability.spots} spots - ${availability.cost}
              <button onClick={() => handleEditClick(availability)}>Edit</button>
              <button onClick={() => handleDelete(availability.id)}>Delete</button>
            </li>
          ))}
        </ul>
      </div>

      <button className="back-button" onClick={() => navigate('/main')}>Back to Main</button>
    </div>
  );
};

export default AvailabilityForm;
