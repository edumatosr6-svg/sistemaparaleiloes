-- These will be stored within the 'site_config' JSON in the system_settings table, 
-- but we ensure the keys exist by initializing them if not present.

-- No structural changes needed to the table since it uses a JSON value for 'site_config'.
-- We will handle the defaults in the application code.

-- However, let's create a separate key for easier access if preferred, 
-- or just stick to site_config as the app already uses it extensively.
-- I'll stick to site_config to minimize changes to existing loading logic.
