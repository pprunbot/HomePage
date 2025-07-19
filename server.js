const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_PATH = path.join(__dirname, 'data', 'config.json');
const TEMPLATES = path.join(__dirname, 'templates');
const STATIC = path.join(__dirname, 'static');

const app = express();
const PORT = 3000;

// 中间件
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'your-secret-key', // 请替换为随机字符串
  resave: false,
  saveUninitialized: true
}));
app.use('/static', express.static(STATIC));

// 确保 config 文件存在
if (!fs.existsSync(DATA_PATH)) {
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify({
    passwordHash: null,
    sites: [],
    projects: []
  }, null, 2));
}

// 读取 / 保存
function loadConfig() {
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
}
function saveConfig(cfg) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(cfg, null, 2));
}

// 登录检查
function requireAuth(req, res, next) {
  if (req.session && req.session.authed) return next();
  res.redirect('/login');
}

// 渲染 index.html（保持不变）
app.get('/', (req, res) => {
  res.sendFile(path.join(TEMPLATES, 'index.html'));
});

// 登录页
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});
app.post('/login', async (req, res) => {
  const { password } = req.body;
  const cfg = loadConfig();

  // 如果第一次（未设置过密码），则设定它
  if (!cfg.passwordHash) {
    const hash = await bcrypt.hash(password, 10);
    cfg.passwordHash = hash;
    saveConfig(cfg);
    req.session.authed = true;
    return res.redirect('/admin');
  }

  // 已设置过，校验
  const ok = await bcrypt.compare(password, cfg.passwordHash);
  if (ok) {
    req.session.authed = true;
    res.redirect('/admin');
  } else {
    res.send('密码错误，请 <a href="/login">重试</a>');
  }
});

// 退出
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

// 后台管理主界面
app.get('/admin', requireAuth, (req, res) => {
  const cfg = loadConfig();
  res.render('admin.html', {
    sites: cfg.sites,
    projects: cfg.projects
  });
});

// 增删改站点 / 项目
app.post('/admin/action', requireAuth, (req, res) => {
  const { type, action, index, name, url, desc } = req.body;
  // type = 'site'|'project'
  const cfg = loadConfig();
  const list = (type === 'site') ? cfg.sites : cfg.projects;

  if (action === 'add') {
    list.push({ name, url, desc });
  }
  else if (action === 'delete') {
    list.splice(Number(index), 1);
  }
  else if (action === 'edit') {
    Object.assign(list[Number(index)], { name, url, desc });
  }
  saveConfig(cfg);
  res.redirect('/admin');
});

// 设置/修改后台密码
app.post('/admin/password', requireAuth, async (req, res) => {
  const { newPassword } = req.body;
  const cfg = loadConfig();
  cfg.passwordHash = await bcrypt.hash(newPassword, 10);
  saveConfig(cfg);
  res.redirect('/admin');
});

// 启用 EJS 语法渲染 HTML
app.engine('html', require('ejs').renderFile);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
