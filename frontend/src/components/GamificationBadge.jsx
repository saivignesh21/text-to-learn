import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Flame, Star, Award } from 'lucide-react';
import { getUserProgress } from '../utils/api';
import './GamificationBadge.css';

const GamificationBadge = () => {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();
  const [stats, setStats] = useState({
    level: 1,
    xp: 0,
    streakCount: 0,
    nextLevelXp: 100
  });

  const fetchStats = async () => {
    if (!isAuthenticated) return;
    try {
      const token = await getAccessTokenSilently();
      const response = await getUserProgress(null, token);
      if (response?.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch gamification stats", error);
    }
  };

  useEffect(() => {
    fetchStats();

    // Listen for lesson completion events to update stats instantly
    const handleProgressUpdate = () => {
      fetchStats();
    };

    window.addEventListener('progress_updated', handleProgressUpdate);
    return () => {
      window.removeEventListener('progress_updated', handleProgressUpdate);
    };
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  const xpProgress = Math.min(100, Math.max(0, (stats.xp / stats.nextLevelXp) * 100));

  return (
    <div className="gamification-badge">
      <div className="stat-item streak" title={`${stats.streakCount} Day Streak!`}>
        <Flame size={16} className={stats.streakCount > 0 ? 'active' : ''} />
        <span>{stats.streakCount}</span>
      </div>
      
      <div className="stat-item level" title={`Level ${stats.level}`}>
        <Award size={16} className="active" />
        <span>Lvl {stats.level}</span>
      </div>

      <div className="xp-bar-container" title={`${stats.xp} / ${stats.nextLevelXp} XP`}>
        <div className="xp-bar-fill" style={{ width: `${xpProgress}%` }}></div>
      </div>
    </div>
  );
};

export default GamificationBadge;
