-- CreateTable
CREATE TABLE "retailers" (
    "id" UUID NOT NULL,
    "domain" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "retailers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "retailerId" UUID NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "retailers_domain_key" ON "retailers"("domain");

-- CreateIndex
CREATE INDEX "retailers_domain_idx" ON "retailers"("domain");

-- CreateIndex
CREATE INDEX "coupons_retailerId_idx" ON "coupons"("retailerId");

-- AddForeignKey
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES "retailers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
