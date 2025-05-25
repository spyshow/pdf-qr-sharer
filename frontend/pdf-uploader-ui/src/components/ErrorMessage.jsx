import React from 'react';

function ErrorMessage({ errorMessage }) {
  if (!errorMessage) {
    return null;
  }

  return (
    <div className="error-message">
      <p>Error: {errorMessage}</p>
    </div>
  );
}

export default ErrorMessage;
