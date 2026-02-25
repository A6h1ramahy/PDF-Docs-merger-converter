import CloudConvert from 'cloudconvert';

const cloudConvert = new CloudConvert(process.env.CLOUDCONVERT_API_KEY!);

export type ConvertTask = 'pdf-to-docx' | 'docx-to-pdf';

export async function convertFile(
  inputBuffer: Buffer,
  filename: string,
  task: ConvertTask
): Promise<{ buffer: Buffer; outputFilename: string }> {
  const isToDocx = task === 'pdf-to-docx';
  const inputFormat = isToDocx ? 'pdf' : 'docx';
  const outputFormat = isToDocx ? 'docx' : 'pdf';
  const outputFilename = filename.replace(/\.[^.]+$/, '') + '.' + outputFormat;

  // Create job with upload + convert + export tasks
  const job = await cloudConvert.jobs.create({
    tasks: {
      'upload-file': {
        operation: 'import/upload',
      },
      'convert-file': {
        operation: 'convert',
        input: 'upload-file',
        input_format: inputFormat,
        output_format: outputFormat,
      },
      'export-file': {
        operation: 'export/url',
        input: 'convert-file',
      },
    },
  });

  // Upload the file
  const uploadTask = job.tasks.find((t) => t.name === 'upload-file');
  if (!uploadTask) throw new Error('Upload task not found in CloudConvert job');

  await cloudConvert.tasks.upload(uploadTask, inputBuffer as unknown as Blob, filename);

  // Wait for job completion
  const completedJob = await cloudConvert.jobs.wait(job.id);

  // Get the export task
  const exportTask = completedJob.tasks.find((t) => t.name === 'export-file');
  if (!exportTask || !exportTask.result?.files?.[0]?.url) {
    throw new Error('Export task failed or no output file found');
  }

  // Download the output file
  const outputUrl = exportTask.result.files[0].url;
  const response = await fetch(outputUrl);
  if (!response.ok) throw new Error(`Failed to download converted file: ${response.statusText}`);

  const arrayBuffer = await response.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    outputFilename,
  };
}
