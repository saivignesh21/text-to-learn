import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { Menu, X, BookOpen, ChevronDown } from "lucide-react";
import "./Navbar.css";

const Navbar = () => {
  const { loginWithRedirect, logout, isAuthenticated, user } = useAuth0();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // DEPLOYMENT FIX: Get correct return URL based on environment
  const getLogoutReturnUrl = () => {
    if (window.location.hostname === 'localhost') {
      return 'http://localhost:3000';
    }
    return window.location.origin;
  };

  // FIXED: Improved logout handler for deployment
  const handleLogout = () => {
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    
    console.log('🚪 Logging out from:', window.location.origin);
    
    try {
      // Use logoutParams for Auth0 SDK v2+
      logout({ 
        logoutParams: {
          returnTo: getLogoutReturnUrl()
        }
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback for older Auth0 SDK
      logout({ 
        returnTo: getLogoutReturnUrl()
      });
    }
  };

  const handleLogin = () => {
    setMobileMenuOpen(false);
    console.log('🔐 Initiating login');
    
    loginWithRedirect({
      authorizationParams: {
        redirect_uri: getLogoutReturnUrl(),
      }
    });
  };

  const handleSignup = () => {
    setMobileMenuOpen(false);
    console.log('📝 Initiating signup');
    
    loginWithRedirect({
      authorizationParams: {
        screen_hint: "signup",
        redirect_uri: getLogoutReturnUrl(),
      }
    });
  };

  return (
    <nav className="navbar-modern">
      <div className="navbar-modern-container">
        {/* Logo Section */}
        <Link to="/" className="navbar-modern-logo">
          <div className="logo-icon">
            <BookOpen size={24} />
          </div>
          <span className="logo-text">Text-to-Learn</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="navbar-modern-right">
          {isAuthenticated ? (
            <>
              {/* User Greeting (Desktop) */}
              <div className="user-greeting-modern hidden md:flex">
                <span>Welcome, <strong>{user?.nickname || user?.name || "User"}</strong></span>
              </div>

              {/* Profile Dropdown */}
              <div className="user-menu-wrapper">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="user-menu-trigger"
                >
                  <div className="user-avatar">
                    {user?.picture ? (
                      <img src={user.picture} alt={user.name} />
                    ) : (
                      <span>{user?.name?.charAt(0) || "U"}</span>
                    )}
                  </div>
                  <ChevronDown size={16} className="chevron-icon" />
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="user-dropdown-menu">
                    <Link
                      to="/profile"
                      className="dropdown-item"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <span>👤 Profile</span>
                    </Link>
                    <Link
                      to="/settings"
                      className="dropdown-item"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <span>⚙️ Settings</span>
                    </Link>
                    <div className="dropdown-divider"></div>
                    <button
                      onClick={handleLogout}
                      className="dropdown-item logout-item"
                    >
                      <span>🚪 Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Auth Buttons (Desktop) */
            <div className="auth-buttons-modern">
              <button onClick={handleLogin} className="btn-login-modern">
                Login
              </button>
              <button onClick={handleSignup} className="btn-signup-modern">
                Get Started
              </button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-menu-button md:hidden"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="navbar-mobile-menu">
          {isAuthenticated ? (
            <>
              <div className="mobile-user-info">
                <div className="mobile-avatar">
                  {user?.picture ? (
                    <img src={user.picture} alt={user.name} />
                  ) : (
                    <span>{user?.name?.charAt(0) || "U"}</span>
                  )}
                </div>
                <div>
                  <p className="mobile-user-name">{user?.name}</p>
                  <p className="mobile-user-email">{user?.email}</p>
                </div>
              </div>

              <div className="mobile-menu-divider"></div>

              <Link
                to="/profile"
                className="mobile-menu-item"
                onClick={() => setMobileMenuOpen(false)}
              >
                👤 Profile
              </Link>
              <Link
                to="/settings"
                className="mobile-menu-item"
                onClick={() => setMobileMenuOpen(false)}
              >
                ⚙️ Settings
              </Link>

              <div className="mobile-menu-divider"></div>

              <button
                onClick={handleLogout}
                className="mobile-menu-item logout-item"
              >
                🚪 Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleLogin}
                className="mobile-menu-item login-item"
              >
                Login
              </button>
              <button
                onClick={handleSignup}
                className="mobile-menu-item signup-item"
              >
                Get Started
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;