const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = process.env.GOOGLE_API_KEY;
const MODEL = 'gemini-2.5-flash-lite';

const DEBUG_PROMPT = `
Você é um analisador preciso de gráficos forex. Descreva EXATAMENTE o que vê, sem interpretar.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. ÚLTIMOS 3 CANDLES (extrema direita do gráfico):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CANDLE 1 (mais à direita):
- COR: (verde escuro, verde claro, vermelho escuro, vermelho claro, cinza, cyan/turquesa, rosa/magenta, outra?)
- BRILHO: (neon/elétrico ou opaco/fosco?)
- TAMANHO: (grande, médio, pequeno, muito pequeno?)
- Comparado aos candles do meio do gráfico, este é maior, igual ou menor?

CANDLE 2 (segundo da direita):
- COR:
- BRILHO:
- TAMANHO:

CANDLE 3 (terceiro da direita):
- COR:
- BRILHO:
- TAMANHO:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. SETAS/SÍMBOLOS NO GRÁFICO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Você vê SETAS apontando para cima ou para baixo nos candles?
- Se sim, QUANTAS setas você vê?
- Qual a COR dessas setas? (azul, magenta/roxo, verde, vermelha, outra?)
- ONDE estão localizadas? (nos últimos 3 candles? no meio do gráfico? mais à esquerda?)
- As setas estão acima ou abaixo dos candles?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. BANDAS/LINHAS CURVAS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Quantas linhas ACIMA do preço atual?
- Quantas linhas ABAIXO do preço atual?
- COR das linhas superiores:
- COR das linhas inferiores:
- Há uma linha no MEIO? Se sim, qual cor?
- DIREÇÃO atual (subindo, descendo, horizontal)?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. CAIXAS/RETÂNGULOS DESENHADOS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Você vê alguma CAIXA ou RETÂNGULO desenhado no gráfico?
- Se SIM:
  * COR da caixa: (amarela, cinza, verde, vermelha, outra?)
  * ONDE COMEÇA (lado esquerdo da caixa)? (início do gráfico? meio do gráfico? perto dos últimos candles?)
  * ONDE TERMINA (lado direito da caixa)? (meio do gráfico? perto dos últimos candles? extrema direita?)
  * Tem algum TEXTO escrito na caixa? Se sim, o que está escrito?
  * DENTRO da caixa, os candles são: (todos vermelhos? todos verdes? misturados?)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. HISTOGRAMA (parte inferior do gráfico):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ÚLTIMAS 3 BARRAS do histograma (extrema direita):
- Barra 1 (mais à direita): COR e TAMANHO
- Barra 2: COR e TAMANHO
- Barra 3: COR e TAMANHO

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6. INFORMAÇÕES NO CANTO SUPERIOR ESQUERDO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Consegue ler o valor de "Bias:"?
- Consegue ler o valor de "Stop:"?
- Consegue ler valores de "Entrada:"?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMPORTANTE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Seja EXTREMAMENTE específico nas cores: "verde escuro fosco", "cyan elétrico brilhante", "magenta/roxo", etc.
✓ Use comparações: "os últimos 3 candles são MUITO MENORES que os candles do meio"
✓ CONTE elementos: "vejo 5 setas magenta", "4 linhas verdes acima"
✓ Descreva POSIÇÕES: "a caixa começa no meio e vai até a extrema direita"
✓ NÃO interprete - apenas DESCREVA o que vê

Responda em formato estruturado seguindo as seções acima.
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