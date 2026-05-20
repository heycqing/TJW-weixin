require('dotenv').config();

function getRequiredEnv(name) {
    var value = process.env[name];
    if (!value) {
        throw new Error('Missing required environment variable: ' + name);
    }
    return value;
}

function getOptionalEnv(name, fallback) {
    return process.env[name] || fallback;
}

Object.defineProperty(exports, 'wechat', {
    get: function () {
        return {
            appID: getRequiredEnv('WECHAT_APP_ID'),
            appSecret: getRequiredEnv('WECHAT_APP_SECRET'),
            token: getRequiredEnv('WECHAT_TOKEN'),
        };
    },
});

Object.defineProperty(exports, 'mysql', {
    get: function () {
        return {
            host: getRequiredEnv('MYSQL_HOST'),
            user: getOptionalEnv('MYSQL_USER', 'root'),
            password: getRequiredEnv('MYSQL_PASSWORD'),
            port: getOptionalEnv('MYSQL_PORT', '3306'),
            database: getRequiredEnv('MYSQL_DATABASE'),
        };
    },
});

Object.defineProperty(exports, 'legacyServer', {
    get: function () {
        return {
            port: Number(getOptionalEnv('PORT', '1446')),
        };
    },
});
