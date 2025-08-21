import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export function AdminPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login'); // Opciono: preusmeri na login nakon odjave
  };

  return (
    <div>
      <h1>Welcome to the Admin Panel!</h1>
      <button onClick={handleLogout} style={{ background: 'red', color: 'white', padding: '10px', marginTop: '20px' }}>
        Logout
      </button>
    </div>
  );
}