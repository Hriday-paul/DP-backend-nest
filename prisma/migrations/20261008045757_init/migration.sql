-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MEMBER', 'MANAGER');

-- CreateEnum
CREATE TYPE "Otp_type" AS ENUM ('REGISTER', 'CHANGE_EMAIL', 'FORGOT_PASSWORD', 'MULTI_FACTOR_AUTH');

-- CreateTable
CREATE TABLE "auths" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "last_loginAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "passwordChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "auths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpRequest" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiredAt" TIMESTAMP(3) NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "type" "Otp_type" NOT NULL DEFAULT 'REGISTER',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "userId" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "OtpRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "countries" TEXT[],
    "address" TEXT,
    "profession" TEXT,
    "company" TEXT,
    "notification" BOOLEAN NOT NULL DEFAULT true,
    "fcmToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_pictures" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_pictures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "auths_userId_key" ON "auths"("userId");

-- CreateIndex
CREATE INDEX "auths_userId_idx" ON "auths"("userId");

-- CreateIndex
CREATE INDEX "OtpRequest_userId_idx" ON "OtpRequest"("userId");

-- CreateIndex
CREATE INDEX "OtpRequest_type_idx" ON "OtpRequest"("type");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_isDeleted_idx" ON "users"("email", "isDeleted");

-- CreateIndex
CREATE INDEX "users_id_isDeleted_idx" ON "users"("id", "isDeleted");

-- CreateIndex
CREATE INDEX "users_id_email_isDeleted_idx" ON "users"("id", "email", "isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "profile_pictures_userId_key" ON "profile_pictures"("userId");

-- CreateIndex
CREATE INDEX "profile_pictures_userId_idx" ON "profile_pictures"("userId");

-- CreateIndex
CREATE INDEX "notifications_receiverId_idx" ON "notifications"("receiverId");

-- AddForeignKey
ALTER TABLE "auths" ADD CONSTRAINT "auths_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtpRequest" ADD CONSTRAINT "OtpRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_pictures" ADD CONSTRAINT "profile_pictures_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
