import React from 'react';

function QRCodeDisplay({ qrCodeDataUrl, pdfUrl, handlePrintQrCode }) {
  if (!qrCodeDataUrl) {
    return null;
  }

  return (
    <div id="printable-area">
      <div className="qr-code-section">
        <h3>QR Code:</h3>
        <img src={qrCodeDataUrl} alt="QR Code for PDF" />
      </div>
      <div className="pdf-link-section">
        <h3>PDF Link:</h3>
        <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
          {pdfUrl}
        </a>
      </div>
      <button id="print-qr-button" className="print-button" onClick={handlePrintQrCode}>
        Print QR Code & Link
      </button>
    </div>
  );
}

export default QRCodeDisplay;
