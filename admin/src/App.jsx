import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import MenuItems from './pages/MenuItems';
import Categories from './pages/Categories';
import Users from './pages/Users';
import Coupons from './pages/Coupons';
import Messages from './pages/Messages';
import Refunds from './pages/Refunds';
import Sales from './pages/Sales';
import DeliveryPartners from './pages/DeliveryPartners';
import Settings from './pages/Settings';
import Reviews from './pages/Reviews';
import ChangePassword from './pages/ChangePassword';
import Wallets from './pages/Wallets';

function ProtectedRoute({ children }) {
  const auth = JSON.parse(localStorage.getItem('admin-auth') || 'null');
  if (!auth?.token) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter basename="/admin">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="menu" element={<MenuItems />} />
          <Route path="categories" element={<Categories />} />
          <Route path="users" element={<Users />} />
          <Route path="coupons" element={<Coupons />} />
          <Route path="messages" element={<Messages />} />
          <Route path="refunds" element={<Refunds />} />
          <Route path="sales" element={<Sales />} />
          <Route path="delivery-partners" element={<DeliveryPartners />} />
          <Route path="settings" element={<Settings />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="change-password" element={<ChangePassword />} />
          <Route path="wallets" element={<Wallets />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
