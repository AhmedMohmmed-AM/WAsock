class QRCode:
    def __init__(self, data, nodeJS, small=True, type="terminal", imgWidth=500):
        self.data = data
        self.nodeJS = nodeJS
        self.small = small != False
        self.type = type.lower()
        if not isinstance(imgWidth, int):
            raise TypeError("Img width must be a integer")

        self.imgWidth = imgWidth

    def render(self, imgName="qr.png"):
        if self.type == "img":
            response = self.nodeJS.send({
                "action": "qrcodeGenerate",
                "type": "img",
                "qr": self.data,
                "fileName": imgName,
                "fileWidth": self.imgWidth,
            })
            if not response["success"]:
                raise RuntimeError(response.get("message", "Failed to create a image for QRCode"))

        elif self.type == "terminal":
            self.nodeJS.send({
                "action": "qrcodeGenerate",
                "type": "terminal",
                "qr": self.data,
                "small": self.small
            })
        else:
            raise ValueError(f"Unknown type: {self.type}")  