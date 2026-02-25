import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const secretParam = req.nextUrl.searchParams.get('secret');

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && secretParam !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date().toISOString();

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

    const pathsToDelete = sessions.map(s => s.file_path);
    const { error: storageError } = await supabaseAdmin.storage
      .from('merged-files')
      .remove(pathsToDelete);

    if (storageError) {
      console.error('Storage deletion error:', storageError);
    }

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
