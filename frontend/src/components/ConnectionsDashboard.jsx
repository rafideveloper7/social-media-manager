import React, { useState } from "react";
import axios from "axios";
import { Video, Layers, CheckCircle, CloudUpload } from "lucide-react";

const ConnectionsDashboard = ({ userId }) => {
  // Post states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🌟 Clean Native Inline SVG Map for 100% stable brand icons
  const availableSocials = [
    {
      id: "twitter",
      name: "X / Twitter",
      icon: (
        <svg
          className="w-5 h-5 text-black"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      keyGroup: "Gmail Account 1",
    },
    {
      id: "youtube",
      name: "YouTube Shorts",
      icon: (
        <svg
          className="w-5 h-5 text-red-600"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.516 0-9.387.507a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.503 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.507 9.387.507 9.387.507s7.517 0 9.387-.507a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
      keyGroup: "Gmail Account 1",
    },
    {
      id: "linkedin",
      name: "LinkedIn Professional",
      icon: (
        <svg
          className="w-5 h-5 text-blue-700"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z" />
        </svg>
      ),
      keyGroup: "Gmail Account 2",
    },
    {
      id: "facebook",
      name: "Facebook Page",
      icon: (
        <svg
          className="w-5 h-5 text-blue-800"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
      keyGroup: "Gmail Account 2",
    },
    {
      id: "instagram",
      name: "Instagram Business",
      icon: (
        <svg
          className="w-5 h-5 text-pink-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      ),
      keyGroup: "Gmail Account 3",
    },
    {
      id: "tiktok",
      name: "TikTok Creator",
      icon: <Video className="w-5 h-5 text-black" />, // Using native video cam icon for clear look
      keyGroup: "Gmail Account 3",
    },
  ];

  const handlePlatformToggle = (platformId) => {
    if (selectedPlatforms.includes(platformId)) {
      setSelectedPlatforms(selectedPlatforms.filter((id) => id !== platformId));
    } else {
      setSelectedPlatforms([...selectedPlatforms, platformId]);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    if (selectedPlatforms.length === 0) {
      alert("Please choose at least one social media account to blast.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("userId", userId || "65f1a9b2c3d4e5f6a7b8c9d0");
      formData.append("title", title);
      formData.append("description", description);
      formData.append("tags", tags);
      formData.append("platforms", JSON.stringify(selectedPlatforms));

      if (mediaFile) {
        formData.append("file", mediaFile);
      }

      const response = await axios.post(
        "https://smmb.vercel.app/api/posts",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      console.log("Engine Dispatch Result:", response.data);
      alert("Content distributed successfully to Zernio endpoints!");

      setTitle("");
      setDescription("");
      setTags("");
      setMediaFile(null);
      setPreviewUrl("");
      setSelectedPlatforms([]);
    } catch (error) {
      console.error("Core Handshake Crash:", error);
      alert(
        `Pipeline rejection: ${error.response?.data?.message || error.message}`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-slate-50 min-h-screen font-sans">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-600" /> Multi-Account
            Publishing Studio
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Running 6 connected accounts utilizing 3 multi-tenant free developer
            access endpoints.
          </p>
        </div>
        <div className="flex gap-2">
          <span className="bg-green-50 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-green-200 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Engine Secured
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Accounts Connectivity Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-4">
              Active Managed Channels
            </h2>
            <div className="space-y-3">
              {availableSocials.map((social) => {
                const isSelected = selectedPlatforms.includes(social.id);
                return (
                  <div
                    key={social.id}
                    onClick={() => handlePlatformToggle(social.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 p-2 rounded-lg flex items-center justify-center">
                        {social.icon}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-700 text-sm">
                          {social.name}
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium">
                          {social.keyGroup}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-600"
                          : "border-slate-300"
                      }`}
                    >
                      {isSelected && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Post Composer */}
        <div className="lg:col-span-2 text-slate-700">
          <form
            onSubmit={handlePublish}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-5"
          >
            <h2 className="text-lg font-bold text-slate-800">
              Compose Broadcast Campaign
            </h2>

            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">
                Campaign Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Air Drawing Application Live Build"
                required
                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">
                Description / Post Body
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="What do you want to share across networks? Zernio handles text truncation automatically per channel..."
                required
                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">
                Tags (Comma Separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="computervision, nodejs, react"
                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
              />
            </div>

            {/* Drag & Drop Media Box */}
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">
                Media Asset Upload
              </label>
              <div className="border-2 border-dashed border-slate-200 hover:border-slate-300 transition-colors rounded-xl p-6 text-center relative bg-slate-50/50">
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                {!previewUrl ? (
                  <div className="space-y-1">
                    <CloudUpload className="w-8 h-8 mx-auto text-slate-400" />
                    <p className="text-xs text-slate-500 font-medium">
                      Click or Drag Image/Video file here
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Cloudinary handles secure caching auto-processing
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {mediaFile?.type.startsWith("video/") ? (
                      <video
                        src={previewUrl}
                        className="max-h-40 mx-auto rounded-lg"
                        controls
                      />
                    ) : (
                      <img
                        src={previewUrl}
                        alt="Upload Preview"
                        className="max-h-40 mx-auto rounded-lg object-contain"
                      />
                    )}
                    <p className="text-xs font-semibold text-slate-600">
                      {mediaFile?.name}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Trigger Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold text-sm text-white transition-all shadow-sm ${
                loading
                  ? "bg-slate-400 cursor-not-allowed animate-pulse"
                  : "bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99]"
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Processing Media Pipeline...</span>
                </div>
              ) : (
                "Publish Media Update Everywhere Now"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ConnectionsDashboard;
