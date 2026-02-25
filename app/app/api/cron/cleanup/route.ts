import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Simple authorization via secret header/param (Vercel Cron provides this)
  const authHeader = req.headers.get('authorization');
  const secretParam = req.nextUrl.searchParams.get('secret');

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && secretParam !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date().toISOString();

    // 1. Find all expired sessions (not yet marked as deleted)
    const { data: sessions, error: fetchError } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .lt('expires_at', now)
      .eq('is_deleted', false);

    if (fetchError) {
      console.error('Fetch expired sessions error:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch expired sessions' }, { status: 500 });
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ message: 'No expired sessions to clean up' });
    }

    // 2. Delete files from storage
    const pathsToDelete = sessions.map(s => s.file_path);
    const { error: storageError } = await supabaseAdmin.storage
      .from('merged-files')
      .remove(pathsToDelete);

    if (storageError) {
      console.error('Storage deletion error:', storageError);
      // We continue anyway to update the database records
    }

    // 3. Update database records to mark as deleted (or delete them entirely)
    // I'll mark as deleted and keep the metadata for logs, or just delete if user wants full privacy
    const sessionIds = sessions.map(s => s.id);
    const { error: deleteError } = await supabaseAdmin
      .from('sessions')
      .update({ is_deleted: true })
      .in('id', sessionIds);

    if (deleteError) {
      console.error('DB update error:', deleteError);
      return NextResponse.json({ error: 'Failed to update session records' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Cleanup successful',
      deletedCount: sessions.length,
      filesProcessed: pathsToDelete
    });
  } catch (err) {
    console.error('Cleanup cron error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
