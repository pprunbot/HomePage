const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// 创建配置文件（如果不存在）
const configPath = path.join(__dirname, 'config.json');
if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify({
        passwordSet: false,
        password: ''
    }, null, 2));
}

// 创建内容文件（如果不存在）
const contentPath = path.join(__dirname, 'content.json');
if (!fs.existsSync(contentPath)) {
    fs.writeFileSync(contentPath, JSON.stringify({
        sites: '',
        projects: ''
    }, null, 2));
}

// 中间件
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// 静态文件服务
app.use('/static', express.static(path.join(__dirname, 'static')));

// 鉴权中间件
const checkAuth = (req, res, next) => {
    const config = JSON.parse(fs.readFileSync(configPath));
    
    if (!config.passwordSet) {
        // 尚未设置密码，允许访问
        return next();
    }
    
    if (req.session && req.session.authenticated) {
        // 已登录
        return next();
    }
    
    // 未登录，重定向到登录页
    res.redirect('/login');
};

// 首页路由
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'templates', 'index.html');
    const content = JSON.parse(fs.readFileSync(contentPath));
    
    fs.readFile(indexPath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Error loading page');
        }
        
        // 替换占位内容
        const updatedData = data
            .replace('<!-- 站点展示 -->', content.sites)
            .replace('<!-- 项目展示 -->', content.projects);
        
        res.send(updatedData);
    });
});

// 登录页面
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'login.html'));
});

// 登录处理
app.post('/login', (req, res) => {
    const config = JSON.parse(fs.readFileSync(configPath));
    const { password } = req.body;
    
    if (config.passwordSet && password === config.password) {
        req.session.authenticated = true;
        res.redirect('/admin');
    } else if (!config.passwordSet) {
        // 首次访问，无需密码
        req.session.authenticated = true;
        res.redirect('/admin');
    } else {
        res.send('密码错误');
    }
});

// 后台管理页面
app.get('/admin', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'admin.html'));
});

// 获取当前内容
app.get('/api/content', checkAuth, (req, res) => {
    try {
        const content = JSON.parse(fs.readFileSync(contentPath));
        res.json(content);
    } catch (error) {
        res.status(500).json({ error: '无法读取内容' });
    }
});

// 更新内容
app.post('/api/update-content', checkAuth, (req, res) => {
    try {
        const { sites, projects } = req.body;
        const newContent = { sites, projects };
        
        fs.writeFileSync(contentPath, JSON.stringify(newContent, null, 2));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: '更新失败' });
    }
});

// 设置密码
app.post('/api/set-password', checkAuth, (req, res) => {
    try {
        const { password } = req.body;
        const config = JSON.parse(fs.readFileSync(configPath));
        
        config.passwordSet = true;
        config.password = password;
        
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: '设置密码失败' });
    }
});

// 检查密码设置状态
app.get('/api/password-status', (req, res) => {
    try {
        const config = JSON.parse(fs.readFileSync(configPath));
        res.json({ passwordSet: config.passwordSet });
    } catch (error) {
        res.status(500).json({ error: '无法读取配置' });
    }
});

// 启动服务器
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
