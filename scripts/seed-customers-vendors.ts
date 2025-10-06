import { db } from "../lib/db";
import { customers, vendors } from "../lib/db/schema";
import { randomUUID } from "crypto";

async function main() {
  console.log("Seeding customers and vendors...");

  // Seed customers
  const customersData = [
    {
      id: randomUUID(),
      name: "Acme Corporation",
      email: "contact@acme.com",
      phone: "+1-555-0101",
      address: "123 Business St, New York, NY 10001",
      taxId: "12-3456789",
      creditLimit: 50000,
      notes: "Major client - Net 30 payment terms",
      isActive: true,
    },
    {
      id: randomUUID(),
      name: "TechStart Inc",
      email: "billing@techstart.io",
      phone: "+1-555-0102",
      address: "456 Innovation Ave, San Francisco, CA 94102",
      taxId: "98-7654321",
      creditLimit: 25000,
      notes: "Fast-growing startup",
      isActive: true,
    },
    {
      id: randomUUID(),
      name: "Global Retail Co",
      email: "accounts@globalretail.com",
      phone: "+1-555-0103",
      address: "789 Commerce Blvd, Chicago, IL 60601",
      taxId: "45-6789012",
      creditLimit: 100000,
      notes: "Large retail chain - Monthly billing",
      isActive: true,
    },
    {
      id: randomUUID(),
      name: "Small Business LLC",
      email: "owner@smallbiz.com",
      phone: "+1-555-0104",
      address: "321 Main St, Austin, TX 78701",
      taxId: "67-8901234",
      creditLimit: 10000,
      notes: "Local business - Cash on delivery preferred",
      isActive: true,
    },
    {
      id: randomUUID(),
      name: "Enterprise Solutions",
      email: "procurement@enterprise.com",
      phone: "+1-555-0105",
      address: "555 Corporate Dr, Boston, MA 02101",
      taxId: "23-4567890",
      creditLimit: 75000,
      notes: "Enterprise client - Quarterly contracts",
      isActive: true,
    },
  ];

  for (const customer of customersData) {
    await db.insert(customers).values(customer);
    console.log(`Created customer: ${customer.name}`);
  }

  // Seed vendors
  const vendorsData = [
    {
      id: randomUUID(),
      name: "Office Supplies Co",
      email: "sales@officesupplies.com",
      phone: "+1-555-0201",
      address: "100 Supply St, Denver, CO 80201",
      taxId: "11-2233445",
      paymentTerms: "Net 30",
      notes: "Office supplies and equipment",
      isActive: true,
    },
    {
      id: randomUUID(),
      name: "Tech Hardware Inc",
      email: "orders@techhardware.com",
      phone: "+1-555-0202",
      address: "200 Tech Park, Seattle, WA 98101",
      taxId: "22-3344556",
      paymentTerms: "Net 45",
      notes: "Computer hardware and accessories",
      isActive: true,
    },
    {
      id: randomUUID(),
      name: "Cloud Services Provider",
      email: "billing@cloudservices.com",
      phone: "+1-555-0203",
      address: "300 Cloud Ave, Portland, OR 97201",
      taxId: "33-4455667",
      paymentTerms: "Monthly subscription",
      notes: "Cloud hosting and services",
      isActive: true,
    },
    {
      id: randomUUID(),
      name: "Marketing Agency",
      email: "accounts@marketingpro.com",
      phone: "+1-555-0204",
      address: "400 Creative Blvd, Miami, FL 33101",
      taxId: "44-5566778",
      paymentTerms: "50% upfront, 50% on completion",
      notes: "Digital marketing services",
      isActive: true,
    },
    {
      id: randomUUID(),
      name: "Legal Services LLP",
      email: "billing@legalservices.com",
      phone: "+1-555-0205",
      address: "500 Law St, Washington, DC 20001",
      taxId: "55-6677889",
      paymentTerms: "Net 15",
      notes: "Legal consultation and services",
      isActive: true,
    },
  ];

  for (const vendor of vendorsData) {
    await db.insert(vendors).values(vendor);
    console.log(`Created vendor: ${vendor.name}`);
  }

  console.log("✅ Seeding completed!");
  console.log(`Created ${customersData.length} customers`);
  console.log(`Created ${vendorsData.length} vendors`);
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
