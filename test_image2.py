import base64, requests, json
with open('../uploads/1765149276053_image.png', 'rb') as f:
    b64 = base64.b64encode(f.read()).decode('utf-8')
r = requests.post('https://supreme-bot-red.vercel.app/api/analyze',
    headers={'Content-Type': 'application/json'}, json={'screenshot': b64})
print(json.dumps(r.json(), indent=2, ensure_ascii=False))
