import React from 'react';
import { Download, FileImage } from 'lucide-react';

interface PreviewPanelProps {
  previewImage: string | null;
  zipData: Uint8Array | null;
  onSave: () => Promise<void>;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ previewImage, zipData, onSave }) => {
  return (
    <div className="preview-panel">
      <h2 style={{ marginBottom: '1rem' }}>Preview</h2>
      
      <div className="preview-container">
        {zipData && previewImage ? (
          <>
            <img src={previewImage} alt="QR Code Preview" className="preview-image" />
            <div className="preview-info">
              <h3>QR Code Generated</h3>
              <p>Your QR code has been positioned on the image as specified.</p>
              <button className="btn btn-success" onClick={onSave}>
                <Download size={18} />
                Save ZIP File
              </button>
            </div>
          </>
        ) : (
          <div className="preview-placeholder">
            <FileImage size={48} />
            <p>Generated QR code preview will appear here after generation</p>
            <p className="file-drop-hint">Click "Generate QR Codes" to see the preview</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewPanel;
