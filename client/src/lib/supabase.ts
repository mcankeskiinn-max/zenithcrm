import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vdbcoxahsgmvwubuwnqp.supabase.co';
const supabaseAnonKey = 'sb_publishable_m-ZqrAWUsty-KdbZuZmaWw_8tuYh4mC';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
