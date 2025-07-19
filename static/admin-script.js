// 标签切换
document.addEventListener('DOMContentLoaded', function() {
    // 标签切换功能
    const tabLinks = document.querySelectorAll('.admin-sidebar li');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabLinks.forEach(link => {
        link.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // 更新活动标签
            tabLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // 显示对应内容
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(`${tabId}-section`).classList.add('active');
        });
    });
    
    // 检查密码状态
    checkPasswordStatus();
    
    // 加载站点数据
    loadSites();
    
    // 加载项目数据
    loadProjects();
    
    // 添加站点表单提交
    document.getElementById('add-site-form').addEventListener('submit', function(e) {
        e.preventDefault();
        addSite();
    });
    
    // 添加项目表单提交
    document.getElementById('add-project-form').addEventListener('submit', function(e) {
        e.preventDefault();
        addProject();
    });
    
    // 密码表单提交
    document.getElementById('password-form').addEventListener('submit', function(e) {
        e.preventDefault();
        setPassword();
    });
    
    // 模态框关闭
    document.querySelector('.close-modal').addEventListener('click', closeModal);
});

// 检查密码状态
async function checkPasswordStatus() {
    try {
        const response = await fetch('/admin/sites'); // 任意管理端点
        if (response.status === 200) {
            const config = await fetch('/data/config.json').then(res => res.json());
            const statusText = document.getElementById('status-text');
            const passwordTitle = document.getElementById('set-password-title');
            
            if (config.passwordSet) {
                statusText.textContent = '已设置';
                statusText.style.color = '#27ae60';
                passwordTitle.textContent = '修改管理员密码';
            } else {
                statusText.textContent = '未设置';
                statusText.style.color = '#e74c3c';
                passwordTitle.textContent = '设置管理员密码';
            }
        }
    } catch (error) {
        console.error('检查密码状态失败:', error);
    }
}

