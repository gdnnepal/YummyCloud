import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import OrderDetail from './pages/OrderDetail';
import History from './pages/History';
import ChangePassword from './pages/ChangePassword';

function ProtectedRoute({ children }) {
  const auth = JSON.parse(localStorage.getItem('rider-auth') || 'null');
  if (!auth?.token) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter basename="/rider">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
