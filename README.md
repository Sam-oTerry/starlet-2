# Starlet Properties Website

## Overview

Starlet Properties is a real estate and vehicle marketplace for Uganda, supporting listings for properties (residential, commercial, land, vacation/short stay) and vehicles (cars, motorcycles, trucks, buses, heavy machinery, bicycles/e-bikes, boats/watercraft). The platform includes user management, store profiles, subscriptions, reviews, deals, analytics, inspections, inquiries, and educational resources, with support for English and Acholi languages.

This repository contains the frontend website structure using HTML, CSS, and JavaScript, designed for modern, responsive, and modular web development.

---

## Table of Contents
- [Project Purpose & Vision](#project-purpose--vision)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Local Development](#local-development)
- [How to Extend the Project](#how-to-extend-the-project)
- [Key Features](#key-features)
- [Page-by-Page Overview](#page-by-page-overview)
- [Folder Structure](#folder-structure)
- [Setup Instructions](#setup-instructions)
- [Backend/API (Not included)](#backendapi-not-included)
- [Deployment Instructions](#deployment-instructions)
- [How to Contribute](#how-to-contribute)
- [FAQ](#faq)
- [Known Issues & Roadmap](#known-issues--roadmap)
- [Contact](#contact)
- [License](#license)

---

## Project Purpose & Vision
Starlet Properties aims to empower Ugandans with a modern, reliable, and user-friendly platform for buying, selling, and renting properties and vehicles. The vision is to build trust, promote transparency, and support economic growth by connecting people with the best agents, official stores, and verified listings nationwide.

## Tech Stack
- **Frontend:** HTML5, CSS3 (Bootstrap 5, custom styles), JavaScript (modular, ES6)
- **UI Libraries:** Bootstrap, Bootstrap Icons, Font Awesome
- **Fonts:** Google Fonts (Inter)
- **Responsive Design:** Mobile-first, custom responsive CSS
- **Backend:** Not included (intended for integration with Node.js/Express, MongoDB, or Firebase)

---

## Quick Start
1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd starlet-2
   ```
2. **Open the homepage:**
   - Double-click `index.html` or open it in your browser.
   - No build step is required; this is a static frontend project.
3. **Explore the site:**
   - Browse properties, vehicles, stores, and more using the navigation bar.

---

## Local Development
1. **Install a local server (recommended for JS/CSS hot reload):**
   - You can use [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) (VSCode extension) or run:
     ```bash
     npx serve .
     # or
     python -m http.server
     ```
   - Open `http://localhost:5000` (or the port shown) in your browser.
2. **Edit HTML/CSS/JS files:**
   - All source files are in the root, `css/`, `js/`, and `components/` folders.
   - Changes are reflected on refresh.
3. **Add images/assets:**
   - Place images in `images/`, fonts/icons in `assets/`.

---

## How to Extend the Project
### Add a New Page
1. Copy an existing HTML file (e.g., `about.html`) and rename it.
2. Update the content and navigation links as needed.
3. Add your new page to the navigation bar in all relevant HTML files.

### Add a New Feature or Component
1. Create a new file in `components/` (e.g., a new card or modal).
2. Include it in your main HTML file using HTML imports or copy-paste.
3. Add any required styles to `css/components.css`.
4. Add any required JS to `js/` and link it in your HTML.

### Connect to a Backend
1. Update or extend the API calls in `js/api.js`.
2. Replace dummy data with real API endpoints.
3. Follow the comments in `js/auth.js` and `js/api.js` for integration points.

---

## Key Features
- Multi-language support (English & Acholi)
- Agent/store tier system (Silver, Gold, Diamond)
- User roles: admin, staff, seller, buyer, agent
- Listings: properties & vehicles, with search/filter, media, and verification
- Store management, reviews, subscriptions
- Admin panel (analytics, moderation, fee settings)
- Inspections, inquiries, deals, and educational resources
- Responsive, modern UI with modular components (forms, cards, modals)
- Privacy and security (compliance with Ugandan law)
- Role-based dashboards and notifications
- Premium services for agents (subscription-based visibility)
- Official store support
- Guest and registered user flows
- Moderation and verification for listings and reviews
- Analytics for listing/store performance
- WhatsApp/app-based inquiry and communication

---

## Page-by-Page Overview
- **index.html**: Homepage with search, featured listings, and platform overview. Entry point for users to discover properties, vehicles, and stores.
- **login.html**: User login page supporting email/phone, password, and Google sign-in. Includes password reset and remember-me options.
- **register.html**: User registration page with fields for name, email, phone, password, and confirmation. Supports role selection and language preference.
- **properties.html**: Search, filter, and browse property listings (houses, land, commercial, vacation). Includes featured properties, advanced filters, and property details.
- **vehicles.html**: Search, filter, and browse vehicle listings (cars, motorcycles, trucks, buses, heavy machinery, bicycles/e-bikes, boats/watercraft). Includes featured vehicles, advanced filters, and vehicle details.
- **stores.html**: Browse/search official stores and agents, with filters by type/location. Displays store profiles, ratings, and reviews.
- **resources.html**: Educational resources for buyers, sellers, and agents. (Content placeholder for articles, guides, and media.)
- **about.html**: Platform mission, story, values, and team. Explains the vision, history, and core values of Starlet Properties.
- **contact.html**: Contact form and company contact information. (Content placeholder for direct inquiries.)
- **privacy.html**: Privacy policy, data collection, user rights, and compliance with Uganda's Data Protection and Privacy Act.
- **terms.html**: Terms of service, user roles, permitted/prohibited activities, subscriptions, reviews, and platform rules.
- **details.html**: Detailed view for a single property or vehicle listing, including media, features, location, and contact options.
- **store-details.html**: Detailed view for a single store/agent, including profile, listings, reviews, and contact info.
- **addlistings.html**: Form for adding new property or vehicle listings (for sellers/agents).
- **mylistings.html**: User dashboard for managing personal listings.
- **dashboard.html**: (and pages/admin/dashboard.html) Admin/staff dashboard for analytics, moderation, and management.

---

## Folder Structure

```
starlet-2/
├── index.html                # Homepage
├── login.html                # User login page
├── register.html             # User registration page
├── properties.html           # Property listings
├── vehicles.html             # Vehicle listings
├── stores.html               # Store listings
├── resources.html            # Educational resources
├── about.html                # About page
├── contact.html              # Contact page
├── privacy.html              # Privacy policy
├── terms.html                # Terms of service
│
├── css/
│   ├── style.css             # Main styles
│   ├── responsive.css        # Responsive design
│   └── components.css        # Component styles
│
├── js/
│   ├── main.js               # Main functionality
│   ├── search.js             # Search functionality
│   ├── api.js                # API interactions
│   ├── auth.js               # Authentication
│   └── utils.js              # Utility functions
│
├── images/                   # Image assets
│
├── assets/
│   ├── fonts/                # Custom fonts
│   └── icons/                # Custom icons
│
├── components/
│   ├── forms/
│   │   ├── login-form.html
│   │   ├── register-form.html
│   │   └── listing-form.html
│   ├── modals/
│   │   └── contact-modal.html
│   └── cards/
│       ├── property-card.html
│       └── vehicle-card.html
│
├── pages/
│   ├── admin/
│   │   ├── dashboard.html
│   │   ├── users.html
│   │   ├── listings.html
│   │   ├── stores.html
│   │   └── analytics.html
│   ├── dashboard/
│   ├── listings/
│   └── stores/
│
├── README.md                 # Project documentation
├── package.json              # Project configuration (optional)
└── .gitignore                # Git ignore rules
```

---

## Setup Instructions
1. **Clone the repository**
2. Open `index.html` in your browser to view the homepage.
3. Add your images to the `images/` folder, fonts/icons to `assets/`, and customize styles in `css/`.
4. For backend/API integration, connect the JavaScript files in `js/` to your backend endpoints.

---

## Backend/API (Not included)
- This structure is frontend-only. For full functionality, connect to a backend API (e.g., Node.js/Express, MongoDB) as described in the main project documentation.

---

## Deployment Instructions
1. **Static Hosting:**
   - You can deploy the site to any static hosting provider (e.g., Netlify, Vercel, GitHub Pages).
   - Upload the contents of the repository (except `node_modules/` and dev files).
   - Set the root directory to the project folder.
2. **Custom Domain:**
   - Configure your DNS to point to your hosting provider.
   - Update any absolute URLs in the HTML if needed.

---

## How to Contribute
1. **Fork this repository** on GitHub.
2. **Create a new branch** for your feature or bugfix:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** and commit them with clear messages.
4. **Push to your fork** and open a Pull Request (PR) with a description of your changes.
5. **Follow the code style** used in the project (see `css/`, `js/` for examples).
6. For major changes, open an issue first to discuss what you want to change.

---

## FAQ
**Q: Is this a full-stack project?**
A: No, this is a frontend-only project. You must connect it to your own backend for full functionality.

**Q: How do I add a new property or vehicle type?**
A: Update the relevant dropdowns and filters in `properties.html`, `vehicles.html`, and the search/filter JS code.

**Q: Can I use this for commercial purposes?**
A: Not without permission. See the License section.

**Q: How do I add a new language?**
A: Add translation strings to the UI and update the language selector logic in `js/main.js`.

**Q: Where do I report bugs or request features?**
A: Open an issue on GitHub or contact the maintainer (see Contact section).

---

## Known Issues & Roadmap
- **Known Issues:**
  - Some pages (e.g., `resources.html`, `contact.html`) are placeholders and need content.
  - No backend/API integration by default.
  - No authentication persistence (requires backend).
- **Roadmap:**
  - Add backend integration (Node.js/Firebase example)
  - Add more educational resources
  - Improve accessibility and add more languages
  - Add user notifications and messaging
  - Add more analytics and admin features

---

## Contact
- **Email:** info@starlet.co.ug
- **Twitter:** [@starletproperties](https://twitter.com/starletproperties)
- **Facebook:** [Starlet Properties](https://facebook.com/starletproperties)
- **Location:** Kampala, Uganda

---

## License
This project is for educational and demonstration purposes. For commercial use, please contact the author.
