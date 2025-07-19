const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

const DATA_FILE = './data.json';
const PASSWORD_FILE = './password.json';
const INDEX_FILE = './templates/index.html';

app.use(express.static('static'));
app.use('/templates', express.static('templates'));
app.use(bodyParser.urlencoded({ extended: true }));

// 初始化数据文件
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ sites: [], projects: [] }, null, 2));
}
if (!fs.existsSync(PASSWORD_FILE)) {
    fs.writeFileSync(PASSWORD_FILE, JSON.stringify({ password: null }, null, 2));
}

// 渲染首页
app.get('/', (req, res) => {
    res.sendFile(INDEX_FILE);
});

// 后台登录页面
app.get('/admin', (req, res) => {
    const { password } = JSON.parse(fs.readFileSync(PASSWORD_FILE));
    if (password) {
        res.sendFile(__dirname + '/templates/login.html');
    } else {
        res.sendFile(__dirname + '/templates/admin.html');
    }
});

// 登录提交
app.post('/login', (req, res) => {
    const { password } = req.body;
    const saved = JSON.parse(fs.readFileSync(PASSWORD_FILE)).password;
    if (saved && password === saved) {
        res.sendFile(__dirname + '/templates/admin.html');
    } else {
        res.send('<script>alert("密码错误！");window.location="/admin";</script>');
    }
});

// 获取当前数据
app.get('/api/data', (req, res) => {
    const data = JSON.parse(fs.readFileSync(DATA_FILE));
    res.json(data);
});

// 更新数据
app.post('/api/update', (req, res) => {
    const { sites, projects, newPassword } = req.body;

    if (sites && projects) {
        const data = { sites: JSON.parse(sites), projects: JSON.parse(projects) };
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        updateIndexHtml(data);
    }

    if (newPassword) {
        fs.writeFileSync(PASSWORD_FILE, JSON.stringify({ password: newPassword }, null, 2));
    }

    res.send('OK');
});

// 更新index.html文件
function updateIndexHtml(data) {
    let html = fs.readFileSync(INDEX_FILE, 'utf8');

    const sitesHtml = data.sites.map(site => `
        <a href="${site.url}" target="_blank" class="site-link btn-effect">
            <div class="site-card">
                <div class="site-icon">
                    <img src="${site.img}" alt="${site.title}">
                </div>
                <div class="site-info">
                    <h3>${site.title}</h3>
                    <p>${site.desc}</p>
                </div>
            </div>
        </a>
    `).join('');

    const projectsHtml = data.projects.map(proj => `
        <a href="${proj.url}" target="_blank" class="project-link btn-effect">
            <div class="project-card">
                <div class="project-icon">
                    <img src="${proj.img}" alt="${proj.title}">
                </div>
                <div class="project-info">
                    <h3>${proj.title}</h3>
                    <p>${proj.desc}</p>
                </div>
            </div>
        </a>
    `).join('');

    html = html.replace(
        /<!-- 站点展示 -->[\s\S]*?<section class="projects-section">/,
        `<!-- 站点展示 -->\n<section class="sites-section">\n<h2><i class="fas fa-globe"></i> WebSite</h2>\n<div class="sites-grid">${sitesHtml}</div>\n</section>\n\n<section class="projects-section">`
    );

    html = html.replace(
        /<!-- 项目展示 -->[\s\S]*?<section class="skills-section">/,
        `<!-- 项目展示 -->\n<section class="projects-section">\n<h2><i class="fas fa-cube"></i> 项目集</h2>\n<div class="projects-grid">${projectsHtml}</div>\n</section>\n\n<section class="skills-section">`
    );

    fs.writeFileSync(INDEX_FILE, html);
}

app.listen(port, () => {
    console.log(`后台运行在 http://localhost:${port}/admin`);
});
