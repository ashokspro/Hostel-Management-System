// App.js - Your main application file
import React, { useState } from 'react';

// Import your actual components
import Login from './components/Login';
import Header from './components/Header';
import StudentDashboard from './components/StudentDashboard';
import WardenDashboard from './components/WardenDashboard';
import SecurityDashboard from './components/SecurityDashboard';
import ProfileModal from './components/ProfileModal';

const App = () => {
  // State to track current user and page
  const [currentUser, setCurrentUser] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Handle login - called when user successfully logs in
  const handleLogin = (userData) => {
    setCurrentUser(userData);
    addNotification(`Welcome ${userData.name}!`, 'success');
  };

  // Handle logout - called when user clicks logout
  const handleLogout = () => {
    setCurrentUser(null);
    setNotifications([]);
  };

  // Add notification function
  const addNotification = (message, type = 'info') => {
    const newNotification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    setNotifications(prev => [newNotification, ...prev.slice(0, 4)]);
  };

  // Function to render the correct dashboard based on user type
  const renderDashboard = () => {
    if (!currentUser) return null;

    switch (currentUser.userType) {
      case 'student':
        return (
          <StudentDashboard 
            currentUser={currentUser} 
            addNotification={addNotification} 
          />
        );
      case 'warden':
        return (
          <WardenDashboard 
            currentUser={currentUser} 
            addNotification={addNotification} 
          />
        );
      case 'security':
        return (
          <SecurityDashboard 
            currentUser={currentUser} 
            addNotification={addNotification} 
          />
        );
      default:
        return (
          <div className="container py-4">
            <div className="alert alert-danger">
              Unknown user type: {currentUser.userType}
            </div>
          </div>
        );
    }
  };

  // If no user is logged in, show login page
  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  // If user is logged in, show header + appropriate dashboard
  return (
    <div jsx="true" className="min-vh-100 bg-light">
      {/* Header with logout functionality */}
      <Header 
        currentUser={currentUser} 
        onLogout={handleLogout}
        onProfileClick={() => setShowProfileModal(true)}
      />
      
      {/* Render appropriate dashboard */}
      {renderDashboard()}
      
      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileModal 
          currentUser={currentUser}
          onClose={() => setShowProfileModal(false)}
        />
      )}
      
      {/* Toast Notifications */}
      {notifications.length > 0 && (
        <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1050 }}>
          {notifications.slice(0, 3).map((notification) => (
            <div 
              key={notification.id} 
              className={`alert alert-${notification.type} alert-dismissible fade show`} 
              role="alert"
            >
              {notification.message}
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default App;