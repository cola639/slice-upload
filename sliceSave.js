const fs = require('fs') //文件模块
const async = require('async') //异步模块

let dirPath = __dirname + '/../uploadFiles/tep/' // 切片的临时存储
let index = req.body['index'] //当前片数
let total = req.body['total'] //总片数
let name = req.body['name'] //文件名称

let url =
  dirPath + '/' + name.split('.')[0] + '_' + index + '.' + name.split('.')[1] //临时bolb文件新名字

try {
  //判断是否最后一个文件,
  if (index == total) {
    //检查文件是存在，如果存在，重新设置名称

    let bf = Buffer.from(req.body['data'])
    let uid = uuid.v4()
    fs.writeFileSync(url, bf)
    fs.mkdirSync(__dirname + '/../uploadFiles/' + uid)

    let pathname = __dirname + '/../uploadFiles/' + uid + '/' + name //上传文件存放位置和名称
    //这里定时，是做异步串行，等上执行完后，再执行下面
    setTimeout(function () {
      let writeStream = fs.createWriteStream(pathname)
      let aname = []
      //所有二进制文件片段 组合进aname数组
      for (let i = 1; i <= total; i++) {
        let url =
          dirPath +
          '/' +
          name.split('.')[0] +
          '_' +
          i +
          '.' +
          name.split('.')[1]
        aname.push(url)
      }

      // async.eachLimit进行同步处理
      async.eachLimit(
        aname,
        1,
        function (item, callback) {
          // item 当前路径， callback为回调函数
          fs.readFile(item, function (err, data) {
            if (err) throw err
            // 把数据写入流里，这里有两种方式
            // 第一种是利用stream边读边写，这种方式相对于第二种对于内存更加友好
            writeStream.write(data)

            // 删除生成临时bolb文件
            fs.unlink(item, function () {
              console.log('删除成功')
            })
            // callback()
          })
        },
        function (err) {
          if (err) throw err
          // 后面文件写完，关闭可写流文件，文件已经成生完成
          // 这里同时有两种方式进行文件合并
          // 第一种，是关闭流，由于利用stream是边读边写的，对内存友好
          writeStream.end()
          //返回给客服端，上传成功
          let data = JSON.stringify({
            code: 0,
            data: {
              source_store_id: uid,
              file_name: name,
            },
          })
          res.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8' })
          res.end(data) //返回数据
        }
      )
    }, 50)
  } else {
    //上传的并非最后一段数据, res.send(message)

    let bf = Buffer.from(req.body['data']) //转为二进制流
    fs.writeFileSync(url, bf) //写入文件

    let data = JSON.stringify({ code: 1, msg: '继续上传' })
    res.writeHead(200, { 'Content-Type': 'text/html;charset=utf-8' })
    res.end(data)
  }
} catch (err) {
  console.log(err)
}
