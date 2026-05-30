🌟 Aura Glow — Full Stack DevOps E-Commerce Platform
📌 Project Overview

Aura Glow is a full-stack e-commerce web application for cosmetics, built using Node.js, AWS cloud infrastructure, and DevOps practices. The project demonstrates a complete CI/CD pipeline with automated deployment, scalable AWS architecture, and secure backend development.

It is deployed on AWS using an Application Load Balancer, EC2 instances, and Terraform-managed infrastructure.

🚀 Live Deployment
aura-glow-alb-1905105520.us-east-1.elb.amazonaws.com

🧱 Architecture Overview

System follows this flow:

Internet → AWS Application Load Balancer → Nginx → Node.js (PM2) → Backend Services

🛠️ Tech Stack
💻 Frontend
HTML
CSS
JavaScript
⚙️ Backend
Node.js
Express.js
☁️ Cloud & DevOps
AWS EC2
AWS VPC
AWS ALB (Load Balancer)
AWS IAM
Terraform (Infrastructure as Code)
GitHub Actions (CI/CD)
Nginx
PM2

🔐 Features
👤 User Features
User registration & login
Session-based authentication
Product browsing
Add to cart
Place orders
Customer reviews
🛠️ Admin Features
Admin dashboard
Product management
User management
Review moderation
🔒 Security Features
Password hashing (bcrypt/SHA)
Secure sessions
Input validation
Role-based access control
HTTP security headers

☁️ AWS Infrastructure
VPC with public/private subnets
EC2 instance for application hosting
Application Load Balancer for traffic distribution
Security Groups for access control
IAM roles for secure AWS access

🔁 CI/CD Pipeline
GitHub Actions triggers deployment on push to master  branch
SSH-based deployment to EC2
PM2 restarts application automatically
Zero-downtime deployment flow (basic level)

📦 Project Structure
AuraGlow/
│
├── backend/
│   ├── routes/
│   ├── models/
│   ├── controllers/
│   └── server.js
│
├── frontend/
│   ├── pages/
│   └── assets/
│
├── infra/ (Terraform)
│   ├── main.tf
│   ├── vpc.tf
│   └── security.tf
│
├── .github/workflows/
│   └── deploy.yml
│
└── README.md

⚙️ Setup Instructions (Local)
# Clone repo
git clone https://github.com/malavikapsaji14-cyber/aura-glow.git

# Install dependencies
npm install

# Run application
npm start

🚀 Deployment Flow
Code Push → GitHub Actions → SSH to EC2 → Pull Latest Code → PM2 Restart → Live Update

To view the site:http://aura-glow-alb-1905105520.us-east-1.elb.amazonaws.com/
















