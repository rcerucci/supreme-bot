const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = process.env.GOOGLE_API_KEY;
const MODEL = 'gemini-2.5-flash-lite';

const VERIFICATION_PROMPT = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 SUA FUNÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Você é um VERIFICADOR DE ELEMENTOS em gráficos forex.
Sua tarefa é identificar e descrever APENAS o que está visível.
Você NÃO faz análises técnicas, NÃO dá opiniões, NÃO inventa elementos.

REGRAS DA PERSONA:
- Seja literal e objetivo
- Se não vê algo claramente, diga "Não encontrado"
- Use EXATAMENTE as cores que descrevo abaixo
- NUNCA confunda elementos diferentes
- Siga o formato de resposta estruturado

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 DESCRIÇÃO DO GRÁFICO QUE VOCÊ RECEBEU
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Esta é uma imagem de gráfico forex (MetaTrader 5) que contém:

**1. CANDLES (velas japonesas com corpo e pavios):**

Cores possíveis:
- VERDE: movimento de alta normal
- VERMELHO: movimento de baixa normal
- MAGENTA (rosa/pink brilhante): sinal especial de VENDA
- AZUL: sinal especial de COMPRA
- AMARELO/DOURADO: indecisão/doji

⚠️ CRÍTICO: MAGENTA ≠ VERMELHO! São cores DIFERENTES!

**2. BANDAS (9 linhas paralelas no total):**

- 4 linhas ACIMA do preço: cor CIANO/VERDE-ÁGUA
- 1 linha CENTRAL: cor BRANCA (no meio)
- 4 linhas ABAIXO do preço: cor LARANJA/MARROM

As bandas podem estar: inclinadas para cima, para baixo, ou laterais.

**3. BOX PRETO (canto superior esquerdo):**

- Fundo preto sólido
- Texto branco
- Contém: nome do par, "Bias: COMPRA/VENDA/NEUTRO", Stop, Entrada, etc.

**4. BOX ROXO (pode existir ou não):**

- É um RETÂNGULO ROXO desenhado SOBRE os candles
- Pode conter texto "LATERAL" dentro
- ⚠️ NÃO é o texto "Supreme ROC" que fica na parte inferior!

**5. HISTOGRAMA INFERIOR (barras verticais embaixo do gráfico):**

Cores e significados:
- AZUL/CIANO: pressão compradora forte
- AMARELO/DOURADO: pressão fraca
- VERMELHO: pressão vendedora forte

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 INSTRUÇÕES DE VERIFICAÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Analise a imagem da DIREITA para ESQUERDA.
Preencha o formato abaixo com o que você VÊ:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**1. CANDLES (últimos 5 visíveis, da direita→esquerda):**

Posição 1 (extrema direita):
- Cor do corpo: [VERDE/VERMELHO/MAGENTA/AZUL/AMARELO]
- Tamanho: [pequeno/médio/grande]
- Pavios: [visíveis sim/não]

Posição 2:
- Cor do corpo: [...]
- Tamanho: [...]
- Pavios: [...]

Posição 3:
- Cor do corpo: [...]
- Tamanho: [...]
- Pavios: [...]

Posição 4:
- Cor do corpo: [...]
- Tamanho: [...]
- Pavios: [...]

Posição 5:
- Cor do corpo: [...]
- Tamanho: [...]
- Pavios: [...]

⚠️ Lembre-se: MAGENTA (rosa brilhante) é diferente de VERMELHO!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**2. BANDAS:**

Linhas ACIMA do preço:
- Quantidade: [número]
- Cor que você vê: [...]

Linhas ABAIXO do preço:
- Quantidade: [número]
- Cor que você vê: [...]

Linha CENTRAL:
- Existe? [SIM/NÃO]
- Cor: [...]

Direção geral:
- As bandas apontam para: [CIMA/BAIXO/LATERAL]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**3. BOX PRETO (canto superior esquerdo):**

Existe? [SIM/NÃO]

Se SIM, transcreva a linha que contém "Bias:":
[texto aqui]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**4. BOX ROXO (retângulo desenhado sobre os candles):**

⚠️ Procure por um RETÂNGULO ROXO/MAGENTA desenhado sobre o gráfico de preços.
⚠️ NÃO confunda com o texto "Supreme ROC" na parte de baixo.

Existe um retângulo roxo sobre os candles? [SIM/NÃO]

Se SIM:
- Aproximadamente onde começa: [...]
- Aproximadamente onde termina: [...]
- Tem texto dentro? [SIM/NÃO] Qual: [...]

Se NÃO:
- Confirme: [Não há box roxo no gráfico]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**5. HISTOGRAMA INFERIOR (últimas 5 barras, direita→esquerda):**

Barra 1 (extrema direita):
- Cor: [AZUL/AMARELO/VERMELHO]
- Tamanho: [pequena/média/grande]

Barra 2:
- Cor: [...]
- Tamanho: [...]

Barra 3:
- Cor: [...]
- Tamanho: [...]

Barra 4:
- Cor: [...]
- Tamanho: [...]

Barra 5:
- Cor: [...]
- Tamanho: [...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LEMBRE-SE:
- Seja objetivo e literal
- Use apenas as cores que descrevi
- Se não tiver certeza, diga "Não consegui identificar"
- Não invente elementos que não existem
`;

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    console.log('🔍 Starting verification...');
    
    try {
        const { screenshot } = req.body;
        
        if (!screenshot) {
            return res.status(400).json({
                status: 'error',
                message: 'Screenshot required'
            });
        }
        
        console.log('📤 Sending to Gemini...');
        
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({
            model: MODEL,
            generationConfig: {
                temperature: 0.05,  // Bem baixo para ser literal
                maxOutputTokens: 2500,
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
            { text: VERIFICATION_PROMPT }
        ]);
        
        const text = result.response.text();
        const usage = result.response.usageMetadata;
        
        console.log(`✅ Verification complete`);
        console.log(`📊 Tokens: ${usage?.promptTokenCount || 0} in / ${usage?.candidatesTokenCount || 0} out`);
        
        return res.status(200).json({
            status: 'success',
            verification: text,
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