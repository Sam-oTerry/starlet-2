# Starlet Properties - Real Estate & Vehicle Marketplace

A comprehensive web application for buying, selling, and renting properties and vehicles in Uganda. Built with modern web technologies and Firebase backend.

## 🌟 Features

### 🏠 Properties
- **Houses for Sale/Rent** - Residential properties with detailed listings
- **Land for Sale/Rent** - Commercial and residential land
- **Commercial Properties** - Office spaces, retail, industrial
- **Vacation & Short Stay** - Holiday rentals and temporary accommodation

### 🚗 Vehicles
- **Cars** - Personal and commercial vehicles
- **Motorcycles** - Bikes and scooters
- **Trucks & Buses** - Commercial transport
- **Heavy Machinery** - Construction and industrial equipment
- **Bicycles & E-bikes** - Personal transport
- **Boats & Watercraft** - Marine vehicles

### 👥 User Features
- **User Authentication** - Secure login/registration system
- **Dashboard** - Personal dashboard for managing listings and messages
- **Real-time Messaging** - Chat system for buyers and sellers
- **Favorites** - Save and manage favorite listings
- **Search & Filters** - Advanced search with multiple filters
- **Notifications** - Real-time notifications for messages and updates

### 🏪 Store Management
- **Official Stores** - Verified business listings
- **Store Profiles** - Detailed store information and listings
- **Store Analytics** - Performance metrics for store owners

### 🔧 Admin Features
- **Admin Dashboard** - Comprehensive admin panel
- **User Management** - Manage users and permissions
- **Listing Moderation** - Review and approve listings
- **Analytics** - Platform usage statistics
- **Message Management** - Monitor and manage conversations

## 🛠️ Technology Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with Bootstrap 5
- **JavaScript (ES6+)** - Dynamic functionality
- **Bootstrap 5** - Responsive UI framework
- **Bootstrap Icons** - Icon library

### Backend
- **Firebase** - Backend-as-a-Service
  - **Firestore** - NoSQL database
  - **Authentication** - User management
  - **Cloud Messaging** - Push notifications
  - **Hosting** - Web hosting

### Development Tools
- **Node.js** - Runtime environment
- **npm** - Package management

## 📁 Project Structure

```
starlet-2/
├── assets/                 # Static assets (fonts, icons)
├── components/            # Reusable UI components
│   ├── cards/            # Property and vehicle cards
│   ├── forms/            # Login, registration, listing forms
│   └── modals/           # Contact and other modals
├── css/                  # Stylesheets
│   ├── style.css         # Main styles
│   ├── components.css    # Component styles
│   └── responsive.css    # Responsive design
├── dashboard/            # User dashboard pages
├── functions/            # Firebase Cloud Functions
├── images/               # Image assets
├── js/                   # JavaScript modules
│   ├── auth.js          # Authentication logic
│   ├── api.js           # API interactions
│   ├── main.js          # Main application logic
│   ├── search.js        # Search functionality
│   ├── admin.js         # Admin panel logic
│   └── utils.js         # Utility functions
├── pages/               # Application pages
│   ├── admin/           # Admin panel pages
│   ├── dashboard/       # User dashboard pages
│   ├── listings/        # Listing pages
│   └── stores/          # Store pages
├── public/              # Public assets
└── index.html           # Main entry point
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Firebase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/starlet-properties.git
   cd starlet-properties
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Firebase Setup**
   - Create a new Firebase project
   - Enable Firestore, Authentication, and Cloud Messaging
   - Update the Firebase configuration in your JavaScript files
   - Deploy Firestore security rules

4. **Environment Configuration**
   - Copy your Firebase config to the appropriate JavaScript files
   - Set up VAPID keys for push notifications

5. **Run the application**
   ```bash
   # For development
   npm run dev
   
   # For production
   npm run build
   ```

## 🔧 Configuration

### Firebase Configuration
Update the Firebase configuration in your JavaScript files:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### Firestore Rules
Deploy the Firestore security rules from `firestore.rules`:

```bash
firebase deploy --only firestore:rules
```

## 📱 Features in Detail

### Authentication System
- Email/password registration and login
- Social media authentication (Google, Facebook)
- Password reset functionality
- User profile management

### Listing Management
- Create, edit, and delete listings
- Image upload and management
- Category-based organization
- Search and filtering capabilities

### Messaging System
- Real-time chat between users
- File and image sharing
- Read receipts and typing indicators
- Push notifications

### Admin Panel
- User management and moderation
- Listing approval system
- Analytics and reporting
- Platform configuration

## 🎨 UI/UX Features

- **Responsive Design** - Works on all devices
- **Modern Interface** - Clean and intuitive design
- **Dark/Light Mode** - User preference support
- **Accessibility** - WCAG compliant
- **Performance** - Optimized loading times

## 🔒 Security Features

- **Firebase Security Rules** - Database access control
- **Input Validation** - Client and server-side validation
- **XSS Protection** - Content security policies
- **CSRF Protection** - Cross-site request forgery prevention

## 📊 Analytics & Monitoring

- **User Analytics** - Track user behavior
- **Performance Monitoring** - Page load times
- **Error Tracking** - JavaScript error monitoring
- **Usage Statistics** - Platform usage metrics

## 🚀 Deployment

### Firebase Hosting
```bash
# Build the project
npm run build

# Deploy to Firebase
firebase deploy
```

### Custom Domain
- Configure custom domain in Firebase Console
- Update DNS settings
- Enable SSL certificate

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Email**: info@starlet.co.ug
- **Phone**: +256 123 456 789
- **Address**: Kampala, Uganda

## 🙏 Acknowledgments

- Bootstrap team for the UI framework
- Firebase team for the backend services
- All contributors and beta testers

## 📈 Roadmap

- [ ] Mobile app development
- [ ] Advanced analytics dashboard
- [ ] Payment integration
- [ ] Multi-language support
- [ ] AI-powered recommendations
- [ ] Virtual property tours

---

**Starlet Properties** - Connecting buyers and sellers across Uganda 🇺🇬
