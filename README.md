# vod

a vod codec cms

> 一个简单的在线编码（转码）后台管理系统

## 启动

- `npm run dev`

- `npm run serve`

## 配置

配置文件
- `.env`
- `src/config/index.ts`


## 转码流程

1. 视频文件上传前检查（断点续传）

2. 上传文件分片（切片上传）

3. 文件分片上传完成进行合并和MD5校验（文件校验）

4. 进行ffprobe进行媒体分析

5. 根据配置的ffmpeg参数进行视频切片


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

## 常用命令

- ffmpeg mp4转码为hls

> `ffmpeg -i in.mp4 -vcodec libx264 -acodec aac -hls_list_size 0 -hls_time 30 -hls_enc 1 -hls_enc_key 0123456789abcdef out.m3u8`

- hls标签备注

> `#EXT-X-DISCONTINUITY` -声明不连续

> `#EXT-X-KEY:METHOD=NONE` -声明不加密