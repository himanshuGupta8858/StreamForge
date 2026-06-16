# AWS ECS Fargate Deployment Guide — spotify-project2

This document outlines the step-by-step architecture and process to deploy your 3-container microservices application (`frontend`, `auth-service`, and `notification-service`) onto **AWS ECS (Elastic Container Service)** using **AWS Fargate** (serverless containers).

---

## 1. Recommended ECS Architecture

For a robust, production-ready, and cost-effective deployment on AWS Fargate, we recommend dividing the system into **2 Task Definitions**:

```
[User Client]
      │
      ▼ (Port 80/443)
[Application Load Balancer]
      │
      ▼ (Port 3000)
┌─────────────────────────────────────────────────────────────┐
│  Task Definition 1: Web & API Gateway                       │
│                                                             │
│   [Frontend Container: Nginx] (Port 3000)                   │
│               │                                             │
│               ▼ (Proxies /api/* to localhost:5000)          │
│   [Auth Service Container: Node.js] (Port 5000)             │
└───────┬─────────────────────────────────────────────────────┘
        │
        ├──────────────────────┐
        ▼                      ▼
  [(MongoDB Atlas)]      [(CloudAMQP RabbitMQ)]
                               │
                               ▼ (Consumes Events)
┌─────────────────────────────────────────────────────────────┐
│  Task Definition 2: Async Workers                           │
│                                                             │
│   [Notification Service Container] (Port 5001 - Internal)   │
└──────────────────────────────┬──────────────────────────────┘
                               ▼ (Sends Emails)
                         [(Gmail API OAuth2)]
```

### Why this 2-Task architecture?
1. **Simplified Internal Networking:** Putting the `frontend` (Nginx) and `auth-service` (Node.js) in the same Task Definition allows them to communicate securely over `localhost` (`127.0.0.1:5000`). This completely avoids setting up AWS Cloud Map (Service Discovery) or private ALBs.
2. **Independent Background Scalability:** The `notification-service` is an asynchronous worker. It doesn't serve external web traffic and has **no open ports**. Keeping it in a separate task allows you to scale it independently based on message queue length and saves money because it doesn't need an ALB.
3. **No Database/Broker overhead:** MongoDB and RabbitMQ run externally (Atlas and CloudAMQP), so you don't need to host stateful databases on ECS.

---

## 2. Port Mappings & Services Summary

Here is the configuration required for each service to maintain good health checks:

| Service | Port Mapping (Host:Container) | ALB Target Group Port | ECS Service Type | Health Check Route |
| :--- | :--- | :--- | :--- | :--- |
| **Web Gateway (Frontend + Auth)** | `3000:3000` (exposes Nginx) | Port `3000` | Replica (Public VPC subnet) | `/` (returns frontend `index.html`) |
| **Notification Worker** | *None* | *None* | Replica (Private/Public subnet) | *No HTTP health checks needed* |

---

## 3. Step-by-Step Deployment Process

### Step 1: Push Images to Amazon ECR
Your AWS Account ID is `079512360946` in the `ap-south-1` (Mumbai) region.

1. **Authenticate Docker with ECR:**
   ```bash
   aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin 079512360946.dkr.ecr.ap-south-1.amazonaws.com
   ```

2. **Create ECR Repositories (if not already created):**
   ```bash
   aws ecr create-repository --repository-name spotify-project2-auth-service --region ap-south-1
   aws ecr create-repository --repository-name spotify-project2-music-service --region ap-south-1
   aws ecr create-repository --repository-name spotify-project2-notification-service --region ap-south-1
   aws ecr create-repository --repository-name spotify-project2-frontend --region ap-south-1
   ```

