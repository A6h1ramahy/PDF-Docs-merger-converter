import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { convertFile, ConvertTask } from '@/lib/cloudconvert';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';
export const maxDuration = 120; 

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    let task = formData.get('task') as ConvertTask | 'infer'; 
    const sessionToken = formData.get('sessionToken') as string; 
    const file = formData.get('file') as File; 

    let inputBuffer: Buffer;
    let inputFilename: string;

    if (sessionToken) {
      const { data: session, error: sessionError } = await supabaseAdmin
        .from('sessions')
        .select('*')
        .eq('token', sessionToken)
        .single();

      if (sessionError || !session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      const { data: fileData, error: downloadError } = await supabaseAdmin.storage
        .from('merged-files')
        .download(session.file_path);

      if (downloadError || !fileData) {
        return NextResponse.json({ error: 'Failed to download original file' }, { status: 500 });
      }

      inputBuffer = Buffer.from(await fileData.arrayBuffer());
      inputFilename = session.file_name;

      if (task === 'infer') {
        task = session.file_type === 'pdf' ? 'pdf-to-docx' : 'docx-to-pdf';
      }
    } else if (file) {
      inputBuffer = Buffer.from(await file.arrayBuffer());
      inputFilename = file.name;
      if (task === 'infer') return NextResponse.json({ error: 'Cannot infer task for new upload' }, { status: 400 });
    } else {
      return NextResponse.json({ error: 'No file or session token provided' }, { status: 400 });
    }

    if (!task || !['pdf-to-docx', 'docx-to-pdf'].includes(task as string)) {
      return NextResponse.json({ error: 'Invalid conversion task' }, { status: 400 });
    }

    const { buffer: outputBuffer, outputFilename } = await convertFile(inputBuffer, inputFilename, task as ConvertTask);

    const newToken = uuidv4();
    const fileType = task === 'pdf-to-docx' ? 'docx' : 'pdf';
    const storagePath = `sessions/${newToken}/${outputFilename}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('merged-files')
      .upload(storagePath, outputBuffer, {
        contentType: fileType === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to store converted file' }, { status: 500 });
    }

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const { error: dbError } = await supabaseAdmin.from('sessions').insert({
      token: newToken,
      file_path: storagePath,
      file_name: outputFilename,
      file_type: fileType,
      expires_at: expiresAt,
    });

    if (dbError) {
      console.error('DB insert error:', dbError);
      await supabaseAdmin.storage.from('merged-files').remove([storagePath]);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    return NextResponse.json({
      token: newToken,
      fileType,
      fileName: outputFilename,
      expiresAt,
    });
  } catch (err) {
    console.error('Conversion error:', err);
    return NextResponse.json({ error: 'Conversion failed: ' + (err as Error).message }, { status: 500 });
  }
}
