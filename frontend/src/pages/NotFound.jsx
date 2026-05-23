import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-bold text-gray-200">404</p>
      <h1 className="text-lg font-semibold text-gray-800 mt-4">Page Not Found</h1>
      <p className="text-sm text-gray-500 mt-2">The page you're looking for doesn't exist.</p>
      <Link to="/" className="bg-primary text-white px-6 py-2.5 rounded-xl font-medium text-sm mt-6 active:scale-95 transition-transform">
        Go Home
      </Link>
    </div>
  );
}

export default NotFound;
