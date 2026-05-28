import urllib.request
import json
import base64

data = "A,B\n1,2\n3,4".encode('utf-8')
b64 = base64.b64encode(data).decode('utf-8')

req = urllib.request.Request('http://localhost:8000/api/clean', method='POST')
req.add_header('Content-Type', 'application/json')
body = json.dumps({'filename': 'test.csv', 'content': b64}).encode('utf-8')

try:
    with urllib.request.urlopen(req, data=body) as response:
        while True:
            line = response.readline()
            if not line:
                break
            print(line.decode('utf-8').strip())
except Exception as e:
    print("Error:", e)
    if hasattr(e, 'read'):
        print(e.read().decode('utf-8'))
