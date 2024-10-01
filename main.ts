import * as fs from 'fs';

interface Result {
  [hostname: string]: Array<string | { [key: string]: any[] }>;
}

interface JsonResponse {
  items: {
    fileUrl: string;
  }[];
}

let result: Result = {};

function processURL(currentURL: string): void {

  const parsedURL = new URL(currentURL);

  // Init hostname
  if (!result[parsedURL.hostname]) {
    result[parsedURL.hostname] = [];
  }

  let currentLocation = result[parsedURL.hostname];
  let pathParts = parsedURL.pathname.split('/').splice(1); // remove the first empty string created by split

  for (let i = 0; i < pathParts.length - 1; i++) {

    let currentPart = pathParts[i];

    let existingObject = currentLocation.find(item =>
      typeof item === 'object' &&
      Object.keys(item)[0] === currentPart
    ) as { [key: string]: any[] } | undefined;

    if (!existingObject) {
      let newObject: { [key: string]: any[] } = {};
      newObject[currentPart] = [];
      currentLocation.push(newObject);
      currentLocation = newObject[currentPart];
    } else {
      currentLocation = existingObject[currentPart];
    }

  }

  // Add file
  if (pathParts[pathParts.length - 1] !== '') {
    currentLocation.push(pathParts[pathParts.length - 1]);
  }

}

async function processAllURLs(url: string): Promise<void> {
  try {

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('HTTP error: ' + response.status);
    }
    const jsonData: JsonResponse = await response.json();
    jsonData.items.forEach(item => processURL(item.fileUrl));

    // Log result and write to result.json for easier viewing
    console.log('Result: ' + JSON.stringify(result, null, 2));
    fs.writeFileSync('result.json', JSON.stringify(result, null, 2), 'utf-8');

  } catch (e) {
    console.log('Error: ' + e);
  }
}

(async () => {
  await processAllURLs('https://rest-test-eight.vercel.app/api/test');
})();