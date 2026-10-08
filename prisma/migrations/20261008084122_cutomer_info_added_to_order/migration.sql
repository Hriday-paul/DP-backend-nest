/*
  Warnings:

  - Added the required column `customerEmail` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerName` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerWhatsapp` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `accountNumber` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transactionId` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('BKASH', 'NAGAD', 'ROCKET', 'CARD', 'CASH');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "customerEmail" TEXT NOT NULL,
ADD COLUMN     "customerName" TEXT NOT NULL,
ADD COLUMN     "customerNote" TEXT,
ADD COLUMN     "customerWhatsapp" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "accountNumber" TEXT NOT NULL,
ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'BKASH',
ADD COLUMN     "transactionId" TEXT NOT NULL;
