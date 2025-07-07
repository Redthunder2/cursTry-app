# 🎥 Glass Video Chat - Modern WebRTC Video Chat Application

A beautiful, modern video chat application built with **ASP.NET Core 8.0**, **SignalR**, and **WebRTC** featuring a stunning **glassmorphism design**.

## ✨ Features

### 🔒 **Secure Video Calling**
- **Peer-to-peer WebRTC connections** for secure communication
- **End-to-end encrypted** video and audio streams
- **STUN server configuration** for NAT traversal

### 💬 **Real-time Chat**
- **Instant messaging** during video calls
- **Room-based chat** with message history
- **User join/leave notifications**
- **Sliding chat panel** with modern UI

### 🎮 **Advanced Controls**
- **Video/Audio toggle** with visual indicators
- **Screen sharing** capability
- **Picture-in-picture** local video display
- **Room ID copying** for easy sharing

### 🎨 **Modern Design**
- **Glassmorphism UI** with backdrop blur effects
- **Animated gradient backgrounds**
- **Responsive design** for mobile and desktop
- **Smooth animations** and transitions
- **Font Awesome icons** throughout

## 🚀 Getting Started

### Prerequisites
- **.NET 8.0 SDK** or later
- **Modern web browser** with WebRTC support (Chrome, Firefox, Edge, Safari)

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd VideoChat
   ```

2. **Restore dependencies**
   ```bash
   dotnet restore
   ```

3. **Build the application**
   ```bash
   dotnet build
   ```

4. **Run the application**
   ```bash
   dotnet run
   ```

5. **Open your browser**
   Navigate to `http://localhost:5000` or `https://localhost:7165`

## 🏗️ Architecture

### Backend Components

#### **SignalR Hub** (`Hubs/ChatHub.cs`)
- **Real-time communication** for chat and WebRTC signaling
- **Room management** with join/leave functionality
- **WebRTC signaling** (offers, answers, ICE candidates)
- **Message broadcasting** within rooms

#### **Controllers** (`Controllers/VideoChatController.cs`)
- **Room creation** and management
- **Unique room ID generation**
- **View routing** and parameter handling

#### **Models & Configuration**
- **Program.cs**: SignalR service configuration
- **launchSettings.json**: Application URLs and environment settings

### Frontend Components

#### **Views**
- **Index.cshtml**: Landing page with room creation/joining
- **Room.cshtml**: Video chat interface with controls
- **_Layout.cshtml**: Common layout with CSS/JS references

#### **JavaScript** (`wwwroot/js/videochat.js`)
- **VideoChat class**: Main application logic
- **WebRTC management**: Peer connections and media streams
- **SignalR integration**: Real-time communication
- **UI control handling**: Video, audio, screen sharing, chat

#### **Styling** (`wwwroot/css/videochat.css`)
- **Glassmorphism effects**: Backdrop blur and transparency
- **Responsive design**: Mobile-first approach
- **Animations**: CSS keyframes and transitions
- **Custom components**: Buttons, inputs, modals, chat interface

## 🎯 Usage Guide

### Creating a New Room
1. Visit the **home page**
2. Click **"Create New Room"**
3. You'll be redirected to a **unique room** with a generated ID
4. **Share the room ID** with others to join

### Joining an Existing Room
1. On the **home page**, enter the **room ID**
2. Click **"Join Room"** or press **Enter**
3. You'll be taken to the **room interface**

### In the Video Chat Room

#### **Initial Setup**
1. **Enter your name** in the modal that appears
2. **Allow camera/microphone access** when prompted
3. Your **local video** will appear in the bottom-right corner

#### **Controls Available**
- **🎥 Video Toggle**: Turn camera on/off
- **🎤 Audio Toggle**: Mute/unmute microphone  
- **🖥️ Screen Share**: Share your screen (toggle to stop)
- **💬 Chat Toggle**: Open/close chat panel
- **📞 Leave Room**: Exit the room (with confirmation)
- **📋 Copy Room ID**: Copy room ID to clipboard

#### **Chat Features**
- **Send messages** using the input field or Enter key
- **View message history** with timestamps
- **System notifications** for user join/leave events
- **Auto-scroll** to latest messages

## 🔧 Technical Details

### WebRTC Configuration
```javascript
// STUN servers for NAT traversal
rtcConfiguration: {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
}
```

### SignalR Hub Methods
- **`JoinRoom(roomId, userName)`**: Join a specific room
- **`LeaveRoom(roomId, userName)`**: Leave a room
- **`SendMessageToRoom(roomId, user, message)`**: Send chat message
- **`SendOffer/SendAnswer/SendIceCandidate`**: WebRTC signaling

### CSS Custom Properties
```css
:root {
    --glass-bg: rgba(255, 255, 255, 0.1);
    --glass-border: rgba(255, 255, 255, 0.2);
    --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

## 🌐 Browser Compatibility

| Browser | WebRTC Support | Screen Sharing | Status |
|---------|---------------|----------------|---------|
| Chrome 80+ | ✅ Full | ✅ Yes | ✅ Fully Supported |
| Firefox 75+ | ✅ Full | ✅ Yes | ✅ Fully Supported |
| Edge 80+ | ✅ Full | ✅ Yes | ✅ Fully Supported |
| Safari 14+ | ✅ Full | ⚠️ Limited | ⚠️ Mostly Supported |

## 🛠️ Development

### Project Structure
```
VideoChat/
├── Controllers/           # MVC Controllers
├── Hubs/                 # SignalR Hubs  
├── Views/                # Razor Views
│   ├── VideoChat/        # VideoChat-specific views
│   └── Shared/           # Shared layout and components
├── wwwroot/              # Static files
│   ├── css/              # Stylesheets
│   ├── js/               # JavaScript files
│   └── lib/              # Third-party libraries
├── Properties/           # Application settings
└── Program.cs            # Application entry point
```

### Adding New Features

#### **Extending SignalR Hub**
```csharp
public async Task NewFeature(string roomId, object data)
{
    await Clients.Group(roomId).SendAsync("ReceiveNewFeature", data);
}
```

#### **Adding UI Components**
1. Update **Room.cshtml** with new HTML elements
2. Add **CSS styling** in videochat.css
3. Implement **JavaScript handlers** in videochat.js
4. Wire up **SignalR events** as needed

## 🚀 Deployment

### Development
```bash
dotnet run --environment Development
```

### Production
```bash
dotnet publish -c Release
```

### Environment Variables
- **`ASPNETCORE_ENVIRONMENT`**: Development/Production
- **`ASPNETCORE_URLS`**: Binding URLs
- **`ASPNETCORE_HTTPS_PORT`**: HTTPS port

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

## 📝 License

This project is licensed under the **MIT License** - see the LICENSE file for details.

## 🙏 Acknowledgments

- **ASP.NET Core Team** for the excellent framework
- **SignalR** for real-time communication capabilities  
- **WebRTC** for peer-to-peer video/audio technology
- **Font Awesome** for beautiful icons
- **CSS Glassmorphism** trend for modern UI inspiration

---

**Built with ❤️ using ASP.NET Core 8.0 and modern web technologies**