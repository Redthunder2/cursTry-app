class VideoChat {
    constructor(roomId) {
        this.roomId = roomId;
        this.userName = '';
        this.localStream = null;
        this.remoteStream = null;
        this.peerConnection = null;
        this.connection = null;
        this.isVideoEnabled = true;
        this.isAudioEnabled = true;
        this.isChatOpen = false;
        this.isScreenSharing = false;
        
        // WebRTC configuration
        this.rtcConfiguration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        };
        
        this.initialize();
    }
    
    async initialize() {
        this.setupDOMElements();
        this.setupEventListeners();
        await this.setupSignalR();
        this.showUserNameModal();
    }
    
    setupDOMElements() {
        // Video elements
        this.localVideo = document.getElementById('localVideo');
        this.remoteVideo = document.getElementById('remoteVideo');
        this.remoteUserName = document.getElementById('remoteUserName');
        
        // Control buttons
        this.toggleVideoBtn = document.getElementById('toggleVideo');
        this.toggleAudioBtn = document.getElementById('toggleAudio');
        this.shareScreenBtn = document.getElementById('shareScreen');
        this.toggleChatBtn = document.getElementById('toggleChat');
        this.leaveRoomBtn = document.getElementById('leaveRoom');
        this.copyRoomIdBtn = document.getElementById('copyRoomId');
        
        // Chat elements
        this.chatPanel = document.getElementById('chatPanel');
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendMessageBtn = document.getElementById('sendMessage');
        this.closeChatBtn = document.getElementById('closeChatBtn');
        
        // Modal elements
        this.userNameModal = document.getElementById('userNameModal');
        this.userNameInput = document.getElementById('userNameInput');
        this.joinRoomBtn = document.getElementById('joinRoomBtn');
    }
    
    setupEventListeners() {
        // Control button events
        this.toggleVideoBtn.addEventListener('click', () => this.toggleVideo());
        this.toggleAudioBtn.addEventListener('click', () => this.toggleAudio());
        this.shareScreenBtn.addEventListener('click', () => this.toggleScreenShare());
        this.toggleChatBtn.addEventListener('click', () => this.toggleChat());
        this.leaveRoomBtn.addEventListener('click', () => this.leaveRoom());
        this.copyRoomIdBtn.addEventListener('click', () => this.copyRoomId());
        
        // Chat events
        this.sendMessageBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
        this.closeChatBtn.addEventListener('click', () => this.toggleChat());
        
        // Modal events
        this.joinRoomBtn.addEventListener('click', () => this.joinRoom());
        this.userNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.joinRoom();
            }
        });
    }
    
    async setupSignalR() {
        this.connection = new signalR.HubConnectionBuilder()
            .withUrl("/chathub")
            .build();
            
        // Set up SignalR event handlers
        this.connection.on("UserJoined", (userName) => {
            this.addChatMessage(`${userName} joined the room`, 'system');
            this.remoteUserName.textContent = userName;
        });
        
        this.connection.on("UserLeft", (userName) => {
            this.addChatMessage(`${userName} left the room`, 'system');
            this.remoteUserName.textContent = 'Waiting for participant...';
            this.handleRemoteStreamEnded();
        });
        
        this.connection.on("ReceiveMessage", (user, message) => {
            this.addChatMessage(`${user}: ${message}`, 'message');
        });
        
        // WebRTC signaling handlers
        this.connection.on("ReceiveOffer", async (offer, fromConnectionId) => {
            if (fromConnectionId !== this.connection.connectionId) {
                await this.handleReceiveOffer(offer);
            }
        });
        
        this.connection.on("ReceiveAnswer", async (answer, fromConnectionId) => {
            if (fromConnectionId !== this.connection.connectionId) {
                await this.handleReceiveAnswer(answer);
            }
        });
        
        this.connection.on("ReceiveIceCandidate", async (candidate, fromConnectionId) => {
            if (fromConnectionId !== this.connection.connectionId) {
                await this.handleReceiveIceCandidate(candidate);
            }
        });
        
        try {
            await this.connection.start();
            console.log("SignalR Connected");
        } catch (err) {
            console.error("SignalR Connection Error: ", err);
        }
    }
    
    showUserNameModal() {
        this.userNameModal.style.display = 'flex';
        this.userNameInput.focus();
    }
    
    async joinRoom() {
        const userName = this.userNameInput.value.trim();
        if (!userName) {
            alert('Please enter your name');
            return;
        }
        
        this.userName = userName;
        this.userNameModal.style.display = 'none';
        
        try {
            await this.setupLocalStream();
            await this.connection.invoke("JoinRoom", this.roomId, this.userName);
            this.initializePeerConnection();
        } catch (err) {
            console.error("Error joining room: ", err);
        }
    }
    
    async setupLocalStream() {
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            this.localVideo.srcObject = this.localStream;
        } catch (err) {
            console.error("Error accessing media devices: ", err);
        }
    }
    
    initializePeerConnection() {
        this.peerConnection = new RTCPeerConnection(this.rtcConfiguration);
        
        // Add local stream tracks to peer connection
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                this.peerConnection.addTrack(track, this.localStream);
            });
        }
        
        // Handle remote stream
        this.peerConnection.ontrack = (event) => {
            this.remoteStream = event.streams[0];
            this.remoteVideo.srcObject = this.remoteStream;
        };
        
        // Handle ICE candidates
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.connection.invoke("SendIceCandidate", this.roomId, event.candidate);
            }
        };
        
        // Handle connection state changes
        this.peerConnection.onconnectionstatechange = () => {
            console.log("Connection state: ", this.peerConnection.connectionState);
            if (this.peerConnection.connectionState === 'connected') {
                this.addChatMessage('Connected to peer!', 'system');
            }
        };
    }
    
    async createOffer() {
        try {
            const offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);
            await this.connection.invoke("SendOffer", this.roomId, offer);
        } catch (err) {
            console.error("Error creating offer: ", err);
        }
    }
    
    async handleReceiveOffer(offer) {
        try {
            if (!this.peerConnection) {
                this.initializePeerConnection();
            }
            
            await this.peerConnection.setRemoteDescription(offer);
            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);
            await this.connection.invoke("SendAnswer", this.roomId, answer);
        } catch (err) {
            console.error("Error handling offer: ", err);
        }
    }
    
    async handleReceiveAnswer(answer) {
        try {
            await this.peerConnection.setRemoteDescription(answer);
        } catch (err) {
            console.error("Error handling answer: ", err);
        }
    }
    
    async handleReceiveIceCandidate(candidate) {
        try {
            await this.peerConnection.addIceCandidate(candidate);
        } catch (err) {
            console.error("Error adding ICE candidate: ", err);
        }
    }
    
    toggleVideo() {
        if (this.localStream) {
            const videoTrack = this.localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                this.isVideoEnabled = videoTrack.enabled;
                
                this.toggleVideoBtn.classList.toggle('active', this.isVideoEnabled);
                this.toggleVideoBtn.innerHTML = this.isVideoEnabled 
                    ? '<i class="fas fa-video"></i>' 
                    : '<i class="fas fa-video-slash"></i>';
            }
        }
    }
    
    toggleAudio() {
        if (this.localStream) {
            const audioTrack = this.localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                this.isAudioEnabled = audioTrack.enabled;
                
                this.toggleAudioBtn.classList.toggle('active', this.isAudioEnabled);
                this.toggleAudioBtn.innerHTML = this.isAudioEnabled 
                    ? '<i class="fas fa-microphone"></i>' 
                    : '<i class="fas fa-microphone-slash"></i>';
            }
        }
    }
    
    async toggleScreenShare() {
        try {
            if (!this.isScreenSharing) {
                // Start screen sharing
                const screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: true
                });
                
                const videoTrack = screenStream.getVideoTracks()[0];
                const sender = this.peerConnection.getSenders().find(s => 
                    s.track && s.track.kind === 'video'
                );
                
                if (sender) {
                    await sender.replaceTrack(videoTrack);
                }
                
                // Update local video
                this.localVideo.srcObject = screenStream;
                this.isScreenSharing = true;
                this.shareScreenBtn.classList.add('active');
                this.shareScreenBtn.innerHTML = '<i class="fas fa-stop"></i>';
                
                // Handle screen share end
                videoTrack.onended = () => {
                    this.stopScreenShare();
                };
                
            } else {
                this.stopScreenShare();
            }
        } catch (err) {
            console.error("Error with screen sharing: ", err);
        }
    }
    
    async stopScreenShare() {
        try {
            // Get camera stream back
            const cameraStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            
            const videoTrack = cameraStream.getVideoTracks()[0];
            const sender = this.peerConnection.getSenders().find(s => 
                s.track && s.track.kind === 'video'
            );
            
            if (sender) {
                await sender.replaceTrack(videoTrack);
            }
            
            // Update local video and stream
            this.localVideo.srcObject = cameraStream;
            this.localStream = cameraStream;
            this.isScreenSharing = false;
            this.shareScreenBtn.classList.remove('active');
            this.shareScreenBtn.innerHTML = '<i class="fas fa-desktop"></i>';
            
        } catch (err) {
            console.error("Error stopping screen share: ", err);
        }
    }
    
    toggleChat() {
        this.isChatOpen = !this.isChatOpen;
        
        if (this.isChatOpen) {
            this.chatPanel.classList.add('open');
            this.toggleChatBtn.classList.add('active');
            this.messageInput.focus();
        } else {
            this.chatPanel.classList.remove('open');
            this.toggleChatBtn.classList.remove('active');
        }
    }
    
    sendMessage() {
        const message = this.messageInput.value.trim();
        if (message && this.connection) {
            this.connection.invoke("SendMessageToRoom", this.roomId, this.userName, message);
            this.messageInput.value = '';
        }
    }
    
    addChatMessage(message, type = 'message') {
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${type}`;
        messageElement.innerHTML = `
            <span class="message-text">${this.escapeHtml(message)}</span>
            <span class="message-time">${new Date().toLocaleTimeString()}</span>
        `;
        
        this.chatMessages.appendChild(messageElement);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    copyRoomId() {
        navigator.clipboard.writeText(this.roomId).then(() => {
            // Show temporary feedback
            const originalText = this.copyRoomIdBtn.innerHTML;
            this.copyRoomIdBtn.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => {
                this.copyRoomIdBtn.innerHTML = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy room ID: ', err);
        });
    }
    
    async leaveRoom() {
        if (confirm('Are you sure you want to leave the room?')) {
            try {
                if (this.connection) {
                    await this.connection.invoke("LeaveRoom", this.roomId, this.userName);
                }
                
                this.cleanup();
                window.location.href = '/VideoChat';
            } catch (err) {
                console.error("Error leaving room: ", err);
                window.location.href = '/VideoChat';
            }
        }
    }
    
    handleRemoteStreamEnded() {
        if (this.remoteVideo) {
            this.remoteVideo.srcObject = null;
        }
        this.remoteStream = null;
    }
    
    cleanup() {
        // Stop local stream
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
        }
        
        // Close peer connection
        if (this.peerConnection) {
            this.peerConnection.close();
        }
        
        // Stop SignalR connection
        if (this.connection) {
            this.connection.stop();
        }
    }
    
    // Auto-initiate call when another user joins
    async handleUserJoined() {
        // Create offer if we're not already in a call
        if (this.peerConnection && this.peerConnection.connectionState === 'new') {
            await this.createOffer();
        }
    }
}

// Enhanced connection handling
document.addEventListener('DOMContentLoaded', function() {
    // Handle browser refresh/close
    window.addEventListener('beforeunload', function() {
        if (window.videoChat) {
            window.videoChat.cleanup();
        }
    });
    
    // Enhanced user joined handler to auto-start calls
    if (window.videoChat && window.videoChat.connection) {
        const originalUserJoinedHandler = window.videoChat.connection.on;
        window.videoChat.connection.on = function(eventName, handler) {
            if (eventName === 'UserJoined') {
                const enhancedHandler = function(userName) {
                    handler(userName);
                    // Auto-initiate call after a short delay
                    setTimeout(() => {
                        if (window.videoChat.peerConnection && 
                            window.videoChat.peerConnection.connectionState === 'new') {
                            window.videoChat.createOffer();
                        }
                    }, 1000);
                };
                return originalUserJoinedHandler.call(this, eventName, enhancedHandler);
            }
            return originalUserJoinedHandler.call(this, eventName, handler);
        };
    }
});