import subprocess, atexit, socket, queue, threading, json, time, os
from concurrent.futures import ThreadPoolExecutor

def connectToServer(self):
    for _ in range(50):
        try:
            self.sock.connect(("127.0.0.1", 5000))
            return
        except ConnectionRefusedError:
            time.sleep(0.1)

    raise ConnectionError("Could not connect to Node.js server")

_SERVER_JS_PATH = os.path.join(os.path.dirname(__file__), "node", "server.js")

class NodeJS:
    def __init__(self):
        self.process = subprocess.Popen(
            ["node", _SERVER_JS_PATH]
        )

        atexit.register(self.end)

        self.sock = socket.socket()
        connectToServer(self)

        self.responses = queue.Queue()

        self.events = {}

        self.executor = ThreadPoolExecutor(max_workers=10)

        self.threading = threading.Thread(
            target=self.receive,
            daemon=True
        )
        self.threading.start()

    def receive(self):
        buffer = ""

        while True:
            data = self.sock.recv(4096)

            if not data:
                break

            buffer += data.decode("utf-8")

            while "\n" in buffer:
                line, buffer = buffer.split("\n", 1)

                if not line:
                    continue

                message = json.loads(line)

                if message.get("type") == "event":
                    event = message.get("event")
                    callback = self.events.get(event)

                    if callback:
                        self.executor.submit(callback, message)
                else:
                    self.responses.put(message)

    def on(self, event, callback):
        self.events[event] = callback

    def send(self, message):
        data = json.dumps(message).encode("utf-8") + b"\n"
        self.sock.sendall(data)
        return self.responses.get()

    def end(self):
        self.sock.close()
        self.process.terminate()
        self.process.wait()