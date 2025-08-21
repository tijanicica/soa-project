import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, AlertTriangle, Compass } from 'lucide-react';
import { useAuth } from '../hooks/useAuth'; // <-- 1. Uvezite useAuth hook

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth(); // <-- 2. Dobavite login funkciju iz konteksta

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      // --- 3. KORISTITE LOGIN FUNKCIJU IZ KONTEKSTA ---
      // Ona će sama sačuvati token, dekodirati ga i ažurirati globalno stanje.
      const userRole = await login(username, password);

      // Sada samo preusmerite na osnovu uloge koju je vratila login funkcija
      switch (userRole) {
        case 'tourist':
          navigate('/home');
          break;
        case 'guide':
          navigate('/guide');
          break;
        case 'administrator':
          navigate('/admin');
          break;
        default:
          console.warn(`Unknown role: ${userRole}`);
          setError('Invalid user role.');
          break;
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Login failed. Please check your credentials.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-2">
      
      {/* LEVA STRANA: Forma */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-12 bg-slate-50">
        <div className="mb-8 text-center">
            <Compass className="mx-auto h-12 w-12 text-cyan-600" />
            <h1 className="text-4xl font-bold text-slate-800 mt-2">TourApp</h1>
            <p className="text-slate-500 text-sm">Your next adventure starts here</p>
        </div>

        {/* --- POČETAK IZMENE: motion.div je zamenjen običnim div --- */}
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 sm:p-10">
        {/* --- KRAJ IZMENE --- */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-800">Welcome Back!</h2>
            <p className="text-gray-500 mt-1">Please enter your details to sign in.</p>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="username" className="font-semibold text-gray-700">Username</Label>
              <Input
                  id="username"
                  type="text"
                  placeholder="e.g., turista_mika"
                  required
                  className="h-12 bg-gray-50 border-gray-300 focus:border-cyan-500 focus:ring-cyan-500 rounded-md"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="password" className="font-semibold text-gray-700">Password</Label>
              <Input
                  id="password"
                  type="password"
                  required
                  placeholder="Enter your password"
                  className="h-12 bg-gray-50 border-gray-300 focus:border-cyan-500 focus:ring-cyan-500 rounded-md"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
            </div>
            
            <div className="h-14">
              {error && (
                // --- POČETAK IZMENE: motion.div je zamenjen običnim div --- */}
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded-md flex items-center gap-3 text-sm">
                {/* --- KRAJ IZMENE --- */}
                  <AlertTriangle size={20} />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-lg font-semibold rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 transition-colors -mt-6"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="animate-spin" /> : 'Sign In'}
            </Button>
            
            <p className="text-center text-sm text-gray-600">
              Don't have an account?{" "}
              <Link to="/register" className="font-semibold underline text-cyan-600 hover:text-cyan-700">
                Register
              </Link>
            </p>
          </form>
        </div>
      </div>

      {/* DESNA STRANA: Slika */}
      <div className="hidden lg:flex relative items-center justify-center bg-gray-900">
        <img
         src="/images/login-background.webp"
          alt="An inspiring travel destination"
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
        <div className="relative z-10 text-center text-white p-10">
           {/* --- POČETAK IZMENE: motion.div je zamenjen običnim div --- */}
           <div>
           {/* --- KRAJ IZMENE --- */}
            <h2 className="text-5xl font-extrabold leading-tight tracking-tight">
              Discover the world, <br /> one journey at a time.
            </h2>
            <p className="mt-4 text-lg text-gray-200 max-w-md mx-auto">
              Find unique tours, create your own adventures, and share your experiences.
            </p>
           </div>
        </div>
      </div>
    </div>
  );
}