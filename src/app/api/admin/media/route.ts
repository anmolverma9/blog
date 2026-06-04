import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { mediaService } from '@/modules/media';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const media = await mediaService.getAllMedia();
    return NextResponse.json(media);
  } catch (err: any) {
    console.error('Admin GET media error:', err.message);
    return NextResponse.json({ error: 'Failed to fetch media library' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const altText = formData.get('alt_text') as string | null;
    const titleText = formData.get('title_text') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const originalName = file.name;
    const fileExtension = path.extname(originalName);
    
    // Generate clean unique filename
    const sanitizedBase = path.basename(originalName, fileExtension)
      .replace(/[^a-zA-Z0-9]/g, '_')
      .toLowerCase();
    const uniqueFilename = `${Date.now()}_${sanitizedBase}${fileExtension}`;

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Write file to public/uploads/
    const filePath = path.join(uploadDir, uniqueFilename);
    await fs.promises.writeFile(filePath, buffer);

    // Save record to DB
    const relativePath = `/uploads/${uniqueFilename}`;
    const mediaId = await mediaService.addMedia({
      filename: uniqueFilename,
      file_path: relativePath,
      file_size: file.size,
      mime_type: file.type,
      alt_text: altText || originalName,
      title_text: titleText || originalName,
    });

    return NextResponse.json({
      success: true,
      media: {
        id: mediaId,
        filename: uniqueFilename,
        file_path: relativePath,
        alt_text: altText || originalName,
        title_text: titleText || originalName,
      },
    });
  } catch (err: any) {
    console.error('Admin POST media error:', err.message);
    return NextResponse.json({ error: 'Failed to upload media file' }, { status: 500 });
  }
}
