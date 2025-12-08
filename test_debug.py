import base64
import requests

# Converter imagem para base64
with open('../uploads/1765149276053_image.png', 'rb') as f:
    img_data = f.read()
    b64 = base64.b64encode(img_data).decode('utf-8')

# Chamar endpoint de debug
response = requests.post(
    'https://supreme-bot-red.vercel.app/api/debug',
    headers={'Content-Type': 'application/json'},
    json={'screenshot': b64}
)

result = response.json()

if result['status'] == 'success':
    print("=" * 80)
    print("DESCRIÇÃO DA IA:")
    print("=" * 80)
    print(result['description'])
    print("=" * 80)
    print(f"\nTokens: {result['metadata']['tokens_input']} input, {result['metadata']['tokens_output']} output")
else:
    print(f"Erro: {result.get('message', 'Unknown error')}")
