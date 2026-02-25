# DynamoDB CRUD – MERN Stack on AWS EC2

A full-stack CRUD application demonstrating all **5 DynamoDB attribute types** with a Node.js/Express backend and React frontend, deployed on AWS EC2.

---

## Architecture

```
Internet → EC2 (port 80)
              └─ Nginx
                   ├─ /create|/read|/update|/delete  →  Express :5000
                   └─ /*  →  React static build (client/dist)
                                       │
                                       └─ @aws-sdk/lib-dynamodb  →  AWS DynamoDB
```

---

## DynamoDB Schema – `Tasks` Table

| Attribute     | Type    | Description                              |
|---------------|---------|------------------------------------------|
| `taskId`      | **S**   | Partition key · UUID                     |
| `title`       | **S**   | Task title                               |
| `priority`    | **N**   | Integer 1–5                              |
| `isCompleted` | **BOOL**| Completion status                        |
| `tags`        | **L**   | List of tag strings                      |
| `metadata`    | **M**   | Map with `assignee`, `dueDate`, `category` |

---

## API Endpoints

| Method | Path            | Description                    |
|--------|-----------------|--------------------------------|
| POST   | `/create`       | Create a new task              |
| GET    | `/read`         | List all tasks (Scan)          |
| PUT    | `/update`       | Update task attributes by ID   |
| DELETE | `/delete/:id`   | Delete a task by ID            |
| GET    | `/health`       | Health check                   |

### Sample Request – POST /create
```json
{
  "title":       "Deploy to EC2",
  "priority":    5,
  "isCompleted": false,
  "tags":        ["aws", "devops", "urgent"],
  "metadata":    { "assignee": "Alice", "dueDate": "2026-03-01", "category": "Infrastructure" }
}
```

---

## Local Development

### Prerequisites
- Node.js 18+
- AWS credentials configured (`~/.aws/credentials` or env vars)

### 1. Backend
```bash
cd server
cp .env.example .env          # edit if needed
npm install
node scripts/createTable.js   # one-time: create DynamoDB table
npm run dev                   # starts on :5000 with nodemon
```

### 2. Frontend
```bash
cd client
npm install
npm run dev                   # starts on :3000, proxies API to :5000
```

---

## EC2 Deployment (Amazon Linux 2023)

### 1. Provision EC2
- **AMI**: Amazon Linux 2023
- **IAM Role**: Attach a role with `AmazonDynamoDBFullAccess` (or a scoped-down policy)
- **Security Group**: Inbound 22 (SSH), 80 (HTTP)

### 2. Install dependencies on EC2
```bash
# Node.js 20.x
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs git

# PM2 (process manager)
sudo npm install -g pm2

# Nginx
sudo dnf install -y nginx
sudo systemctl enable nginx
```

### 3. Deploy code
```bash
# Clone or copy files to EC2
git clone https://github.com/YOUR_USER/YOUR_REPO.git /home/ec2-user/app
cd /home/ec2-user/app

# Install backend deps
cd server && npm install --omit=dev && cd ..

# Create DynamoDB table (only once)
node server/scripts/createTable.js

# Build React frontend
cd client && npm install && npm run build && cd ..
```

### 4. Start backend with PM2
```bash
# From the root of the project
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup   # follow printed instructions to survive reboots
```

### 5. Configure Nginx
```bash
sudo cp nginx.conf /etc/nginx/conf.d/dynamodb-crud.conf
sudo nginx -t          # test config
sudo systemctl reload nginx
```

Your app is now live at `http://<EC2-PUBLIC-IP>/`

---

## Security Notes

- **No hardcoded credentials** – the AWS SDK uses the EC2 Instance Metadata Service (IMDS) via the **IAM Role** attached to the instance.
- Restrict the IAM Role to only the `dynamodb:PutItem`, `dynamodb:Scan`, `dynamodb:UpdateItem`, `dynamodb:DeleteItem` actions on the `Tasks` table ARN.
- For HTTPS, use **AWS Certificate Manager + ALB** or **Certbot (Let's Encrypt)** with Nginx.
