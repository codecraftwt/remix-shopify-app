/*
  Warnings:

  - You are about to alter the column `price` on the `Wishlist` table. The data in that column could be lost. The data in that column will be cast from `String` to `Float`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Wishlist" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customerId" TEXT,
    "productId" TEXT,
    "shop" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" REAL,
    "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Wishlist" ("createdAt", "customerId", "id", "price", "productId", "quantity", "shop") SELECT "createdAt", "customerId", "id", "price", "productId", "quantity", "shop" FROM "Wishlist";
DROP TABLE "Wishlist";
ALTER TABLE "new_Wishlist" RENAME TO "Wishlist";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
