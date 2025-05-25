import React from 'react';
import { Alert } from 'antd';

function ErrorMessage({ errorMessage }) {
  if (!errorMessage) {
    return null;
  }
  return (
    <Alert
      message={errorMessage}
      type="error"
      showIcon
      style={{ marginBottom: '16px' }} // Optional styling
    />
  );
}

export default ErrorMessage;
