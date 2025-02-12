const express = require('express');
const path = require('path');
const crypto = require('crypto');
const app = express();
const port = 3000;

// Armazenamento temporário para as slugs (em produção, considere usar Redis)
const temporarySlugs = new Map();

// Mantemos apenas a configuração básica para os outros arquivos estáticos
app.use(express.static(path.join(__dirname, 'checkout')));

// Middleware para debug - vamos ver quais requisições estão chegando
app.use((req, res, next) => {
    console.log('Requisição recebida:', req.method, req.path);
    next();
});

// Página inicial com botão
app.get('/', (req, res) => {
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

// Endpoint para gerar nova URL temporária
app.get('/generate-checkout', (req, res) => {
    // Gerar slug aleatório
    const slug = crypto.randomBytes(8).toString('hex');
    
    // Armazenar slug com timestamp
    temporarySlugs.set(slug, {
        created: Date.now(),
        expires: Date.now() + (30 * 1000) // 30 segundos
    });

    // Retornar URL do checkout
    res.json({ url: `/temp-checkout/${slug}` });
});

// Rota para servir o checkout temporário
app.get('/temp-checkout/:slug', (req, res) => {
    const slug = req.params.slug;
    const slugData = temporarySlugs.get(slug);

    // Verificar se o slug existe e não expirou
    if (!slugData || Date.now() > slugData.expires) {
        return res.status(404).send(`
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Link Expirado</title>
                <style>
                    body {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        margin: 0;
                        font-family: Arial, sans-serif;
                        background-color: #f5f5f5;
                        text-align: center;
                    }
                    .error-container {
                        background-color: white;
                        padding: 30px;
                        border-radius: 8px;
                        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                    }
                    h1 { color: #d32f2f; }
                    p { color: #666; }
                    a {
                        color: #1976d2;
                        text-decoration: none;
                    }
                    a:hover {
                        text-decoration: underline;
                    }
                </style>
            </head>
            <body>
                <div class="error-container">
                    <h1>Link Expirado</h1>
                    <p>Este link de checkout não está mais disponível.</p>
                    <a href="/">Voltar para página inicial</a>
                </div>
            </body>
            </html>
        `);
    }

    // Servir o conteúdo do checkout
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

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
}); 