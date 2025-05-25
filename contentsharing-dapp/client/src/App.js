import React, { useEffect, useState } from "react";
import Web3 from "web3";
import ContentSharingABI from "./ContentSharing.json";
import "./App.css";

const contractAddress = "0x9D84E3d57ca1979cC10ce4ed22f7d8DBcD1d65C0";

const MAX_CHAR = 500;

function App() {
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [imageData, setImageData] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState("All Posts");

  const groups = ["All Posts", "Tech", "Art", "Sports"];

  useEffect(() => {
    async function load() {
      if (window.ethereum) {
        const web3 = new Web3(window.ethereum);
        await window.ethereum.enable();
        const accounts = await web3.eth.getAccounts();
        setAccount(accounts[0]);
        const contract = new web3.eth.Contract(ContentSharingABI.abi, contractAddress);
        setContract(contract);
        const count = await contract.methods.getPostCount().call();
        let tempPosts = [];
        for (let i = 0; i < count; i++) {
          const post = await contract.methods.posts(i).call();
          tempPosts.push({ ...post, id: i });
        }
        setPosts(tempPosts);
        setFilteredPosts(tempPosts);
      } else {
        alert("Install MetaMask!");
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (selectedGroup === "All Posts") {
      setFilteredPosts(posts);
    } else {
      setFilteredPosts(posts.filter(post => post.group === selectedGroup));
    }
  }, [selectedGroup, posts]);

  const connectWallet = async () => {
    if (window.ethereum) {
      const web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
      const accounts = await web3.eth.getAccounts();
      setAccount(accounts[0]);
    } else {
      alert("Install MetaMask!");
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageData(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    if (!contract) {
      alert("Smart contract not loaded yet.");
      return;
    }

    try {
      await contract.methods.createPost(newPost).send({ from: account });

      const postToAdd = {
        author: account,
        content: newPost,
        group: selectedGroup,
        image: imageData,
        removed: false,
        id: posts.length
      };

      setPosts([...posts, postToAdd]);
      setNewPost("");
      setImageData(null);
    } catch (err) {
      console.error("Transaction failed:", err);
      alert("Transaction failed. See console.");
    }
  };

  const handleFlagPost = async (postId) => {
    try {
      await contract.methods.flagPost(postId).send({ from: account });
      alert("Post flagged for review.");
      // Refresh posts
      const count = await contract.methods.getPostCount().call();
      let tempPosts = [];
      for (let i = 0; i < count; i++) {
        const post = await contract.methods.posts(i).call();
        tempPosts.push({ ...post, id: i });
      }
      setPosts(tempPosts);
    } catch (err) {
      console.error("Error flagging post:", err);
    }
  };

  return (
    <div className="app-container">
      <nav className="sidebar">
        <h2>Groups</h2>
        <ul className="group-list">
          {groups.map((group) => (
            <li
              key={group}
              className={selectedGroup === group ? "active-group" : ""}
              onClick={() => setSelectedGroup(group)}
            >
              {group}
            </li>
          ))}
        </ul>
      </nav>

      <main className="main-content">
        <header className="header">
          <h1>ContentSharing Platform</h1>
          {account ? (
            <div className="account-info">Connected: {account}</div>
          ) : (
            <button className="login-button" onClick={connectWallet}>Connect MetaMask</button>
          )}
        </header>

        <form onSubmit={handleSubmit} className="post-form">
          <textarea
            value={newPost}
            onChange={(e) => {
              if (e.target.value.length <= MAX_CHAR) setNewPost(e.target.value);
            }}
            placeholder={`Write your content here... (max ${MAX_CHAR} chars)`}
            rows={4}
          />
          <div className="form-footer">
            <span className="char-count">{newPost.length} / {MAX_CHAR}</span>

            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              id="imageUpload"
              style={{ display: "none" }}
            />
            <label htmlFor="imageUpload" className="upload-label">
              Upload Image
            </label>

            <button type="submit">Post</button>
          </div>
        </form>

        <div className="posts-list">
          {filteredPosts.length === 0 && <p>No posts in this group.</p>}
          {filteredPosts.map((post, index) => {
            if (post.removed) return null;
            return (
              <div key={index} className="post-card">
                <p className="post-author">{post.author}</p>
                <p className="post-content">{post.content}</p>
                {post.image && <img src={post.image} alt="User upload" className="post-image" />}
                {post.group && <p className="post-group">Group: {post.group}</p>}
                <button onClick={() => handleFlagPost(post.id)}>🚩 Flag as Inappropriate</button>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default App;