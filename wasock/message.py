class Message:
    def __init__(self, data, nodeJS):
        message = data["message"]["messages"][0]    

        self.data = message
        self.nodeJS = nodeJS

        self.key = message["key"]
        self.id = self.key["id"]
        self.chat = self.key["remoteJid"]
        self.sender = self.key.get("remoteJidAlt")
        self.fromMe = self.key["fromMe"]
        self.timestamp = message["messageTimestamp"]
        self.name = message.get("pushName")

        content = message.get("message", {})

        self.text = (
            content.get("conversation")
            or content.get("extendedTextMessage", {}).get("text")
        )

        self.quoted = None
        self.quotedText = None
        self.quotedId = None
        self.quotedSender = None
        self.quotedFromMe = None
        self.quotedKey = None

        contextInfo = content.get("extendedTextMessage", {}).get("contextInfo")

        if contextInfo and contextInfo.get("quotedMessage"):
            self.quoted = contextInfo["quotedMessage"]
            self.quotedId = contextInfo.get("stanzaId")
            self.quotedSender = contextInfo.get("participant")
            self.quotedFromMe = contextInfo.get("fromMe")
            self.quotedKey = { 
                "remoteJid": self.chat,
                "fromMe": self.quotedFromMe,
                "id": self.quotedId,
                "participant": self.quotedSender
            }

            self.quotedText = (
                self.quoted.get("conversation")
                or self.quoted.get("extendedTextMessage", {}).get("text")
            )

    def reply(self, msg, chat=None, quoted=None):
        if chat is None: chat = self.chat
        if quoted is None: quoted = self.data

        if msg is None: msg = ""

        self.nodeJS.send({
            "action": "replyMessage",
            "chat": chat,
            "msg": msg,
            "quoted": quoted
        })

    def send(self, msg, chat=None):
        if chat is None: chat = self.chat
        
        if msg is None: msg = ""
        
        self.nodeJS.send({
            "action": "sendMessage",
            "chat": chat,
            "msg": msg,
        })

    def delete(self, key=None):
        if key is None:
            self.nodeJS.send({
                "action": "deleteMessage",
                "chat": self.chat,
                "key": self.key
            })
        else:
            self.nodeJS.send({
                "action": "deleteMessage",
                "chat": self.chat,
                "key": key
            })