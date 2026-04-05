import React, { useState, useEffect, useCallback } from "react";
import { Play, AlertCircle } from "lucide-react";
import "./VideoBlock.css";

const VideoBlock = ({ query = "" }) => {
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchVideo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!query || query.trim() === "") {
        setError("No video query provided");
        setLoading(false);
        return;
      }

      console.log(`🎬 Fetching video for query: ${query}`);

      // FIXED FOR CREATE REACT APP: Use process.env instead of import.meta.env
      // CRA automatically prefixes with REACT_APP_
      const API_URL = 
        process.env.REACT_APP_API_URL || "http://localhost:5000/api";

      console.log(`📍 Using API URL: ${API_URL}`);

      const videoUrl = `${API_URL}/enrichment/videos/${encodeURIComponent(query)}`;
      console.log(`🔗 Fetching from: ${videoUrl}`);

      const response = await fetch(videoUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data && data.data.length > 0) {
        setVideo(data.data[0]);
        console.log("✅ Video fetched successfully:", data.data[0].title);
      } else {
        setError("No videos found for this topic");
        console.warn("⚠️  No videos found:", data);
      }
    } catch (err) {
      console.error("❌ Error fetching video:", err);
      setError(err.message || "Failed to load video");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    fetchVideo();
  }, [fetchVideo]);

  if (loading) {
    return (
      <div className="video-block-container loading">
        <div className="video-loading">
          <div className="spinner"></div>
          <p>🔍 Searching for videos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="video-block-container error">
        <div className="video-error">
          <AlertCircle size={24} />
          <p>{error}</p>
          <small>Query: {query}</small>
        </div>
      </div>
    );
  }

  if (!video) {
    return null;
  }

  return (
    <div className="video-block-container">
      <div className="video-wrapper">
        {/* Video Thumbnail with Play Button */}
        <div className="video-thumbnail-wrapper">
          <img
            src={video.thumbnail}
            alt={video.title}
            className="video-thumbnail"
          />
          <div className="video-play-overlay">
            <a
              href={`https://www.youtube.com/watch?v=${video.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="video-play-button"
              title="Watch on YouTube"
            >
              <Play size={48} fill="white" />
            </a>
          </div>
        </div>

        {/* Video Info */}
        <div className="video-info">
          <h3 className="video-title">{video.title}</h3>
          <div className="video-meta">
            <span className="video-channel">
              📺 {video.channelTitle || "Educational Content"}
            </span>
            <span className="video-date">
              📅 {new Date(video.publishedAt).toLocaleDateString()}
            </span>
          </div>
          <p className="video-description">
            {video.description?.substring(0, 200)}...
          </p>

          {/* Watch Button */}
          <a
            href={`https://www.youtube.com/watch?v=${video.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="video-watch-button"
          >
            <Play size={16} />
            Watch on YouTube
          </a>
        </div>
      </div>
    </div>
  );
};

export default VideoBlock;

