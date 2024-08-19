import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './FacilitiesForm.css';

const FacilitiesForm = () => {
  const [facilities, setFacilities] = useState([]);
  const [newFacility, setNewFacility] = useState({ name: '', descripcion: '', tutor: '' });
  const [updateFacility, setUpdateFacility] = useState({ id: '', name: '', descripcion: '', tutor: '' });
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch facilities on component mount
    axios.get('http://localhost:3007/facilities')
      .then(response => setFacilities(response.data))
      .catch(error => console.error('Error fetching facilities:', error));
  }, []);

  const handleCreate = () => {
    if (newFacility.name && newFacility.descripcion && newFacility.tutor) {
      axios.post('http://localhost:3004/facilities', newFacility)
        .then(response => {
          setFacilities([...facilities, response.data]);
          setNewFacility({ name: '', descripcion: '', tutor: '' });
          window.location.reload();
        })
        .catch(error => console.error('Error creating facility:', error));
    } else {
      alert('Please fill in all fields before creating a facility.');
    }
  };

  const handleUpdate = () => {
    if (updateFacility.name && updateFacility.descripcion && updateFacility.tutor) {
      axios.put(`http://localhost:3005/facilities/${updateFacility.id}`, updateFacility)
        .then(response => {
          setFacilities(facilities.map(facility => 
            facility.id === updateFacility.id ? response.data : facility
          ));
          setUpdateFacility({ id: '', name: '', descripcion: '', tutor: '' });
          window.location.reload();
        })
        .catch(error => console.error('Error updating facility:', error));
    } else {
      alert('Please fill in all fields before updating a facility.');
    }
  };

  const handleDelete = (id) => {
    axios.delete(`http://localhost:3006/facilities/${id}`)
      .then(() => {
        setFacilities(facilities.filter(facility => facility.id !== id));
      })
      .catch(error => console.error('Error deleting facility:', error));
  };

  const handleEditClick = (facility) => {
    setUpdateFacility(facility);
  };

  return (
    <div className="facilities-form">
      <h2>Facilities</h2>

      <div className="instructions">
        <h3>Instructions</h3>
        <p>
          <strong>Name:</strong> Enter the name of the facility.<br />
          <strong>Description:</strong> Provide a brief description of the facility.<br />
          <strong>Tutor:</strong> Specify the name of the tutor responsible for the facility.
        </p>
      </div>

      <div>
        <h3>Create Facility</h3>
        <input
          type="text"
          placeholder="Name"
          value={newFacility.name}
          onChange={(e) => setNewFacility({ ...newFacility, name: e.target.value })}
        />
        <input
          type="text"
          placeholder="Description"
          value={newFacility.descripcion}
          onChange={(e) => setNewFacility({ ...newFacility, descripcion: e.target.value })}
        />
        <input
          type="text"
          placeholder="Tutor"
          value={newFacility.tutor}
          onChange={(e) => setNewFacility({ ...newFacility, tutor: e.target.value })}
        />
        <button onClick={handleCreate}>Create</button>
      </div>

      <div>
        <h3>Update Facility</h3>
        <input
          type="text"
          placeholder="ID"
          value={updateFacility.id}
          readOnly
        />
        <input
          type="text"
          placeholder="Name"
          value={updateFacility.name}
          onChange={(e) => setUpdateFacility({ ...updateFacility, name: e.target.value })}
        />
        <input
          type="text"
          placeholder="Description"
          value={updateFacility.descripcion}
          onChange={(e) => setUpdateFacility({ ...updateFacility, descripcion: e.target.value })}
        />
        <input
          type="text"
          placeholder="Tutor"
          value={updateFacility.tutor}
          onChange={(e) => setUpdateFacility({ ...updateFacility, tutor: e.target.value })}
        />
        <button onClick={handleUpdate}>Update</button>
      </div>

      <div>
        <h3>Facilities List</h3>
        <ul>
          {facilities.map(facility => (
            <li key={facility.id}>
              {facility.name} - {facility.descripcion} - {facility.tutor}
              <button onClick={() => handleEditClick(facility)}>Edit</button>
              <button onClick={() => handleDelete(facility.id)}>Delete</button>
            </li>
          ))}
        </ul>
      </div>

      <button className="back-button" onClick={() => navigate('/main')}>Back to Main</button>
    </div>
  );
};

export default FacilitiesForm;
