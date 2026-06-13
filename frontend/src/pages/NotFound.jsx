// src/pages/NotFound.jsx

import { useNavigate } from 'react-router-dom';

function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center
                        bg-gradient-to-br from-blue-900 to-blue-500">
            <div className="bg-white rounded-2xl shadow-2xl p-12 text-center max-w-md">
                <div className="text-8xl font-black text-blue-800 mb-4">404</div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                    Page Not Found
                </h1>
                <p className="text-gray-500 mb-8">
                    The page you're looking for doesn't exist.
                </p>
                <button
                    onClick={() => navigate(-1)}
                    className="bg-blue-800 text-white px-6 py-3 rounded-lg
                               font-semibold hover:bg-blue-900 transition-colors"
                >
                    Go Back
                </button>
            </div>
        </div>
    );
}

export default NotFound;