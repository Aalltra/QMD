import { API } from './api.js';
import { isAuthenticated, requireAuth, getCurrentUser, showNotification } from './auth.js';

let currentCategory = 'general';

export function initForum() {
    setupForumEventListeners();
    
    if (document.querySelector('.forum-categories a[data-category="general"]')) {
        setupGeneralChat();
    } else {
        loadForumCategory('general');
    }
    
    document.addEventListener('auth:login', () => {
        updateNewThreadButton();
        if (document.getElementById('chatMessages')) {
            loadGeneralChatMessages();
        }
    });
    
    document.addEventListener('auth:logout', () => {
        updateNewThreadButton();
        if (document.getElementById('chatMessages')) {
            document.getElementById('chatMessages').innerHTML = '<p>Please log in to view chat messages</p>';
        }
    });
    
    console.log('Forum module initialized');
}

function setupForumEventListeners() {
    const categoryLinks = document.querySelectorAll('.forum-categories a');
    categoryLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const category = link.getAttribute('data-category');
            currentCategory = category;
            
            categoryLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            loadForumCategory(category);
        });
    });
    
    const newThreadBtn = document.getElementById('newThreadBtn');
    newThreadBtn.addEventListener('click', () => {
        requireAuth(() => {
            const modal = document.getElementById('newThreadModal');
            modal.style.display = 'block';
            
            document.getElementById('threadCategory').value = currentCategory;
        });
    });
    
    const newThreadForm = document.getElementById('newThreadForm');
    newThreadForm.addEventListener('submit', (e) => {
        e.preventDefault();
        createNewThread();
    });
    
    updateNewThreadButton();
}

function updateNewThreadButton() {
    const newThreadBtn = document.getElementById('newThreadBtn');
    if (isAuthenticated()) {
        newThreadBtn.disabled = false;
        newThreadBtn.title = 'Create a new thread';
    } else {
        newThreadBtn.disabled = true;
        newThreadBtn.title = 'Please log in to create a thread';
    }
}

async function loadForumCategory(category) {
    try {
        const threadsContainer = document.getElementById('threadsContainer');
        threadsContainer.innerHTML = '<p>Loading threads...</p>';
        
        const threads = await API.getThreadsByCategory(category);
        
        if (!threads || threads.length === 0) {
            threadsContainer.innerHTML = '<p>No threads in this category. Be the first to create one!</p>';
            return;
        }
        
        threads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        threadsContainer.innerHTML = '';
        threads.forEach(thread => {
            const threadEl = createThreadElement(thread);
            threadsContainer.appendChild(threadEl);
        });
    } catch (error) {
        console.error('Failed to load forum threads:', error);
        document.getElementById('threadsContainer').innerHTML = '<p>Failed to load threads. Please try again later.</p>';
    }
}

