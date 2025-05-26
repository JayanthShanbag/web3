import React, { useEffect, useState } from "react";
import Web3 from "web3";
import ContentSharingABI from "./ContentSharing.json";
import "./App.css";

const contractAddress = "0x8C28fC1669f094f02F09CeC69771eb7c2069cd72";
const MAX_CHAR = 500;
const FLAG_THRESHOLD = 3;

function App() {
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("All Posts");
  const [flaggedPostIds, setFlaggedPostIds] = useState(new Set());
  const [imageMap, setImageMap] = useState({});
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const groups = ["All Posts", "Tech", "Art", "Sports"];

  // Load theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setDarkMode(savedTheme === 'dark');
    } else {
      // Check system preference
      setDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }, []);

  // Save theme preference and apply to document
  useEffect(() => {
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    async function load() {
      if (window.ethereum) {
        const web3 = new Web3(window.ethereum);
        try {
          setIsLoading(true);
          await window.ethereum.request({ method: "eth_requestAccounts" });
          const accounts = await web3.eth.getAccounts();
          setAccount(accounts[0]);
          const csContract = new web3.eth.Contract(ContentSharingABI.abi, contractAddress);
          setContract(csContract);
          await loadPosts(csContract);
        } catch {
          alert("Please connect to MetaMask.");
        } finally {
          setIsLoading(false);
        }
      } else {
        alert("Please install MetaMask.");
      }
    }

    if (account || window.ethereum) {
      load();
    }
  }, []);

  async function loadPosts(contractInstance) {
    try {
      const count = await contractInstance.methods.getPostCount().call();
      let tempPosts = [];
      for (let i = 0; i < count; i++) {
        const post = await contractInstance.methods.getPost(i).call();
        tempPosts.push({
          id: i,
          author: post.author,
          content: post.content,
          group: post.group,
          removed: post.removed,
          flagCount: Number(post.flagCount),
          timestamp: new Date(Date.now() - Math.random() * 86400000).toLocaleString()
        });
      }
      setPosts(tempPosts);
      setFilteredPosts(tempPosts);
    } catch (error) {
      console.error("Error loading posts:", error);
    }
  }

  useEffect(() => {
    if (selectedGroup === "All Posts") {
      setFilteredPosts(posts);
    } else {
      setFilteredPosts(posts.filter((post) => post.group === selectedGroup));
    }
  }, [selectedGroup, posts]);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        setIsLoading(true);
        const web3 = new Web3(window.ethereum);
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const accounts = await web3.eth.getAccounts();
        setAccount(accounts[0]);
        const csContract = new web3.eth.Contract(ContentSharingABI.abi, contractAddress);
        setContract(csContract);
        await loadPosts(csContract);
      } catch {
        alert("Connection failed.");
      } finally {
        setIsLoading(false);
      }
    } else {
      alert("Install MetaMask!");
    }
  };

  const logout = () => {
    setAccount("");
    setContract(null);
    setPosts([]);
    setFilteredPosts([]);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageMap((prev) => ({ ...prev, temp: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    if (!contract) return alert("Smart contract not loaded yet.");

    try {
      setIsLoading(true);
      await contract.methods.createPost(newPost, selectedGroup === "All Posts" ? "Tech" : selectedGroup).send({ from: account });
      const postId = posts.length;
      if (imageMap.temp) {
        setImageMap((prev) => {
          const updated = { ...prev };
          updated[postId] = updated.temp;
          delete updated.temp;
          return updated;
        });
      }
      await loadPosts(contract);
      setNewPost("");
    } catch (err) {
      console.error("Transaction failed:", err);
      alert("Transaction failed. See console.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFlagPost = async (postId) => {
    if (flaggedPostIds.has(postId)) {
      alert("You've already flagged this post.");
      return;
    }

    try {
      await contract.methods.flagPost(postId).send({ from: account });
      setFlaggedPostIds(new Set(flaggedPostIds).add(postId));
      await loadPosts(contract);
    } catch (err) {
      console.error("Error flagging post:", err);
      alert("You have likely already flagged this post.");
    }
  };

  const removeImagePreview = () => {
    setImageMap(prev => {
      const updated = { ...prev };
      delete updated.temp;
      return updated;
    });
  };

  if (!account) {
    return (
      <div className={`login-container ${darkMode ? 'dark' : ''}`}>
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">
              <div className="logo-icon">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <rect width="40" height="40" rx="12" fill="url(#gradient)" />
                  <path d="M12 20L18 26L28 14" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="100%" stopColor="#8B5CF6" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <h1>ContentShare</h1>
            </div>
            <p className="login-subtitle">Decentralized Social Platform</p>
          </div>

          <div className="login-features">
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <div>
                <h3>Web3 Features</h3>
                <ul>
                  <li>Blockchain-powered content</li>
                  <li>Community moderation</li>
                  <li>Decentralized storage</li>
                </ul>
              </div>
            </div>
          </div>

          <button 
            onClick={connectWallet}
            disabled={isLoading}
            className="connect-button"
          >
            {isLoading ? (
              <div className="loading-spinner"></div>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke="currentColor" strokeWidth="2"/>
                  <polyline points="3.27,6.96 12,12.01 20.73,6.96" stroke="currentColor" strokeWidth="2"/>
                  <line x1="12" y1="22.08" x2="12" y2="12" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Connect MetaMask
              </>
            )}
          </button>

          <p className="login-footer">Secure wallet connection required</p>

          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="theme-toggle"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`app-container ${darkMode ? 'dark' : ''}`}>
      {/* Sidebar */}
      <nav className="sidebar">
        <div className="sidebar-header">
          <h2>ContentShare</h2>
        </div>
        
        <div className="group-list">
          {groups.map((group) => (
            <div
              key={group}
              onClick={() => setSelectedGroup(group)}
              className={`group-item ${selectedGroup === group ? 'active-group' : ''}`}
            >
              <span className="group-icon">
                {group === "All Posts" && "📋"}
                {group === "Tech" && "⚡"}
                {group === "Art" && "🎨"}
                {group === "Sports" && "⚽"}
              </span>
              {group}
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="account-card">
            <div className="account-info">
              <p className="account-label">Connected Account</p>
              <p className="account-address">{account.slice(0, 6)}...{account.slice(-4)}</p>
            </div>
            <button onClick={logout} className="logout-button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        <div className="main-header">
          <div className="header-content">
            <h1>{selectedGroup}</h1>
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="theme-toggle"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>

        {/* Post Form */}
        <div className="post-form-container">
          <div className="post-form">
            <div className="user-avatar">
              <div className="avatar-placeholder">
                {account.slice(2, 4).toUpperCase()}
              </div>
            </div>
            <div className="post-input-container">
              <textarea
                value={newPost}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_CHAR) setNewPost(e.target.value);
                }}
                placeholder="What's happening?"
                className="post-textarea"
                rows={3}
              />
              
              {imageMap.temp && (
                <div className="image-preview">
                  <img src={imageMap.temp} alt="Preview" />
                  <button
                    onClick={removeImagePreview}
                    className="remove-image"
                  >
                    ×
                  </button>
                </div>
              )}

              <div className="post-actions">
                <div className="post-tools">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    id="imageUpload"
                    className="hidden-input"
                  />
                  <label htmlFor="imageUpload" className="tool-button">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="2"/>
                      <polyline points="21,15 16,10 5,21" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </label>
                  
                  <span className={`char-count ${newPost.length > MAX_CHAR * 0.8 ? 'warning' : ''}`}>
                    {newPost.length} / {MAX_CHAR}
                  </span>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!newPost.trim() || isLoading}
                  className="post-button"
                >
                  {isLoading ? (
                    <div className="loading-spinner small"></div>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <line x1="22" y1="2" x2="11" y2="13" stroke="currentColor" strokeWidth="2"/>
                        <polygon points="22,2 15,22 11,13 2,9 22,2" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      Post
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Posts List */}
        <div className="posts-container">
          {filteredPosts.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h3>No posts in this group yet</h3>
              <p>Be the first to share something!</p>
            </div>
          )}
          
          {filteredPosts.map((post) => {
            if (post.removed) return null;
            return (
              <div key={post.id} className="post-card">
                <div className="post-header">
                  <div className="post-avatar">
                    {post.author.slice(2, 4).toUpperCase()}
                  </div>
                  <div className="post-meta">
                    <div className="post-author">{post.author.slice(0, 8)}...</div>
                    <div className="post-details">
                      <span className="post-group">{post.group}</span>
                      <span className="post-time">{post.timestamp}</span>
                    </div>
                  </div>
                </div>
                
                <div className="post-content">{post.content}</div>
                
                {imageMap[post.id] && (
                  <div className="post-image-container">
                    <img src={imageMap[post.id]} alt="Post" className="post-image" />
                  </div>
                )}
                
                <div className="post-footer">
                  <div className="post-stats">
                    <span className="flag-count">
                      🚩 {post.flagCount} / {FLAG_THRESHOLD} flags
                    </span>
                  </div>
                  
                  <button
                    onClick={() => handleFlagPost(post.id)}
                    disabled={flaggedPostIds.has(post.id)}
                    className={`flag-button ${flaggedPostIds.has(post.id) ? 'flagged' : ''}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" stroke="currentColor" strokeWidth="2"/>
                      <line x1="4" y1="22" x2="4" y2="15" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    {flaggedPostIds.has(post.id) ? "Flagged" : "Flag"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Right Sidebar */}
      <aside className="right-sidebar">
        <div className="stats-card">
          <h3>Platform Stats</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Total Posts</span>
              <span className="stat-value">{posts.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Active Groups</span>
              <span className="stat-value">{groups.length - 1}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Your Posts</span>
              <span className="stat-value">
                {posts.filter(p => p.author === account).length}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default App;