const axios = require("axios");

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

if (!YOUTUBE_API_KEY) {
  console.warn(
    "⚠️  YOUTUBE_API_KEY not configured. Video features will be limited."
  );
}

/**
 * Search for educational videos on YouTube based on query
 * @param {string} query - Search query (e.g., "Tutorial on React Hooks")
 * @param {number} maxResults - Number of results to return (default: 3)
 * @returns {Promise<Array>} Array of video objects with id, title, thumbnail
 */
async function searchVideos(query, maxResults = 3) {
  try {
    if (!YOUTUBE_API_KEY) {
      console.warn("YouTube API key not available, returning mock data");
      return getMockVideoData(query);
    }

    console.log(`🎬 Searching YouTube for: "${query}"`);

    const response = await axios.get(`${YOUTUBE_API_BASE}/search`, {
      params: {
        q: query,
        part: "snippet",
        type: "video",
        maxResults: maxResults,
        videoEmbeddable: true,
        key: YOUTUBE_API_KEY,
        order: "relevance",
      },
    });

    const videos = response.data.items.map((item) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.medium.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
    }));

    console.log(`✅ Found ${videos.length} videos for query: "${query}"`);
    return videos;
  } catch (error) {
    console.error("🔥 YouTube API Error:", error.message);

    // Fallback to mock data on error
    console.warn("⚠️  Returning mock data due to API error");
    return getMockVideoData(query);
  }
}

/**
 * Get video details by ID
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<Object>} Video details including duration, view count
 */
async function getVideoDetails(videoId) {
  try {
    if (!YOUTUBE_API_KEY) {
      return null;
    }

    console.log(`🎬 Fetching details for video: ${videoId}`);

    const response = await axios.get(`${YOUTUBE_API_BASE}/videos`, {
      params: {
        id: videoId,
        part: "snippet,contentDetails,statistics",
        key: YOUTUBE_API_KEY,
      },
    });

    if (response.data.items.length === 0) {
      return null;
    }

    const video = response.data.items[0];
    return {
      id: videoId,
      title: video.snippet.title,
      description: video.snippet.description,
      duration: video.contentDetails.duration,
      viewCount: video.statistics.viewCount,
      likeCount: video.statistics.likeCount,
      commentCount: video.statistics.commentCount,
    };
  } catch (error) {
    console.error("🔥 Error fetching video details:", error.message);
    return null;
  }
}

/**
 * Mock data for development/testing when API key is unavailable
 * @param {string} query - Search query
 * @returns {Array} Mock video data
 */
function getMockVideoData(query) {
  const mockVideos = [
    {
      id: "dQw4w9WgXcQ",
      title: `Tutorial: ${query}`,
      description: "This is a mock video. Enable YouTube API for real videos.",
      thumbnail: "https://via.placeholder.com/320x180?text=Video+1",
      channelTitle: "Learn Channel",
      publishedAt: new Date().toISOString(),
    },
    {
      id: "jNQXAC9IVRw",
      title: `Explained: ${query}`,
      description: "This is a mock video. Enable YouTube API for real videos.",
      thumbnail: "https://via.placeholder.com/320x180?text=Video+2",
      channelTitle: "Tech Academy",
      publishedAt: new Date().toISOString(),
    },
    {
      id: "9bZkp7q19f0",
      title: `Beginner Guide to ${query}`,
      description: "This is a mock video. Enable YouTube API for real videos.",
      thumbnail: "https://via.placeholder.com/320x180?text=Video+3",
      channelTitle: "Educational Hub",
      publishedAt: new Date().toISOString(),
    },
  ];

  return mockVideos;
}

module.exports = {
  searchVideos,
  getVideoDetails,
};
