import string
from .nodejs import NodeJS
from .browser import Browser

class WhatsAppSocket:
    def __init__(self, authName="auth", loggerLevel="silent", syncFullHistory=False, browserInfo: Browser=Browser.ubuntu("Chrome")):
        if not loggerLevel.lower() in ["debug", "error", "fatal", "info", "silent", "trace", "warn"]:
            raise SyntaxError(f"Unknown logger type {loggerLevel}")
        if not isinstance(authName, str):
            raise TypeError("authName must be string")
        if not isinstance(syncFullHistory, bool):
            raise TypeError("syncFullHistory must be boolean")

        self.nodeJS = NodeJS()

        response = self.nodeJS.send({
            "action": "setup", 
            "loggerLevel": loggerLevel.lower(), 
            "authName": authName,
            "browserInfo": browserInfo,
            "syncFullHistory": syncFullHistory
        })

        if not response["success"]:
            raise RuntimeError(response.get("message", "Setup failed"))

    def requestPairingCode(self, phoneNumber, customPairingCode=None):
        if not customPairingCode is None:
            if not isinstance(customPairingCode, str):
                raise TypeError("customPairingCode must be a string")
            if len(customPairingCode) != 8:
                raise SyntaxError("customPairingCode must be length 8")

            allowedChars = string.ascii_uppercase + string.digits

            if any(char not in allowedChars for char in customPairingCode):
                raise SyntaxError("customPairingCode must contain uppercase letters and digits only")

            customPairingCode = customPairingCode.upper()
        
        response = self.nodeJS.send({
            "action": "requestPairCode",
            "phoneNumber": phoneNumber,
            "customPairingCode": customPairingCode
        })

        if not response["success"]:
            raise RuntimeError(response.get("message", "Failed to get pairing code"))
        return response["code"]

    def start(self):
        #return self.nodeJS.send({"action": "start"})
        try:
            self.nodeJS.send({"action": "start"})
            input()
        except KeyboardInterrupt:
            print("\nExiting the program...")
            self.end()
        finally:
            self.end()

    def on(self, event, callback):
        self.nodeJS.on(event, callback)

    def end(self):
        self.nodeJS.end()