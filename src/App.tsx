import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';
import Dashboard from './pages/admin/Dashboard';
import Documents from './pages/admin/Documents';
import UsersList from './pages/admin/Users';
import AppLayout from './components/layout/AppLayout';
import { useStore } from './store/useStore';
import api from './lib/api';
import { Loader2 } from 'lucide-react';

function App() {
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
        } catch (error) {
          console.error("Failed to restore session:", error);
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setInitializing(false);
    };

    restoreSession();
  }, [setUser]);

  if (initializing) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/chat" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/chat" />} />
        
        {/* Main layout routes - Publicly accessible for Chat */}
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/chat" />} />
          <Route path="chat" element={<Chat />} />
          
          {/* Admin Routes - Protected */}
          <Route path="admin" element={
            !user ? <Navigate to="/login" /> : 
            user.role === 'admin' ? <Navigate to="/admin/dashboard" /> : 
            <Navigate to="/chat" />
          } />
          
          {user?.role === 'admin' ? (
            <>
              <Route path="admin/dashboard" element={<Dashboard />} />
              <Route path="admin/documents" element={<Documents />} />
              <Route path="admin/users" element={<UsersList />} />
            </>
          ) : (
            <Route path="admin/*" element={!user ? <Navigate to="/login" /> : <Navigate to="/chat" />} />
          )}
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/chat" />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
