import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const dbPath = path.join(process.cwd(), 'data', 'cms.json');

export async function GET() {
  try {
    const data = await readFile(dbPath, 'utf8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    console.error("Erreur de lecture CMS:", error);
    return NextResponse.json({ error: "Impossible de lire la configuration CMS" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session || role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: "Accès refusé. Privilèges Super Admin requis." }, { status: 403 });
    }

    const body = await request.json();
    await writeFile(dbPath, JSON.stringify(body, null, 2), 'utf8');
    
    return NextResponse.json({ success: true, message: "Configuration mise à jour avec succès." });
  } catch (error) {
    console.error("Erreur de sauvegarde CMS:", error);
    return NextResponse.json({ error: "Impossible de sauvegarder la configuration CMS" }, { status: 500 });
  }
}
