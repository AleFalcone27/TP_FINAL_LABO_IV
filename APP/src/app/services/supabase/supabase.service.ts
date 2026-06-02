import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {

  private supabase: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey,
  );

  get storage() {
    return this.supabase.storage;
  }

  uploadFile(bucket: string, path: string, file: File) {
    return this.supabase.storage.from(bucket).upload(path, file, { upsert: true });
  }

  getPublicUrl(bucket: string, path: string) {
    return this.supabase.storage.from(bucket).getPublicUrl(path);
  }

  downloadFile(bucket: string, path: string) {
    return this.supabase.storage.from(bucket).download(path);
  }

  listFiles(bucket: string, folder: string = '') {
    return this.supabase.storage.from(bucket).list(folder);
  }

  deleteFile(bucket: string, paths: string[]) {
    return this.supabase.storage.from(bucket).remove(paths);
  }
}

