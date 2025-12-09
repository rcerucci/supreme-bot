const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = process.env.GOOGLE_API_KEY;
const MODEL = 'gemini-2.5-flash-lite';

const VERIFICATION_PROMPT = `
Você é um verificador LITERAL de elementos visuais em gráficos forex.

⚠️ DIFERENÇAS CRÍTICAS DE COR:

AMARELO vs VERMELHO:
- AMARELO = RGB(255, 255, 0) = Tom dourado/limão BRILHANTE
- VERMELHO = RGB(255, 0, 0) = Tom carmesim ESCURO
- Se parece "laranja" ou "dourado" = é AMARELO!
- Se parece "vinho" ou "escuro" = é VERMELHO!

AZUL DODGER vs VERDE:
- AZUL DODGER = RGB(30, 144, 255) = Azul ciano CLARO
- VERDE = RGB(0, 255, 0) = Verde limão PURO
- Se parece "azul claro" ou "ciano" = é AZUL DODGER!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ELEMENTOS DO GRÁFICO:

1. CANDLES (5 cores possíveis):
   [0] BRANCO = Neutro
   [1] VERDE = Alta normal
   [2] VERMELHO = Baixa normal (escuro!)
   [3] AZUL DODGER = ⭐ SINAL COMPRA (com seta ciano ↓ abaixo)
   [4] AMARELO = ⭐ SINAL VENDA (com seta amarela ↑ acima, brilhante!)

2. SETAS:
   • Ciano (↑) = Abaixo de candles AZUL DODGER
   • Amarela (↓) = Acima de candles AMARELOS

3. BANDAS: 9 linhas (4 superiores + 1 central branca + 4 inferiores)

4. BOX PRETO: Painel superior esquerdo, texto "Bias: COMPRA/VENDA/NEUTRO"

5. BOX ROXO: Retângulo roxo com texto "LATERAL" (pode não existir)

6. HISTOGRAMA: Barras azuis/vermelhas/amarelas na parte inferior

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ANALISE A IMAGEM (direita → esquerda):

**1. CANDLES (últimos 5):**

Posição 1: Cor [BRANCO/VERDE/VERMELHO/AZUL DODGER/AMARELO], Tamanho [...]
Posição 2: Cor [...], Tamanho [...]
Posição 3: Cor [...], Tamanho [...]
Posição 4: Cor [...], Tamanho [...]
Posição 5: Cor [...], Tamanho [...]

**2. SETAS:**
Cianas (↓): [N] ou "Não encontradas"
Amarelas (↑): [N] ou "Não encontradas"

**3. BANDAS:**
Superiores: [N]
Central: [SIM/NÃO]
Inferiores: [N]
Total: [soma]

**4. BOX PRETO:**
Bias: [transcreva linha]

**5. BOX ROXO:**
Existe? [SIM/NÃO]

**6. HISTOGRAMA (últimas 5 barras):**
Barra 1: [AZUL/VERMELHO/AMARELO], [tamanho]
Barra 2: [...], [...]
Barra 3: [...], [...]
Barra 4: [...], [...]
Barra 5: [...], [...]

IMPORTANTE: Se você vê setas AMARELAS, os candles abaixo delas são AMARELOS (não vermelhos)!
`;

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    try {
        const { screenshot } = req.body;
        
        if (!screenshot) {
            return res.status(400).json({
                status: 'error',
                message: 'Screenshot required'
            });
        }
        
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({
            model: MODEL,
            generationConfig: {
                temperature: 0.01,
                maxOutputTokens: 1500
            }
        });
        
        const result = await model.generateContent([
            {
                inlineData: {
                    data: screenshot,
                    mimeType: 'image/png'
                }
            },
            { text: VERIFICATION_PROMPT }
        ]);
        
        const text = result.response.text();
        const usage = result.response.usageMetadata;
        
        return res.status(200).json({
            status: 'success',
            verification: text,
            tokens: {
                input: usage?.promptTokenCount || 0,
                output: usage?.candidatesTokenCount || 0,
                total: usage?.totalTokenCount || 0
            }
        });
        
    } catch (error) {
        console.error('Error:', error.message);
        
        return res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};
