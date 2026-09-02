# WAsock

![WAsock Logo](assets/logo.png)

**wasock** (WhatsApp Socket) is a lightweight Python library for interacting with WhatsApp, built on top of [Baileys](https://github.com/WhiskeySockets/Baileys) via a Node.js subprocess that communicates with Python over a TCP socket.

Made by an Egyptian developer 🇪🇬 — Ahmed Mohmmed-AM.

> **Status:**`0.5.1` — still under development, the API may change before a stable release.

---

## Overview

wasock gives you a simple Python interface for WhatsApp: receiving messages, replying to them, sending new messages, deleting messages, and displaying a QR code or pairing code for login — without writing a single line of JavaScript.

wasock is a lightweight Python wrapper around [Baileys](https://github.com/WhiskeySockets/Baileys). It spawns a Node.js subprocess and talks to it over a local TCP socket, so you can send, receive, reply to, and delete WhatsApp messages entirely from Python.

---

## Requirements

* Python >= 3.8
* Node.js (>= 18 recommended)
* An internet connection to install the initial npm dependencies

---

## Installation

```bash
pip install wasock
```

---

## Quick Start

```python
from wasock import WhatsAppSocket, Message, QRCode, Connection

bot = WhatsAppSocket(authName="auth", loggerLevel="silent")

def onLogin(data):
    qr = QRCode(data["qr"], bot.nodeJS, small=True, type="img", imgWidth=500)
    qr.render("qr.png")
    print("Scan qr.png with WhatsApp on your phone")

def onConnection(data):
    conn = Connection(data)
    if conn.connected:
        print("Connection opened!")
    else:
        print(f"Connection closed: {conn.reason}")

def onMessage(data):
    message = Message(data, bot.nodeJS)
    if message.fromBot:
        return

    if message.text == "!ping":
        message.reply("pong")

bot.on("login", onLogin)
bot.on("connection", onConnection)
bot.on("message", onMessage)

bot.start()

try:
    input("Bot is running, press Enter to exit...\n")
finally:
    bot.end()
```

---

## API

### `WhatsAppSocket(authName="auth", loggerLevel="silent")`

Starts the connection to the Node server and sets up the session.

* `.start()` — starts the actual connection to WhatsApp.
* `.on(event, callback)` — registers an event listener (`"login"`, `"connection"`, `"message"`).
* `.requestPairingCode(phoneNumber, customPairingCode=None)` — gets a pairing code for the given phone number, as an alternative to scanning a QR code. `customPairingCode` must be exactly 8 uppercase letters/digits if provided.
* `.end()` — closes the connection and stops the Node process.

### `Message`

Automatically built for each incoming message.

**Properties:**


| Property                                | Description                                           |
| --------------------------------------- | ----------------------------------------------------- |
| `.text`                                 | The message text                                      |
| `.chat`                                 | The chat's JID                                        |
| `.fromBot`                              | `True`if the message was sent by the bot itself       |
| `.quoted`/`.quotedText`/`.quotedSender` | The quoted message's data, if this message is a reply |

**Methods:**

* `.reply(msg, chat=None, quoted=None)` — replies to the message.
* `.send(msg, chat=None)` — sends a new message without a quote.
* `.delete()` — deletes the message for everyone.

### `QRCode(data, nodeJS, small=True, type="terminal", imgWidth=500)`

* `data`: the raw QR string received from the `"login"` event.
* `nodeJS`: the `bot.nodeJS` instance, used to send the QR to the Node server for rendering.
* `small`: `True` for a compact QR (terminal mode only), `False` for a larger one.
* `type`: `"terminal"` (prints to the terminal) or `"img"` (saves as an image file).
* `imgWidth`: width in pixels for the generated image, only used when `type="img"`. Must be an `int`.

**Methods:**

* `.render(imgName="qr.png")` — renders the QR code. For `type="terminal"`, prints it directly to the terminal. For `type="img"`, saves it as an image file with the given name.

### `Connection`

* `.connected` — `True`/`False`
* `.statusCode` — the disconnect status code, if any
* `.reason` — the disconnect reason, if any
* `.isAuthFailure()` — `True` if the reason was a 401 (a new QR code is needed)

---

## Important Notes

* The `auth/` folder contains sensitive WhatsApp session data — **never commit it to GitHub**.
* The location of `auth/` is resolved relative to the script's working directory, not the library's location.

---

## Support

If you need help, have a question, or encounter an issue, you can contact:

**Email:**[wasock.support@gmail.com](https://mail.google.com/mail/?view=cm&fs=1&to=wasock.support@gmail.com)

---

## License

MIT License — see the [LICENSE](https://chatgpt.com/c/LICENSE) file for details.

---

## Author

Ahmed Mohmmed-AM — Egyptian developer 🇪🇬
GitHub: [@AhmedMohmmed-AM](https://github.com/AhmedMohmmed-AM)
