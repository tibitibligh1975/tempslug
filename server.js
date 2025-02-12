const express = require('express');
const path = require('path');
const crypto = require('crypto');
const app = express();

// Armazenamento temporário para as slugs
const temporarySlugs = new Map();

// Middleware para logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Configuração básica do Express
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use('/', express.static(path.join(__dirname, 'public')));
app.use('/checkout', express.static(path.join(__dirname, 'checkout')));
app.use('/temp-checkout', express.static(path.join(__dirname, 'checkout')));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Rota raiz
app.get('/', (req, res) => {
    try {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } catch (error) {
        console.error('Erro ao servir página inicial:', error);
        res.status(500).send('Erro interno do servidor');
    }
});

// Rota para gerar checkout
app.get('/generate-checkout', (req, res) => {
    try {
        const slug = crypto.randomBytes(8).toString('hex');
        temporarySlugs.set(slug, {
            created: Date.now(),
            expires: Date.now() + (30 * 1000)
        });
        res.json({ url: `/temp-checkout/${slug}` });
    } catch (error) {
        console.error('Erro ao gerar checkout:', error);
        res.status(500).json({ error: 'Erro ao gerar checkout' });
    }
});

// Rota para checkout temporário
app.get('/temp-checkout/:slug', (req, res) => {
    try {
        const slug = req.params.slug;
        const slugData = temporarySlugs.get(slug);

        if (!slugData || Date.now() > slugData.expires) {
            return res.status(404).send('Link expirado');
        }

        res.sendFile(path.join(__dirname, 'checkout', 'index.html'));
    } catch (error) {
        console.error('Erro ao acessar checkout:', error);
        res.status(500).send('Erro interno do servidor');
    }
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

// Inicialização do servidor
const port = process.env.PORT || 3000;

const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${port}`);
}).on('error', (error) => {
    console.error('Erro ao iniciar servidor:', error);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM recebido. Encerrando servidor...');
    server.close(() => {
        console.log('Servidor encerrado');
        process.exit(0);
    });
});

process.on('uncaughtException', (error) => {
    console.error('Erro não capturado:', error);
    process.exit(1);
}); 