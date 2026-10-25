# ZenithOS Web Admin - 裸机操作系统Web可视化管理后台

## 项目概述
这是一个轻量级的Web管理后台，用于可视化监控和控制ZenithOS裸机操作系统。采用纯JavaScript实现，零框架依赖。

## 架构设计

### 宿主机端 (Node.js)
- ** WebSocket 服务器**: 双向实时通信
- ** HTTP 静态文件服务**: 提供前端资源
- ** 模拟串口通信**: 模拟内核日志输入

### 前端 (纯HTML/CSS/JS)
- ** 暗黑极客风格**: 深色系主题 + 霓虹效果
- ** 实时监控**: 内核日志滚动、内存使用图表
- ** 3D 网格可视化**: Canvas实现的动态网络拓扑
- ** 控制按钮**: ARP触发、清屏、系统重启

## 核心文件结构
```
zenithos-web-admin/
├── package.json          # 项目配置
├── server.js             # Node.js服务器主程序
└── public/
    ├── index.html        # 主页面
    ├── style.css         # 样式文件
    └── app.js            # 前端逻辑
```

## 安装与启动

### 1. 安装依赖
```bash
npm install
```

### 2. 启动服务器
```bash
npm start
```

### 3. 访问管理后台
```
http://localhost:3000
```

## 功能特性

### 1. 实时内核日志
- 自动滚动显示
- 按类型着色 (错误=红色，网络=蓝色，系统=绿色)
- 实时速率统计

### 2. 内存监控
- 总内存/已用内存显示
- 动态使用率图表
- 内存分页可视化

### 3. 3D网络拓扑
- 节点连线动画
- 实时状态更新
- 网格交互效果

### 4. 控制面板
- 📡 **Trigger ARP**: 模拟ARP请求数据包
- 🧹 **Clear Screen**: 清空日志缓冲区
- 🔄 **Reboot OS**: 发送重启指令

## 通信协议

### 客户端 → 服务器
```json
{
  "type": "trigger_arp"    // 触发ARP请求
  "type": "clear_screen"    // 清屏指令
  "type": "restart_os"      // 重启系统
  "type": "memory_snapshot" // 内存快照
}
```

### 服务器 → 客户端
```json
{
  "type": "kernel_log"      // 内核日志
  "data": "[...] net: ARP..."
}
{
  "type": "memory_snapshot"   // 内存数据
  "data": { ... }
}
{
  "type": "grid_status"     // 网格状态
  "data": { ... }
}
```

## 技术栈
- **后端**: Node.js + WebSocket (ws库)
- **前端**: Vanilla JavaScript + HTML5 Canvas
- **样式**: CSS3 (CSS变量 + 动画)
- **零依赖**: 除ws外的所有组件自定义实现

## 扩展建议

### 真实串口集成
将模拟串口替换为实际串口通信库：
```javascript
// 使用 node-serialport 库
const SerialPort = require('serialport');
const ReadLine = require('@serialport/parser-readline');
```

### 增强功能
- 文件系统浏览器
- 进程管理界面
- 网络配置面板
- 系统性能 profiling

## 注意事项
- 当前使用模拟日志生成器，实际使用时需连接真实串口
- WebSocket自动重连机制最多5次重试
- 内存图表和3D动画使用requestAnimationFrame刷新
- 日志缓冲区限制100条防止内存泄漏

## 开发服务器
开发模式下运行，自动监听文件变化：
```bash
npm run dev
```

## 许可证
MIT License - ZenithOS Team
