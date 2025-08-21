import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export function HomePage() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Welcome, Tourist!</h1>
      <p>This is your home page.</p>
      {auth.user && <p>Your role is: {auth.user.role}</p>}
      <button onClick={handleLogout} style={{ background: 'red', color: 'white', padding: '10px', marginTop: '20px' }}>
        Logout
      </button>
    </div>
  );
}