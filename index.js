'use strict';

// [START functions_ocr_setup]
const config = require('./config.json');

// Get a reference to the Pub/Sub component
const pubsub = require('@google-cloud/pubsub')();
// Get a reference to the Cloud Storage component
const storage = require('@google-cloud/storage')();
// Get a reference to the Cloud Vision API component
const vision = require('@google-cloud/vision')();

//Firebase init
var admin = require("firebase-admin");

var serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://hackohio2017-9e3d9.firebaseio.com"
});

// [END functions_ocr_setup]

// [START functions_ocr_publish]
/**
 * Publishes the result to the given pubsub topic and returns a Promise.
 *
 * @param {string} topicName Name of the topic on which to publish.
 * @param {object} data The message data to publish.
 */
function publishResult (topicName, data) {
  return pubsub.topic(topicName).get({ autoCreate: true })
    .then(([topic]) => topic.publish(data));
}
// [END functions_ocr_publish]

// [START functions_ocr_detect]
/**
 * Detects the text in an image using the Google Vision API.
 *
 * @param {string} bucketName Cloud Storage bucket name.
 * @param {string} filename Cloud Storage file name.
 * @returns {Promise}
 */
function detectText (bucketName, filename) {
  let text;

  console.log(`Looking for text in image ${filename}`);
  return vision.textDetection({ source: { imageUri: `gs://${bucketName}/${filename}` } })
    .then(([detections]) => {
      const annotation = detections.textAnnotations[0];
      text = annotation ? annotation.description : '';
      console.log(`Extracted text from image (${text})`);
        //POST to Firestore
        // database reference
        var db = admin.database();
        var ref = db.ref("images");
        ref.child("mostRecent").set({
          text: {
            raw: text,
            brand: "brand_filler",
            catalogue: 'catalogue#_ holder',
            orderNum: 'GO# or PO#'
          }
        });
    })
.then(([detection]) => {
if (Array.isArray(detection)) {
  detection = detection[0];
}
console.log(`Detected language "${detection.language}" for ${filename}`);

// Submit a message to the bus for each language we're going to translate to
const tasks = config.TO_LANG.map((lang) => {
  let topicName = "nameplateTranslationTopic";
  if (detection.language === lang) {
  topicName = "nameplateResultTopic";
}
const messageData = {
  text: text,
  filename: filename,
  lang: lang,
  from: detection.language
};

return publishResult(topicName, messageData);
});

return Promise.all(tasks);
});
}
// [END functions_ocr_detect]

// [START functions_ocr_process]
/**
 * Cloud Function triggered by Cloud Storage when a file is uploaded.
 *
 * @param {object} event The Cloud Functions event.
 * @param {object} event.data A Google Cloud Storage File object.
*/
 exports.processImage = function processImage (event) {
   let file = event.data;

   return Promise.resolve()
     .then(() => {
       if (file.resourceState === 'not_exists') {
         // This was a deletion event, we don't want to process this
         return;
       }

       if (!file.bucket) {
         throw new Error('Bucket not provided. Make sure you have a "bucket" property in your request');
       }
       if (!file.name) {
         throw new Error('Filename not provided. Make sure you have a "name" property in your request');
       }
       return detectText(file.bucket, file.name);
     })
     .then(() => {
       console.log(`File ${file.name} processed.`);
     });
 };
 // [END functions_ocr_process]
