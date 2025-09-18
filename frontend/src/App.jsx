import React from 'react';
import Login from './pages/login';
import Student from './pages/student'; 

const App = () => {
    return (
        <div>
            <Login />
            <Student />
            {/* You can add more components or routes here as needed */}
        </div>
    );
};

export default App;