const fs = require('fs') //文件模块
const async = require('async')
const axios = require('axios')

// const disPath = 'D:/study_data/helloWorld.txt'
const disPath = 'D:/study_data/node.msi'

// console.log(`Current Location ${__dirname} Read Data From ${disPath}`)

const distFile = fs.readFileSync(disPath)
const largrFile = Buffer.from(distFile)
const fileName = 'node.msi'
// const fileName = 'helloWorld.txt'

const arr = [] //File Container
const size = largrFile.length //KB Unit
const limitedSize = 1024 * 1024 * 2 //Limited Size 2MB
const uploadCount = Math.ceil(size / limitedSize) //Upload Counts
let succeed = 0 //Upload Files

for (let i = 0; i < uploadCount; i++) {
  arr.push(i)
}

try {
  async.eachLimit(
    arr,
    1,
    // 切片上传
    async function (item, callback) {
      let i = item
      let start = i * limitedSize //当前分片开始下标
      let end = Math.min(size, start + limitedSize) //结束下标
      let minFile = largrFile.slice(start, end)

      const obj = {}
      obj.data = minFile
      obj.name = fileName
      obj.total = uploadCount
      obj.size = size
      obj.start = start
      obj.end = end
      obj.index = i + 1
      // http://111.229.14.128:8899/largeBKend
      // http://localhost:8898/upload 测试
      await axios
        .post('http://localhost:3000/upload', obj, {
          timeout: 1000 * 60 * 60,
        })
        .then((res) => {
          ++succeed //进度展示参数

          //返回code为0是成功上传 1是继续上传
          if (res.data.code === 0) {
            console.log('上传成功')
            //上传成功
            // console.log(res.data.data)
            // console.log('大文件切上传完成，拿回数据索引，准备转发')
            // let ws = new WebSocket('ws://111.229.14.128:1708')
            // let msg = {
            //   msg: 'Migration',
            //   bk: true,
            //   serviceDownloadId: res.data.data.source_store_id,
            //   fromToken: req.query.fromToken,
            //   targetToken: req.query.targetToken,
            // }
            // ws.on('open', () => {
            //   ws.send(JSON.stringify(msg))
            //   ws.close()
            // })
            // ws.on('message', (data) => {
            //   if (data == 'node offline') {
            //     console.log('node offline')
            //     ws.close()
            //   } else {
            //     console.log(data)
            //   }
            // })
          } else if (res.data.code === 1) {
            // console.log(res.data.msg)
            let data = JSON.stringify({ code: 1 })
            // console.log(data)
            // res.send(data) //返回数据
          }
          //生成当前进度百分比
          // _this.percentage=Math.round(succeed/uploadCount*100);
          console.log('进度： ' + Math.round((succeed / uploadCount) * 100))

          // callback()
        })
    },
    function (err) {
      if (err) {
        console.log(err)
        return res.send({ code: -1 })
      }
    }
  )
} catch (err) {
  console.log(err)
}
