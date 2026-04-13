ALTER TABLE "users" ADD COLUMN "wallet_nonce" varchar(100);
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_wallet_address_unique" UNIQUE("wallet_address");
