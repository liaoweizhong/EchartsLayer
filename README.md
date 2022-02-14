# EchartsLayer
arcgis地图基于echarts的迁移图插件

使用方式

引入到项目中后

//实例化 EchartsLayer对象 
const echartsLayer = new EchartsLayer(
  // arcgis3.x版本的地图实例化对象map
  map,
  // 测试里用的是echarts3.2.2版本的 echarts对象
  echarts
)

// 定义各地区经纬度坐标 格式如下  为地名key 坐标为值数组的 object格式
var geoCoordMap = {
  '上海': [121.4648, 31.2891],
  '东莞': [113.8953, 22.901],
  '东营': [118.7073, 37.5513],
  '中山': [113.4229, 22.478],
  '临汾': [111.4783, 36.1615],
  '临沂': [118.3118, 35.2936],
}

// 定义线条  格式为  二维数组 内容结构依次为  [从哪里, 到哪里, 数值, 定义参数(具体的看下面,这个可以为空)]
var BJData = [
    ["北京","上海",95, { lineStyle: { color: "#ffff00" } }],
    ["北京","广州",90, { lineStyle: { color: "#ff0000" } }],
    ["北京","大连",85, { lineStyle: { color: "#ff0000" } }],
    ["北京","南宁",80, { lineStyle: { color: "#ff0000" } }],
    ["北京","南昌",75, { lineStyle: { color: "#ff0000" } }],
    ["北京","拉萨",70, { lineStyle: { color: "#ff0000" } }],
}

// 进入启动 第一个为定义的各地域经纬度 第二个是定义线条  第三个就是全局的默认配置项这个可以设置为空
echartsLayer.start(geoCoordMap, BJData, defaultParam);

defaultParam {
  // 默认聚合点样式 (详情查看：https://echarts.apache.org/zh/option.html#series-effectScatter.itemStyle)
  itemStyleGroup: {
    color: ""  // 颜色
  }
  // 默认聚合点名称样式 （详情查看: https://echarts.apache.org/zh/option.html#series-effectScatter.label）
  labelGroup: {
    color: "" //颜色
    fontSize: 12 // 字体大小
  }
}

/*以下都是参数详解*/
BJData格式中的定义参数具体配置项
BJDataParam {
  // 线条样式配置 (详情查看echarts配置中的 https://echarts.apache.org/zh/option.html#series-lines.lineStyle)
  lineStyle: {
    color: "" // 颜色
    width: 1, // 粗细
    type: "solid", // 类型
  },
  //线特效的配置  (详情查看echarts配置中的 https://echarts.apache.org/zh/option.html#series-lines.effect)
  effect: {
    show: true, //是否显示
    period： 4, //特效时间
  }
}
