import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'pdf']);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(role)) {
      return NextResponse.json({ error: 'Accès refusé. Privilèges administrateur requis.' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: "Aucun fichier uploadé." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Taille de fichier maximale dépassée (5 Mo max)." }, { status: 400 });
    }

    const rawExt = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTENSIONS.has(rawExt)) {
      return NextResponse.json({ error: "Type de fichier non autorisé. Formats acceptés : JPG, PNG, WEBP, PDF." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Nom de fichier unique et sécurisé
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = `upload-${uniqueSuffix}.${rawExt}`;
    
    // Chemin de sauvegarde dans public/uploads/
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });
    const filepath = path.join(uploadDir, filename);

    // Sauvegarder le fichier
    await writeFile(filepath, buffer);

    // Renvoyer l'URL publique
    const url = `/uploads/${filename}`;
    
    return NextResponse.json({ success: true, url });
  } catch (error) {
    console.error("Erreur lors de l'upload:", error);
    return NextResponse.json({ error: "Erreur serveur lors de l'upload." }, { status: 500 });
  }
}
