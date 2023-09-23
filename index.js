const process = require('process');
const { google } = require('googleapis');
const dotenv = require('dotenv');
const { retry } = require('./retry');
const { authorize } = require('./authorize');
dotenv.config();

let driveService;
let auth;
let albumId;
const folderId = process.env.DRIVE_FOLDER;
const pageSize = process.env.PAGE_SIZE ? +process.env.PAGE_SIZE : 50;
let isComplete = false;
let pageToken;
const imageMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/bmp',
]);

const createAlbum = async () => {
  return (
    await auth.request({
      url: 'https://photoslibrary.googleapis.com/v1/albums',
      method: 'POST',
      headers: {
        'Content-type': 'application/json',
      },
      body: JSON.stringify({
        album: {
          title: process.env.ALBUM_NAME,
        },
      }),
    })
  ).data.id;
};

async function addUploadsToAlbum(uploadTokens) {
  return retry(
    auth.request({
      url: 'https://photoslibrary.googleapis.com/v1/mediaItems:batchCreate',
      method: 'POST',
      headers: {
        'Content-type': 'application/json',
      },
      body: JSON.stringify({
        albumId,
        newMediaItems: uploadTokens.map(({ name, uploadToken }) => ({
          simpleMediaItem: {
            fileName: name,
            uploadToken,
          },
        })),
      }),
    })
  );
}

async function uploadFilesToPhotos(files) {
  return retry(
    Promise.all(
      files.map(async ({ name, data, mimeType }) => ({
        name,
        uploadToken: (
          await auth.request({
            url: 'https://photoslibrary.googleapis.com/v1/uploads',
            headers: {
              'Content-type': 'application/octet-stream',
              'X-Goog-Upload-Content-Type': mimeType,
              'X-Goog-Upload-Protocol': 'raw',
            },
            method: 'POST',
            body: data,
          })
        ).data,
      }))
    )
  );
}

async function getFilesContents(imagesMetadata) {
  return retry(
    Promise.all(
      imagesMetadata.map(async ({ id, name, mimeType }) => ({
        name,
        mimeType,
        data: (
          await driveService.files.get(
            { fileId: id, alt: 'media' },
            { responseType: 'stream' }
          )
        ).data,
      }))
    )
  );
}

async function getFilesMetadata(pageToken) {
  const page = await retry(
    driveService.files.list({
      q: `'${folderId}' in parents`,
      pageSize,
      ...(pageToken ? { pageToken } : {}),
    })
  );
  const imagesMetadata = page.data.files?.filter(({ mimeType }) =>
    imageMimeTypes.has(mimeType)
  );
  return { imagesMetadata, nextPageToken: page.data.nextPageToken };
}

(async () => {
  auth = await authorize();
  driveService = google.drive({ version: 'v3', auth });
  albumId = await createAlbum();
  let batch = 1;
  let imagesCount = 0;

  while (!isComplete) {
    const { imagesMetadata, nextPageToken } = await getFilesMetadata(pageToken);
    const files = await getFilesContents(imagesMetadata);
    const uploadTokens = await uploadFilesToPhotos(files);
    await addUploadsToAlbum(uploadTokens);
    console.log(`Done with batch ${batch}, files: ${files.length}`);
    imagesCount += files.length;
    pageToken = nextPageToken;
    batch++;
    if (!nextPageToken) {
      isComplete = true;
    }
  }

  console.log(
    `All finished! moved ${imagesCount} images from google drive to google photos.`
  );
})();
