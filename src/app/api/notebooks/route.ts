import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Create a simple fallback notebook structure
const createFallbackNotebook = (notebookName: string) => {
  return {
    cells: [
      {
        cell_type: 'markdown',
        source: [
          `# ${notebookName} Analysis`,
          '\n',
          'This is a placeholder notebook. The actual notebook data could not be loaded.',
          '\n',
          'Please check that the notebook file exists and is properly formatted.'
        ]
      },
      {
        cell_type: 'code',
        source: ['# Sample code cell', 'print("Hello from Hygieia AI!")'],
        outputs: []
      }
    ],
    metadata: {
      kernelspec: {
        display_name: 'Python 3',
        language: 'python',
        name: 'python3'
      }
    },
    nbformat: 4,
    nbformat_minor: 4
  };
};

export async function GET(request: NextRequest) {
  try {
    // Get the notebook name from the query parameter
    const url = new URL(request.url);
    const notebookName = url.searchParams.get('name');
    
    if (!notebookName) {
      return NextResponse.json({ error: 'Notebook name is required' }, { status: 400 });
    }
    
    // Log the current working directory for debugging
    console.log(`Current working directory: ${process.cwd()}`);
    console.log(`Looking for notebook: ${notebookName}`);
    
    // Try different possible paths for the notebook file
    const possiblePaths = [
      path.join(process.cwd(), 'Notebook', `${notebookName}.ipynb`),
      path.join(process.cwd(), 'notebook', `${notebookName}.ipynb`),
      path.join(process.cwd(), '..', 'Notebook', `${notebookName}.ipynb`),
      path.join(process.cwd(), '..', '..', 'Notebook', `${notebookName}.ipynb`),
      path.join(process.cwd(), 'public', 'notebooks', `${notebookName}.ipynb`),
      path.join(process.cwd(), 'src', 'notebooks', `${notebookName}.ipynb`)
    ];
    
    // Log all possible paths for debugging
    console.log('Checking the following paths:');
    possiblePaths.forEach(p => console.log(` - ${p}`));
    
    // Try to find the notebook file in any of the possible paths
    let notebookContent = null;
    let foundPath = null;
    
    for (const notebookPath of possiblePaths) {
      try {
        console.log(`Checking if exists: ${notebookPath}`);
        const exists = fs.existsSync(notebookPath);
        console.log(`  Exists: ${exists}`);
        
        if (exists) {
          console.log(`Reading file: ${notebookPath}`);
          notebookContent = fs.readFileSync(notebookPath, 'utf-8');
          foundPath = notebookPath;
          console.log(`Successfully read file from: ${notebookPath}`);
          break;
        }
      } catch (err) {
        console.error(`Error checking path ${notebookPath}:`, err);
      }
    }
    
    // If we found a notebook file, parse it and return it
    if (notebookContent && foundPath) {
      console.log(`Found notebook at: ${foundPath}`);
      try {
        const notebookData = JSON.parse(notebookContent);
        return NextResponse.json(notebookData);
      } catch (parseError) {
        console.error('Error parsing notebook JSON:', parseError);
        // Return a fallback notebook if parsing fails
        return NextResponse.json(createFallbackNotebook(notebookName));
      }
    }
    
    // If we couldn't find the notebook file, return a fallback notebook
    console.log(`Could not find notebook: ${notebookName}. Using fallback.`);
    return NextResponse.json(createFallbackNotebook(notebookName));
  } catch (error) {
    console.error('Error in notebook API route:', error);
    // Return a fallback notebook in case of any error
    return NextResponse.json(createFallbackNotebook('Error'));
  }
}
