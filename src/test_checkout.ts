import 'dotenv/config';
import { processCheckout } from './modules/checkout/checkout.service';
import { prisma } from './prisma/client';

async function main() {
  const userId = 'da402692-6fc5-448f-99d4-177771443234';
  try {
    const res = await processCheckout(userId, 'Test shipping address, Dhaka, 1207');
    console.log('Success:', res);
  } catch (err: any) {
    console.error('Error occurred:');
    console.error(err);
    if (err.stack) {
      console.error(err.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
