const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// 配置中间件
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));
app.use(express.static(path.join(__dirname, 'static')));

// 数据文件路径
const dataPath = path.join(__dirname, 'data.json');

// 初始化数据文件
if (!fs.existsSync(dataPath)) {
  const initialData = {
    password: null,
    sites: [
      {
        title: "博客",
        url: "https://blog.loadke.tech/",
        icon: "https://img.icons8.com/?id=87160&format=png",
        description: "记录技术日常"
      },
      // 其他初始站点数据...
    ],
    projects: [
      {
        title: "IonRh主页",
        url: "https://github.com/IonRh",
        icon: "https://img.icons8.com/fluency/48/github.png",
        description: "Github介绍页"
      },
      // 其他初始项目数据...
    ]
  };
  fs.writeFileSync(dataPath, JSON.stringify(initialData, null, 2));
}

// 读取数据
function getData() {
  return JSON.parse(fs.readFileSync(dataPath));
}

// 保存数据
function saveData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

// 首页路由
app.get('/', (req, res) => {
  const data = getData();
  const indexPath = path.join(__dirname, 'templates', 'index.html');
  let html = fs.readFileSync(indexPath, 'utf8');
  
  // 生成站点展示HTML
  let sitesHTML = '';
  data.sites.forEach(site => {
    sitesHTML += `
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
    `;
  });
  
  // 生成项目展示HTML
  let projectsHTML = '';
  data.projects.forEach(project => {
    projectsHTML += `
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
    `;
  });
  
  // 替换占位符
  html = html.replace('<!-- SITES_SECTION -->', sitesHTML);
  html = html.replace('<!-- PROJECTS_SECTION -->', projectsHTML);
  
  res.send(html);
});

// 后台登录路由
app.get('/admin', (req, res) => {
  const data = getData();
  
  // 如果已设置密码且未登录，重定向到登录页面
  if (data.password && !req.session.loggedIn) {
    res.redirect('/admin/login');
    return;
  }
  
  // 显示后台管理页面
  const adminPath = path.join(__dirname, 'templates', 'admin.html');
  let html = fs.readFileSync(adminPath, 'utf8');
  
  // 填充站点数据
  let sitesRows = '';
  data.sites.forEach((site, index) => {
    sitesRows += `
      <tr>
        <td>${index + 1}</td>
        <td><input type="text" class="form-control" name="sites[${index}][title]" value="${site.title}" required></td>
        <td><input type="url" class="form-control" name="sites[${index}][url]" value="${site.url}" required></td>
        <td><input type="url" class="form-control" name="sites[${index}][icon]" value="${site.icon}" required></td>
        <td><input type="text" class="form-control" name="sites[${index}][description]" value="${site.description}" required></td>
        <td><button type="button" class="btn btn-danger btn-sm remove-site">删除</button></td>
      </tr>
    `;
  });
  
  // 填充项目数据
  let projectsRows = '';
  data.projects.forEach((project, index) => {
    projectsRows += `
      <tr>
        <td>${index + 1}</td>
        <td><input type="text" class="form-control" name="projects[${index}][title]" value="${project.title}" required></td>
        <td><input type="url" class="form-control" name="projects[${index}][url]" value="${project.url}" required></td>
        <td><input type="url" class="form-control" name="projects[${index}][icon]" value="${project.icon}" required></td>
        <td><input type="text" class="form-control" name="projects[${index}][description]" value="${project.description}" required></td>
        <td><button type="button" class="btn btn-danger btn-sm remove-project">删除</button></td>
      </tr>
    `;
  });
  
  // 替换占位符
  html = html.replace('<!-- SITES_ROWS -->', sitesRows);
  html = html.replace('<!-- PROJECTS_ROWS -->', projectsRows);
  
  res.send(html);
});

// 后台登录页面
app.get('/admin/login', (req, res) => {
  const loginPath = path.join(__dirname, 'templates', 'login.html');
  res.sendFile(loginPath);
});

// 处理登录请求
app.post('/admin/login', (req, res) => {
  const { password } = req.body;
  const data = getData();
  
  if (password === data.password) {
    req.session.loggedIn = true;
    res.redirect('/admin');
  } else {
    res.send('<script>alert("密码错误"); window.location.href = "/admin/login";</script>');
  }
});

// 处理退出请求
app.get('/admin/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

// 处理数据保存请求
app.post('/admin/save', (req, res) => {
  const data = getData();
  
  // 检查登录状态
  if (data.password && !req.session.loggedIn) {
    res.status(401).send('未授权');
    return;
  }
  
  // 更新站点数据
  data.sites = req.body.sites || [];
  
  // 更新项目数据
  data.projects = req.body.projects || [];
  
  // 更新密码（如果提供了新密码）
  if (req.body.newPassword) {
    data.password = req.body.newPassword;
  }
  
  // 保存数据
  saveData(data);
  
  res.send('<script>alert("保存成功"); window.location.href = "/admin";</script>');
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
