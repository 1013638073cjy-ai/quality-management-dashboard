const express = require('express')
const fs = require('node:fs/promises')
const path = require('node:path')
const { randomUUID } = require('node:crypto')

const app = express()
const PORT = Number(process.env.PORT) || 3001

// JSON 文件相当于一个简易数据库
const DB_PATH = path.join(__dirname, 'data', 'detections.json')

// 解析客户端发送的 JSON 请求体
app.use(express.json())

// 读取所有检测记录
async function readData() {
  const content = await fs.readFile(DB_PATH, 'utf-8')
  return JSON.parse(content)
}

// 将检测记录写入 JSON 文件
async function writeData(data) {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8')
}

// 验证客户端提交的检测数据
function validateDetection(body) {
  const validStatus = ['合格', '不合格', '待检测']

  if (
    !body ||
    typeof body.materialName !== 'string' ||
    !body.materialName.trim() ||
    typeof body.materialType !== 'string' ||
    !body.materialType.trim() ||
    typeof body.inspector !== 'string' ||
    !body.inspector.trim() ||
    typeof body.date !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(body.date) ||
    !validStatus.includes(body.status) ||
    (body.remark !== undefined && typeof body.remark !== 'string')
  ) {
    return false
  }

  return true
}

// 统一包装异步路由错误
function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next)
  }
}

// 1. GET：获取所有检测记录
app.get(
  '/api/detections',
  asyncHandler(async (req, res) => {
    const data = await readData()

    res.json({
      code: 0,
      message: '获取成功',
      data,
    })
  }),
)

// 2. POST：新增检测记录
app.post(
  '/api/detections',
  asyncHandler(async (req, res) => {
    if (!validateDetection(req.body)) {
      return res.status(400).json({
        code: 400,
        message: '检测记录参数不合法',
        data: null,
      })
    }

    const data = await readData()

    const newRecord = {
      id: randomUUID(),
      materialName: req.body.materialName.trim(),
      materialType: req.body.materialType.trim(),
      inspector: req.body.inspector.trim(),
      date: req.body.date,
      status: req.body.status,
      remark: req.body.remark ?? '',
    }

    data.unshift(newRecord)
    await writeData(data)

    res.status(201).json({
      code: 0,
      message: '新增成功',
      data: newRecord,
    })
  }),
)

// 3. PUT：根据 id 修改检测记录
app.put(
  '/api/detections/:id',
  asyncHandler(async (req, res) => {
    if (!validateDetection(req.body)) {
      return res.status(400).json({
        code: 400,
        message: '检测记录参数不合法',
        data: null,
      })
    }

    const data = await readData()
    const index = data.findIndex((item) => item.id === req.params.id)

    if (index === -1) {
      return res.status(404).json({
        code: 404,
        message: '检测记录不存在',
        data: null,
      })
    }

    // 保留原 id，只更新业务字段
    data[index] = {
      ...data[index],
      materialName: req.body.materialName.trim(),
      materialType: req.body.materialType.trim(),
      inspector: req.body.inspector.trim(),
      date: req.body.date,
      status: req.body.status,
      remark: req.body.remark ?? '',
    }

    await writeData(data)

    res.json({
      code: 0,
      message: '修改成功',
      data: data[index],
    })
  }),
)

// 4. DELETE：删除指定检测记录
app.delete(
  '/api/detections/:id',
  asyncHandler(async (req, res) => {
    const data = await readData()
    const index = data.findIndex((item) => item.id === req.params.id)

    if (index === -1) {
      return res.status(404).json({
        code: 404,
        message: '检测记录不存在',
        data: null,
      })
    }

    data.splice(index, 1)
    await writeData(data)

    res.json({
      code: 0,
      message: '删除成功',
      data: null,
    })
  }),
)

// ==================================
// 生产环境托管 React 构建产物
// ==================================

const DIST_PATH = path.join(__dirname, '..', 'dist')

// 提供 JS、CSS 等静态文件
app.use(
  express.static(DIST_PATH, {
    index: false,
    setHeaders: (res, filePath) => {
      if (filePath.includes(`${path.sep}assets${path.sep}`)) {
        // 哈希静态资源可以长期缓存
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
      }
    },
  }),
)

// API 不存在时返回 JSON 404
app.use('/api', (req, res) => {
  res.status(404).json({
    code: 404,
    message: '接口不存在',
    data: null,
  })
})

// React Router 子路由刷新时返回 index.html
app.use((req, res, next) => {
  if (req.method !== 'GET') return next()

  // 不存在的静态资源不返回 HTML
  if (req.path.startsWith('/assets/')) {
    return res.sendStatus(404)
  }

  res.setHeader('Cache-Control', 'no-cache')
  res.sendFile(path.join(DIST_PATH, 'index.html'))
})

// 统一处理服务器异常
app.use((err, req, res, next) => {
  console.error('服务器错误：', err)

  res.status(500).json({
    code: 500,
    message: '服务器内部错误',
    data: null,
  })
})

app.listen(PORT, () => {
  console.log(`Express 服务启动：http://localhost:${PORT}`)
})
