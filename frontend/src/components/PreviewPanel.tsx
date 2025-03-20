import React, { useEffect, useState } from 'react';
import { Download, FileImage, ThumbsUp, ArrowLeft } from 'lucide-react';

interface PreviewPanelProps {
  previewImage: string | null;
  zipData: Uint8Array | null;
  onSave: () => Promise<void>;
  onBack: () => void;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ previewImage, zipData, onSave, onBack }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (previewImage) {
      setShowAnimation(true);
      const timer = setTimeout(() => setShowAnimation(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [previewImage]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="preview-container">
      <div className="preview-header">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft className="back-icon" />
          <span>Back to Editor</span>
        </button>
        <h2 className="preview-title">Generated QR Code Preview</h2>
        <div className="header-spacer" /> {/* Added spacer for symmetry */}
      </div>
      
      <div className={`preview-content ${previewImage ? 'has-preview' : 'no-preview'}`}>
        {zipData && previewImage ? (
          <div className="preview-result">
            <div className="preview-image-container">
              <img 
                src={previewImage} 
                alt="QR Code with Text Overlay" 
                className={`preview-image ${showAnimation ? 'animate-show' : ''}`} 
              />
              {showAnimation && (
                <div className="success-overlay">
                  <ThumbsUp className="success-icon" />
                </div>
              )}
            </div>
            
            <div className="preview-info">
              <h3>QR Code Image Generated</h3>
              <p>This is an image from your generated ZIP file with QR code and text overlay.</p>
              <button 
                className="download-button" 
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <span className="loading-text">
                    <Download className="download-icon spinning" />
                    Saving...
                  </span>
                ) : (
                  <span className="button-text">
                    <Download className="download-icon" />
                    Save ZIP File
                  </span>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="placeholder">
            <FileImage className="placeholder-icon" />
            <p className="placeholder-text">No preview available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewPanel;