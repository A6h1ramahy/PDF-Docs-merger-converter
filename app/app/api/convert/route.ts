import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { convertFile, ConvertTask } from '@/lib/cloudconvert';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';
export const maxDuration = 120; // Conversion can take longer

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const task = formData.get('task') as ConvertTask; // 'pdf-to-docx' or 'docx-to-pdf'
    const sessionToken = formData.get('sessionToken') as string; // Optional: convert existing session file
    const file = formData.get('file') as File; // Optional: upload new file to convert

    if (!task || !['pdf-to-docx', 'docx-to-pdf'].includes(task)) {
      return NextResponse.json({ error: 'Invalid conversion task' }, { status: 400 });
    }

    let inputBuffer: Buffer;
    let inputFilename: string;

    if (sessionToken) {
      // Get file from existing session
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
    } else if (file) {
      // Use uploaded file
      inputBuffer = Buffer.from(await file.arrayBuffer());
      inputFilename = file.name;
    } else {
      return NextResponse.json({ error: 'No file or session token provided' }, { status: 400 });
    }

    // Convert file
    const { buffer: outputBuffer, outputFilename } = await convertFile(inputBuffer, inputFilename, task);

    // Upload to Supabase
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

    // Create session record
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
