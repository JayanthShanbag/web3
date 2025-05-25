// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ContentSharing {
    struct Post {
        address author;
        string content;
    }

    Post[] public posts;

    event NewPost(address indexed author, string content);

    function createPost(string memory content) public {
        posts.push(Post(msg.sender, content));
        emit NewPost(msg.sender, content);
    }

    function getPostCount() public view returns (uint) {
        return posts.length;
    }
}
