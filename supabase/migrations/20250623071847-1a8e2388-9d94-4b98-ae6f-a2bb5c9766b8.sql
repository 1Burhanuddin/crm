
-- Ensure the orders table has the correct structure for multiple products
-- First, let's make sure the products column exists and old columns are removed
DO $$ 
BEGIN
    -- Check if we still have the old columns and remove them if they exist
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'product_id'
    ) THEN
        ALTER TABLE public.orders DROP COLUMN IF EXISTS product_id;
    END IF;
    
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'qty'
    ) THEN
        ALTER TABLE public.orders DROP COLUMN IF EXISTS qty;
    END IF;
    
    -- Add products column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'products'
    ) THEN
        ALTER TABLE public.orders 
        ADD COLUMN products JSONB NOT NULL DEFAULT '[]';
    END IF;
    
    -- Add remarks column if it doesn't exist (seems to be missing from current schema)
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'remarks'
    ) THEN
        ALTER TABLE public.orders 
        ADD COLUMN remarks TEXT;
    END IF;
END $$;

-- Create index on products column for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_products ON public.orders USING GIN (products);

-- Ensure RLS policies exist for orders table
DO $$ 
BEGIN
    -- Enable RLS if not already enabled
    IF NOT (SELECT rowsecurity FROM pg_tables WHERE tablename = 'orders' AND schemaname = 'public') THEN
        ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create RLS policies for orders if they don't exist
DO $$ 
BEGIN
    -- Policy for SELECT
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'orders' 
        AND policyname = 'Users can view their own orders'
    ) THEN
        CREATE POLICY "Users can view their own orders" 
        ON public.orders 
        FOR SELECT 
        USING (auth.uid() = user_id);
    END IF;
    
    -- Policy for INSERT
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'orders' 
        AND policyname = 'Users can create their own orders'
    ) THEN
        CREATE POLICY "Users can create their own orders" 
        ON public.orders 
        FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
    END IF;
    
    -- Policy for UPDATE
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'orders' 
        AND policyname = 'Users can update their own orders'
    ) THEN
        CREATE POLICY "Users can update their own orders" 
        ON public.orders 
        FOR UPDATE 
        USING (auth.uid() = user_id);
    END IF;
    
    -- Policy for DELETE
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'orders' 
        AND policyname = 'Users can delete their own orders'
    ) THEN
        CREATE POLICY "Users can delete their own orders" 
        ON public.orders 
        FOR DELETE 
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- Also ensure other tables have proper RLS policies
-- Customers table
DO $$ 
BEGIN
    IF NOT (SELECT rowsecurity FROM pg_tables WHERE tablename = 'customers' AND schemaname = 'public') THEN
        ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Users can manage their own customers') THEN
        CREATE POLICY "Users can manage their own customers" ON public.customers FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- Products table
DO $$ 
BEGIN
    IF NOT (SELECT rowsecurity FROM pg_tables WHERE tablename = 'products' AND schemaname = 'public') THEN
        ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Users can manage their own products') THEN
        CREATE POLICY "Users can manage their own products" ON public.products FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;
