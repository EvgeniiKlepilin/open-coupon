import Logo from '@/assets/logo.png';
import { useState } from 'react';
import './App.css';
import HelloWorld from '@/components/HelloWorld';

function App() {
  const [show, setShow] = useState(false);
  const toggle = () => setShow(!show);

  return (
    <div className="popup-container">
      {show && (
        <div className={`popup-content ${show ? 'opacity-100' : 'opacity-0'}`}>
          <div>
            <a href="https://reactjs.org/" target="_blank" rel="noreferrer">
              <img src={Logo} className="logo" alt="OpenCoupon logo" />
            </a>
            <HelloWorld msg="Welcome to OpenCoupon" />
          </div>
        </div>
      )}
      <button className="toggle-button" onClick={toggle}>
        <img src={Logo} alt="CRXJS logo" className="button-icon" />
      </button>
    </div>
  );
}

export default App;
