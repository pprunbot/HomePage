document.addEventListener('DOMContentLoaded', function() {
    // 添加时间戳防止缓存
    const timestamp = new Date().getTime();
    
    // 加载站点数据
    fetch(`/data/sites.json?t=${timestamp}`)
        .then(response => response.json())
        .then(sites => {
            renderSites(sites);
        })
        .catch(error => {
            console.error('加载站点数据失败:', error);
            renderDefaultSites();
        });
    
    // 加载项目数据
    fetch(`/data/projects.json?t=${timestamp}`)
        .then(response => response.json())
        .then(projects => {
            renderProjects(projects);
        })
        .catch(error => {
            console.error('加载项目数据失败:', error);
            renderDefaultProjects();
        });
});

function renderSites(sites) {
    const container = document.getElementById('sites-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    sites.forEach(site => {
        const siteElement = createSiteElement(site);
        container.appendChild(siteElement);
    });
}

function createSiteElement(site) {
    const link = document.createElement('a');
    link.href = site.url;
    link.target = '_blank';
    link.className = 'site-link btn-effect';
    link.title = site.description;
    
    link.innerHTML = `
        <div class="site-card">
            <div class="site-icon">
                <img src="${site.icon}" alt="${site.name}" onerror="this.src='https://via.placeholder.com/48'">
            </div>
            <div class="site-info">
                <h3>${site.name}</h3>
                <p>${site.description}</p>
            </div>
        </div>
    `;
    
    return link;
}

function renderProjects(projects) {
    const container = document.getElementById('projects-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    projects.forEach(project => {
        const projectElement = createProjectElement(project);
        container.appendChild(projectElement);
    });
}

function createProjectElement(project) {
    const link = document.createElement('a');
    link.href = project.url;
    link.target = '_blank';
    link.className = 'project-link btn-effect';
    link.title = project.description;
    
    link.innerHTML = `
        <div class="project-card">
            <div class="project-icon">
                <img src="${project.icon}" alt="${project.name}" onerror="this.src='https://via.placeholder.com/48'">
            </div>
            <div class="project-info">
                <h3>${project.name}</h3>
                <p>${project.description}</p>
            </div>
        </div>
    `;
    
    return link;
}

// 默认内容（如果动态加载失败时使用）
function renderDefaultSites() {
    const container = document.getElementById('sites-container');
    if (!container) return;
    
    container.innerHTML = `
        <a href="http://localhost:3000/" target="_blank" class="site-link btn-effect">
            <div class="site-card">
                <div class="site-icon">
                    <img src="https://img.icons8.com/?id=87160&format=png" alt="博客">
                </div>
                <div class="site-info">
                    <h3>博客</h3>
                    <p>记录技术日常</p>
                </div>
            </div>
        </a>
        <a href="http://localhost:3000/" target="_blank" class="site-link btn-effect">
            <div class="site-card">
                <div class="site-icon">
                    <img src="https://img.icons8.com/?id=Oz14KBnT7lnn&format=png" alt="API站">
                </div>
                <div class="site-info">
                    <h3>轻API</h3>
                    <p>API-test</p>
                </div>
            </div>
        </a>
        <a href="http://localhost:3000/" target="_blank" class="site-link btn-effect">
            <div class="site-card">
                <div class="site-icon">
                    <img src="https://img.icons8.com/?id=13682&format=png" alt="Cloudflare-test">
                </div>
                <div class="site-info">
                    <h3>Cloudflare-test</h3>
                    <p>Cloudflare-test</p>
                </div>
            </div>
        </a>
        <a href="http://localhost:3000/" target="_blank" class="site-link btn-effect">
            <div class="site-card">
                <div class="site-icon">
                    <img src="https://img.icons8.com/?id=115369&format=png" alt="Github-Jsdlier-Docker">
                </div>
                <div class="site-info">
                    <h3>test</h3>
                    <p>test</p>
                </div>
            </div>
        </a>
        <a href="http://localhost:3000/" target="_blank" class="site-link btn-effect">
            <div class="site-card">
                <div class="site-icon">
                    <img src="https://img.icons8.com/?id=h57OOadmEz64&format=png" alt="Google 翻译">
                </div>
                <div class="site-info">
                    <h3>Google 翻译</h3>
                    <p>Google 翻译</p>
                </div>
            </div>
        </a>
    `;
}

function renderDefaultProjects() {
    const container = document.getElementById('projects-container');
    if (!container) return;
    
    container.innerHTML = `
        <a href="https://github.com/pprunbot/" target="_blank" class="project-link btn-effect">
            <div class="project-card">
                <div class="project-icon">
                    <img src="https://img.icons8.com/fluency/48/github.png" alt=""pprunbot主页">
                </div>
                <div class="project-info">
                    <h3>"pprunbot主页</h3>
                    <p>Github介绍页</p>
                </div>
            </div>
        </a>
        <a href="https://github.com/pprunbot/HomePage/" target="_blank" class="project-link btn-effect">
            <div class="project-card">
                <div class="project-icon">
                    <img src="https://img.icons8.com/fluency/48/github.png" alt="pprunbot主题">
                </div>
                <div class="project-info">
                    <h3>本站开源主页</h3>
                    <p>本站的开源仓库</p>
                </div>
            </div>
        </a>
        <a href="https://github.com/pprunbot/IOS_Shared" target="_blank" class="project-link btn-effect">
            <div class="project-card">
                <div class="project-icon">
                    <img src="https://img.icons8.com/fluency/48/github.png" alt="小火箭共享">
                </div>
                <div class="project-info">
                    <h3>小火箭共享</h3>
                    <p>Shadowrocket共享</p>
                </div>
            </div>
        </a>
        <a href="https://github.com/pprunbot/uptime-jk" target="_blank" class="project-link btn-effect">
            <div class="project-card">
                <div class="project-icon">
                    <img src="https://img.icons8.com/fluency/48/github.png" alt="心跳监控">
                </div>
                <div class="project-info">
                    <h3>网站心跳监控</h3>
                    <p>网站心跳监控</p>
                </div>
            </div>
        </a>
    `;
}
