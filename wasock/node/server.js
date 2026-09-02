const pino = require("pino");
const {
    makeWASocket,
    fetchLatestBaileysVersion,
    useMultiFileAuthState,
    DisconnectReason,
    Browsers
} = require("@whiskeysockets/baileys");
const { WhatsAppCaller } = require("")
const qrcode = require("qrcode-terminal");
const QRcode = require("qrcode");
const fs = require("fs");
const path = require("path");
const net = require("net");

const { isAuthValid } = require("./assets/isauthvalid");
const { resolveBrowser } = require("./assets/resolvebrowser");

var loggerLevel = "silent";
var authName = "auth";
var browserInfo = ["ubuntu", "Chrome", "14.4.1"];
var syncFullHistory = false;

var globalSocket;

function send(socket, message) {
    socket.write(JSON.stringify(message) + "\n");
}

const authPath = path.resolve(authName);
if (fs.existsSync(authPath) && !isAuthValid(authPath)) {
    fs.rmSync(authPath, { recursive: true, force: true });
}

async function startBaileys(logger, authName, browserInfo, socket) {
    const { state, saveCreds } = await useMultiFileAuthState(authName);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        auth: state,
        logger,
        version,
        browser: resolveBrowser(browserInfo, Browsers),
        syncFullHistory,
    });
    globalSocket = sock;

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
        const { qr, connection, lastDisconnect } = update;

        if (qr) {
            send(socket, {
                type: "event",
                event: "login",
                qr
            });
        }

        switch (connection) {
            case "open":
                send(socket, {
                    type: "event",
                    event: "connection",
                    status: "open"
                });
                break;

            case "close":
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode;

                send(socket, {
                    type: "event",
                    event: "connection",
                    status: "close",
                    reason: lastDisconnect?.error?.message,
                    statusCode: shouldReconnect
                });

                if (shouldReconnect !== DisconnectReason.loggedOut) {
                    await startBaileys(logger, authName, browserInfo, socket);
                }

                break;
        }
    });

    sock.ev.on("messages.upsert", (update) => {
        send(socket, {
            type: "event",
            event: "message",
            message: update
        });
    });
}

const server = net.createServer((socket) => {
    let buffer = "";
    let processing = false;
    const queue = [];

    async function processBuffer() {
        if (processing) return;
        processing = true;

        while (buffer.includes("\n")) {
            const index = buffer.indexOf("\n");
            const line = buffer.slice(0, index);
            buffer = buffer.slice(index + 1);

            if (!line) continue;

            let message;
            try {
                message = JSON.parse(line);
            } catch (e) {
                console.log("Invalid JSON:", line);
                continue;
            }

            if (message.action === "setup") {
                loggerLevel = message.loggerLevel;
                authName = message.authName;
                syncFullHistory = message.syncFullHistory;
                browserInfo = message.browserInfo;
                send(socket, { type: "response", success: true, message: "" });
            }

            if (message.action === "start") {
                await startBaileys(pino({ level: loggerLevel }), authName, browserInfo, socket);
                send(socket, { type: "response", success: true, message: "" });
            }

            if (message.action === "replyMessage") {
                try {
                    if (!globalSocket) throw new Error("Not connected");
                    if (!message.chat) throw new Error("chat is required");

                    await globalSocket.sendMessage(
                        message.chat,
                        { text: message.msg },
                        { quoted: message.quoted }
                    );
                    send(socket, { type: "response", success: true, message: "" });
                } catch (err) {
                    console.error("replyMessage error:", err.message);
                    send(socket, { type: "response", success: false, message: err.message });
                }
            } 

            if (message.action === "sendMessage") {
                try {
                    if (!globalSocket) throw new Error("Not connected");
                    await globalSocket.sendMessage(
                        message.chat,
                        { text: message.msg },
                    );
                    send(socket, { type: "response", success: true, message: "" });
                } catch (err) {
                    console.error("sendMessage error:", err);
                    send(socket, { type: "response", success: false, message: err.message });
                }
            }

            if (message.action === "deleteMessage") {
                try {
                    if (!globalSocket) throw new Error("Not connected");
                    await globalSocket.sendMessage(
                        message.chat,
                        { delete: message.key },
                    );
                    send(socket, { type: "response", success: true, message: "" });
                } catch (err) {
                    console.error("deleteMessage error:", err);
                    send(socket, { type: "response", success: false, message: err.message });
                }
            }

            if (message.action === "qrcodeGenerate") {
                if (message.type === "img") {
                    QRcode.toFile(message.fileName, message.qr, { width: message.fileWidth }, (err) => {
                        if (err) {
                            send(socket, { type: "response", success: false, message: err.message });
                            return;
                        }

                        send(socket, { type: "response", success: true, message: "" });
                    });
                } else if (message.type === "terminal") {
                    qrcode.generate(message.qr, { small: message.small });
                    send(socket, { type: "response", success: true, message: "" });
                }
            }

            if (message.action === "requestPairCode") {
                try {
                    if (!globalSocket) throw new Error("Not connected");
                    if (globalSocket.authState.creds.registered) {
                        throw new Error("Already registered, no need for pairing code");
                    }
                    
                    const code = message.customPairingCode
                        ? await globalSocket.requestPairingCode(message.phoneNumber, message.customPairingCode)
                        : await globalSocket.requestPairingCode(message.phoneNumber);

                    send(socket, { type: "response", success: true, message: "", code });
                } catch (err) {
                    console.error("requestParinigCode error:", err);
                    send(socket, { type: "response", success: false, message: err.message });
                }
            }
        }

        processing = false;
    }

    socket.on("data", (data) => {
        buffer += data.toString();
        processBuffer();
    });
});

server.listen(5000, () => {
    console.log("Server running on 5000 port");
});