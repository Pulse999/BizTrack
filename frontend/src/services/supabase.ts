import { createClient } from "@supabase/supabase-js";

// Read env vars (Vite injects these at build time)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isConfigured) {
	// Avoid calling createClient with empty values (it validates and throws).
	// Log a helpful message so developers know why the app won't connect to Supabase.
	// In production you should ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.
	// Exporting `null` allows consumers to handle absence gracefully.
	// eslint-disable-next-line no-console
	console.warn(
		'[supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set. Supabase client will be unavailable.'
	);
}

export const supabase = isConfigured
	? createClient(supabaseUrl as string, supabaseAnonKey as string)
	: null as unknown as ReturnType<typeof createClient>;
