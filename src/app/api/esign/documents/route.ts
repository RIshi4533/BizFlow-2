
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { type SignDocument } from '@/lib/mock-data';

// Point to the newly created JSON file in the data directory
const dataFilePath = path.join(process.cwd(), 'src', 'lib', 'data', 'documents.json');

async function readDocuments(): Promise<SignDocument[]> {
    try {
        const fileContent = await fs.readFile(dataFilePath, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        // If the file doesn't exist, is empty, or has other errors, return an empty array
        // This ensures the app doesn't crash on first run or if the file is deleted.
        return [];
    }
}

async function writeDocuments(documents: SignDocument[]): Promise<void> {
    try {
        await fs.writeFile(dataFilePath, JSON.stringify(documents, null, 2), 'utf-8');
    } catch(error) {
        console.error("Failed to write to documents.json", error);
        // We throw the error so the calling function knows the write failed.
        throw new Error("Failed to persist document data.");
    }
}


export async function GET() {
  try {
    const documents = await readDocuments();
    return NextResponse.json(documents);
  } catch (error) {
    console.error('Failed to read documents:', error);
    return NextResponse.json({ message: 'Failed to read documents' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const updatedDocuments = await request.json();
    
    // Basic validation to ensure we're receiving an array.
    if (!Array.isArray(updatedDocuments)) {
        return NextResponse.json({ message: 'Invalid data format. Expected an array of documents.' }, { status: 400 });
    }

    await writeDocuments(updatedDocuments);
    
    // Return the data that was successfully written.
    return NextResponse.json(updatedDocuments, { status: 200 });

  } catch (error) {
      console.error('Failed to write documents:', error);
      return NextResponse.json({ message: 'Failed to write documents' }, { status: 500 });
  }
}
