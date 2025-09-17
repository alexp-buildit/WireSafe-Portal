const { pool } = require('../lib/db');

const migrations = [
  // Users table
  `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`,

  `CREATE TABLE IF NOT EXISTS users (
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
  );`,

  // Transactions table
  `CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id VARCHAR(20) UNIQUE NOT NULL,
    property_address TEXT NOT NULL,
    purchase_amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'setup' CHECK (status IN ('setup', 'banking_info', 'buyer_verification', 'seller_verification', 'completed', 'flagged')),
    main_escrow_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    secondary_escrow_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );`,

  // Transaction participants
  `CREATE TABLE IF NOT EXISTS transaction_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('buyer', 'seller', 'lender', 'main_escrow', 'secondary_escrow')),
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(transaction_id, user_id, role)
  );`,

  // Banking information table
  `CREATE TABLE IF NOT EXISTS banking_information (
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
  );`,

  // Verification actions table
  `CREATE TABLE IF NOT EXISTS verification_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(100) NOT NULL,
    action_data JSONB,
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
  );`,

  // Audit logs table
  `CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );`,

  // Notifications table
  `CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );`,

  // Indexes for performance
  `CREATE INDEX IF NOT EXISTS idx_transactions_main_escrow ON transactions(main_escrow_id);`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_secondary_escrow ON transactions(secondary_escrow_id);`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);`,
  `CREATE INDEX IF NOT EXISTS idx_transaction_participants_transaction ON transaction_participants(transaction_id);`,
  `CREATE INDEX IF NOT EXISTS idx_transaction_participants_user ON transaction_participants(user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_banking_information_transaction ON banking_information(transaction_id);`,
  `CREATE INDEX IF NOT EXISTS idx_banking_information_user ON banking_information(user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_audit_logs_transaction ON audit_logs(transaction_id);`,
  `CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);`,
  `CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;`,

  // Function to generate transaction IDs
  `CREATE OR REPLACE FUNCTION generate_transaction_id()
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
  $$ LANGUAGE plpgsql;`,

  // Trigger to auto-generate transaction IDs
  `CREATE OR REPLACE FUNCTION set_transaction_id()
  RETURNS TRIGGER AS $$
  BEGIN
    IF NEW.transaction_id IS NULL OR NEW.transaction_id = '' THEN
      NEW.transaction_id := generate_transaction_id();
    END IF;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;`,

  `DROP TRIGGER IF EXISTS trigger_set_transaction_id ON transactions;`,
  `CREATE TRIGGER trigger_set_transaction_id
    BEFORE INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION set_transaction_id();`,

  // Function to update updated_at timestamp
  `CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;`,

  // Triggers for updated_at
  `DROP TRIGGER IF EXISTS update_users_updated_at ON users;`,
  `CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();`,

  `DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;`,
  `CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();`,

  `DROP TRIGGER IF EXISTS update_banking_information_updated_at ON banking_information;`,
  `CREATE TRIGGER update_banking_information_updated_at
    BEFORE UPDATE ON banking_information
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();`
];

async function runMigrations() {
  const client = await pool.connect();

  try {
    console.log('Starting database migrations...');

    for (let i = 0; i < migrations.length; i++) {
      console.log(`Running migration ${i + 1}/${migrations.length}...`);
      await client.query(migrations[i]);
    }

    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Database setup complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database setup failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigrations };