import openCouponLogo from '@/assets/logo.png';
import HelloWorld from '@/components/HelloWorld';
import './App.css';

export default function App() {
  return (
    <div>
      <a href="https://reactjs.org/" target="_blank" rel="noreferrer">
        <img src={openCouponLogo} className="logo" alt="OpenCoupon logo" />
      </a>
      <HelloWorld msg="Welcome to OpenCoupon" />
    </div>
  );
}
