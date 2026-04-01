import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-church-200 mb-4">404</p>
        <h1 className="text-xl font-semibold text-gray-800 mb-2">Page not found</h1>
        <p className="text-gray-500 mb-6">This page doesn't exist or you don't have access.</p>
        <Link to="/" className="btn-primary inline-block">Go home</Link>
      </div>
    </div>
  );
}
