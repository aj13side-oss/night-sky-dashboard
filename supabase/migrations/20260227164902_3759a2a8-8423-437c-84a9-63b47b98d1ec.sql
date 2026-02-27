DROP POLICY IF EXISTS "Users can see all profiles" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);