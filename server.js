const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// 确保数据目录存在
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// 初始化数据文件
const initDataFile = (file, defaultValue) => {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(defaultValue, null, 2));
  }
};

// 初始化数据文件
initDataFile(path.join(dataDir, 'sites.json'), []);
initDataFile(path.join(dataDir, 'projects.json'), []);
initDataFile(path.join(dataDir, 'password.json'), { password: '' });

// 中间件
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: 'secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));
app.use(express.static(path.join(__dirname, 'static')));

// 读取数据文件
const readData = (file) => {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
};

// 写入数据文件
const writeData = (file, data) => {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

// 检查密码
const checkPassword = (req, res, next) => {
  const passwordData = readData(path.join(dataDir, 'password.json'));
  
  // 如果未设置密码，直接允许访问
  if (!passwordData.password) {
    return next();
  }
  
  // 检查会话是否已认证
  if (req.session.authenticated) {
    return next();
  }
  
  res.redirect('/login');
};

// 主页路由
app.get('/', (req, res) => {
  const sites = readData(path.join(dataDir, 'sites.json'));
  const projects = readData(path.join(dataDir, 'projects.json'));
  
  let html = fs.readFileSync(path.join(__dirname, 'templates', 'index.html'), 'utf8');
  
  // 动态插入站点数据
  const sitesHtml = sites.map(site => `
    <a href="${site.url}" target="_blank" class="site-link btn-effect">
      <div class="site-card">
        <div class="site-icon">
          <img src="${site.icon}" alt="${site.title}">
        </div>
        <div class="site-info">
          <h3>${site.title}</h3>
          <p>${site.description}</p>
        </div>
      </div>
    </a>
  `).join('');
  
  // 动态插入项目数据
  const projectsHtml = projects.map(project => `
    <a href="${project.url}" target="_blank" class="project-link btn-effect">
      <div class="project-card">
        <div class="project-icon">
          <img src="${project.icon}" alt="${project.title}">
        </div>
        <div class="project-info">
          <h3>${project.title}</h3>
          <p>${project.description}</p>
        </div>
      </div>
    </a>
  `).join('');
  
  // 替换占位符
  html = html.replace('<!-- 站点展示 -->', sitesHtml);
  html = html.replace('<!-- 项目展示 -->', projectsHtml);
  
  res.send(html);
});

// 登录页面
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'login.html'));
});

// 登录处理
app.post('/login', (req, res) => {
  const { password } = req.body;
  const passwordData = readData(path.join(dataDir, 'password.json'));
  
  if (password === passwordData.password) {
    req.session.authenticated = true;
    res.redirect('/admin');
  } else {
    res.send('密码错误');
  }
});

// 后台管理页面
app.get('/admin', checkPassword, (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'admin.html'));
});

// 获取数据API
app.get('/admin/data', checkPassword, (req, res) => {
  const sites = readData(path.join(dataDir, 'sites.json'));
  const projects = readData(path.join(dataDir, 'projects.json'));
  const passwordData = readData(path.join(dataDir, 'password.json'));
  
  res.json({
    sites,
    projects,
    hasPassword: !!passwordData.password
  });
});

// 添加站点
app.post('/admin/sites', checkPassword, (req, res) => {
  const sites = readData(path.join(dataDir, 'sites.json'));
  sites.push(req.body);
  writeData(path.join(dataDir, 'sites.json'), sites);
  res.json({ success: true });
});

// 删除站点
app.delete('/admin/sites/:index', checkPassword, (req, res) => {
  const sites = readData(path.join(dataDir, 'sites.json'));
  const index = parseInt(req.params.index);
  
  if (index >= 0 && index < sites.length) {
    sites.splice(index, 1);
    writeData(path.join(dataDir, 'sites.json'), sites);
    res.json({ success: true });
  } else {
    res.status(400).json({ error: '无效的索引' });
  }
});

// 添加项目
app.post('/admin/projects', checkPassword, (req, res) => {
  const projects = readData(path.join(dataDir, 'projects.json'));
  projects.push(req.body);
  writeData(path.join(dataDir, 'projects.json'), projects);
  res.json({ success: true });
});

// 删除项目
app.delete('/admin/projects/:index', checkPassword, (req, res) => {
  const projects = readData(path.join(dataDir, 'projects.json'));
  const index = parseInt(req.params.index);
  
  if (index >= 0 && index < projects.length) {
    projects.splice(index, 1);
    writeData(path.join(dataDir, 'projects.json'), projects);
    res.json({ success: true });
  } else {
    res.status(400).json({ error: '无效的索引' });
  }
});

// 设置密码
app.post('/admin/password', checkPassword, (req, res) => {
  const { password } = req.body;
  writeData(path.join(dataDir, 'password.json'), { password });
  res.json({ success: true });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
