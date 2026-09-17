import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

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
    const body = await request.json();
    
    // Sauvegarde dans le fichier JSON (qui fait office de base de données)
    await writeFile(dbPath, JSON.stringify(body, null, 2), 'utf8');
    
    return NextResponse.json({ success: true, message: "Configuration mise à jour avec succès." });
  } catch (error) {
    console.error("Erreur de sauvegarde CMS:", error);
    return NextResponse.json({ error: "Impossible de sauvegarder la configuration CMS" }, { status: 500 });
  }
}
