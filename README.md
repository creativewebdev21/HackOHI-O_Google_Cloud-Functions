# Hack OHI/O 2017
Backend application for image recognition project.
Challenge: create a mobile app that service technicians can
leverage to obtain the information they need faster by scanning the nameplate and interpreting the
results. This solution should leverage the phone’s camera to complete this scanning. The fields with
which these technicians may want to retrieve on the spot are the following:
* Brand
* Catalog Number or Style Number
* Order Number (GO# or PO#)

# Compile
1) clone this github repo:`https://github.com/SweetmanTech/hackOHI-O_Google_Cloud_Functions_2017.git`
2) cd `hackOHI-O_Google_Cloud_Functions_2017`
3) `npm install`
4) `firebase init`

# Run
`sudo gcloud beta functions deploy ocr-extract --stage-bucket [STAGING_BUCKET] --trigger-bucket [PHOTO_BUCKET] --entry-point processImage`
`gsutil cp [/filepath/to/image]  gs://[PHOTO_BUCKET]]``
