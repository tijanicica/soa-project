// frontend/src/pages/RegisterPage.jsx

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerUser } from '../services/StakeholdersApi';
import { Loader2, AlertTriangle, Compass, CheckCircle, User, MapPin } from 'lucide-react'; // Dodajemo User i MapPin

export function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('tourist');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      await registerUser({ username, email, password, role });
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Pomoćna funkcija za stilizovanje kartica za odabir uloge
  const getRoleCardClass = (currentRole) => {
    return `flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
      role === currentRole
        ? 'border-cyan-500 bg-cyan-50 scale-105'
        : 'border-gray-200 bg-white hover:border-cyan-300'
    }`;
  };

  return (
    // Glavni kontejner sa pozadinskom slikom
    <div 
      className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-cover bg-center"
      style={{ backgroundImage: 'url(/images/login-background.webp)' }}
    >
      {/* Overlay za zatamnjenje pozadine */}
      <div className="absolute inset-0 bg-black opacity-50"></div>

      {/* Sav sadržaj je relativan u odnosu na overlay da bi bio iznad njega */}
      <div className="relative z-10 w-full max-w-md">

        {/* Logo i naziv aplikacije */}
        <div className="mb-6 text-center">
            <Compass className="mx-auto h-12 w-12 text-white" />
            <h1 className="text-4xl font-bold text-white mt-2">TourApp</h1>
            <p className="text-slate-200 text-sm">Join our community of explorers</p>
        </div>

        {/* Kartica sa formom */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-slate-800">Create an Account</h2>
            <p className="text-gray-500 mt-1">Start your adventure with us today.</p>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4">
            {/* NOVI ODABIR ULOGE SA KARTICAMA */}
            <div className="grid grid-cols-2 gap-4">
              <div className={getRoleCardClass('tourist')} onClick={() => setRole('tourist')}>
                <User className={`h-8 w-8 mb-2 ${role === 'tourist' ? 'text-cyan-600' : 'text-gray-400'}`} />
                <span className={`font-semibold ${role === 'tourist' ? 'text-cyan-700' : 'text-gray-600'}`}>Tourist</span>
              </div>
              <div className={getRoleCardClass('guide')} onClick={() => setRole('guide')}>
                <MapPin className={`h-8 w-8 mb-2 ${role === 'guide' ? 'text-cyan-600' : 'text-gray-400'}`} />
                <span className={`font-semibold ${role === 'guide' ? 'text-cyan-700' : 'text-gray-600'}`}>Guide</span>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" type="text" placeholder="e.g., explorer123" required value={username} onChange={(e) => setUsername(e.target.value)} disabled={isLoading} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required placeholder="Choose a strong password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
            </div>

            <div className="h-10 mt-2">
              {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-2 rounded-md flex items-center gap-2 text-sm">
                  <AlertTriangle size={18} /><span>{error}</span>
                </div>
              )}
              {success && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-2 rounded-md flex items-center gap-2 text-sm">
                  <CheckCircle size={18} /><span>{success}</span>
                </div>
              )}
            </div>

            <Button type="submit" className="w-full h-12 text-lg font-semibold rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 transition-colors" disabled={isLoading || !!success}>
              {isLoading ? <Loader2 className="animate-spin" /> : 'Create Account'}
            </Button>
            
            <p className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold underline text-cyan-600 hover:text-cyan-700">
                Sign In
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}