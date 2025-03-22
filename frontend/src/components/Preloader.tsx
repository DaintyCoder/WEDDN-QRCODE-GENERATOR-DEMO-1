import React from 'react';
import Logo from '../assets/images/weddn-desktop-logo.svg';

interface PreloaderProps {
  loading: boolean;
}

const Preloader: React.FC<PreloaderProps> = ({ loading }) => {
  if (!loading) return null;

  return (
    <div className="preloader">
      <div className="preloader-content">
        <img src={Logo} alt="Loading" className="preloader-icon" />
        <p className="preloader-text">Loading...</p>
      </div>
    </div>
  );
};

export default Preloader;