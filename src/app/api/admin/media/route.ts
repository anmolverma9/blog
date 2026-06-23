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
    const imageUrl = formData.get('url') as string | null;
    const altText = formData.get('alt_text') as string | null;
    const titleText = formData.get('title_text') as string | null;

    if (!file && !imageUrl) {
      return NextResponse.json({ error: 'No file or URL uploaded' }, { status: 400 });
    }

    let buffer: Buffer;
    let uniqueFilename: string;
    let fileType: string;
    let fileSize: number;
    let originalName: string;

    if (file) {
      buffer = Buffer.from(await file.arrayBuffer());
      originalName = file.name;
      const fileExtension = path.extname(originalName);
      const sanitizedBase = path.basename(originalName, fileExtension)
        .replace(/[^a-zA-Z0-9]/g, '_')
        .toLowerCase();
      uniqueFilename = `${Date.now()}_${sanitizedBase}${fileExtension}`;
      fileType = file.type;
      fileSize = file.size;
    } else {
      // Fetch from URL
      const response = await fetch(imageUrl!);
      if (!response.ok) {
        return NextResponse.json({ error: 'Failed to fetch image from URL' }, { status: 400 });
      }
      const arrayBuffer = await response.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      fileSize = buffer.length;
      fileType = response.headers.get('content-type') || 'image/jpeg';
      
      let baseName = 'downloaded_image';
      try {
        const parsedUrl = new URL(imageUrl!);
        baseName = path.basename(parsedUrl.pathname) || 'downloaded_image';
      } catch (e) {
        // Fallback if URL is invalid or base64 data URL
      }
      
      let fileExtension = path.extname(baseName);
      if (!fileExtension) {
        if (fileType === 'image/png') fileExtension = '.png';
        else if (fileType === 'image/gif') fileExtension = '.gif';
        else if (fileType === 'image/webp') fileExtension = '.webp';
        else fileExtension = '.jpg';
      }
      const baseWithoutExt = path.basename(baseName, fileExtension);
      const sanitizedBase = baseWithoutExt
        .replace(/[^a-zA-Z0-9]/g, '_')
        .toLowerCase() || 'image';
      uniqueFilename = `${Date.now()}_${sanitizedBase}${fileExtension}`;
      originalName = baseName;
    }

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Write file to public/uploads/
    const filePath = path.join(uploadDir, uniqueFilename);
    await fs.promises.writeFile(filePath, buffer);

    const defaultSeo = cleanSeoMetadata(originalName, fileType);

    // Save record to DB
    const relativePath = `/uploads/${uniqueFilename}`;
    const mediaId = await mediaService.addMedia({
      filename: uniqueFilename,
      file_path: relativePath,
      file_size: fileSize,
      mime_type: fileType,
      alt_text: altText || defaultSeo,
      title_text: titleText || defaultSeo,
    });

    return NextResponse.json({
      success: true,
      media: {
        id: mediaId,
        filename: uniqueFilename,
        file_path: relativePath,
        alt_text: altText || defaultSeo,
        title_text: titleText || defaultSeo,
      },
    });
  } catch (err: any) {
    console.error('Admin POST media error:', err.message);
    return NextResponse.json({ error: 'Failed to upload media file' }, { status: 500 });
  }
}

function cleanSeoMetadata(filename: string, mimeType?: string): string {
  const ext = path.extname(filename);
  let name = path.basename(filename, ext);

  // Strip 10-13 digit timestamps
  name = name.replace(/\b\d{10,13}\b/g, '');
  // Strip hex or alphanum hashes of length 8+
  name = name.replace(/\b[a-f0-9]{8,}\b/gi, '');
  name = name.replace(/\b[a-z0-9]{12,}\b/gi, '');

  // Clean separator chars
  name = name.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();

  // Fallback to basic clean base name if everything got stripped
  if (!name) {
    name = path.basename(filename, ext).replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  // Capitalize title
  const cleanTitle = name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const fallback = mimeType?.startsWith('video/') ? 'Video Asset' : 'Image Asset';
  return cleanTitle || fallback;
}
