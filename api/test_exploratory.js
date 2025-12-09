const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = process.env.GOOGLE_API_KEY;
const MODEL = 'gemini-2.5-flash-lite';

const EXPLORATORY_PROMPT = `
Você é um analisador técnico de gráficos forex. Descreva detalhadamente o que você VÊ.

📊 1. CANDLES (últimos 5, direita→esquerda):
Para cada: Posição, Cor do corpo, Tamanho, Pavios

📈 2. BANDAS:
Acima: quantidade e cor
Abaixo: quantidade e cor  
Central: cor e direção

📦 3. BOX PRETO:
Transcreva o texto

🟣 4. BOX ROXO:
Existe? Onde? Texto?

📊 5. HISTOGRAMA (últimas 5):
Cor e tamanho de cada
Tendência geral
`;

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    console.log('🔍 Starting analysis...');
    
    try {
        const { screenshot } = req.body;
        
        if (!screenshot) {
            return res.status(400).json({
                status: 'error',
                message: 'Screenshot required'
            });
        }
        
        console.log('📤 Sending to Gemini (no preprocessing)...');
        
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({
            model: MODEL,
            generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 3000,
                thinkingConfig: { thinkingBudget: 0 }
            }
        });
        
        const result = await model.generateContent([
            {
                inlineData: {
                    data: screenshot,
                    mimeType: 'image/png'
                }
            },
            { text: EXPLORATORY_PROMPT }
        ]);
        
        const text = result.response.text();
        const usage = result.response.usageMetadata;
        
        console.log(`✅ Complete: ${usage?.promptTokenCount} in / ${usage?.candidatesTokenCount} out`);
        
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
        
        return res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};
