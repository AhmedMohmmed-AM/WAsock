class Message:
    def __init__(self, data, nodeJS):
        message = data["message"]["messages"][0]    

        self.data = message
        self.nodeJS = nodeJS

        self.id = message["key"]["id"]
        self.chat = message["key"]["remoteJid"]
        self.sender = message["key"].get("remoteJidAlt")
        self.fromBot = message["key"]["fromMe"]
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

        contextInfo = content.get("extendedTextMessage", {}).get("contextInfo")

        if contextInfo and contextInfo.get("quotedMessage"):
            self.quoted = contextInfo["quotedMessage"]
            self.quotedId = contextInfo.get("stanzaId")
            self.quotedSender = contextInfo.get("participant")

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

    def delete(self):
        self.nodeJS.send({
            "action": "deleteMessage",
            "chat": self.chat,
            "key": self.getKey()
        })

    def getKey(self):
        key = self.data["key"]
        return key