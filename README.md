# WireSafe Portal - Wire Fraud Prevention Platform

A secure web application designed to prevent fraudulent wire transfers in commercial and residential real estate transactions through multi-party verification and secure information sharing.

## 🚀 Features

- **Multi-Party Verification System**: Robust verification workflow requiring multiple approvals at each critical stage
- **Secure Banking Information Management**: All sensitive financial data encrypted at rest and transmitted over secure channels
- **Real-Time Transaction Tracking**: Intuitive dashboard showing transaction progress and required actions
- **Comprehensive Audit Logging**: Immutable audit trails for compliance and fraud investigation
- **Role-Based Access Control**: Different permissions for escrow officers, buyers, sellers, and lenders
- **Wire Fraud Prevention**: Multiple verification checkpoints to prevent fraudulent wire transfers

## 🏗️ Architecture

- **Frontend**: Next.js with React and Tailwind CSS
- **Backend**: Node.js with Express.js API routes
- **Database**: PostgreSQL with encrypted sensitive data
- **Authentication**: JWT tokens with secure session management
- **Deployment**: Vercel platform with automatic scaling

## 🔧 Installation

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Vercel account (for deployment)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/wiresafe-portal.git
   cd wiresafe-portal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your configuration:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/wire_fraud_prevention
   JWT_SECRET=your-super-secure-jwt-secret-key
   ENCRYPTION_KEY=your-32-character-encryption-key
   ENCRYPTION_IV=your-16-character-initialization-vector
   ```

4. **Set up the database**
   ```bash
   npm run db:migrate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

### Transaction Management

- `GET /api/transactions` - Get user's transactions
- `POST /api/transactions` - Create new transaction (main escrow only)
- `GET /api/transactions/[id]` - Get transaction details
- `PUT /api/transactions/[id]` - Update transaction status
- `PUT /api/transactions/[id]/users` - Add users to transaction

### Banking Information

- `POST /api/banking/[transactionId]` - Submit banking information
- `GET /api/banking/[transactionId]` - Get banking information
- `PUT /api/banking/[id]/approve` - Approve banking information

### Verification Workflows

- `POST /api/verify/buyer/[transactionId]` - Buyer verification actions
- `POST /api/verify/seller/[transactionId]` - Seller verification actions
- `POST /api/verify/escrow/[transactionId]` - Escrow verification actions

### Audit & Notifications

- `GET /api/audit/[transactionId]` - Get transaction audit log
- `GET /api/audit/user/[userId]` - Get user audit log
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications` - Mark notifications as read

## 🔐 Security Features

- **Data Encryption**: AES-256 encryption for all banking information
- **Secure Authentication**: JWT tokens with configurable expiration
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Comprehensive server-side validation
- **Audit Logging**: Complete activity tracking for compliance
- **HTTPS Enforcement**: All communications over secure channels

## 👥 User Roles

### Main Escrow Officer
- Create transactions
- Add participants
- Verify fund receipts
- Access full audit logs

### Secondary Escrow Officer
- Approve banking information
- Co-approve changes
- Verify seller information
- Access audit logs

### Buying Party/Lender
- Enter banking information
- Verify escrow banking details
- Authorize wire transfers
- View transaction status

### Selling Party
- Verify banking information
- Confirm property details
- Acknowledge payment receipt
- View transaction status

## 🚀 Deployment

### Deploy to Vercel

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Set up environment variables in Vercel dashboard**
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `ENCRYPTION_KEY`
   - `ENCRYPTION_IV`
   - `NODE_ENV=production`

3. **Deploy**
   ```bash
   npm run deploy
   ```

### Environment Variables

Required for production:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret for JWT token signing | `your-super-secure-secret` |
| `ENCRYPTION_KEY` | 32-character encryption key | `12345678901234567890123456789012` |
| `ENCRYPTION_IV` | 16-character initialization vector | `1234567890123456` |
| `NODE_ENV` | Environment mode | `production` |
| `BASE_URL` | Application base URL | `https://yourdomain.vercel.app` |

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## 📊 Monitoring

### Health Check
Check application health at `/api/health`

### Audit Logs
All user actions are logged with:
- Timestamps (UTC)
- IP addresses
- User agents
- Action details
- Transaction associations

## 🔄 Transaction Workflow

1. **Setup Phase**: Main escrow creates transaction and adds secondary escrow
2. **Banking Info Collection**: All parties enter encrypted banking details
3. **Approval Process**: Secondary escrow approves all banking information
4. **Buyer Verification**: Buyers verify escrow details and authorize transfers
5. **Fund Receipt**: Escrow verifies receipt of buyer funds
6. **Seller Verification**: Sellers verify their information and property details
7. **Payment Authorization**: Dual escrow approval for seller payments
8. **Completion**: All parties acknowledge successful transaction

## 🛡️ Wire Fraud Prevention

The platform prevents wire fraud through:

- **Multi-party verification** at each critical step
- **Dual escrow approval** for all banking changes
- **Encrypted banking information** storage
- **Real-time verification** of account details
- **Audit trails** for all actions
- **Flagging system** for suspicious activity
- **Time-based controls** and session management

## 📞 Support

For technical support or security concerns:

1. Check the `/api/health` endpoint for system status
2. Review audit logs for transaction-specific issues
3. Contact your system administrator

## 📄 License

This project is proprietary software designed for real estate wire fraud prevention.

## 🤝 Contributing

Please read the security guidelines before contributing:

1. All database changes require migration scripts
2. Security-related changes require additional review
3. Comprehensive test coverage is required
4. Follow established coding standards

---

**Security Notice**: This application handles sensitive financial information. Always use HTTPS in production and follow security best practices for deployment and maintenance.
