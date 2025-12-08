const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = process.env.GOOGLE_API_KEY;
const MODEL = 'gemini-2.5-flash-lite';

const DEBUG_PROMPT = `
Descreva em detalhes o que você vê neste gráfico forex M5.

Foque especialmente nos ÚLTIMOS 3 CANDLES (extrema direita):

1. CANDLE ATUAL (mais à direita):
   - Qual a COR exata? (verde, vermelho, cinza, cyan, rosa, outra?)
   - É brilhante/neon ou opaco/fosco?
   - Tamanho (grande, médio, pequeno)?

2. PENÚLTIMO CANDLE (segundo da direita):
   - Qual a COR exata? (verde, vermelho, cinza, cyan, rosa, outra?)
   - É brilhante/neon ou opaco/fosco?
   - Tamanho?

3. ANTEPENÚLTIMO CANDLE (terceiro da direita):
   - Qual a COR exata?
   - É brilhante/neon ou opaco/fosco?
   - Tamanho?

4. BANDAS (linhas curvas):
   - Quantas linhas você vê acima do preço?
   - Quantas linhas você vê abaixo do preço?
   - Qual a cor dessas linhas?
   - Elas estão subindo, descendo ou horizontais?

5. CAIXAS/RETÂNGULOS:
   - Você vê alguma caixa/retângulo desenhado?
   - Se sim, qual a cor? (cinza, amarela, outra?)
   - Onde está localizada? (perto dos últimos candles ou longe no histórico?)

6. HISTOGRAMA (parte inferior):
   - Cor das últimas 3 barras? (verde, vermelho, cinza?)
   - Tamanho (grande, médio, pequeno)?

7. TEXTO NO CANTO SUPERIOR ESQUERDO:
   - Consegue ler os valores?
   - Especialmente "Bias:", "Stop:", "Entrada:"

Seja MUITO específico nas cores. Use termos como:
- "verde escuro fosco"
- "verde brilhante neon"
- "vermelho escuro"
- "rosa brilhante"
- "cyan/turquesa elétrico"
- etc.

NÃO analise ou interprete - apenas DESCREVA o que vê.
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
