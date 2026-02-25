import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { mergePDFs } from '@/lib/merge-pdf';
import { mergeDOCXFiles } from '@/lib/merge-docx';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const fileType = formData.get('fileType') as string; 

    if (!fileType || !['pdf', 'docx'].includes(fileType)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    const files: { buffer: Buffer; order: number; name: string }[] = [];
    let index = 0;

    while (formData.get(`file_${index}`)) {
      const file = formData.get(`file_${index}`) as File;
      const order = parseInt(formData.get(`order_${index}`) as string, 10);
      const arrayBuffer = await file.arrayBuffer();
      files.push({
        buffer: Buffer.from(arrayBuffer),
        order: isNaN(order) ? index : order,
        name: file.name,
      });
      index++;
    }

    if (files.length < 2) {
      return NextResponse.json({ error: 'Please upload at least 2 files to merge' }, { status: 400 });
    }

    let mergedBuffer: Buffer;
    let outputFilename: string;

    if (fileType === 'pdf') {
      mergedBuffer = await mergePDFs(files);
      outputFilename = 'merged.pdf';
    } else {
      mergedBuffer = await mergeDOCXFiles(files);
      outputFilename = 'merged.docx';
    }

    const token = uuidv4();
    const storagePath = `sessions/${token}/${outputFilename}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('merged-files')
      .upload(storagePath, mergedBuffer, {
        contentType: fileType === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to store merged file' }, { status: 500 });
    }

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const { error: dbError } = await supabaseAdmin.from('sessions').insert({
      token,
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
      token,
      fileType,
      fileName: outputFilename,
      expiresAt,
    });
  } catch (err) {
    console.error('Merge error:', err);
    return NextResponse.json({ error: 'Merge failed: ' + (err as Error).message }, { status: 500 });
  }
}
