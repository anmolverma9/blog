import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const mimeTypes: { [key: string]: string } = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.ogg': 'video/ogg',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
};

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return mimeTypes[ext] || 'application/octet-stream';
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  // Support both synchronous and asynchronous params (for Next.js 15+ compatibility)
  const resolvedParams = 'then' in params ? await params : params;
  const filePathArray = resolvedParams.path;
  const filePathStr = filePathArray.join('/');

  // 1. Check if the file exists locally
  const localFilePath = path.join(process.cwd(), 'public', 'uploads', filePathStr);
  if (fs.existsSync(localFilePath)) {
    try {
      const buffer = await fs.promises.readFile(localFilePath);
      const contentType = getMimeType(localFilePath);
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    } catch (err: any) {
      console.error('Failed to read local upload file:', err.message);
      return new NextResponse('Error reading file from disk', { status: 500 });
    }
  }

  // 2. If not found locally, return 404
  return new NextResponse('Not found', { status: 404 });
}
