import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { chatAPI, apiUtils } from '../api';
import config from '../config/env';
import './GroupChat.css';

const GroupChat = ({ user }) => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    console.log('🔍 GroupChat useEffect - user:', user?.name, 'isGroupMember:', user?.isGroupMember);
    console.log('🔍 User object:', user);
    
    if (!user) {
      console.log('❌ No user object provided to GroupChat');
      return;
    }
    
    if (!user.isGroupMember) {
      console.log('❌ User is not a group member');
      return;
    }

    // Load existing messages
    loadExistingMessages();

    // Connect to Socket.IO
    const token = getCookie('token') || apiUtils.getToken();
    console.log('Socket connection - token present:', !!token);
    console.log('Token value:', token ? token.substring(0, 20) + '...' : 'null');
    
    const newSocket = io(config.SOCKET_URL, {
      auth: {
        token: token // Get token from cookie or localStorage
      }
    });

    newSocket.on('connect', () => {
      console.log('Connected to Socket.IO');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.log('Socket connection error:', error);
      setIsConnected(false);
    });

    newSocket.on('onlineUsers', (users) => {
      setOnlineUsers(users);
    });

    newSocket.on('newMessage', (messageData) => {
      console.log('Received new message:', messageData);
      setMessages(prev => [...prev, messageData]);
    });

    newSocket.on('userJoined', (userData) => {
      setOnlineUsers(prev => [...prev, userData]);
      setMessages(prev => [...prev, {
        type: 'system',
        message: `${userData.name} joined the chat`,
        timestamp: new Date()
      }]);
    });

    newSocket.on('userLeft', (userData) => {
      setOnlineUsers(prev => prev.filter(user => user.userId !== userData.userId));
      setMessages(prev => [...prev, {
        type: 'system',
        message: `${userData.name} left the chat`,
        timestamp: new Date()
      }]);
    });

    newSocket.on('uploadError', (error) => {
      alert('File upload failed: ' + error.message);
      setUploading(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getCookie = (name) => {
    console.log('All cookies:', document.cookie);
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  };

  // Add logout function to window for debugging
  window.logout = () => {
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    console.log('Cookie cleared. Please log in again.');
  };

  const loadExistingMessages = async () => {
    setLoadingMessages(true);
    try {
      const response = await chatAPI.getMessages();
      
      if (response.data.messages) {
        setMessages(response.data.messages);
        console.log('Loaded existing messages:', response.data.messages.length);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && socket) {
      console.log('Sending message:', newMessage.trim());
      socket.emit('sendMessage', { message: newMessage.trim() });
      setNewMessage('');
    }
  };

  const handleFileSelection = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Add files to selected files
    const newFiles = files.map(file => ({
      file,
      id: Date.now() + Math.random(),
      name: file.name,
      type: file.type,
      size: file.size
    }));

    setSelectedFiles(prev => [...prev, ...newFiles]);
    setShowFilePreview(true);
    
    // Clear the input so the same file can be selected again
    e.target.value = '';
  };

  const removeFile = (fileId) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
    if (selectedFiles.length <= 1) {
      setShowFilePreview(false);
    }
  };

  const uploadSelectedFiles = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    
    try {
      for (const fileData of selectedFiles) {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result.split(',')[1];
          socket.emit('uploadFile', {
            file: base64,
            fileName: fileData.name,
            fileType: fileData.type
          });
        };
        reader.readAsDataURL(fileData.file);
      }
      
      // Clear selected files after upload
      setSelectedFiles([]);
      setShowFilePreview(false);
    } catch (error) {
      console.error('File upload error:', error);
      alert('File upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        socket.emit('uploadFile', {
          file: base64,
          fileName: file.name,
          fileType: file.type
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('File upload error:', error);
      alert('File upload failed');
      setUploading(false);
    }
  };

  const renderMessage = (messageData, index) => {
    console.log('Rendering message:', messageData);
    const isOwnMessage = messageData.userId === user?._id;
    
    if (messageData.type === 'system') {
      return (
        <div key={index} className="system-message">
          <span>{messageData.message}</span>
        </div>
      );
    }

    return (
      <div key={index} className={`message ${isOwnMessage ? 'own-message' : ''}`}>
        <div className="message-header">
          <img 
            src={messageData.profilePic || '/default-avatar.png'} 
            alt={messageData.name}
            className="user-avatar"
          />
          <span className="user-name">{messageData.name}</span>
          <span className="message-time">
            {new Date(messageData.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <div className="message-content">
          {messageData.messageType === 'text' ? (
            <p>{messageData.message}</p>
          ) : messageData.messageType === 'file' && messageData.message && typeof messageData.message === 'object' ? (
            <div className="file-message">
              {messageData.message.fileType && messageData.message.fileType.startsWith('image/') ? (
                <img 
                  src={messageData.message.fileUrl} 
                  alt={messageData.message.fileName}
                  className="file-preview"
                />
              ) : messageData.message.fileType && messageData.message.fileType.startsWith('video/') ? (
                <video 
                  src={messageData.message.fileUrl} 
                  controls
                  className="file-preview"
                />
              ) : (
                <div className="file-attachment">
                  <a 
                    href={messageData.message.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    📎 {messageData.message.fileName}
                  </a>
                </div>
              )}
            </div>
          ) : (
            <p>{messageData.message}</p>
          )}
        </div>
      </div>
    );
  };

  if (!user || !user.isGroupMember) {
    return (
      <div className="group-chat-container">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You need to be a group member to access the chat.</p>
          <button onClick={() => window.location.href = '/dashboard'}>
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group-chat-container">
      <div className="chat-header">
        <div className="header-left">
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="back-btn"
            title="Back to Dashboard"
          >
            ← Back
          </button>
          <h2>Group Chat</h2>
        </div>
        <div className="header-right">
          <div className="connection-status">
            {isConnected ? '🟢 Online' : '🔴 Offline'}
          </div>
          <button 
            onClick={() => {
              console.log('All cookies:', document.cookie);
              console.log('Token:', getCookie('token'));
            }}
            style={{ marginLeft: '10px', padding: '5px 10px' }}
          >
            Debug Cookies
          </button>
        </div>
      </div>
      
      <div className="chat-layout">
        <div className="online-users">
          <h3>Online Users ({onlineUsers.length})</h3>
          <div className="users-list">
            {onlineUsers.map((userData) => (
              <div key={userData.userId} className="online-user">
                <img 
                  src={userData.profilePic || '/default-avatar.png'} 
                  alt={userData.name}
                  className="user-avatar-small"
                />
                <span>{userData.name}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="chat-main">
          <div className="messages-container">
            {loadingMessages ? (
              <div className="loading-messages">
                <div className="loading-spinner"></div>
                <p>Loading messages...</p>
              </div>
            ) : (
              <>
                {messages.map((messageData, index) => renderMessage(messageData, index))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
          
          <form onSubmit={sendMessage} className="message-input-container">
            <div className="input-group">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="message-input"
                disabled={!isConnected}
              />
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="file-upload-btn"
                disabled={!isConnected || uploading}
                title="Add files"
              >
                📎
              </button>
              <button 
                type="submit" 
                className="send-btn"
                disabled={!isConnected || !newMessage.trim()}
              >
                Send
              </button>
            </div>
            
            {/* File Preview Area */}
            {showFilePreview && selectedFiles.length > 0 && (
              <div className="file-preview-area">
                <div className="file-preview-header">
                  <span>Selected Files ({selectedFiles.length})</span>
                  <button 
                    type="button" 
                    onClick={() => {
                      setSelectedFiles([]);
                      setShowFilePreview(false);
                    }}
                    className="clear-files-btn"
                  >
                    ✕
                  </button>
                </div>
                <div className="selected-files">
                  {selectedFiles.map((fileData) => (
                    <div key={fileData.id} className="selected-file">
                      <span className="file-name">{fileData.name}</span>
                      <span className="file-size">({(fileData.size / 1024).toFixed(1)} KB)</span>
                      <button 
                        type="button" 
                        onClick={() => removeFile(fileData.id)}
                        className="remove-file-btn"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <button 
                  type="button" 
                  onClick={uploadSelectedFiles}
                  className="upload-files-btn"
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} File${selectedFiles.length > 1 ? 's' : ''}`}
                </button>
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelection}
              accept="image/*,video/*,.pdf,.doc,.docx"
              multiple
              style={{ display: 'none' }}
            />
            {uploading && <div className="upload-status">Uploading files...</div>}
          </form>
        </div>
      </div>
    </div>
  );
};

export default GroupChat; 