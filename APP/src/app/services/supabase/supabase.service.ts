import { Injectable } from '@angular/core';
import { createClient } from '@supabase/supabase-js'

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {

  constructor() { }

  supabase = createClient('https://supabase.com/dashboard/project/boxjlgemcqztmbmmdcmq', 'public-anon-key')
}
