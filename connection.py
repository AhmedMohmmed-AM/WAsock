class Connection:
    def __init__(self, connection):
        self.connected = True if connection["status"] == "open" else False
        self.statusCode = connection.get("statusCode", None)
        self.reason = connection.get("reason", None)

    def isAuthFailure(self):
        return self.statusCode == 401