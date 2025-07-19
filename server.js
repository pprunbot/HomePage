const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3000;

// 创建必要目录
if (!fs.existsSync('data')) fs.mkdirSync('data');

// 初始化配置文件
const configPath = path.join(__dirname, 'data', 'config.json');
if (!fs.existsSync(configPath)) {
  fs.writeFileSync(configPath, JSON.stringify({ passwordSet: false, passwordHash: '' }));
}

// 初始化站点数据
const sitesPath = path.join(__dirname, 'data', 'sites.json');
if (!fs.existsSync(sitesPath)) {
  fs.writeFileSync(sitesPath, JSON.stringify([
    {
      "name": "博客", 
      "description": "记录技术日常", 
      "url": "https://blog.loadke.tech/", 
      "icon": "https://img.icons8.com/?id=87160&format=png"
    },
    {
      "name": "轻API", 
      "description": "一些API接口", 
      "url": "https://api.loadke.tech", 
      "icon": "https://img.icons8.com/?id=Oz14KBnT7lnn&format=png"
    },
    {
      "name": "优选IP面板", 
      "description": "Cloudflare优选IP", 
      "url": "https://bestip.badking.pp.ua/", 
      "icon": "https://img.icons8.com/?id=13682&format=png"
    },
    {
      "name": "加速访问", 
      "description": "GH Jsdlier Docker", 
      "url": "https://webproxy.badking.pp.ua/", 
      "icon": "https://img.icons8.com/?id=115369&format=png"
    },
    {
      "name": "Google 翻译", 
      "description": "Google 翻译加速", 
      "url": "https://translate.badking.pp.ua/", 
      "icon": "https://img.icons8.com/?id=h57OOadmEz64&format=png"
    }
  ]));
}

// 初始化项目数据
const projectsPath = path.join(__dirname, 'data', 'projects.json');
if (!fs.existsSync(projectsPath)) {
  fs.writeFileSync(projectsPath, JSON.stringify([
    {
      "name": "IonRh主页", 
      "description": "Github介绍页", 
      "url": "https://github.com/IonRh", 
      "icon": "https://img.icons8.com/fluency/48/github.png"
    },
    {
      "name": "本站开源主页", 
      "description": "本站的开源仓库", 
      "url": "https://github.com/IonRh/HomePage", 
      "icon": "https://img.icons8.com/fluency/48/github.png"
    },
    {
      "name": "CF BestIP", 
      "description": "Cloudflare优选IP", 
      "url": "https://github.com/IonRh/Cloudflare-BestIP", 
      "icon": "https://img.icons8.com/fluency/48/github.png"
    },
    {
      "name": "TGBot_RSS", 
      "description": "TGBot的RSS订阅", 
      "url": "https://github.com/IonRh/TGBot_RSS", 
      "icon": "https://img.icons8.com/fluency/48/github.png"
    }
  ]));
}

// 中间件
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // 生产环境应设为true
}));

// 静态文件服务
app.use('/static', express.static(path.join(__dirname, 'static')));
app.use('/data', express.static(path.join(__dirname, 'data'), {
  setHeaders: (res) => {
    // 禁用缓存
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
}));

// 检查密码是否设置
function isPasswordSet() {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  return config.passwordSet;
}

// 验证密码
function validatePassword(password) {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  return bcrypt.compareSync(password, config.passwordHash);
}

// 设置密码
function setPassword(password) {
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);
  const config = { passwordSet: true, passwordHash: hash };
  fs.writeFileSync(configPath, JSON.stringify(config));
}

// 路由：首页
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});

// 路由：登录页面
app.get('/login', (req, res) => {
  if (!isPasswordSet()) {
    return res.redirect('/admin');
  }
  res.sendFile(path.join(__dirname, 'templates', 'login.html'));
});

// 路由：处理登录
app.post('/login', (req, res) => {
  const { password } = req.body;
  
  if (!isPasswordSet()) {
    req.session.isAdmin = true;
    return res.redirect('/admin');
  }
  
  if (validatePassword(password)) {
    req.session.isAdmin = true;
    res.redirect('/admin');
  } else {
    res.status(401).send('密码错误');
  }
});

// 路由：登出
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// 路由：管理后台
app.get('/admin', (req, res) => {
  if (!isPasswordSet()) {
    req.session.isAdmin = true;
    return res.sendFile(path.join(__dirname, 'templates', 'admin.html'));
  }
  
  if (req.session.isAdmin) {
    res.sendFile(path.join(__dirname, 'templates', 'admin.html'));
  } else {
    res.redirect('/login');
  }
});

// 路由：设置密码
app.post('/admin/set-password', (req, res) => {
  if (!req.session.isAdmin) return res.status(403).send('无权限');
  
  const { password } = req.body;
  setPassword(password);
  res.send('密码设置成功');
});

// 路由：获取站点数据
app.get('/admin/sites', (req, res) => {
  if (!req.session.isAdmin) return res.status(403).send('无权限');
  
  const sites = JSON.parse(fs.readFileSync(sitesPath, 'utf8'));
  res.json(sites);
});

// 路由：更新站点数据
app.post('/admin/sites', (req, res) => {
  if (!req.session.isAdmin) return res.status(403).send('无权限');
  
  const sites = req.body;
  fs.writeFileSync(sitesPath, JSON.stringify(sites, null, 2));
  res.send('站点数据更新成功');
});

// 路由：获取项目数据
app.get('/admin/projects', (req, res) => {
  if (!req.session.isAdmin) return res.status(403).send('无权限');
  
  const projects = JSON.parse(fs.readFileSync(projectsPath, 'utf8'));
  res.json(projects);
});

// 路由：更新项目数据
app.post('/admin/projects', (req, res) => {
  if (!req.session.isAdmin) return res.status(403).send('无权限');
  
  const projects = req.body;
  fs.writeFileSync(projectsPath, JSON.stringify(projects, null, 2));
  res.send('项目数据更新成功');
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
