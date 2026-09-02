## Changelog

### 0.5.2-0.5.3b0

* Added `syncFullHistory` support to `WhatsAppSocket`
* Fixed invalid pairing codes caused by default platform values in `requestPairingCode` and `WhatsAppSocket`
* Added a checker to ensure `syncFullHistory` is a boolean
* Removed the need for `try/finally` ; simple use `bot.start()`
* Replaced `getKey()` in `Message` with `Message.key`
* Added `Message.quotedKey`
* Added `Message.quotedFromMe`
* Replaced `Message.fromBot` with `Message.fromMe`
* Improved `Message.delete(messageKey)` to support deleting any message using its key
* Fixed deleting auth file after login
* Added `Browser` class
* Added `ubuntu`, `macOS`, and `windows` to `Browser` class

### 0.5.1

- Fixed a random pairing code issue in `requestPairingCode`
- Automatically Installing Node.js Modules
- Added checker that checks if customPairingCode has an unallowed letters
- Automatically delete the auth folder if no login information is found
- Fixed Python exceptions not being displayed in the terminal

### 0.5.1b0

- Added a new `requestPairingCode` method to `WhatsAppSocket`

### 0.5.0b2 – 0.5.0b4

- Improved the `QRCode` class
- Fixed bugs in the `QRCode` class

### 0.5.0b1

- Fixed the Node.js server file

### 0.5.0b0

- Initial release
