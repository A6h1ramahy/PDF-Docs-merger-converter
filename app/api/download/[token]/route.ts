import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .eq('token', token)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Link expired or invalid' }, { status: 404 });
    }

    if (new Date(session.expires_at) < new Date()) {
       return NextResponse.json({ error: 'This link has expired (15-minute limit)' }, { status: 410 });
    }

    const { data, error: urlError } = await supabaseAdmin.storage
      .from('merged-files')
      .createSignedUrl(session.file_path, 60, {
        download: session.file_name,
      });

    if (urlError || !data?.signedUrl) {
      console.error('Signed URL error:', urlError);
      return NextResponse.json({ error: 'Failed to generate download link' }, { status: 500 });
    }

    return NextResponse.redirect(data.signedUrl);
  } catch (err) {
    console.error('Download route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
