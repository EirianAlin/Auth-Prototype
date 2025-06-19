import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Register from './pages/Register';
import SetupMFA from './pages/SetupMFA';
import VerifyMFA from './pages/VerifyMFA';

const App = () => (
  <Router>
    <Routes>
      <Route path='/' element={<Home />} />
      <Route path='/login' element={<Login />} />
      <Route path='/register' element={<Register />} />
      <Route path='/setup-mfa' element={<SetupMFA />} />
      <Route path='/verify-mfa' element={<VerifyMFA />} />
      <Route path='/profile' element={<Profile />} />
    </Routes>
  </Router>
);

export default App;