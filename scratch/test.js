const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() {
  const tables = await prisma.$queryRawUnsafe('SHOW TABLES');
  console.log('Tables:', tables);
  
  const shipCount = await prisma.shipment.count();
  const invCount = await prisma.invoice.count();
  const payCount = await prisma.payment.count();
  const notifCount = await prisma.notification.count();
  const logCount = await prisma.auditLog.count();
  
  console.log(`\nCounts:\nShipments: ${shipCount}\nInvoices: ${invCount}\nPayments: ${payCount}\nNotifications: ${notifCount}\nAuditLogs: ${logCount}`);
}
check().finally(() => prisma.$disconnect());
