import React from 'react';
import Logo from '../assets/images/weddn-desktop-logo.svg';

interface StartupLoaderProps {
  loading: boolean;
}

const StartupLoader: React.FC<StartupLoaderProps> = ({ loading }) => {
  if (!loading) return null;

  return (
    <div className="startup-loader">
      <img src={Logo} alt="Loading" className="startup-loader-icon" />
    </div>
  );
};

export default StartupLoader;