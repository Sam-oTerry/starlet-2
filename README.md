# Starlet Properties Website

## Overview

Starlet Properties is a real estate and vehicle marketplace for Uganda, supporting listings for properties (residential, commercial, land, vacation/short stay) and vehicles (cars, motorcycles, trucks, buses, heavy machinery, bicycles/e-bikes, boats/watercraft). The platform includes user management, store profiles, subscriptions, reviews, deals, analytics, inspections, inquiries, and educational resources, with support for English and Acholi languages.

This repository contains the frontend website structure using HTML, CSS, and JavaScript, designed for modern, responsive, and modular web development.

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

## Key Features
- Multi-language support (English & Acholi)
- Agent tier system (Silver, Gold, Diamond)
- Property & vehicle listings
- Store management
- User authentication & roles (admin, staff, seller, buyer, agent)
- Admin panel for management and analytics
- Responsive design for mobile and desktop
- Modular components for forms, cards, and modals

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

## License
This project is for educational and demonstration purposes. For commercial use, please contact the author.
