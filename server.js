#!/usr/bin/env node
/**
 * ZenithOS Web Management Server
 * 裸机操作系统Web可视化管理后台 - 宿主机端服务器
 * 
 * 功能：
 * - HTTP 静态文件服务
 * - WebSocket 双向通信
 * - 模拟串口通信
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// WebSocket 服务器
const WebSocket = require('ws');

// 配置
const PORT = process.env.PORT || 3000;
constSimulatedSerialPort = '/dev/ttyUSB0'; // 模拟端口

// 模拟串口状态
const serialPort = {
  name: '/dev/ttyUSB0',
  isOpen: false,
  baudRate: 115200,
  buffer: '',
};

// 内存状态模拟
const memoryState = {
  pages: [
    { id: 0, status: 'free', usage: 0 },
    { id: 1, status: 'used', usage: 45 },
    { id: 2, status: 'used', usage: 78 },
    { id: 3, status: 'free', usage: 0 },
    { id: 4, status: 'used', usage: 32 },
    { id: 5, status: 'used', usage: 89 },
    { id: 6, status: 'free', usage: 0 },
    { id: 7, status: 'used', usage: 56 },
  ],
  total: 1024, // MB
  used: 0,
};

// 更新内存使用率
function updateMemoryUsage() {
  const totalUsed = memoryState.pages.reduce((sum, page) => sum + page.usage, 0);
  memoryState.used = totalUsed;
  return memoryState;
}

// 模拟内核日志生成器
const kernelLogGenerator = {
  logs: [
    '[ kernels/net.c:124] net: ARP who-has 192.168.1.1 tell 192.168.1.100',
    '[ kernels/traps.c:89] Trap: Double fault at 0x0000:0xf7c0e9c0',
    '[ fs/vfs.c:234] VFS: Mounting ext2 on /dev/sda1',
    '[ mm/page.c:156] Page fault at 0x00456789: read access',
    '[ scheduler.c:78] Task scheduler: switched to PID 42',
    '[ dev/uart.c:67] COM1: Received interrupt',
    '[ net/tcp.c:234] TCP: Connection established to 10.0.0.1:80',
    '[ mm/heap.c:123] Heap allocated 4096 bytes',
    '[ kernels/process.c:89] Process crab terminated: exit code 0',
    '[ dev/pci.c:156] PCI Device: Intel Corporation 82574L (eth0)',
  ],

  getRandomLog() {
    const randomIndex = Math.floor(Math.random() * this.logs.length);
    const timestamp = new Date().toISOString().substr(11, 12);
    return `[${timestamp}] ${this.logs[randomIndex]}`;
  },

  start() {
    this.interval = setInterval(() => {
      const log = this.getRandomLog();
      console.log(log);
      // 发送到所有WebSocket客户端
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'kernel_log', data: log }));
        }
      });
    }, 2000 + Math.random() * 3000); // 随机间隔
  },

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
};

// HTTP 服务器
const server = http.createServer((req, res) => {
  // 静态文件服务
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(__dirname, 'public', filePath);
  
  const extname = path.extname(filePath);
  const contentTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
  };

  const contentType = contentTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('File not found');
      } else {
        res.writeHead(500);
        res.end('Server error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

// WebSocket 服务器
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('Client connected');

  // 发送初始内存状态
  ws.send(JSON.stringify({ type: 'memory_init', data: updateMemoryUsage() }));

  // 发送3D网格状态
  ws.send(JSON.stringify({ type: 'grid_status', data: { 
    nodes: 8, 
    connection: 'active',
    timestamp: Date.now()
  }}));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('Received:', data);

      switch (data.type) {
        case 'trigger_arp':
          // 模拟ARP请求
          setTimeout(() => {
            const arpLog = `[${new Date().toISOString().substr(11, 12)}] net: ARP request: who-has 192.168.1.${Math.floor(Math.random() * 254) + 1} tell 192.168.1.100`;
            wss.clients.forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'kernel_log', data: arpLog }));
              }
            });
          }, 500);
          break;

        case 'clear_screen':
          // 发送清屏指令
          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ type: 'clear_screen' }));
            }
          });
          break;

        case 'restart_os':
          // 模拟系统重启
          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ 
                type: 'system_restart',
                data: 'Rebooting ZenithOS...'
              }));
            }
          });
          break;

        case 'memory_snapshot':
          updateMemoryUsage();
          ws.send(JSON.stringify({ type: 'memory_snapshot', data: memoryState }));
          break;

        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// 启动服务器
server.listen(PORT, () => {
  console.log(`ZenithOS Web Server running at http://localhost:${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}`);
  
  // 启动模拟日志生成器
  kernelLogGenerator.start();
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  kernelLogGenerator.stop();
  wss.clients.forEach(client => client.close());
  wss.close();
  server.close(() => {
    process.exit(0);
  });
});
