from .nodejs import NodeJS

class WhatsAppSocket:
    def __init__(self, authName="auth", loggerLevel="silent"):
        if not loggerLevel.lower() in ["debug", "error", "fatal", "info", "silent", "trace", "warn"]:
            raise SyntaxError(f"Unknown logger type {loggerLevel}")
        if not isinstance(authName, str):
            raise TypeError("authName must be string")

        self.nodeJS = NodeJS()

        response = self.nodeJS.send({"action": "setup", "loggerLevel": loggerLevel.lower(), "authName": authName})

        if not response["success"]:
            raise RuntimeError(response.get("message", "Setup failed"))

    def requestPairingCode(self, phoneNumber, customPairingCode=None):
        if not isinstance(customPairingCode, str):
            raise TypeError("customPairingCode must be a string")
        if len(customPairingCode) < 8 or len(customPairingCode) > 8:
            raise SyntaxError("customPairingCode must be length 8")
        response = self.nodeJS.send({
            "action": "requestPairCode",
            "phoneNumber": phoneNumber,
            "customPairingCode": customPairingCode if customPairingCode is None else customPairingCode.upper()
        })
        if not response["success"]:
            raise RuntimeError(response.get("message", "Failed to get pairing code"))
        return response["code"]

    def start(self):
        return self.nodeJS.send({"action": "start"})

    def on(self, event, callback):
        self.nodeJS.on(event, callback)

    def end(self):
        self.nodeJS.end()