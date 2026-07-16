import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import PublicDashboard from './pages/PublicDashboard';
import MemberDashboard from './pages/MemberDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" />;
  return children;
};

function App() {
  const { user } = useContext(AuthContext);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<PublicDashboard />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              {(user?.role === 'admin' || user?.role === 'co_admin') ? <Navigate to="/admin" /> : <MemberDashboard />}
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/admin" 
          element={
            <PrivateRoute allowedRoles={['admin', 'co_admin']}>
              <AdminDashboard />
            </PrivateRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
