/**
 * ZenithOS Web Admin - Frontend Control
 * 裸机操作系统Web管理后台 - 前端逻辑
 */

class ZenithOSAdmin {
  constructor() {
    this.ws = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000;
    this.logCount = 0;
    this.startTime = Date.now();
    this.lastLogTime = Date.now();
    this.logRate = 0;

    this.init();
  }

  init() {
    this.cacheElements();
    this.bindEvents();
    this.connect();
    this.startUIAnimations();
  }

  cacheElements() {
    // 连接状态
    this.statusIndicator = document.getElementById('status-indicator');
    this.connectionText = document.getElementById('connection-text');
    this.footerConnection = document.getElementById('footer-connection');

    // 日志窗口
    this.logWindow = document.getElementById('log-window');
    this.logContent = document.getElementById('log-content');
    this.lineCount = document.getElementById('line-count');
    this.logRate = document.getElementById('log-rate');

    // 内存监控
    this.memoryTotal = document.getElementById('memory-total');
    this.memoryUsed = document.getElementById('memory-used');
    this.memoryUsage = document.getElementById('memory-usage');
    this.memoryChart = document.getElementById('memory-chart');

    // 3D网格
    this.gridCanvas = document.getElementById('grid-canvas');
    this.gridNodes = document.getElementById('grid-nodes');
    this.gridTimestamp = document.getElementById('grid-timestamp');
    this.gridStatus = document.getElementById('grid-status');

    // 按钮
    this.triggerArpBtn = document.getElementById('trigger-arp');
    this.clearScreenBtn = document.getElementById('clear-screen');
    this.restartOsBtn = document.getElementById('restart-os');
    this.memoryRefreshBtn = document.getElementById('memory-refresh');

    // 底部状态
    this.uptime = document.getElementById('uptime');
  }

  bindEvents() {
    this.triggerArpBtn.addEventListener('click', () => this.sendCommand({ type: 'trigger_arp' }));
    this.clearScreenBtn.addEventListener('click', () => this.sendCommand({ type: 'clear_screen' }));
    this.restartOsBtn.addEventListener('click', () => this.sendCommand({ type: 'restart_os' }));
    this.memoryRefreshBtn.addEventListener('click', () => this.sendCommand({ type: 'memory_snapshot' }));
  }

