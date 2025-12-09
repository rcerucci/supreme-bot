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

async function preprocessImage(imagePath) {
    try {
        const buffer = fs.readFileSync(imagePath);
        const processedBuffer = await sharp(buffer)
            .png({ compressionLevel: 0 })
            .toBuffer();
        return processedBuffer.toString('base64');
    } catch (error) {
        console.error('❌ Preprocessing error:', error.message);
        throw error;
    }
}

async function testExploratoryAnalysis(imagePath) {
    console.log('\n' + '═'.repeat(60));
    console.log('🔍 TESTE EXPLORATÓRIO - PERCEPÇÃO DO GEMINI');
    console.log('═'.repeat(60));
    console.log(`📁 Imagem: ${path.basename(imagePath)}\n`);
    
    try {
        console.log('🔧 Processando imagem (PNG sem compressão)...');
        const base64Image = await preprocessImage(imagePath);
        const imageSizeKB = (base64Image.length * 0.75 / 1024).toFixed(2);
        console.log(`   Tamanho: ${imageSizeKB} KB (base64)\n`);
        
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({
            model: MODEL,
            generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 3000,
                thinkingConfig: { thinkingBudget: 0 }
            }
        });
        
        const contents = [
            {
                inlineData: {
                    data: base64Image,
                    mimeType: 'image/png'
                }
            },
            { text: EXPLORATORY_PROMPT }
        ];
        
        console.log('📤 Enviando para Gemini...\n');
        const startTime = Date.now();
        const result = await model.generateContent(contents);
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        
        const description = result.response.text();
        const usage = result.response.usageMetadata;
        
        console.log('═'.repeat(60));
        console.log('📊 ANÁLISE DO GEMINI:');
        console.log('═'.repeat(60));
        console.log(description);
        console.log('\n' + '═'.repeat(60));
        console.log('📈 MÉTRICAS:');
        console.log('═'.repeat(60));
        console.log(`⏱️  Tempo: ${elapsed}s`);
        console.log(`📥 Tokens entrada: ${usage?.promptTokenCount || 0}`);
        console.log(`📤 Tokens saída: ${usage?.candidatesTokenCount || 0}`);
        console.log(`💰 Total tokens: ${(usage?.promptTokenCount || 0) + (usage?.candidatesTokenCount || 0)}`);
        console.log(`🎯 Modelo: ${MODEL}`);
        console.log('═'.repeat(60) + '\n');
        
        const outputPath = imagePath.replace('.png', '_gemini_analysis.txt');
        const output = `TESTE EXPLORATÓRIO - ${new Date().toISOString()}
Imagem: ${path.basename(imagePath)}
Modelo: ${MODEL}
Tempo: ${elapsed}s
Tokens: ${usage?.promptTokenCount} in / ${usage?.candidatesTokenCount} out

═══════════════════════════════════════════════════════════
ANÁLISE:
═══════════════════════════════════════════════════════════
${description}
`;
        
        fs.writeFileSync(outputPath, output);
        console.log(`💾 Resultado salvo em: ${outputPath}\n`);
        
        return {
            success: true,
            description,
            metrics: {
                time: elapsed,
                tokensIn: usage?.promptTokenCount || 0,
                tokensOut: usage?.candidatesTokenCount || 0,
                imageSize: imageSizeKB
            }
        };
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        return { success: false, error: error.message };
    }
}

async function main() {
    const imagePath = process.argv[2] || './examples_jpeg/exemple.png';
    
    if (!fs.existsSync(imagePath)) {
        console.error(`❌ Imagem não encontrada: ${imagePath}`);
        process.exit(1);
    }
    
    await testExploratoryAnalysis(imagePath);
}

if (require.main === module) {
    main();
}

module.exports = { testExploratoryAnalysis };
