// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ContentSharing {
    struct Post {
        address author;
        string content;
        uint flags;
        bool removed;
    }

    mapping(uint => Post) public posts;
    mapping(uint => mapping(address => bool)) public hasFlagged;
    uint public postCount;
    uint public flagThreshold = 3;

    function createPost(string memory _content) public {
        posts[postCount] = Post(msg.sender, _content, 0, false);
        postCount++;
    }

    function getPostCount() public view returns (uint) {
        return postCount;
    }

    function flagPost(uint _postId) public {
        require(_postId < postCount, "Invalid post ID");
        require(!hasFlagged[_postId][msg.sender], "Already flagged");

        hasFlagged[_postId][msg.sender] = true;
        posts[_postId].flags++;

        if (posts[_postId].flags >= flagThreshold) {
            posts[_postId].removed = true;
        }
    }
}
