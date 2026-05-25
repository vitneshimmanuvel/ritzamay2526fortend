import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Loader2, AlertCircle, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

export default function Register() {
  const setUser = useStore((state) => state.setUser);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/register', { 
        name, 
        email, 
        phoneNumber,
        password, 
        department: department || undefined 
      });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
    } catch (err: any) {
      console.error("Registration failure:", err);
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden">
      {/* Background glowing orbs */}

      <Card className="w-full max-w-md bg-gray-50/50 backdrop-blur-xl border-gray-200 shadow-2xl relative z-10">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto bg-gray-100 p-3 rounded-2xl w-fit ring-1 ring-gray-200">
            <UserPlus className="w-8 h-8 text-red-400" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">Create your account</CardTitle>
          <CardDescription className="text-gray-600">
            Sign up to access your AI assistant
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
                className="bg-gray-50 border-gray-200 text-gray-900 focus-visible:ring-red-500 placeholder:text-gray-400 h-11"
              />
            </div>
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="bg-gray-50 border-gray-200 text-gray-900 focus-visible:ring-red-500 placeholder:text-gray-400 h-11"
              />
            </div>
            <div className="space-y-2">
              <Input
                type="tel"
                placeholder="Phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={loading}
                className="bg-gray-50 border-gray-200 text-gray-900 focus-visible:ring-red-500 placeholder:text-gray-400 h-11"
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
                className="bg-gray-50 border-gray-200 text-gray-900 focus-visible:ring-red-500 placeholder:text-gray-400 h-11"
              />
            </div>

          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" disabled={loading} className="w-full h-11 bg-red-600 hover:bg-red-500 text-white font-medium transition-colors">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
            </Button>
            <p className="text-sm text-gray-500 text-center">
              Already have an account?{' '}
              <Link to="/login" className="text-red-400 hover:text-red-300 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
