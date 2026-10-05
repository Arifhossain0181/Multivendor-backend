-- AlterTable
ALTER TABLE "sub_orders" ADD COLUMN     "deliveryManId" TEXT;

-- CreateIndex
CREATE INDEX "sub_orders_deliveryManId_idx" ON "sub_orders"("deliveryManId");

-- AddForeignKey
ALTER TABLE "sub_orders" ADD CONSTRAINT "sub_orders_deliveryManId_fkey" FOREIGN KEY ("deliveryManId") REFERENCES "delivery_men"("id") ON DELETE SET NULL ON UPDATE CASCADE;
