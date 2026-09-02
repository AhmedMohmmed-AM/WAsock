const pino = require("pino");
const {
    makeWASocket,
    fetchLatestBaileysVersion,
    useMultiFileAuthState,
    DisconnectReason
} = require("@whiskeysockets/baileys");
const qrcode = require("qrcode-terminal");
const QRcode = require("qrcode");
const net = require("net");
const { count } = require("console");

var loggerLevel = "silent";
var authName = "auth";

var globalSocket;

function send(socket, message) {
    socket.write(JSON.stringify(message) + "\n");
}

async function startBaileys(logger, authName, socket) {
    const { state, saveCreds } = await useMultiFileAuthState(authName);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        auth: state,
        logger,
        version
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
                    await startBaileys(logger, authName, socket);
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
                send(socket, { type: "response", success: true, message: "" });
            }

            if (message.action === "start") {
                await startBaileys(pino({ level: loggerLevel }), authName, socket);
                send(socket, { type: "response", success: true, message: "" });
            }

            if (message.action === "replyMessage") {
                console.log("REPLY - chat:", message.chat);
                console.log("REPLY - quoted.key:", message.quoted?.key);
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
                    let code;
                    if (message.customPairingCode) {
                        code = await globalSocket.requestPairingCode(message.phoneNumber, message.customPairingCode);
                    } else {
                        code = await globalSocket.requestPairingCode(message.phoneNumber);
                    }
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