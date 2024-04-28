# vod
a vod codec cms
> 一个简单的媒体编码（转码）管理系统

## 启动
- `npm run dev`
- `npm run serve`

## 配置

配置文件
- `.env`
- `src/config/index.ts`

## 转码流程

1. 媒体文件上传（切片上传，断点续传，md5校验）

2. 进行ffprobe进行媒体分析和校验

3. 根据配置的ffmpeg参数进行视频切片任务


## 功能实现说明

- 大文件分片上传

> `src\route\video.ts` 中 `uploadPart` 实现了传输控制使用 md5 进行文件校验。 使用redis进行持久控制。 


- 视频编码处理

> 依赖`ffmpeg`实现视频编码转换，`ffprobe` 来进行视频信息识别。`ffmpeg`和`ffprobe`需要自行安装并配置在环境变量中（可以直接在命令行使用ffmpeg ffprobe命令）。

- 多存储节点

> 单节点硬盘大小限制。多文件分布式存储。转码节点多节点分开工作。实现中！！！


## 依赖

[veadmin](https://github.com/penndev/veadmin)
> veadmin为本项目进行了完整的适配，本项目完成了接口部分，需要安装veadmin为后台管理客户端使用。

[ffmpeg](https://ffmpeg.org)
> 转码依赖于ffmpeg工具必须保证你运行代码的机器已经安装并可以执行ffmpeg命令和ffprobe命令
