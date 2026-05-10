# Freelancing Website – MERN Stack

A full-stack **Freelancing Marketplace Web Application** built using the **MERN Stack** where freelancers can create gigs, buyers can purchase services, and admins can manage the platform efficiently.

The application includes authentication, gig management, secure payments, dashboards, messaging, notifications, reviews, dispute handling, and commission management.

---

# 🚀 Features

## 👤 Authentication & Authorization

* User Registration & Login
* JWT Authentication
* Protected Routes
* Role-Based Access Control
* Secure Password Hashing using bcrypt

---

# 🛒 Buyer Features

* Browse all freelancer gigs
* Search and filter gigs
* View gig details
* Purchase freelancer services
* Secure Stripe payments
* Manage active orders
* Order history tracking
* Chat with freelancers
* Leave reviews and ratings
* Receive notifications
* Manage profile settings

---

# 💼 Freelancer Features

* Create gigs/services
* Update gigs
* Delete gigs
* Upload gig images
* Manage received orders
* Update order status
* Real-time messaging
* Earnings dashboard
* Withdrawal request system
* Reviews and ratings system
* Notifications system
* Freelancers can also purchase gigs from other freelancers

---

# 🛠️ Admin Features

* Admin dashboard
* Manage users
* Manage gigs
* Delete inappropriate gigs
* Handle buyer & freelancer disputes
* Monitor platform activity
* Commission management
* Revenue analytics
* Withdrawal approval system
* Review moderation

---

# 💳 Payment System

* Stripe payment integration
* Secure checkout process
* Commission deduction system
* Freelancer earnings management

---

# 📊 Dashboard Features

## Freelancer Dashboard

* Total earnings
* Active orders
* Completed projects
* Ratings overview
* Withdrawal tracking

## Buyer Dashboard

* Purchased gigs
* Active orders
* Order history
* Review management

## Admin Dashboard

* Total users
* Total gigs
* Platform revenue
* Commission tracking
* Dispute management

---

# 💬 Real-Time Features

* Real-time messaging using Socket.io
* Instant notifications
* Order update alerts
* Review notifications

---

# 🧰 Tech Stack

## Frontend

* React
* Vite
* Tailwind CSS
* Material UI
* Ant Design
* Axios
* React Router DOM

## Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT Authentication
* Multer
* Stripe

---

# ⚙️ Installation Guide

## Clone Repository

```bash
git clone https://github.com/your-username/freelancing_website.git
```

---

# Install Backend Dependencies

```bash
cd server
npm install
```

---

# Install Frontend Dependencies

```bash
cd client
npm install
```

---

# 🔑 Environment Variables

Create a `.env` file inside the server folder.

```env
PORT=5000

JWT_SECRET=your_jwt_secret

STRIPE_SECRET=your_stripe_secret_key

NODE_ENV=development

MONGO_URI=your_mongodb_connection

CLOUDINARY_CLOUD_NAME=your_cloud_name

CLOUDINARY_API_KEY=your_api_key

CLOUDINARY_API_SECRET=your_api_secret

VITE_STRIPE_PUBLISHABLE_KEY=your_publishable_key

VITE_API_URL=http://localhost:5000

VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

---

# ▶️ Run Backend

```bash
npm run dev
```

---

# ▶️ Run Frontend

```bash
cd client
npm run dev
```

---

# 🔐 Security Features

* JWT Authentication
* Password Encryption
* Protected API Routes
* Role-Based Access Control
* Secure Stripe Transactions

---

# 👨‍💻 Developer

**Suresh Kumar**
MERN Stack Developer

GitHub:
[GitHub Profile]https://github.com/suresh1805200023-byte/freelance

Live link on render:
https://freelance-website-mern-stack-1.onrender.com/
