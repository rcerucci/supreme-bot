const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = process.env.GOOGLE_API_KEY;
const MODEL = 'gemini-2.5-flash-lite';

const CALIBRATION_PROMPT = `
Você é um sensor de precisão de gráficos. Descreva LOCALIZAÇÕES EXATAS usando o sistema de coordenadas abaixo.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SISTEMA DE COORDENADAS HORIZONTAL:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Divida o gráfico horizontalmente em 10 zonas (0% a 100%):
[0-10%] [10-20%] [20-30%] [30-40%] [40-50%] [50-60%] [60-70%] [70-80%] [80-90%] [90-100%]

**OS 3 ÚLTIMOS CANDLES** sempre estão em [90-100%] (extrema direita)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. IDENTIFIQUE OS 3 ÚLTIMOS CANDLES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Na zona [90-100%] (extrema direita):
- Candle 1 (mais à direita): COR que você vê?
- Candle 2 (segundo): COR que você vê?
- Candle 3 (terceiro): COR que você vê?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. CAIXA/RETÂNGULO - LOCALIZAÇÃO PRECISA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Você vê caixa desenhada? Se SIM:

COR que você vê: (use SUA descrição natural)

BORDA ESQUERDA da caixa está em qual zona?
[0-10%] [10-20%] [20-30%] [30-40%] [40-50%] [50-60%] [60-70%] [70-80%] [80-90%] [90-100%]

BORDA DIREITA da caixa está em qual zona?
[0-10%] [10-20%] [20-30%] [30-40%] [40-50%] [50-60%] [60-70%] [70-80%] [80-90%] [90-100%]

**PERGUNTA CRÍTICA:**
A borda DIREITA da caixa está:
A) Antes da zona [90-100%] (não toca os 3 últimos candles)
B) Dentro da zona [90-100%] (cobre os 3 últimos candles)

Escolha A ou B.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. SETAS - CONTE POR ZONA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COR das setas que você vê: (use SUA descrição)

CONTE quantas setas em CADA zona:
- Zona [0-30%]: __ setas
- Zona [30-60%]: __ setas  
- Zona [60-90%]: __ setas
- Zona [90-100%] (3 últimos candles): __ setas

TOTAL de setas: __

**PERGUNTAS CRÍTICAS:**
- Há ALGUMA seta na zona [90-100%]? SIM / NÃO
- Todas as setas estão ANTES da zona [90-100%]? SIM / NÃO

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. BANDAS - CONFIRMAÇÃO RÁPIDA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Quantas linhas ACIMA do preço?
- Quantas linhas ABAIXO?
- COR linhas superiores (sua descrição):
- COR linhas inferiores (sua descrição):
- Tem linha no MEIO? COR?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. HISTOGRAMA - ÚLTIMAS 5 BARRAS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Da direita para esquerda:
1. COR:
2. COR:
3. COR:
4. COR:
5. COR:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMATO DE RESPOSTA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Use números e respostas diretas. Seja CONSISTENTE nas descrições de cores.

RESPONDA EM FORMATO ESTRUTURADO SEGUINDO AS 5 SEÇÕES ACIMA.
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
                message: 'Screenshot is required'
            });
        }
        
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({
            model: MODEL,
            generationConfig: {
                temperature: 0.05,
                maxOutputTokens: 1200,
                thinkingConfig: { thinkingBudget: 0 }
            }
        });
        
        const result = await model.generateContent([
            CALIBRATION_PROMPT,
            {
                inlineData: {
                    data: screenshot,
                    mimeType: 'image/png'
                }
            }
        ]);
        
        const description = result.response.text();
        const usage = result.response.usageMetadata;
        
        return res.status(200).json({
            status: 'success',
            description,
            metadata: {
                timestamp: new Date().toISOString(),
                tokens_input: usage?.promptTokenCount || 0,
                tokens_output: usage?.candidatesTokenCount || 0,
                model: MODEL
            }
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        return res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};