3. **Tag and Push your Local Images:**
   ```bash
   # Auth Service
   docker tag spotify-project2-auth-service:latest 079512360946.dkr.ecr.ap-south-1.amazonaws.com/spotify-project2-auth-service:latest
   docker push 079512360946.dkr.ecr.ap-south-1.amazonaws.com/spotify-project2-auth-service:latest

   # Music Service
   docker tag spotify-project2-music-service:latest 079512360946.dkr.ecr.ap-south-1.amazonaws.com/spotify-project2-music-service:latest
   docker push 079512360946.dkr.ecr.ap-south-1.amazonaws.com/spotify-project2-music-service:latest

   # Notification Service
   docker tag spotify-project2-notification-service:latest 079512360946.dkr.ecr.ap-south-1.amazonaws.com/spotify-project2-notification-service:latest
   docker push 079512360946.dkr.ecr.ap-south-1.amazonaws.com/spotify-project2-notification-service:latest

   # Frontend
   docker tag spotify-project2-frontend:latest 079512360946.dkr.ecr.ap-south-1.amazonaws.com/spotify-project2-frontend:latest
   docker push 079512360946.dkr.ecr.ap-south-1.amazonaws.com/spotify-project2-frontend:latest
   ```

---

### Step 2: Create IAM Execution Roles
Make sure you have an **ECS Task Execution Role** (usually named `ecsTaskExecutionRole`) with the policy `AmazonECSTaskExecutionRolePolicy` attached. This allows ECS Fargate to pull images from ECR and send logs to CloudWatch.

---

### Step 3: Create the Task Definitions

#### Task Definition 1: `spotify-web-gateway` (Frontend + Auth-Service + Music-Service)
* **Launch Type:** Fargate
* **Task Memory:** `1.5 GB` (or `1 GB`)
* **Task CPU:** `0.75 vCPU` (or `0.5 vCPU`)
* **Container 1: `auth-service`**
  - **Image:** `079512360946.dkr.ecr.ap-south-1.amazonaws.com/spotify-project2-auth-service:latest`
  - **Port Mappings:** Container Port `5000` (TCP)
  - **Environment Variables:**
    - `MONGO_URI` = `<YOUR_MONGO_URI_HERE>`
    - `JWT_SECRET` = `<YOUR_JWT_SECRET_HERE>`
    - `JWT_EXPIRES_IN` = `7d`
    - `GOOGLE_CLIENT_ID` = `<YOUR_GOOGLE_CLIENT_ID_HERE>`
    - `GOOGLE_CLIENT_SECRET` = `<YOUR_GOOGLE_CLIENT_SECRET_HERE>`
    - `GOOGLE_CALLBACK_URL` = `http://spotify-project-2-lb-2119035301.ap-south-1.elb.amazonaws.com/api/auth/google/callback`
    - `RABBITMQ_URL` = `<YOUR_RABBITMQ_URL_HERE>`
    - `CLIENT_URL` = `http://spotify-project-2-lb-2119035301.ap-south-1.elb.amazonaws.com`
    - `COOKIE_SECURE` = `false`
* **Container 2: `music-service`**
  - **Image:** `079512360946.dkr.ecr.ap-south-1.amazonaws.com/spotify-project2-music-service:latest`
  - **Port Mappings:** Container Port `5002` (TCP)
  - **Environment Variables:**
    - `MONGO_URI` = `<YOUR_MONGO_URI_HERE>`
    - `JWT_SECRET` = `<YOUR_JWT_SECRET_HERE>`
    - `RABBITMQ_URL` = `<YOUR_RABBITMQ_URL_HERE>`
    - `CLIENT_URL` = `http://spotify-project-2-lb-2119035301.ap-south-1.elb.amazonaws.com`
    - `AWS_ACCESS_KEY_ID` = `<YOUR_AWS_ACCESS_KEY_ID_HERE>`
    - `AWS_SECRET_ACCESS_KEY` = `<YOUR_AWS_SECRET_ACCESS_KEY_HERE>`
    - `AWS_REGION` = `ap-south-1`
    - `AWS_S3_BUCKET_NAME` = `spotify-project-2-bucket`
