-- CreateTable
CREATE TABLE "service_images" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "service_images_serviceId_idx" ON "service_images"("serviceId");

-- AddForeignKey
ALTER TABLE "service_images" ADD CONSTRAINT "service_images_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
