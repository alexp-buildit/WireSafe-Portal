# 🚀 Complete Deployment Guide for WireSafe Portal

## 📋 What You'll Need

Before we start, make sure you have:
- A computer with internet access
- A GitHub account (free)
- A Vercel account (free)
- A database (we'll set this up free with Neon)

## Part 1: Setting Up Your GitHub Repository

### Step 1: Create a GitHub Account
1. Go to [github.com](https://github.com)
2. Click "Sign up" if you don't have an account
3. Choose a username, enter your email, and create a password
4. Verify your email address

### Step 2: Create a New Repository
1. Once logged into GitHub, click the green "New" button or the "+" icon
2. Name your repository: `wiresafe-portal`
3. Make sure it's set to "Public" (free accounts need public repos for Vercel)
4. Check the box "Add a README file"
5. Click "Create repository"

### Step 3: Upload Your Code to GitHub
You have two options:

**Option A: Using GitHub's Web Interface (Easier)**
1. In your new repository, click "uploading an existing file"
2. Drag and drop ALL the files from your WireSafe-Portal folder
3. Write a commit message like "Initial WireSafe Portal upload"
4. Click "Commit changes"

**Option B: Using Git Commands (if you're comfortable)**
```bash
git clone https://github.com/YOUR-USERNAME/wiresafe-portal.git
cd wiresafe-portal
# Copy all your WireSafe Portal files here
git add .
git commit -m "Initial WireSafe Portal upload"
git push origin main
```

## Part 2: Setting Up Your Database (Free with Neon)

### Step 1: Create a Neon Account
1. Go to [neon.tech](https://neon.tech)
2. Click "Sign up" and use your GitHub account to sign in
3. This will automatically link your GitHub and Neon accounts

### Step 2: Create Your Database
1. Once in Neon, click "Create Project"
2. Name your project: `wiresafe-portal-db`
3. Choose the closest region to you
4. Click "Create Project"

### Step 3: Get Your Database Connection String
1. In your Neon dashboard, click on your project
2. Go to the "Dashboard" tab
3. Look for "Connection Details"
4. Copy the "Connection string" - it looks like:
   ```
   postgresql://username:password@hostname:5432/dbname?sslmode=require
   ```
5. **SAVE THIS** - you'll need it for Vercel!

### Step 4: Set Up Your Database Tables
1. In Neon, click on "SQL Editor"
2. Copy and paste the following code:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    company_name VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    roles TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id VARCHAR(20) UNIQUE NOT NULL,
    property_address TEXT NOT NULL,
    purchase_amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'setup' CHECK (status IN ('setup', 'banking_info', 'buyer_verification', 'seller_verification', 'completed', 'flagged')),
    main_escrow_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    secondary_escrow_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transaction participants
CREATE TABLE transaction_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('buyer', 'seller', 'lender', 'main_escrow', 'secondary_escrow')),
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(transaction_id, user_id, role)
);

-- Banking information table
CREATE TABLE banking_information (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    bank_name_encrypted TEXT NOT NULL,
    account_number_encrypted TEXT NOT NULL,
    routing_number_encrypted TEXT NOT NULL,
    account_holder_name_encrypted TEXT NOT NULL,
    amount DECIMAL(15,2),
    approved_by_secondary_escrow BOOLEAN DEFAULT false,
    approved_by_main_escrow BOOLEAN DEFAULT false,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verification actions table
CREATE TABLE verification_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(100) NOT NULL,
    action_data JSONB,
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Audit logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_transactions_main_escrow ON transactions(main_escrow_id);
CREATE INDEX idx_transactions_secondary_escrow ON transactions(secondary_escrow_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transaction_participants_transaction ON transaction_participants(transaction_id);
CREATE INDEX idx_transaction_participants_user ON transaction_participants(user_id);
CREATE INDEX idx_banking_information_transaction ON banking_information(transaction_id);
CREATE INDEX idx_banking_information_user ON banking_information(user_id);
CREATE INDEX idx_audit_logs_transaction ON audit_logs(transaction_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;

-- Function to generate transaction IDs
CREATE OR REPLACE FUNCTION generate_transaction_id()
RETURNS TEXT AS $$
DECLARE
    year_str TEXT;
    counter INT;
    new_id TEXT;
BEGIN
    year_str := EXTRACT(YEAR FROM NOW())::TEXT;

    SELECT COALESCE(MAX(CAST(SUBSTRING(transaction_id FROM 9) AS INT)), 0) + 1
    INTO counter
    FROM transactions
    WHERE transaction_id LIKE 'RE-' || year_str || '-%';

    new_id := 'RE-' || year_str || '-' || LPAD(counter::TEXT, 6, '0');

    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate transaction IDs
CREATE OR REPLACE FUNCTION set_transaction_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.transaction_id IS NULL OR NEW.transaction_id = '' THEN
        NEW.transaction_id := generate_transaction_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_transaction_id
    BEFORE INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION set_transaction_id();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_banking_information_updated_at
    BEFORE UPDATE ON banking_information
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

3. Click "Run" to execute the SQL
4. You should see "Success" messages for each table created

## Part 3: Deploying to Vercel

### Step 1: Create a Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Click "Sign up"
3. Choose "Continue with GitHub" to link your accounts
4. Authorize Vercel to access your GitHub repositories

### Step 2: Import Your Project
1. On your Vercel dashboard, click "Add New..." then "Project"
2. Find your `wiresafe-portal` repository and click "Import"
3. Leave all the settings as default
4. **DON'T CLICK DEPLOY YET** - we need to add environment variables first

### Step 3: Set Up Environment Variables
1. In the Vercel import screen, scroll down to "Environment Variables"
2. Add these variables one by one:

**DATABASE_URL**
- Name: `DATABASE_URL`
- Value: Your Neon connection string (from Step 2.3 above)

**JWT_SECRET**
- Name: `JWT_SECRET`
- Value: Create a strong password like: `MySuperSecretJWTKey2024!@#$`

**ENCRYPTION_KEY**
- Name: `ENCRYPTION_KEY`
- Value: Exactly 32 characters: `12345678901234567890123456789012`

**ENCRYPTION_IV**
- Name: `ENCRYPTION_IV`
- Value: Exactly 16 characters: `1234567890123456`

**NODE_ENV**
- Name: `NODE_ENV`
- Value: `production`

**DATABASE_SSL**
- Name: `DATABASE_SSL`
- Value: `true`

**JWT_EXPIRES_IN**
- Name: `JWT_EXPIRES_IN`
- Value: `24h`

### Step 4: Deploy Your Application
1. After adding all environment variables, click "Deploy"
2. Wait for the build to complete (this takes 2-5 minutes)
3. Once complete, you'll see "🎉 Your project has been deployed"
4. Click "Visit" to see your live application!

## Part 4: Testing Your Application

### Step 1: Visit Your Live Site
1. Click the Vercel-provided URL (something like `https://wiresafe-portal-abc123.vercel.app`)
2. You should see the WireSafe Portal login page

### Step 2: Create Your First User
1. Click "Don't have an account? Register here"
2. Fill out the registration form:
   - Choose a username and password
   - Enter your email and name
   - Select "Main Escrow Officer" as your role
3. Click "Create account"
4. You should be redirected to the dashboard

### Step 3: Test Basic Functionality
1. Try creating a new transaction
2. Check that the dashboard loads properly
3. Test logging out and logging back in

## Part 5: Getting Your Custom Domain (Optional)

### Step 1: Buy a Domain
1. Go to a domain registrar like:
   - Namecheap.com
   - GoDaddy.com
   - Google Domains
2. Search for and purchase a domain like `yourcompany.com`

### Step 2: Connect Domain to Vercel
1. In your Vercel dashboard, go to your project
2. Click the "Domains" tab
3. Add your domain name
4. Follow Vercel's instructions to update your domain's DNS settings
5. Wait 24-48 hours for DNS to propagate

## 🔧 Environment Variables Explained

Here's what each environment variable does:

- **DATABASE_URL**: Connects your app to your PostgreSQL database
- **JWT_SECRET**: Secures user login sessions
- **ENCRYPTION_KEY**: Encrypts sensitive banking information
- **ENCRYPTION_IV**: Additional security for encryption
- **NODE_ENV**: Tells the app it's running in production
- **DATABASE_SSL**: Ensures secure database connections

## 🆘 Troubleshooting

### If Your Build Fails:
1. Check that all environment variables are set correctly
2. Make sure your GitHub repository has all the files
3. Check the Vercel build logs for specific error messages

### If You Can't Connect to Database:
1. Verify your DATABASE_URL is correct
2. Make sure you ran the SQL setup commands in Neon
3. Check that DATABASE_SSL is set to `true`

### If You Can't Register Users:
1. Check that your database tables were created successfully
2. Verify the ENCRYPTION_KEY is exactly 32 characters
3. Verify the ENCRYPTION_IV is exactly 16 characters

## 🎉 You're Live!

Congratulations! Your WireSafe Portal is now live on the internet. You can:

1. Share the URL with your team
2. Create user accounts for different roles
3. Start processing real estate transactions securely

## 📞 Need Help?

If you run into any issues:
1. Check the Vercel deployment logs in your dashboard
2. Verify all environment variables are set correctly
3. Make sure your database connection string is working
4. Double-check that all SQL commands ran successfully in Neon

Your application is now ready to prevent wire fraud in real estate transactions!