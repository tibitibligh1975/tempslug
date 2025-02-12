const express = require('express');
const path = require('path');
const app = express();

// Configuração básica
const port = process.env.PORT || 3000;

// Log para debug
console.log('Iniciando servidor...');
console.log('Ambiente:', process.env.NODE_ENV);
console.log('Porta:', port);

// Rota básica para teste
app.get('/', (req, res) => {
    res.send('Servidor funcionando!');
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Tratamento de erros
app.use((err, req, res, next) => {
    console.error('Erro:', err);
    res.status(500).send('Erro interno do servidor');
});

// Iniciar servidor
app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${port}`);
}).on('error', (err) => {
    console.error('Erro ao iniciar servidor:', err);
}); 