import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { getAllUsers, blockUser } from '../services/StakeholdersApi';
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, AlertTriangle, Users, LogOut, Ban } from 'lucide-react';

export function AdminPage() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getAllUsers();
        setUsers(data || []);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to fetch users.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleBlockUser = async (userIdToBlock) => {
    if (window.confirm('Are you sure you want to block this user?')) {
      try {
        await blockUser(userIdToBlock);
        setUsers(users.map(user => 
          user.id === userIdToBlock ? { ...user, isActive: false } : user
        ));
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to block user.');
      }
    }
  }; // <-- ISPRAVKA #1: DODATA JE ZAGRADA KOJA NEDOSTAJE

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-cyan-600" />
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Admin Panel</h1>
              <p className="text-slate-500">User Management</p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="destructive" className="flex items-center gap-2">
            <LogOut size={16} />
            Logout
          </Button>
        </header>

        <div className="bg-white rounded-lg shadow-md p-6">
          {isLoading && (
            <div className="flex justify-center items-center p-10">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
              <p className="ml-4 text-slate-600">Loading users...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md flex items-center gap-3">
              <AlertTriangle size={20} />
              <span>{error}</span>
            </div>
          )}

          {!isLoading && !error && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.id}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    
                    {/* --- ISPRAVKA #3: VRAĆEN KOD ZA PRIKAZ ROLE --- */}
                    <TableCell>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'administrator' ? 'bg-purple-200 text-purple-800' :
                        user.role === 'guide' ? 'bg-blue-200 text-blue-800' :
                        'bg-green-200 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                    </TableCell>

                    <TableCell>
                       <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isActive ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Blocked'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {user.isActive && auth.user && user.id !== parseInt(auth.user.id) && (
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleBlockUser(user.id)}
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          Block
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
} // <-- ISPRAVKA #2: OBRISANA JE VIŠAK ZAGRADA SA KRAJA