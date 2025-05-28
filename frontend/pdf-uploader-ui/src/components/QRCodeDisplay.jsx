import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Button, Card, Typography, Image, Space } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import PrintableContent from './PrintableContent'; // Import the new component

function QRCodeDisplay({ qrCodeDataUrl, pdfUrl, fileName, tags }) {
  if (!qrCodeDataUrl) {
    return null;
  }

  const printableAreaRef = useRef(); // Ref for the PrintableContent component
  console.log("QRCodeDisplay: printableAreaRef initialized", printableAreaRef); // Log initial ref object

  const handlePrint = useReactToPrint({
    content: () => {
      console.log("useReactToPrint content() called. printableAreaRef.current:", printableAreaRef.current);
      return printableAreaRef.current;
    },
    onBeforeGetContent: () => {
      console.log("useReactToPrint onBeforeGetContent() called. printableAreaRef.current:", printableAreaRef.current);
      return Promise.resolve(); // Required by onBeforeGetContent
    },
    onPrintError: (errorLocation, error) => {
      // Log the error location and the error object itself
      console.error("useReactToPrint onPrintError:", errorLocation, error);
      // It might be useful to see the state of printableAreaRef.current here too, if possible,
      // but the error object itself is more critical.
      console.error("useReactToPrint onPrintError - printableAreaRef.current at time of error:", printableAreaRef.current);
    }
  });

  // Log right before the return statement of QRCodeDisplay
  console.log("QRCodeDisplay: printableAreaRef before return statement. Current value:", printableAreaRef.current);

  return (
    <Card title="Scan QR Code or Open PDF" style={{ marginTop: '20px' }}>
      {/* Hidden component for printing */}
      <div style={{ display: 'none' }}>
        <PrintableContent 
          ref={printableAreaRef} 
          fileName={fileName} 
          tags={tags} 
          qrCodeDataUrl={qrCodeDataUrl} 
        />
      </div>

      {/* Visible content for on-screen display */}
      <div> 
        <h1>{fileName || "Name not available"}</h1>
        <h3>{tags || "Tags not available"}</h3>
        {qrCodeDataUrl && <Image width={200} src={qrCodeDataUrl} alt="QR Code" preview={false} />}
      </div>

      <Space direction="vertical" align="center" size="middle" style={{ width: '100%' }}>
        <Typography.Text>
          PDF Link: <Typography.Link href={pdfUrl} target="_blank" rel="noopener noreferrer">{pdfUrl}</Typography.Link>
        </Typography.Text>
        <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
          Print QR Code & PDF Link
        </Button>
      </Space>
    </Card>
  );
}

export default QRCodeDisplay;
