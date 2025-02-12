const express = require('express');
const path = require('path');
const crypto = require('crypto');
const app = express();

// Configuração da porta - importante para o Railway
const port = process.env.PORT || 3000;

// Log para debug
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Armazenamento temporário para as slugs
const temporarySlugs = new Map();

// Configuração para arquivos estáticos
app.use(express.static(path.join(__dirname, 'checkout')));

// Rota raiz - página inicial com botão
app.get('/', (req, res) => {
    console.log('Acessando rota raiz');
    res.send(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Página Inicial</title>
            <style>
                body {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    margin: 0;
                    font-family: Arial, sans-serif;
                    background-color: #f5f5f5;
                }
                .container {
                    text-align: center;
                    background-color: white;
                    padding: 30px;
                    border-radius: 8px;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }
                .button {
                    background-color: #00C853;
                    color: white;
                    border: none;
                    padding: 15px 30px;
                    font-size: 1.2rem;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: background-color 0.3s;
                }
                .button:hover {
                    background-color: #14A351;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h2 style="color: #484848; margin-bottom: 20px;">Gerar Link de Checkout</h2>
                <button class="button" onclick="generateCheckout()">Gerar Checkout</button>
            </div>
            <script>
                async function generateCheckout() {
                    try {
                        const response = await fetch('/generate-checkout');
                        const data = await response.json();
                        if (data.url) {
                            window.location.href = data.url;
                        }
                    } catch (error) {
                        console.error('Erro ao gerar checkout:', error);
                    }
                }
            </script>
        </body>
        </html>
    `);
});

// Rota para gerar checkout
app.get('/generate-checkout', (req, res) => {
    console.log('Gerando novo checkout');
    const slug = crypto.randomBytes(8).toString('hex');
    temporarySlugs.set(slug, {
        created: Date.now(),
        expires: Date.now() + (30 * 1000)
    });
    res.json({ url: `/temp-checkout/${slug}` });
});

// Rota para checkout temporário
app.get('/temp-checkout/:slug', (req, res) => {
    console.log(`Acessando checkout com slug: ${req.params.slug}`);
    const slug = req.params.slug;
    const slugData = temporarySlugs.get(slug);

    if (!slugData || Date.now() > slugData.expires) {
        return res.status(404).send('Link expirado');
    }

    res.sendFile(path.join(__dirname, 'checkout', 'index.html'));
});

// Rota para servir o checkout diretamente (opcional, caso queira manter)
app.get('/checkout', (req, res) => {
    res.sendFile(path.join(__dirname, 'checkout', 'index.html'));
});

// Limpeza periódica de slugs expirados
setInterval(() => {
    const now = Date.now();
    for (const [slug, data] of temporarySlugs.entries()) {
        if (now > data.expires) {
            temporarySlugs.delete(slug);
        }
    }
}, 5000); // Limpar a cada 5 segundos

// Iniciar o servidor
app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${port}`);
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
    console.error('Erro não capturado:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Promise rejeitada não tratada:', error);
}); 