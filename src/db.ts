import Database from "@tauri-apps/plugin-sql";

export interface Customer {
  id: string;
  code: string;
  fullname: string;
  city: string;
  state: string;
  country: string;
  licence: string;
  is_temporary_close: boolean;
  is_close: boolean;
  customer_type: "local" | "outstation";
  company_code: string;
}

export interface Company {
  id: string;
  unique_code: string;
  name: string;
  email: string;
  address: string;
  licence: string;
  licence_expiry: string;
  phone: string;
  website: string;
  is_active: boolean;
}

let dbInstance: Database | null = null;

/**
 * Initializes and returns the SQLite database instance.
 * Automatically creates the `customers` table if it does not exist.
 */
export async function getDb(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  // Load/create the sqlite database file in the app data directory
  dbInstance = await Database.load("sqlite:novus_optra.db");

  // Create tables if they don't exist
  await dbInstance.execute(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      fullname TEXT NOT NULL,
      city TEXT,
      state TEXT,
      country TEXT,
      licence TEXT,
      is_temporary_close INTEGER DEFAULT 0,
      is_close INTEGER DEFAULT 0,
      customer_type TEXT CHECK(customer_type IN ('local', 'outstation')) DEFAULT 'local',
      company_code TEXT
    )
  `);

  try {
    await dbInstance.execute("ALTER TABLE customers ADD COLUMN company_code TEXT");
  } catch (e) {
    // Column already exists, ignore
  }

  await dbInstance.execute(`
    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      unique_code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      address TEXT,
      licence TEXT,
      licence_expiry TEXT,
      phone TEXT,
      website TEXT,
      is_active INTEGER DEFAULT 1
    )
  `);

  return dbInstance;
}

/**
 * Retrieves all customers from the database sorted by fullname.
 */
export async function getCustomers(): Promise<Customer[]> {
  const db = await getDb();
  const rows = await db.select<any[]>("SELECT * FROM customers ORDER BY fullname ASC");
  
  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    fullname: row.fullname,
    city: row.city || "",
    state: row.state || "",
    country: row.country || "",
    licence: row.licence || "",
    is_temporary_close: row.is_temporary_close === 1,
    is_close: row.is_close === 1,
    customer_type: row.customer_type as "local" | "outstation",
    company_code: row.company_code || "",
  }));
}

/**
 * Inserts a new customer into the database. Generates a random UUID for ID.
 * Throws an error if the code already exists.
 */
export async function createCustomer(customer: Omit<Customer, "id">): Promise<Customer> {
  const db = await getDb();
  const id = crypto.randomUUID();

  // Validate duplicate code
  const existing = await db.select<any[]>("SELECT id FROM customers WHERE code = $1", [customer.code]);
  if (existing.length > 0) {
    throw new Error(`Customer code "${customer.code}" is already in use.`);
  }

  await db.execute(
    `INSERT INTO customers (id, code, fullname, city, state, country, licence, is_temporary_close, is_close, customer_type, company_code)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      id,
      customer.code,
      customer.fullname,
      customer.city,
      customer.state,
      customer.country,
      customer.licence,
      customer.is_temporary_close ? 1 : 0,
      customer.is_close ? 1 : 0,
      customer.customer_type,
      customer.company_code || "",
    ]
  );

  return {
    ...customer,
    id,
  };
}

/**
 * Updates an existing customer. Throws an error if another customer already has the updated code.
 */
export async function updateCustomer(customer: Customer): Promise<void> {
  const db = await getDb();

  // Validate duplicate code for other records
  const existing = await db.select<any[]>(
    "SELECT id FROM customers WHERE code = $1 AND id != $2",
    [customer.code, customer.id]
  );
  if (existing.length > 0) {
    throw new Error(`Customer code "${customer.code}" is already in use by another customer.`);
  }

  await db.execute(
    `UPDATE customers SET 
      code = $1, 
      fullname = $2, 
      city = $3, 
      state = $4, 
      country = $5, 
      licence = $6, 
      is_temporary_close = $7, 
      is_close = $8, 
      customer_type = $9,
      company_code = $10
     WHERE id = $11`,
    [
      customer.code,
      customer.fullname,
      customer.city,
      customer.state,
      customer.country,
      customer.licence,
      customer.is_temporary_close ? 1 : 0,
      customer.is_close ? 1 : 0,
      customer.customer_type,
      customer.company_code || "",
      customer.id,
    ]
  );
}

/**
 * Deletes a customer by ID.
 */
export async function deleteCustomer(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM customers WHERE id = $1", [id]);
}

/**
 * Retrieves all companies from the database sorted by name.
 */
export async function getCompanies(): Promise<Company[]> {
  const db = await getDb();
  const rows = await db.select<any[]>("SELECT * FROM companies ORDER BY name ASC");
  
  return rows.map((row) => ({
    id: row.id,
    unique_code: row.unique_code,
    name: row.name,
    email: row.email || "",
    address: row.address || "",
    licence: row.licence || "",
    licence_expiry: row.licence_expiry || "",
    phone: row.phone || "",
    website: row.website || "",
    is_active: row.is_active === 1,
  }));
}

/**
 * Inserts a new company into the database. Generates random UUID.
 * Throws error if unique_code already exists.
 */
export async function createCompany(company: Omit<Company, "id">): Promise<Company> {
  const db = await getDb();
  const id = crypto.randomUUID();

  const existing = await db.select<any[]>("SELECT id FROM companies WHERE unique_code = $1", [company.unique_code]);
  if (existing.length > 0) {
    throw new Error(`Company code "${company.unique_code}" already exists in the local database.`);
  }

  await db.execute(
    `INSERT INTO companies (id, unique_code, name, email, address, licence, licence_expiry, phone, website, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      id,
      company.unique_code,
      company.name,
      company.email,
      company.address,
      company.licence,
      company.licence_expiry,
      company.phone,
      company.website,
      company.is_active ? 1 : 0,
    ]
  );

  return { id, ...company };
}

/**
 * Updates an existing company record.
 * Throws error if unique_code is modified to duplicate another company.
 */
export async function updateCompany(company: Company): Promise<void> {
  const db = await getDb();

  const existing = await db.select<any[]>(
    "SELECT id FROM companies WHERE unique_code = $1 AND id != $2",
    [company.unique_code, company.id]
  );
  if (existing.length > 0) {
    throw new Error(`Company code "${company.unique_code}" is already in use by another company.`);
  }

  await db.execute(
    `UPDATE companies SET unique_code = $1, name = $2, email = $3, address = $4, licence = $5, licence_expiry = $6, phone = $7, website = $8, is_active = $9
     WHERE id = $10`,
    [
      company.unique_code,
      company.name,
      company.email,
      company.address,
      company.licence,
      company.licence_expiry,
      company.phone,
      company.website,
      company.is_active ? 1 : 0,
      company.id,
    ]
  );
}

/**
 * Deletes a company by ID.
 */
export async function deleteCompany(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM companies WHERE id = $1", [id]);
}
