-- AlterTable
-- Add preferredName column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'preferredName'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "preferredName" TEXT;
    END IF;
END $$;

