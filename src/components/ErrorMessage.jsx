// src/components/ErrorMessage.jsx
import '../styles/ErrorMessage.css';
import React from 'react';

const ErrorMessage = ({ message }) => {
    return (
        <div className="error-message">
            <p>Error: {message}</p>
        </div>
    );
};

export default ErrorMessage;


