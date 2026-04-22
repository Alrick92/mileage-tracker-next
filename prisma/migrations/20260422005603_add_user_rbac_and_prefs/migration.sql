-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Unit" AS ENUM ('KM', 'MI');

-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('EN', 'FR');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "locale" "Locale" NOT NULL DEFAULT 'EN',
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER',
ADD COLUMN     "unit" "Unit" NOT NULL DEFAULT 'MI';
