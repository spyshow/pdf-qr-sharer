import React from 'react';
import { Image } from 'antd';

const PrintableContent = React.forwardRef((props, ref) => {
  const { fileName, tags, qrCodeDataUrl } = props;

  return (
    <div
      id="actual-printable-content"
      ref={ref}
      style={{
        padding: '20px',
        color: 'black', // Ensure text is visible for printing
        background: 'white' // Ensure background is white for printing
      }}
    >
      <h1>{fileName || "Name not available"}</h1>
      <h3>{tags || "Tags not available"}</h3>
      {qrCodeDataUrl && <Image width={200} src={qrCodeDataUrl} alt="QR Code" preview={false} />}
    </div>
  );
});

export default PrintableContent;