function createThreadElement(thread) {
    const threadEl = document.createElement('div');
    threadEl.className = 'thread-item';
    
    const author = API.users.find(user => user.id === thread.userId);
    const authorName = author ? author.username : 'Unknown User';
    
    const createdDate = new Date(thread.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    const contentPreview = thread.content.length > 200 
        ? thread.content.substring(0, 200) + '...' 
        : thread.content;
    
    threadEl.innerHTML = `
        <div class="thread-header">
            <h3 class="thread-title">${thread.title}</h3>
            <div class="thread-meta">
                <span>Posted by ${authorName}</span>
                <span>${createdDate}</span>
            </div>
        </div>
        <div class="thread-content">${contentPreview}</div>
        <div class="thread-footer">
            <span>${thread.comments.length} ${thread.comments.length === 1 ? 'comment' : 'comments'}</span>
            <button class="view-thread-btn" data-thread-id="${thread.id}">View Thread</button>
        </div>
    `;
    
    threadEl.querySelector('.view-thread-btn').addEventListener('click', () => {
        viewThread(thread.id);
    });
    
    return threadEl;
}

async function viewThread(threadId) {
    try {
        const thread = API.threads.find(t => t.id === threadId);
        
        if (!thread) {
            showNotification('Thread not found', 'error');
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        
        const author = API.users.find(user => user.id === thread.userId);
        const authorName = author ? author.username : 'Unknown User';
        
        const createdDate = new Date(thread.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        let commentsHtml = '';
        if (thread.comments && thread.comments.length > 0) {
            thread.comments.forEach(comment => {
                const commentAuthor = API.users.find(user => user.id === comment.userId);
                const commentAuthorName = commentAuthor ? commentAuthor.username : 'Unknown User';
                
                const commentDate = new Date(comment.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                commentsHtml += `
                    <div class="comment-item">
                        <div class="comment-header">
                            <span class="comment-author">${commentAuthorName}</span>
                            <span class="comment-date">${commentDate}</span>
                        </div>
                        <div class="comment-content">${comment.content}</div>
                    </div>
                `;
            });
        } else {
            commentsHtml = '<p>No comments yet. Be the first to comment!</p>';
        }
        
        modal.innerHTML = `
            <div class="modal-content thread-detail">
                <span class="close">&times;</span>
                <div class="thread-view">
                    <div class="thread-header">
                        <h2>${thread.title}</h2>
                        <div class="thread-meta">
                            <span>Posted by ${authorName}</span>
                            <span>${createdDate}</span>
                        </div>
                    </div>
                    <div class="thread-full-content">${thread.content}</div>
                    
                    <div class="thread-comments">
                        <h3>Comments</h3>
                        <div class="comments-list">
                            ${commentsHtml}
                        </div>
                    </div>
                    
                    <div class="add-comment">
                        <h3>Add a Comment</h3>
                        <form id="commentForm">
                            <div class="form-group">
                                <textarea id="commentContent" rows="4" placeholder="Write your comment here..." required></textarea>
                            </div>
                            <button type="submit" id="submitCommentBtn" ${!isAuthenticated() ? 'disabled' : ''}>
                                ${isAuthenticated() ? 'Post Comment' : 'Log in to Comment'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        setTimeout(() => modal.style.display = 'block', 10);
        
        modal.querySelector('.close').addEventListener('click', () => {
            modal.style.display = 'none';
            setTimeout(() => modal.remove(), 300);
        });
        
        const commentForm = modal.querySelector('#commentForm');
        commentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            requireAuth(() => addComment(threadId));
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                setTimeout(() => modal.remove(), 300);
            }
        });
    } catch (error) {
        console.error('Failed to view thread:', error);
        showNotification('Failed to load thread details', 'error');
    }
}

async function addComment(threadId) {
    try {
        const commentContent = document.getElementById('commentContent').value.trim();
        
        if (!commentContent) {
            showNotification('Comment cannot be empty', 'warning');
            return;
        }
        
        if (!isAuthenticated()) {
            showNotification('Please log in to add a comment', 'warning');
            return;
        }
        
        const user = getCurrentUser();
        await API.addComment(threadId, user.id, commentContent);
        
        showNotification('Comment added successfully', 'success');
        
        document.getElementById('commentContent').value = '';
        
        const modal = document.querySelector('.modal');
        modal.style.display = 'none';
        setTimeout(() => {
            modal.remove();
            viewThread(threadId);
        }, 300);
    } catch (error) {
        console.error('Failed to add comment:', error);
        showNotification('Failed to add comment', 'error');
    }
}

async function createNewThread() {
    try {
        if (!isAuthenticated()) {
            showNotification('Please log in to create a thread', 'warning');
            return;
        }
        
        const title = document.getElementById('threadTitle').value.trim();
        const category = document.getElementById('threadCategory').value;
        const content = document.getElementById('threadContent').value.trim();
        
        if (!title || !content) {
            showNotification('Please fill in all fields', 'warning');
            return;
        }
        
        const user = getCurrentUser();
        await API.createThread(user.id, category, title, content);
        
        showNotification('Thread created successfully', 'success');
        
        document.getElementById('newThreadModal').style.display = 'none';
        document.getElementById('threadTitle').value = '';
        document.getElementById('threadContent').value = '';
        
        currentCategory = category;
        document.querySelector(`.forum-categories a[data-category="${category}"]`).click();
    } catch (error) {
        console.error('Failed to create thread:', error);
        showNotification('Failed to create thread', 'error');
    }
}

function setupGeneralChat() {
    const generalLink = document.querySelector('.forum-categories a[data-category="general"]');
    generalLink.textContent = 'General Chat';
    generalLink.innerHTML = '<i class="fas fa-comments"></i> General Chat';
    generalLink.classList.add('active');
    
    document.querySelectorAll('.forum-categories a').forEach(link => {
        if (link !== generalLink) {
            link.classList.remove('active');
        }
    });
    
    const threadsContainer = document.getElementById('threadsContainer');
    threadsContainer.innerHTML = `
        <div class="chat-container">
            <div class="chat-messages" id="chatMessages">
                <p>Loading chat messages...</p>
            </div>
            <div class="chat-input">
                <form id="chatForm">
                    <input type="text" id="chatMessageInput" placeholder="Type a message..." ${!isAuthenticated() ? 'disabled' : ''}>
                    <button type="submit" ${!isAuthenticated() ? 'disabled' : ''}>Send</button>
                </form>
            </div>
        </div>
    `;
    
    if (isAuthenticated()) {
        loadGeneralChatMessages();
    } else {
        document.getElementById('chatMessages').innerHTML = '<p>Please log in to view chat messages</p>';
    }
    
    const chatForm = document.getElementById('chatForm');
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!isAuthenticated()) {
            showNotification('Please log in to send messages', 'warning');
            return;
        }
        
        const messageInput = document.getElementById('chatMessageInput');
        const message = messageInput.value.trim();
        
        if (message) {
            sendGeneralChatMessage(message);
            messageInput.value = '';
        }
    });
}

async function loadGeneralChatMessages() {
    if (!isAuthenticated()) return;
    
    try {
        const threads = await API.getThreadsByCategory('all');
        let allComments = [];
        
        threads.forEach(thread => {
            if (thread.comments && thread.comments.length > 0) {
                thread.comments.forEach(comment => {
                    allComments.push({
                        userId: comment.userId,
                        content: comment.content,
                        createdAt: comment.createdAt
                    });
                });
            }
        });
        
        allComments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        
        if (allComments.length > 50) {
            allComments = allComments.slice(allComments.length - 50);
        }
        
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;
        
        if (allComments.length === 0) {
            chatMessages.innerHTML = '<p>No messages yet. Be the first to say something!</p>';
            return;
        }
        
        let messagesHTML = '';
        let currentDay = null;
        
        for (const message of allComments) {
            const user = API.users.find(u => u.id === message.userId);
            const username = user ? user.username : 'Unknown User';
            
            const messageDate = new Date(message.createdAt).toLocaleDateString();
            if (messageDate !== currentDay) {
                currentDay = messageDate;
                messagesHTML += `<div class="chat-date-separator">${messageDate}</div>`;
            }
            
            const isCurrentUser = user && getCurrentUser() && user.id === getCurrentUser().id;
            
            messagesHTML += `
                <div class="chat-message ${isCurrentUser ? 'current-user' : ''}">
                    <div class="chat-message-user">${username}</div>
                    <div class="chat-message-content">${message.content}</div>
                    <div class="chat-message-time">${new Date(message.createdAt).toLocaleTimeString()}</div>
                </div>
            `;
        }
        
        chatMessages.innerHTML = messagesHTML;
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (error) {
        console.error('Failed to load chat messages:', error);
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            chatMessages.innerHTML = '<p>Failed to load chat messages. Please try again later.</p>';
        }
    }
}

async function sendGeneralChatMessage(message) {
    if (!isAuthenticated()) return;
    
    try {
        
        let generalThread = API.threads.find(t => t.title === 'General Chat Thread');
        
        if (!generalThread) {
            generalThread = await API.createThread(
                getCurrentUser().id,
                'general',
                'General Chat Thread',
                'This thread is used for general chat messages.'
            );
        }
        
        await API.addComment(generalThread.id, getCurrentUser().id, message);
        
        loadGeneralChatMessages();
    } catch (error) {
        console.error('Failed to send chat message:', error);
        showNotification('Failed to send message', 'error');
    }
}