const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = process.env.GOOGLE_API_KEY;
const MODEL = 'gemini-2.5-flash-lite';

const DEBUG_PROMPT = `
Analise este gráfico forex M5 e responda TODAS as perguntas abaixo de forma CONCISA mas COMPLETA.

1. ÚLTIMOS 3 CANDLES (extrema direita):
   - Candle 1: COR (verde/vermelho/cinza/cyan/magenta), TAMANHO vs candles vermelhos do meio
   - Candle 2: COR, TAMANHO relativo
   - Candle 3: COR, TAMANHO relativo

2. SETAS NO GRÁFICO:
   - Tem setas? QUANTAS no total?
   - COR das setas?
   - ONDE estão? (últimos 3 candles / meio / esquerda)
   - Direção: ↑ ou ↓?

3. BANDAS/LINHAS:
   - Quantas linhas ACIMA do preço?
   - Quantas linhas ABAIXO?
   - Cor das linhas superiores?
   - Cor das linhas inferiores?
   - Tem linha amarela no meio?

4. CAIXA/RETÂNGULO:
   - Tem caixa desenhada? COR?
   - ONDE COMEÇA a caixa? (início/meio/final do gráfico)
   - ONDE TERMINA? (meio/final/extrema direita)
   - Tem texto na caixa? O quê?
   - DENTRO da caixa: candles verdes/vermelhos/misturados?

5. HISTOGRAMA (últimas 5 barras):
   - Cores das 5 últimas barras?
   - Tamanhos (grande/médio/pequeno)?

6. TEXTO SUPERIOR ESQUERDO:
   - Consegue ler "Bias:"? Qual valor?
   - Consegue ler "Stop:"? Qual valor?

7. OUTROS:
   - Par de moedas?
   - Timeframe (M1/M5/H1)?

RESPONDA TODAS AS 7 SEÇÕES DE FORMA OBJETIVA E DIRETA.
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
                temperature: 0.1,
                maxOutputTokens: 1500,
                thinkingConfig: { thinkingBudget: 0 }
            }
        });
        
        const result = await model.generateContent([
            DEBUG_PROMPT,
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