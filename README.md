# Exam Portal - Enterprise CBT Platform

A robust, full-stack Computer Based Test (CBT) platform designed for high-stakes office deployments and LAN/Cloud environments. Built with a modern TypeScript stack, it features advanced proctoring, real-time monitoring, and a JEE-style exam engine.

## 🚀 Key Features

### Candidate Experience
*   **JEE-Style Interface**: Professional, high-performance exam runtime UI.
*   **Self-Registration**: Easy entry via exam codes with session resume support.
*   **Hybrid Questions**: Support for MCQ and rich-text subjective answers.
*   **Smart Persistence**: Rolling timers, local/server autosave, and auto-submit on expiry.

### Admin & Monitoring
*   **Live Dashboard**: Real-time monitoring of candidate progress and violations via Socket.IO.
*   **Bulk Operations**: Rapid question authoring and bulk Excel/CSV/ZIP imports.
*   **Advanced Analytics**: Score distribution charts, question-wise difficulty analysis, and funnel reports.
*   **Grading Suite**: Dedicated interface for manual grading of subjective answers.

### Anti-Cheat Engine (SentraGuard)
*   **Full-Screen Enforcement**: Logs and alerts on tab switching, minimize, and exit.
*   **Shortcut Blocking**: Interception of `Ctrl+C`, `Ctrl+V`, `Right Click`, and `F12`.
*   **Visual Deterrence**: Dynamic candidate-specific watermarking to prevent photography.
*   **AI Integration**: Optional webcam-based AI proctoring for anomaly detection.

---

## ☁️ AWS Cloud Hosting Guide

Follow these steps to deploy the Exam Portal on a production-ready AWS EC2 instance.

### 1. Infrastructure Setup
1.  **Launch Instance**: Use an Ubuntu 22.04 LTS instance (t3.medium or higher recommended).
2.  **Elastic IP**: 
    *   Go to **EC2 Dashboard > Elastic IPs**.
    *   Click **Allocate Elastic IP address** and then **Associate** it with your instance.
    *   *This ensures your IP never changes when the server restarts.*
3.  **Security Group**: Open the following Inbound ports:
    *   `22` (SSH)
    *   `80` (HTTP)
    *   `443` (HTTPS)
    *   `5432` (Optional: Postgres if accessing externally)

### 2. Domain Mapping
1.  Go to your Domain Provider (e.g., GoDaddy, Cloudflare).
2.  Create an **A Record**:
    *   **Host**: `exam` (or `@` for root)
    *   **Value**: Your **Elastic IP** address.
3.  Wait for DNS propagation (updates usually take 5–30 minutes).

### 3. Server Preparation
Connect via SSH and run these commands to prepare the environment:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# IMPORTANT: Disable native services that block ports 80/443
sudo systemctl stop nginx
sudo systemctl disable nginx
sudo systemctl stop apache2
sudo systemctl disable apache2

# Enable Docker on boot
sudo systemctl enable docker
```

### 4. Deployment
1.  **Clone the Repo**:
    ```bash
    git clone https://github.com/utk2506/exam-portal.git
    cd exam-portal
    ```
2.  **Environment Setup**:
    ```bash
    cp .env.lan.example .env
    nano .env  # Update JWT_SECRET and ADMIN_PASSWORD
    ```
3.  **Launch Stack**:
    ```bash
    docker compose up -d --build
    ```

### 5. SSL / HTTPS Configuration
The included Nginx configuration expects Let's Encrypt certificates. You can generate them using Certbot on the host:
```bash
sudo apt install certbot
sudo certbot certonly --standalone -d exam.chimeratechnologies.com
```
*Certificates will be automatically picked up by the Docker Nginx container via the volume mount.*

---

## 🛠 Useful Commands

*   **View Logs**: `docker compose logs -f`
*   **Restart App**: `docker compose restart api frontend`
*   **Update Code**: `git pull origin master && docker compose up -d --build`
*   **Reset DB**: `npm run prisma:push -w @exam-platform/api` (Run inside container)

## 📄 License
Confidential - Internal Use Only for Chimera Technologies.
