const { GoogleGenerativeAI } = require('@google/generative-ai');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.GOOGLE_API_KEY;
const MODEL = 'gemini-2.5-flash-lite';

const EXPLORATORY_PROMPT = `
Você é um analisador técnico de gráficos forex. Sua tarefa é DESCREVER detalhadamente o que você VÊ nesta imagem, sem tomar decisões de trading.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INSTRUÇÕES: Descreva cada elemento visual com precisão
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 1. CANDLES (velas japonesas):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Observe os últimos 5 candles da DIREITA para ESQUERDA.
Para cada candle, descreva:
- Posição: "Candle 1 (extrema direita)", "Candle 2", etc
- Cor do CORPO: [verde/vermelho/magenta/azul/amarelo]
- Tamanho do corpo: [pequeno/médio/grande]
- Pavios (sombras): [tem pavios visíveis? superior/inferior?]

Exemplo: "Candle 1: Corpo verde pequeno, com pavio superior longo e pavio inferior curto"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 2. BANDAS (linhas paralelas):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- ACIMA do preço: Quantas linhas? Que cor?
- ABAIXO do preço: Quantas linhas? Que cor?
- CENTRAL: Tem uma linha no meio? Que cor?
- DIREÇÃO: As bandas estão apontando para [CIMA/BAIXO/LATERAL]?
- PARALELISMO: As linhas estão [paralelas/convergindo/divergindo]?
- SQUEEZE: As bandas estão [muito juntas/abrindo/normais]?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 3. BOX PRETO (informações de texto):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
No canto superior esquerdo há um box preto com texto branco.
- Consegue ler o texto? Transcreva as informações visíveis.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟣 4. BOX ROXO (consolidação):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Há um retângulo ROXO no gráfico? [SIM/NÃO]
- Se SIM: Onde começa? Onde termina? Tem texto?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 5. HISTOGRAMA INFERIOR (barras verticais):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Últimas 5 barras da DIREITA para ESQUERDA:
- Barra 1 (extrema direita): [cor], [tamanho]
- Barra 2: [cor], [tamanho]
- Barra 3: [cor], [tamanho]
- Barra 4: [cor], [tamanho]
- Barra 5: [cor], [tamanho]

Cores: azul/ciano, amarelo/dourado, vermelho/laranja
Tendência: [crescendo/decrescendo/estáveis]?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 IMPORTANTE: Seja honesto, use suas cores naturais, conte cuidadosamente.
`;

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    console.log('🔍 Iniciando análise exploratória...');
    
    try {
        const { screenshot } = req.body;
        
        if (!screenshot) {
            return res.status(400).json({
                status: 'error',
                message: 'Screenshot required'
            });
        }
        
        console.log('🔧 Processing image...');
        const buffer = Buffer.from(screenshot, 'base64');
        const processed = await sharp(buffer)
            .png({ compressionLevel: 0 })
            .toBuffer();
        
        const base64Image = processed.toString('base64');
        console.log(`📊 Image size: ${(processed.length / 1024).toFixed(2)} KB`);
        
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({
            model: MODEL,
            generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 3000,
                thinkingConfig: { thinkingBudget: 0 }
            }
        });
        
        console.log('📤 Sending to Gemini...');
        const result = await model.generateContent([
            {
                inlineData: {
                    data: base64Image,
                    mimeType: 'image/png'
                }
            },
            { text: EXPLORATORY_PROMPT }
        ]);
        
        const text = result.response.text();
        const usage = result.response.usageMetadata;
        
        console.log(`✅ Analysis complete`);
        console.log(`📊 Tokens: ${usage?.promptTokenCount} in / ${usage?.candidatesTokenCount} out`);
        
        return res.status(200).json({
            status: 'success',
            description: text,
            tokens: {
                input: usage?.promptTokenCount || 0,
                output: usage?.candidatesTokenCount || 0,
                thinking: usage?.thoughtsTokenCount || 0,
                total: usage?.totalTokenCount || 0
            }
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
        
        return res.status(500).json({
            status: 'error',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};