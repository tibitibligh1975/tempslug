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
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'checkout')));

// Rota raiz - agora serve o arquivo index.html da pasta public
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
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