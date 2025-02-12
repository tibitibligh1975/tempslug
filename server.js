const express = require('express');
const path = require('path');
const crypto = require('crypto');
const app = express();

// Configuração básica
const port = process.env.PORT || 3000;

// Armazenamento temporário para as slugs
const temporarySlugs = new Map();

// Configuração para arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use('/checkout', express.static(path.join(__dirname, 'checkout')));
app.use('/temp-checkout', express.static(path.join(__dirname, 'checkout')));

// Rota para gerar checkout
app.get('/generate-checkout', (req, res) => {
    try {
        const slug = crypto.randomBytes(8).toString('hex');
        temporarySlugs.set(slug, {
            created: Date.now(),
            expires: Date.now() + (30 * 1000) // 30 segundos
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

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Iniciar servidor
app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${port}`);
}).on('error', (err) => {
    console.error('Erro ao iniciar servidor:', err);
}); 