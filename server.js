const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3000;

// 绝对路径定义
const DATA_PATH   = path.join(__dirname, 'data', 'config.json');
const STATIC_DIR  = path.join(__dirname, 'static');
const VIEWS_DIR   = path.join(__dirname, 'views');
const TPL_DIR     = path.join(__dirname, 'templates');

// 中间件
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: '请替换成你自己的随机字符串',
  resave: false,
  saveUninitialized: true
}));
app.use('/static', express.static(STATIC_DIR));

// 确保 config.json 存在
if (!fs.existsSync(DATA_PATH)) {
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify({
    passwordHash: null,
    sites: [],
    projects: []
  }, null, 2), 'utf8');
}

// 读写配置
function loadConfig() {
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
}
function saveConfig(cfg) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(cfg, null, 2), 'utf8');
}

// 登录校验中间件
function requireAuth(req, res, next) {
  if (req.session && req.session.authed) return next();
  res.redirect('/login');
}

// 主页（直接返回静态 templates/index.html）
app.get('/', (req, res) => {
  res.sendFile(path.join(TPL_DIR, 'index.html'));
});

// 登录页
app.get('/login', (req, res) => {
  res.sendFile(path.join(VIEWS_DIR, 'login.html'));
});
app.post('/login', async (req, res) => {
  const { password } = req.body;
  const cfg = loadConfig();

  // 首次设置密码
  if (!cfg.passwordHash) {
    cfg.passwordHash = await bcrypt.hash(password, 10);
    saveConfig(cfg);
    req.session.authed = true;
    return res.redirect('/admin');
  }

  // 校验已有密码
  const ok = await bcrypt.compare(password, cfg.passwordHash);
  if (ok) {
    req.session.authed = true;
    res.redirect('/admin');
  } else {
    res.send('密码错误，请 <a href="/login">重试</a>');
  }
});

// 注销
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

// 后台首页
app.get('/admin', requireAuth, (req, res) => {
  const cfg = loadConfig();
  // 使用 EJS 渲染 admin.html
  res.render('admin.html', {
    sites: cfg.sites,
    projects: cfg.projects
  });
});

// 增删改站点 & 项目
app.post('/admin/action', requireAuth, (req, res) => {
  const { type, action, index, name, url, desc } = req.body;
  const cfg = loadConfig();
  const list = (type === 'site') ? cfg.sites : cfg.projects;

  if (action === 'add') {
    list.push({ name, url, desc });
  } else if (action === 'delete') {
    list.splice(Number(index), 1);
  } else if (action === 'edit') {
    Object.assign(list[Number(index)], { name, url, desc });
  }

  saveConfig(cfg);
  res.redirect('/admin');
});

// 修改后台密码
app.post('/admin/password', requireAuth, async (req, res) => {
  const { newPassword } = req.body;
  const cfg = loadConfig();
  cfg.passwordHash = await bcrypt.hash(newPassword, 10);
  saveConfig(cfg);
  res.redirect('/admin');
});

// 设置视图引擎
app.engine('html', require('ejs').renderFile);
app.set('views', VIEWS_DIR);
app.set('view engine', 'html');

app.listen(PORT, () => {
  console.log(`Server listening: http://localhost:${PORT}`);
});