* **Container 3: `frontend`**
  - **Image:** `079512360946.dkr.ecr.ap-south-1.amazonaws.com/spotify-project2-frontend:latest`
  - **Port Mappings:** Container Port `3000` (TCP)
  - **Depends On:** `auth-service` (Status: `START`), `music-service` (Status: `START`)
  - **Environment Variables:**
    - `AUTH_SERVICE_URL` = `http://127.0.0.1:5000`
    - `MUSIC_SERVICE_URL` = `http://127.0.0.1:5002`

> **HOW PORTABILITY WORKS:**
> Nginx is configured dynamically via the `/etc/nginx/templates/default.conf.template` file:
> - In **local Docker Compose**, we pass `AUTH_SERVICE_URL=http://auth-service:5000` and `MUSIC_SERVICE_URL=http://music-service:5002`.
> - In **ECS Fargate**, we pass `AUTH_SERVICE_URL=http://127.0.0.1:5000` and `MUSIC_SERVICE_URL=http://127.0.0.1:5002` (localhost).
> 
> Nginx automatically substitutes these variables when the container starts. This means the **exact same Docker image** works in both environments!

---

#### Task Definition 2: `spotify-notification-worker` (Notification-Service)
* **Launch Type:** Fargate
* **Task Memory:** `0.5 GB`
* **Task CPU:** `0.25 vCPU`
* **Container 1: `notification-service`**
  - **Image:** `079512360946.dkr.ecr.ap-south-1.amazonaws.com/spotify-project2-notification-service:latest`
  - **Port Mappings:** *None* (Worker only listens to CloudAMQP queue)
  - **Environment Variables:**
    - `RABBITMQ_URL` = `<YOUR_RABBITMQ_URL_HERE>`
    - `GMAIL_CLIENT_ID` = `<YOUR_GMAIL_CLIENT_ID_HERE>`
    - `GMAIL_CLIENT_SECRET` = `<YOUR_GMAIL_CLIENT_SECRET_HERE>`
    - `GMAIL_REDIRECT_URI` = `https://developers.google.com/oauthplayground`
    - `GMAIL_REFRESH_TOKEN` = `<YOUR_GMAIL_REFRESH_TOKEN_HERE>`
    - `GMAIL_USER` = `<YOUR_GMAIL_USER_EMAIL_HERE>`
    - `CLIENT_URL` = `http://spotify-project-2-lb-2119035301.ap-south-1.elb.amazonaws.com`

---

### Step 4: Create Target Group and Application Load Balancer (ALB)
To handle incoming traffic from users:
1. **Create Target Group:**
   - **Target Type:** IP
   - **Protocol:** HTTP
   - **Port:** `3000`
   - **Health Check Path:** `/`
   - **Interval:** `30 seconds`
   - **Healthy Threshold:** `2`
2. **Create ALB:**
   - **Scheme:** Internet-facing
   - **Listeners:** Port `80` (HTTP) forwarding to your Target Group.
   - **Subnets:** Select Public Subnets in at least two availability zones.

---

### Step 5: Deploy ECS Services

1. **ECS Cluster:** Create a cluster named `spotify-project-cluster`.
2. **Service 1: Web Gateway Service**
   - **Launch Type:** Fargate
   - **Task Definition:** `spotify-web-gateway` (latest)
   - **Desired Tasks:** `1` (or more for scaling)
   - **Networking:**
     - **Security Group:** Expose port `3000` to traffic originating from your ALB.
     - **Load Balancing:** Select your ALB, assign the container `frontend` (Port `3000`) to the Target Group you created.
3. **Service 2: Notification Service**
   - **Launch Type:** Fargate
   - **Task Definition:** `spotify-notification-worker` (latest)
   - **Desired Tasks:** `1`
   - **Networking:**
     - **Security Group:** Outbound internet access enabled (to connect to CloudAMQP and Google Gmail servers). No inbound rules required.
     - **Load Balancing:** None.

Once the services are active, point your browser to your ALB's DNS name (e.g., `http://spotify-alb-xxx.ap-south-1.elb.amazonaws.com`) to access your application!
http://spotify-project-2-lb-2119035301.ap-south-1.elb.amazonaws.com
