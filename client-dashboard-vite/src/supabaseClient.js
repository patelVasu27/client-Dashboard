import { createClient } from '@supabase/supabase-js';

// Environment variables are exposed to the client in Vite if prefixed with VITE_.
// Ensure these keys are for the public Supabase API and NOT the service role key.
// The service role key MUST ONLY be used on the server-side to prevent unauthorized access.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// --- Security Best Practice & Clean Code: Validate environment variables early ---
// This check ensures that required environment variables are present before attempting
// to initialize the Supabase client. In production builds, Vite typically handles
// missing VITE_ prefixed variables as build errors. However, this provides
// a clearer runtime error in development and safeguards against misconfiguration.
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Supabase environment variables are missing. Please ensure VITE_SUPABASE_URL " +
    "and VITE_SUPABASE_ANON_KEY are set in your .env file (for development) " +
    "or configured in your hosting environment (for production)."
  );
  // Depending on the application's error handling strategy:
  // - For critical apps, you might throw an error to halt execution: throw new Error("Supabase credentials missing.");
  // - For a graceful degradation, you might return a null/mock client, or simply log.
  // For this client dashboard, we log and proceed, letting subsequent Supabase calls gracefully fail.
}

/**
 * Initializes and exports the Supabase client instance for client-side use.
 *
 * Adheres to:
 * - Clean Code: Clear variable names, focused responsibility (client initialization).
 * - Security Best Practices: Uses public anon key only, with clear warning against service role key.
 *   Validates presence of required environment variables.
 * - Supabase Best Practices: Correctly initializes the client.
 *
 * @returns {import('@supabase/supabase-js').SupabaseClient} The Supabase client instance.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Clean Code: Optional development-only logging ---
// This can be helpful for debugging during development but should be excluded from production
// builds to avoid unnecessary console output and potential information disclosure.
// if (import.meta.env.DEV) {
//   console.log("Supabase Client initialized.");
//   console.log("  URL set:", !!supabaseUrl);
//   console.log("  Anon Key set:", !!supabaseAnonKey);
// }
