const express = require("express");
const http = require('http');
const WebSocket = require('ws');
const app = express();
const port = 3000;

// 创建HTTP服务器
const server = http.createServer(app);

// 创建WebSocket服务器
const wss = new WebSocket.Server({ server });

app.use(express.static("public"));

// 标准 SSE 实现
app.get("/sse", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let count = 0;

  const interval = setInterval(() => {
    count++;
    res.write(`data: ${JSON.stringify({ time: new Date(), count })}\n\n`);
    if (count >= 5) {
      clearInterval(interval);
      res.end();
    }
  }, 1000);
});

// 自定义 Streamable HTTP 实现（仿 OpenAI）
app.get("/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream"); // 也可以是 text/plain
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let count = 0;

  const interval = setInterval(() => {
    count++;
    res.write(`data: ${JSON.stringify({ message: `chunk ${count}` })}\n`); // SSE 标准要求每条消息必须以 \n\n （两个换行符）结尾 ，这是 SSE 协议的强制要求！
    if (count >= 5) {
      res.write(`data: [DONE]\n`);
      clearInterval(interval);
      res.end();
    }
  }, 1000);
});

// WebSocket 连接处理
wss.on('connection', (ws) => {
  console.log('WebSocket 客户端已连接');
  
  let count = 0;
  
  const interval = setInterval(() => {
    count++;
    
    // 发送JSON格式的消息
    ws.send(JSON.stringify({ 
      type: 'message',
      data: { message: `WebSocket chunk ${count}` },
      timestamp: new Date().toISOString()
    }));
    
    if (count >= 5) {
      // 发送结束消息
      ws.send(JSON.stringify({ 
        type: 'done',
        message: 'WebSocket 数据发送完毕'
      }));
      clearInterval(interval);
      ws.close();
    }
  }, 1000);
  
  // 处理客户端断开连接
  ws.on('close', () => {
    console.log('WebSocket 客户端已断开');
    clearInterval(interval);
  });
  
  // 处理错误
  ws.on('error', (error) => {
    console.error('WebSocket 错误:', error);
    clearInterval(interval);
  });
});

// 使用HTTP服务器而不是直接使用app
server.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
