import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Button, Card, Typography, Image, Space } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';

function QRCodeDisplay({ qrCodeDataUrl, pdfUrl, fileName, tags }) {
  const printableAreaRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => printableAreaRef.current,
    documentTitle: fileName || 'QR Code',
    removeAfterPrint: true,
  });

  if (!qrCodeDataUrl) {
    return null;
  }

  return (
    <Card title="Scan QR Code or Open PDF" style={{ marginTop: '20px' }} className="printable-card">
      <div ref={printableAreaRef} className="printable-area">
        <h1>{fileName || "Name not available"}</h1>
        <h3>{tags || "Tags not available"}</h3>
        {qrCodeDataUrl && <Image width={200} src={qrCodeDataUrl} alt="QR Code" preview={false} />}
      </div>

      <Space direction="vertical" align="center" size="middle" style={{ width: '100%', marginTop: '20px' }} className="non-printable">
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
