const fs = require('fs') //文件模块
const async = require('async') //异步模块
const uuid = require('uuid') //uuid标识
const bodyParser = require('body-parser') //打印参数
const express = require('express')
const app = express()

app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({ extended: false }))
// app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
// app.use(bodyParser.json())
// app.use(express.static('public'))

//设置监听端口
app.listen(3000)

app.post('/upload', function (req, res) {
  const fileObj = req.body
  const name = fileObj.name //文件名称
  const index = fileObj.index //当前片数
  const total = fileObj.total //总片数

  const dirPath = __dirname + '/../../study_data/temp' // 切片临时存储位置
  const url =
    dirPath + '/' + name.split('.')[0] + '_' + index + '.' + name.split('.')[1] //临时文件切片名

  try {
    //判断是否最后一个文件
    if (index == total) {
      const bf = Buffer.from(fileObj['data'])
      fs.writeFileSync(url, bf)

      //生成唯一uuid
      const uid = uuid.v4()
      fs.mkdirSync(__dirname + '/../../study_data/uploadFiles' + uid) //创建uuid文件夹

      const pathname =
        __dirname + '/../../study_data/uploadFiles' + uid + '/' + name //上传文件保存名称

      let writeStream = fs.createWriteStream(pathname) //创建可写流
      let aname = []
      for (let i = 1; i <= total; i++) {
        const url =
          dirPath +
          '/' +
          name.split('.')[0] +
          '_' +
          i +
          '.' +
          name.split('.')[1]
        aname.push(url)
      }
      // console.log(aname)

      async.eachLimit(
        aname,
        1,
        (item, callback) => {
          // item 当前文件片路径， callback为回调函数
          fs.readFile(item, function (err, data) {
            if (err) throw err
            // 利用stream边读边写
            writeStream.write(data)
            // 删除生成临时bolb文件
            fs.unlink(item, function () {
              console.log('成功删除temp临时文件片')
            })
            console.log(`当前操作第${item}文件`)

            callback() //callback迭代回调
          })
        },
        (err) => {
          if (err) throw err
          // 后面文件写完，关闭可写流文件，文件已经成生完成
          // 这里同时有两种方式进行文件合并
          // 第一种，是关闭流，由于利用stream是边读边写的，对内存友好
          writeStream.end()
          //返回给客服端，上传成功
          console.log('数据合并完成')
          const data = { code: 0, message: 'upload sucess' }
          res.send(data)
        }
      )
      //这里定时，是做异步串行，等上执行完后，再执行下面
      setTimeout(function () {
        //所有二进制文件片段 装进aname数组
        // let writeStream = fs.createWriteStream(pathname) //创建可写流
        // async.eachLimit进行同步处理
        // async.eachLimit(
        //   aname,
        //   1,
        //   (item, callback) => {
        //     // item 当前文件片路径， callback为回调函数
        //     fs.readFile(item, function (err, data) {
        //       if (err) throw err
        //       // 利用stream边读边写
        //       writeStream.write(data)
        //       // 删除生成临时bolb文件
        //       fs.unlink(item, function () {
        //         console.log('成功删除temp临时文件片')
        //       })
        //      callback();
        //       console.log(`当前操作第${item}文件`)
        //     })
        //   },
        //   function (err) {
        //     if (err) throw err
        //     // 后面文件写完，关闭可写流文件，文件已经成生完成
        //     // 这里同时有两种方式进行文件合并
        //     // 第一种，是关闭流，由于利用stream是边读边写的，对内存友好
        //     writeStream.end()
        //     //返回给客服端，上传成功
        //     const data = { code: 0, message: 'upload sucess' }
        //     res.send(data)
        //   }
        // )
      }, 50)
    } else {
      //判断非最后一段数据

      let bf = Buffer.from(fileObj['data']) //转为二进制流
      fs.writeFileSync(url, bf) //写入文件

      //返回继续上传
      let data = JSON.stringify({ code: 1, msg: '继续上传' })
      //   res.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8' })
      res.send(data)
    }
  } catch (err) {
    console.log(err)
  }
})

app.post('/post', function (req, res) {
  console.log(`req.body ${JSON.stringify(req.body)}`)
  res.send({ code: 0, message: 'test good' })
})
