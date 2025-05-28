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

  const handlePrint = useReactToPrint({
    content: () => printableAreaRef.current,
  });

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
