// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ContentSharing {

    struct Post {
        address author;
        string content;
        string group;
        bool removed;
        uint flagCount;
        mapping(address => bool) flaggedBy;
    }

    mapping(uint => Post) private posts;
    uint public postCount;

    uint constant FLAG_THRESHOLD = 3;

    event PostCreated(uint postId, address author, string content, string group);
    event PostFlagged(uint postId, address flaggedBy, uint flagCount);
    event PostRemoved(uint postId);

    function createPost(string memory _content, string memory _group) public {
        Post storage newPost = posts[postCount];
        newPost.author = msg.sender;
        newPost.content = _content;
        newPost.group = _group;
        newPost.removed = false;
        newPost.flagCount = 0;
        postCount++;

        emit PostCreated(postCount - 1, msg.sender, _content, _group);
    }

    function flagPost(uint _postId) public {
        require(_postId < postCount, "Invalid post ID");
        Post storage post = posts[_postId];
        require(!post.removed, "Post already removed");
        require(!post.flaggedBy[msg.sender], "Already flagged this post");

        post.flaggedBy[msg.sender] = true;
        post.flagCount++;

        emit PostFlagged(_postId, msg.sender, post.flagCount);

        if(post.flagCount >= FLAG_THRESHOLD) {
            post.removed = true;
            emit PostRemoved(_postId);
        }
    }

    function getPost(uint _postId) public view returns (
        address author,
        string memory content,
        string memory group,
        bool removed,
        uint flagCount
    ) {
        require(_postId < postCount, "Invalid post ID");
        Post storage post = posts[_postId];
        return (
            post.author,
            post.content,
            post.group,
            post.removed,
            post.flagCount
        );
    }

    function getPostCount() public view returns (uint) {
        return postCount;
    }
}
