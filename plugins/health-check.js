module.exports = {
    requestReceived: function(req, res, next) {
        const path = req.path || '';

        // 簡單 health check
        if (path === '/health' || path === '/healthy') {
            return res.status(200).send('OK');
        }

        // 詳細 health check
        if (path === '/health/status') {
            const health = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: Math.floor(process.uptime()),
                memory: {
                    used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
                    total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
                },
                version: require('../package.json').version,
                service: 'prerender',
                nodeVersion: process.version,
                environment: process.env.NODE_ENV || 'development'
            };
            return res.status(200).json(health);
        }

        // Readiness check（Docker/K8s 常用）
        if (path === '/ready') {
            return res.status(200).send('READY');
        }

        // Liveness check（Docker/K8s 常用）
        if (path === '/live') {
            return res.status(200).send('ALIVE');
        }

        next();
    }
};
