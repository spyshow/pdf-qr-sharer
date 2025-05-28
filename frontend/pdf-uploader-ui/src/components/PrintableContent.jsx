import React from 'react';
import { Image } from 'antd'; // Assuming Image component is from antd

const PrintableContent = React.forwardRef((props, ref) => {
  const { fileName, tags, qrCodeDataUrl } = props;

  return (
    <div id="actual-printable-content" ref={ref} style={{ background: 'white' }}> {/* Added white background style */}
      <h1>{fileName || "Name not available"}</h1>
      <h3>{tags || "Tags not available"}</h3>
      {qrCodeDataUrl && <Image width={200} src={qrCodeDataUrl} alt="QR Code" preview={false} />}
    </div>
  );
});

export default PrintableContent;
