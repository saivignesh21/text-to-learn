import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

const Layout = ({
  courses,
  activeCourse,
  activeLesson,
  courseSource,
  isViewingProfileLesson,
  notification,
  onSelectCourse,
  onSelectLesson,
  onDeleteCourse,
}) => {
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'error':
        return <AlertCircle size={20} />;
      case 'success':
        return <CheckCircle size={20} />;
      default:
        return <Info size={20} />;
    }
  };

  return (
    <div className="app-layout">
      {/* Fixed Navbar */}
      <Navbar />

      {/* Global Notification */}
      {notification && (
        <div className={`global-notification notification-${notification.type}`}>
          <div className="notification-content">
            {getNotificationIcon(notification.type)}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="app-container">
        {/* Sidebar - Hidden on profile page */}
        <Sidebar
          courses={courses}
          activeCourse={activeCourse}
          activeLesson={activeLesson}
          courseSource={courseSource}
          isViewingProfileLesson={isViewingProfileLesson}
          onSelectCourse={onSelectCourse}
          onSelectLesson={onSelectLesson}
          onDeleteCourse={onDeleteCourse}
        />

        {/* Main Content */}
        <main className="app-main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;