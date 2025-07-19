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

// 初始化类别数据
const categoriesPath = path.join(__dirname, 'data', 'categories.json');
if (!fs.existsSync(categoriesPath)) {
  fs.writeFileSync(categoriesPath, JSON.stringify([
    {
      id: 'sites',
      name: '站点展示',
      icon: 'fas fa-globe',
      items: [
        { name: "博客", description: "记录技术日常", url: "https://blog.loadke.tech/", icon: "https://img.icons8.com/?id=87160&format=png" },
        { name: "轻API", description: "一些API接口", url: "https://api.loadke.tech", icon: "https://img.icons8.com/?id=Oz14KBnT7lnn&format=png" }
      ]
    },
    {
      id: 'projects',
      name: '项目集',
      icon: 'fas fa-cube',
      items: [
        { name: "IonRh主页", description: "Github介绍页", url: "https://github.com/IonRh", icon: "https://img.icons8.com/fluency/48/github.png" },
        { name: "本站开源主页", description: "本站的开源仓库", url: "https://github.com/IonRh/HomePage", icon: "https://img.icons8.com/fluency/48/github.png" }
      ]
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
  cookie: { secure: false }
}));

// 静态文件服务
app.use('/static', express.static(path.join(__dirname, 'static')));
app.use('/data', express.static(path.join(__dirname, 'data'), {
  setHeaders: (res) => {
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

// 路由：获取所有类别
app.get('/admin/categories', (req, res) => {
  if (!req.session.isAdmin) return res.status(403).send('无权限');
  
  const categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));
  res.json(categories);
});

// 路由：更新类别数据
app.post('/admin/categories', (req, res) => {
  if (!req.session.isAdmin) return res.status(403).send('无权限');
  
  const categories = req.body;
  fs.writeFileSync(categoriesPath, JSON.stringify(categories, null, 2));
  res.send('类别数据更新成功');
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
