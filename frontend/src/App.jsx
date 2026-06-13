// src/App.jsx

import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

// React Toastify CSS — must be imported globally
import 'react-toastify/dist/ReactToastify.css';

import AppRoutes from './routes/AppRoutes';

function App() {
    return (
        // BrowserRouter enables React Router's history API
        // Everything inside can use useNavigate, useLocation, Link etc.
        <BrowserRouter>

            {/* All page routes render here */}
            <AppRoutes />

            {/* ToastContainer renders toast notifications
                position — where toasts appear on screen
                autoClose — disappear after 3 seconds
                hideProgressBar — cleaner look without the timer bar */}
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                pauseOnHover
                draggable
                theme="light"
            />

        </BrowserRouter>
    );
}

export default App;