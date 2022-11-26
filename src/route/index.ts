import Router from "@koa/router"
import { captcha, login } from "./adminuser.js"
import { mediaList } from "./media.js"
import { taskHlsQuery, taskHlsSubmit, taskMpegtsQuery, taskMpegtsSubmit } from "./task.js"
import { uploadBefore, uploadPart } from "./upload.js"

const router = new Router({
    prefix: '/api'
})

router.get('/captcha', captcha)
router.post('/login', login)

// 处理文件列表
router.get('/media/list', mediaList)

// 分片上传媒体文件
router.post('/upload/before', uploadBefore)
router.put("/upload/part", uploadPart)

// 后台运行的队列任务
router.get('/job/hls/query', taskHlsQuery)
router.post('/job/hls/submit', taskHlsSubmit)
router.get('/job/mpegts/query', taskMpegtsSubmit )
router.post('/job/mpegts/submit', taskMpegtsQuery )

export default router