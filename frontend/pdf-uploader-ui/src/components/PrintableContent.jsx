import React from 'react';
// Image import might not be needed if we are removing it for this diagnostic step.
// However, to minimize changes if we revert, let's keep it for now.
import { Image } from 'antd'; 

const PrintableContent = React.forwardRef((props, ref) => {
  console.log("PrintableContent: Rendering. Props received:", props); // Added console.log

  const { fileName } = props; // Only need fileName for this simplified version

  return (
    <div 
      id="actual-printable-content" 
      ref={ref} 
      style={{ 
        border: '2px solid red', 
        background: 'yellow', 
        padding: '10px', 
        marginTop: '10px', // Add some margin to separate from other content if visible
        minWidth: '50px', // Ensure it has some dimension
        minHeight: '50px' // Ensure it has some dimension
      }}
    >
      <p>PRINTABLE CONTENT (Debug):</p>
      <p>File Name: {fileName || "No Filename Prop Provided"}</p>
      {/* The H1, H3, and Image are temporarily removed for this diagnostic step */}
      {/* We are testing the ref assignment to this div itself */}
    </div>
  );
});

export default PrintableContent;
