# Drive to Photos importer

Purpose: ease moving large amounts of files from a drive folder to a new photos album.

Reason: If there are 3,000 photos that you want to import in another person's drive account, you have to download 15 zip files and import all the photos one after the other. A lot of time and a lot of labor. I've come to solve the labor part.

## Setup

This script is essentially an app that you can setup on your account. The steps are:

1. [Create a new app in google console](https://console.cloud.google.com/projectcreate)
2. (go to "APIs & Services) Enable the drive and photos api for the project under "Enabled APIs and Services"
3. Create an OAuth 2.0 Client ID and download it to the project directory (under "Credentials")
4. If needed, add yourself as Test User ("OAuth consent screen")
5. Create a ".env" file with parameters like in the example.env file

send me a message on github or linkedin if something is not working for you.
