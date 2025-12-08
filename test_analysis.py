import base64
import requests
import json

# Converter imagem para base64
with open('../uploads/1765149276049_image.png', 'rb') as f:
    img_data = f.read()
    b64 = base64.b64encode(img_data).decode('utf-8')

# Fazer requisição
response = requests.post(
    'https://supreme-bot-red.vercel.app/api/analyze',
    headers={'Content-Type': 'application/json'},
    json={
        'sessionId': 'e1d40960-737b-4453-afd4-df35249b2ce7',
        'screenshot': b64
    }
)

# Mostrar resposta
result = response.json()
print(json.dumps(result, indent=2, ensure_ascii=False))