// 加载站点数据
async function loadSites() {
    try {
        const response = await fetch('/admin/sites');
        if (!response.ok) throw new Error('无法加载站点数据');
        
        const sites = await response.json();
        const tableBody = document.querySelector('#sites-table tbody');
        tableBody.innerHTML = '';
        
        sites.forEach((site, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${site.name}</td>
                <td>${site.description}</td>
                <td><a href="${site.url}" target="_blank">${site.url}</a></td>
                <td class="action-cell">
                    <button class="btn-edit" onclick="openEditModal('site', ${index})">
                        <i class="fas fa-edit"></i> 编辑
                    </button>
                    <button class="btn-danger" onclick="deleteItem('site', ${index})">
                        <i class="fas fa-trash"></i> 删除
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('加载站点数据失败:', error);
        alert('加载站点数据失败');
    }
}

// 加载项目数据
async function loadProjects() {
    try {
        const response = await fetch('/admin/projects');
        if (!response.ok) throw new Error('无法加载项目数据');
        
        const projects = await response.json();
        const tableBody = document.querySelector('#projects-table tbody');
        tableBody.innerHTML = '';
        
        projects.forEach((project, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${project.name}</td>
                <td>${project.description}</td>
                <td><a href="${project.url}" target="_blank">${project.url}</a></td>
                <td class="action-cell">
                    <button class="btn-edit" onclick="openEditModal('project', ${index})">
                        <i class="fas fa-edit"></i> 编辑
                    </button>
                    <button class="btn-danger" onclick="deleteItem('project', ${index})">
                        <i class="fas fa-trash"></i> 删除
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('加载项目数据失败:', error);
        alert('加载项目数据失败');
    }
}

// 添加站点
async function addSite() {
    const name = document.getElementById('site-name').value;
    const description = document.getElementById('site-description').value;
    const url = document.getElementById('site-url').value;
    const icon = document.getElementById('site-icon').value;
    
    if (!name || !description || !url || !icon) {
        alert('请填写所有字段');
        return;
    }
    
    try {
        // 获取当前站点列表
        const response = await fetch('/admin/sites');
        if (!response.ok) throw new Error('无法获取站点数据');
        
        const sites = await response.json();
        
        // 添加新站点
        sites.push({ name, description, url, icon });
        
        // 更新服务器
        const updateResponse = await fetch('/admin/sites', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(sites)
        });
        
        if (updateResponse.ok) {
            document.getElementById('add-site-form').reset();
            loadSites();
        } else {
            throw new Error('添加站点失败');
        }
    } catch (error) {
        console.error('添加站点失败:', error);
        alert('添加站点失败');
    }
}

// 添加项目
async function addProject() {
    const name = document.getElementById('project-name').value;
    const description = document.getElementById('project-description').value;
    const url = document.getElementById('project-url').value;
    const icon = document.getElementById('project-icon').value;
    
    if (!name || !description || !url || !icon) {
        alert('请填写所有字段');
        return;
    }
    
    try {
        // 获取当前项目列表
        const response = await fetch('/admin/projects');
        if (!response.ok) throw new Error('无法获取项目数据');
        
        const projects = await response.json();
        
        // 添加新项目
        projects.push({ name, description, url, icon });
        
        // 更新服务器
        const updateResponse = await fetch('/admin/projects', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(projects)
        });
        
        if (updateResponse.ok) {
            document.getElementById('add-project-form').reset();
            loadProjects();
        } else {
            throw new Error('添加项目失败');
        }
    } catch (error) {
        console.error('添加项目失败:', error);
        alert('添加项目失败');
    }
}

// 打开编辑模态框
async function openEditModal(type, index) {
    try {
        let data;
        if (type === 'site') {
            const response = await fetch('/admin/sites');
            if (!response.ok) throw new Error('无法获取站点数据');
            data = await response.json();
        } else {
            const response = await fetch('/admin/projects');
            if (!response.ok) throw new Error('无法获取项目数据');
            data = await response.json();
        }
        
        const item = data[index];
        document.getElementById('edit-type').value = type;
        document.getElementById('edit-index').value = index;
        document.getElementById('edit-name').value = item.name;
        document.getElementById('edit-description').value = item.description;
        document.getElementById('edit-url').value = item.url;
        document.getElementById('edit-icon').value = item.icon;
        
        document.getElementById('modal-title').textContent = `编辑${type === 'site' ? '站点' : '项目'}`;
        document.getElementById('edit-modal').style.display = 'flex';
        
        // 设置表单提交事件
        document.getElementById('edit-form').onsubmit = saveEdit;
    } catch (error) {
        console.error('打开编辑模态框失败:', error);
        alert('无法加载编辑数据');
    }
}

// 保存编辑
async function saveEdit(e) {
    e.preventDefault();
    
    const type = document.getElementById('edit-type').value;
    const index = document.getElementById('edit-index').value;
    const name = document.getElementById('edit-name').value;
    const description = document.getElementById('edit-description').value;
    const url = document.getElementById('edit-url').value;
    const icon = document.getElementById('edit-icon').value;
    
    try {
        let data;
        if (type === 'site') {
            const response = await fetch('/admin/sites');
            if (!response.ok) throw new Error('无法获取站点数据');
            data = await response.json();
        } else {
            const response = await fetch('/admin/projects');
            if (!response.ok) throw new Error('无法获取项目数据');
            data = await response.json();
        }
        
        // 更新数据
        data[index] = { name, description, url, icon };
        
        // 保存到服务器
        const endpoint = type === 'site' ? '/admin/sites' : '/admin/projects';
        const updateResponse = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (updateResponse.ok) {
            closeModal();
            if (type === 'site') {
                loadSites();
            } else {
                loadProjects();
            }
        } else {
            throw new Error('保存失败');
        }
    } catch (error) {
        console.error('保存编辑失败:', error);
        alert('保存编辑失败');
    }
}

// 删除项目或站点
async function deleteItem(type, index) {
    if (!confirm(`确定要删除这个${type === 'site' ? '站点' : '项目'}吗？`)) return;
    
    try {
        let data;
        if (type === 'site') {
            const response = await fetch('/admin/sites');
            if (!response.ok) throw new Error('无法获取站点数据');
            data = await response.json();
        } else {
            const response = await fetch('/admin/projects');
            if (!response.ok) throw new Error('无法获取项目数据');
            data = await response.json();
        }
        
        // 删除指定项
        data.splice(index, 1);
        
        // 保存到服务器
        const endpoint = type === 'site' ? '/admin/sites' : '/admin/projects';
        const updateResponse = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (updateResponse.ok) {
            if (type === 'site') {
                loadSites();
            } else {
                loadProjects();
            }
        } else {
            throw new Error('删除失败');
        }
    } catch (error) {
        console.error('删除失败:', error);
        alert('删除失败');
    }
}

// 设置密码
async function setPassword() {
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const message = document.getElementById('password-message');
    
    if (!newPassword || !confirmPassword) {
        message.textContent = '请填写密码和确认密码';
        message.style.color = '#e74c3c';
        return;
    }
    
    if (newPassword !== confirmPassword) {
        message.textContent = '两次输入的密码不一致';
        message.style.color = '#e74c3c';
        return;
    }
    
    if (newPassword.length < 6) {
        message.textContent = '密码长度至少为6个字符';
        message.style.color = '#e74c3c';
        return;
    }
    
    try {
        const response = await fetch('/admin/set-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password: newPassword })
        });
        
        if (response.ok) {
            message.textContent = '密码设置成功';
            message.style.color = '#27ae60';
            document.getElementById('password-form').reset();
            checkPasswordStatus();
        } else {
            message.textContent = '密码设置失败';
            message.style.color = '#e74c3c';
        }
    } catch (error) {
        console.error('设置密码失败:', error);
        message.textContent = '密码设置失败';
        message.style.color = '#e74c3c';
    }
}

// 关闭模态框
function closeModal() {
    document.getElementById('edit-modal').style.display = 'none';
}

// 全局函数导出
window.openEditModal = openEditModal;
window.deleteItem = deleteItem;
