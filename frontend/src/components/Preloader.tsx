import React from 'react';
import { Loader2 } from 'lucide-react';

interface PreloaderProps {
  loading: boolean;
}

const Preloader: React.FC<PreloaderProps> = ({ loading }) => {
  if (!loading) return null;
  
  return (
    <div className="preloader">
      <div className="preloader-content">
        <Loader2 className="preloader-icon" />
        <p className="preloader-text">Loading...</p>
      </div>
    </div>
  );
};

export default Preloader;