  connect() {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}`;

    console.log('Connecting to:', wsUrl);
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.connected = true;
      this.reconnectAttempts = 0;
      this.updateConnectionStatus('connected');
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleMessage(data);
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.connected = false;
      this.updateConnectionStatus('disconnected');
      this.attemptReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.updateConnectionStatus('error');
    };
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectInterval * this.reconnectAttempts);
    } else {
      console.error('Max reconnect attempts reached');
      this.updateConnectionText('Max retries exceeded');
    }
  }

  sendCommand(command) {
    if (!this.connected || !this.ws) {
      console.error('Not connected to server');
      this.showSystemMessage('Error: Not connected to ZenithOS', 'error');
      return;
    }

    try {
      this.ws.send(JSON.stringify(command));
      console.log('Sent:', command);
    } catch (error) {
      console.error('Error sending command:', error);
      this.showSystemMessage('Error sending command', 'error');
    }
  }

  handleMessage(data) {
    switch (data.type) {
      case 'kernel_log':
        this.addLogLine(data.data, 'kernel');
        break;

      case 'clear_screen':
        this.clearLogs();
        break;

      case 'memory_init':
      case 'memory_snapshot':
        this.updateMemoryUI(data.data);
        break;

      case 'grid_status':
        this.updateGridUI(data.data);
        break;

      case 'system_restart':
        this.showSystemMessage('Restarting ZenithOS...', 'system');
        break;

      default:
        console.log('Unknown message type:', data.type);
    }
  }

  addLogLine(text, type = 'kernel') {
    const logLine = document.createElement('div');
    logLine.className = `log-line ${type}`;
    logLine.textContent = text;
    
    this.logContent.appendChild(logLine);
    this.logCount++;
    this.lineCount.textContent = this.logCount;

    // 自动滚动到底部
    this.logWindow.scrollTop = this.logWindow.scrollHeight;

    // 更新日志速率
    const now = Date.now();
    if (now - this.lastLogTime >= 1000) {
      this.logRate = this.logCount;
      this.lastLogTime = now;
      this.logRate.textContent = this.logRate;
      this.logCount = 0;
    }

    // 限制日志条目数量，防止内存溢出
    if (this.logContent.children.length > 100) {
      this.logContent.removeChild(this.logContent.firstChild);
    }
  }

  clearLogs() {
    this.logContent.innerHTML = '';
    this.logCount = 0;
    this.lineCount.textContent = '0';
    this.logRate.textContent = '0';
    this.showSystemMessage('Console cleared', 'system');
  }

  updateMemoryUI(data) {
    const total = data.total;
    const used = data.used;
    const usage = ((used / total) * 100).toFixed(1);

    this.memoryTotal.textContent = `${total} MB`;
    this.memoryUsed.textContent = `${used} MB`;
    this.memoryUsage.textContent = `${usage}%`;

    // 更新颜色根据使用率
    if (usage < 50) {
      this.memoryUsed.style.color = 'var(--accent-green)';
      this.memoryUsage.style.color = 'var(--accent-green)';
    } else if (usage < 80) {
      this.memoryUsed.style.color = 'var(--accent-orange)';
      this.memoryUsage.style.color = 'var(--accent-orange)';
    } else {
      this.memoryUsed.style.color = 'var(--accent-red)';
      this.memoryUsage.style.color = 'var(--accent-red)';
    }

    // 更新内存图表
    this.renderMemoryChart(data.pages);
  }

  renderMemoryChart(pages) {
    const ctx = this.memoryChart.getContext('2d');
    const canvas = this.memoryChart;
    const width = canvas.width = canvas.offsetWidth;
    const height = canvas.height = canvas.offsetHeight;

    ctx.clearRect(0, 0, width, height);

    const barWidth = (width / pages.length) * 0.8;
    const gap = 4;
    const startX = (width - (pages.length * barWidth + (pages.length - 1) * gap)) / 2;

    pages.forEach((page, index) => {
      const barHeight = (page.usage / 100) * height;
      const x = startX + index * (barWidth + gap) + gap / 2;
      const y = height - barHeight;

      // 渐变色
      const gradient = ctx.createLinearGradient(x, y, x, height);
      if (page.status === 'free') {
        gradient.addColorStop(0, '#2a2a3a');
        gradient.addColorStop(1, '#3a3a4a');
      } else {
        gradient.addColorStop(0, '#00d4ff');
        gradient.addColorStop(1, '#0078ff');
      }

      // 绘制条形
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);

      // 边框
      ctx.strokeStyle = '#00d4ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, barWidth, barHeight);

      // 使用率标签
      if (page.status === 'used') {
        ctx.fillStyle = '#fff';
        ctx.font = '10px Consolas';
        ctx.textAlign = 'center';
        ctx.fillText(`${page.usage}%`, x + barWidth / 2, y - 5);
      }
    });

    // 绘制Y轴和标签
    ctx.strokeStyle = '#404050';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(startX - 10, 0);
    ctx.lineTo(startX - 10, height);
    ctx.stroke();

    ctx.fillStyle = '#808090';
    ctx.font = '10px Consolas';
    ctx.textAlign = 'right';
    ctx.fillText('100%', startX - 15, 12);
    ctx.fillText('50%', startX - 15, height / 2 + 4);
    ctx.fillText('0%', startX - 15, height - 4);
  }

  updateGridUI(data) {
    this.gridNodes.textContent = data.nodes;
    this.gridTimestamp.textContent = new Date(data.timestamp).toLocaleTimeString();

    // 启动3D网格动画
    this.render3DGrid();
  }

  render3DGrid() {
    const canvas = this.gridCanvas;
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth;
    const height = canvas.height = canvas.offsetHeight;

    // 清除画布
    ctx.clearRect(0, 0, width, height);

    // 3D网格效果
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.3;

    // 绘制节点
    const numNodes = 8;
    const节点 = [];

    for (let i = 0; i < numNodes; i++) {
      const angle = (i / numNodes) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      节点.push({ x, y, angle, speed: 0.002 + Math.random() * 0.002 });
    }

    // 动画
    const animate = () => {
      if (!this.connected) return;

      ctx.clearRect(0, 0, width, height);

      // 绘制连线
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 节点.length; i++) {
        const current = 节点[i];
        const next = 节点[(i + 1) % 节点.length];
        ctx.moveTo(current.x, current.y);
        ctx.lineTo(next.x, next.y);
      }
      ctx.stroke();

      // 绘制节点
      节点.forEach(节点 => {
        // 外发光
        const gradient = ctx.createRadialGradient(节点.x, 节点.y, 0, 节点.x, 节点.y, 15);
        gradient.addColorStop(0, 'rgba(0, 212, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 212, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(节点.x, 节点.y, 15, 0, Math.PI * 2);
        ctx.fill();

        // 节点核心
        ctx.fillStyle = '#00d4ff';
        ctx.beginPath();
        ctx.arc(节点.x, 节点.y, 6, 0, Math.PI * 2);
        ctx.fill();

        // 旋转角度
        节点.angle += 节点.speed;
        节点.x = centerX + Math.cos(节点.angle) *半径;
        节点.y = centerY + Math.sin(节点.angle) *半径;
      });

      requestAnimationFrame(animate);
    };

    animate();
  }

  updateConnectionStatus(status) {
    switch (status) {
      case 'connected':
        this.statusIndicator.classList.add('connected');
        this.updateConnectionText('Connected');
        this.showSystemMessage('Connected to ZenithOS kernel', 'success');
        break;

      case 'disconnected':
        this.statusIndicator.classList.remove('connected');
        this.updateConnectionText('Disconnected');
        this.showSystemMessage('Disconnected from ZenithOS', 'warn');
        break;

      case 'error':
        this.statusIndicator.classList.remove('connected');
        this.updateConnectionText('Error');
        this.showSystemMessage('Connection error', 'error');
        break;
    }
  }

  updateConnectionText(text) {
    this.connectionText.textContent = text;
    this.footerConnection.textContent = text;
  }

  showSystemMessage(message, type = 'system') {
    const logLine = document.createElement('div');
    logLine.className = `log-line ${type}`;
    logLine.textContent = `[SYSTEM] ${message}`;
    this.logContent.appendChild(logLine);
    this.logWindow.scrollTop = this.logWindow.scrollHeight;

    // 限制系统消息数量
    if (this.logContent.children.length > 100) {
      this.logContent.removeChild(this.logContent.firstChild);
    }
  }

  startUIAnimations() {
    // 启动运行时动画
    setInterval(() => {
      const uptime = Math.floor((Date.now() - this.startTime) / 1000);
      this.uptime.textContent = `${uptime}s`;
    }, 1000);

    // 启动内存数据自动更新
    setInterval(() => {
      if (this.connected) {
        this.sendCommand({ type: 'memory_snapshot' });
      }
    }, 3000);
  }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  window.admin = new ZenithOSAdmin();
});
