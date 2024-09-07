# vod
A Vod Codec Admin CMS

> 一个简单的视频编码（转码）管理系统

## 配置

配置文件

- `.env`
- `src/config/index.ts` | 参数校验

## 启动

**开发启动**
- `npm run dev`

## 文件管理
> 媒体文件管理包含上传、编辑、预览、删除、等操作。

包含以下核心功能：
- 上传功能
  - 文件秒传
  - 切片上传
  - 断点续传
  - 文件校验
- 媒体分析
  - 文件大小
  - 视频分辨率
  - 视频FPS
- 预览功能
  - videojs 在线播放器预览
  - Range 实现http range功能，范围预览视频
- 多节点存储
  - 公网单独上传节点
  - 局域网IP获取文件

## 视频转码
> 用nodejs封装ffmpeg命令，依赖`ffmpeg`实现视频编码转换，`ffprobe` 来进行视频信息识别。`ffmpeg`和`ffprobe`需要自行安装并配置在 **环境变量** 中（可以直接在命令行使用ffmpeg ffprobe命令）

基于rabbitmq进行异步队列处理



## 依赖
- [veadmin](https://github.com/penndev/veadmin)
    > veadmin为本项目进行了完整的适配，本项目完成了接口部分，需要安装veadmin为后台管理客户端使用。

- [ffmpeg](https://ffmpeg.org)
    > 转码依赖于ffmpeg工具必须保证你运行代码的机器已经安装并可以执行ffmpeg命令和ffprobe命令
