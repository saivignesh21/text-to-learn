// src/components/PromptFormCreate.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { apiRequest } from "../utils/api";

const PromptFormCreate = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { getAccessTokenSilently } = useAuth0();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      const token = await getAccessTokenSilently();
      const body = {
        title,
        description,
        tags: tags ? tags.split(",").map((t) => t.trim()) : [],
        modules: [],
      };
      const res = await apiRequest("/courses", "POST", body, token);

      const courseId = res.courseId || res._id;
      navigate(courseId ? `/courses/${courseId}` : "/my-courses");
    } catch (err) {
      console.error(err);
      alert("Failed to create course");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded">
      <h3 className="text-lg font-semibold mb-2">Create Course</h3>
      <input
        className="w-full mb-2 p-2 border rounded"
        placeholder="Course title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <textarea
        className="w-full mb-2 p-2 border rounded"
        placeholder="Short description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <input
        className="w-full mb-2 p-2 border rounded"
        placeholder="tags (comma separated)"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
      />
      <button
        type="submit"
        className="bg-blue-600 text-white px-3 py-1 rounded"
        disabled={loading}
      >
        {loading ? "Creating..." : "Create"}
      </button>
    </form>
  );
};

export default PromptFormCreate;
