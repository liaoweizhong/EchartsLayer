import { setDefaultOptions, loadModules } from "esri-loader";
setDefaultOptions({url: 'https://js.arcgis.com/3.17/'})


/**
 * 本身为一个then调用的等待函数 内部需要加载依赖
 * @returns 
 */
export function getEchartsLayer (){

	return new Promise((resolve)=>{

		loadModules([
			"dojo/_base/declare",
			"esri/geometry/Point", "esri/geometry/ScreenPoint"
		], function(declare, Point, ScreenPoint) {
			const echartsLayer = declare("EchartsLayer", null, {
				name: "EchartsLayer",
				_map: null,
				_ec: null,
				_geoCoord: [],
				_mapBindEvent: [],
				_option: null,
				_mapOffset: [0, 0],
				constructor: function(map, ec) {
					this._map = map;
					var div = this._echartsContainer = document.createElement('div');
					div.style.position = 'absolute';
					div.style.height = map.height + 'px';
					div.style.width = map.width + 'px';
					div.style.top = 0;
					div.style.left = 0;
					map.__container.appendChild(div);
					this._init(map, ec);
				},
		
				remove() {
					// 清除事件
					this._mapBindEvent.forEach((e) => {
						return e.remove();
					})
					// 清除echarts
					this.getECharts().dispose();
					// 删除div
					this.getEchartsContainer().remove();
				},
		
				_compatibleEcharts(ec) {
					if (!ec.getZrender) ec.getZrender = ec.getZr;
				},
		
				_init: function(map, ec) {
					var self = this;
					self._map = map;
					//初始化mapoverlay
					/**
					 * 获取echarts容器
					 *
					 * @return {HTMLElement}
					 * @public
					 */
					self.getEchartsContainer = function() {
						return self._echartsContainer;
					};
		
					/**
					 * 获取map实例
					 *
					 * @return {map.Map}
					 * @public
					 */
					self.getMap = function() {
						return self._map;
					};
					/**
					 * 经纬度转换为屏幕像素
					 *
					 * @param {Array.<number>} geoCoord  经纬度
					 * @return {Array.<number>}
					 * @public
					 */
					self.geoCoord2Pixel = function(geoCoord) {
						var point = new Point(geoCoord[0], geoCoord[1]);
						var pos = self._map.toScreen(point);
						return [pos.x, pos.y];
					};
		
					/**
					 * 屏幕像素转换为经纬度
					 *
					 * @param {Array.<number>} pixel  像素坐标
					 * @return {Array.<number>}
					 * @public
					 */
					self.pixel2GeoCoord = function(pixel) {
						var point = self._map.toMap(new ScreenPoint(pixel[0], pixel[1]));
						return [point.lng, point.lat];
					};
		
					/**
					 * 初始化echarts实例
					 *
					 * @return {ECharts}
					 * @public
					 */
					self.initECharts = function() {
						self._ec = ec.init.apply(self, arguments);
						// 对ec进行兼容处理
						self._compatibleEcharts(self._ec);
						self._bindEvent();
						return self._ec;
					};
		
					/**
					 * 获取ECharts实例
					 *
					 * @return {ECharts}
					 * @public
					 */
					self.getECharts = function() {
						return self._ec;
					};
		
					/**
					 * 获取地图的偏移量
					 *
					 * @return {Array.<number>}
					 * @public
					 */
					self.getMapOffset = function() {
						return self._mapOffset;
					};
		
					/**
					 * 对echarts的setOption加一次处理
					 * 用来为markPoint、markLine中添加x、y坐标，需要name与geoCoord对应
					 * @public
					 * @param option
					 * @param notMerge
					 */
					self.setOption = function(option, notMerge) {
						self._option = JSON.parse(JSON.stringify(option));
						var series = option.series || {};
						// 对传入的数据进行初始化处理
						this.initOption(series);
						self._ec.setOption(option, notMerge);
					};
		
					/**
					 * 对option传入值进行初始化
					 * 默认传入的为经纬度 需要同步转化为屏幕坐标
					 * */
					self.initOption = function(series) {
						var i, it, geoCoord2Pixel = self.geoCoord2Pixel;
						for (i in series) {
							it = series[i];
							// 首先判断一下是哪一种类型
							if (it.type === "lines") {
								// 如果是线段类型
								it.data.forEach((e) => {
									e.forEach((ee) => {
										ee.coord = geoCoord2Pixel(ee.coord);
									});
								})
							} else if (it.type === "effectScatter") {
								// 如果是线段类型
								it.data.forEach((e) => {
									e.value = geoCoord2Pixel(e.value).concat(e.value.splice(2, Infinity));
								})
							}
						}
					}
		
					/**
					 * 绑定地图事件的处理方法
					 *
					 * @private
					 */
					self._bindEvent = function() {
						self._mapBindEvent.push(self._map.on('zoom-end', function(e) {
							self.setOption(self._option);
						}));
						self._mapBindEvent.push(self._map.on('zoom-start', function(e) {
							self._ec.clear();
						}));
						self._mapBindEvent.push(self._map.on('pan', function(e) {
							self._ec.clear();
						}));
						self._mapBindEvent.push(self._map.on('pan-end', function(e) {
							self.setOption(self._option);
						}));
		
						self._ec.getZrender().on('dragstart', function(e) {
							self._map.disablePan();
							//self._ec.clear();
						});
						self._ec.getZrender().on('dragend', function(e) {
							self._map.enablePan();
							//self.setOption(self._option);
						});
						self._ec.getZrender().on('mousewheel', function(e) {
							self._ec.clear();
							self._map.emit('mouse-wheel', e.event)
						});
					};
		
		
					self.start = function(areaArray, lineArray, defaultParam = {}, optionFn ) {
						
						// 默认线段颜色
						var defaultParamLineColor = "#a6c84c";
						// 默认聚合点样式
						var defaultGroupItemStyle = defaultParam.itemStyleGroup || {};
						// 默认聚合点名称样式
						var defaultGroupLabel = defaultParam.labelGroup || {};
						
						if( !self._ec ){
							var chartsContainer = this.getEchartsContainer();
							var myChart = this.initECharts(chartsContainer);
							window.onresize = myChart.onresize;
						}

						// 定义各地区经纬度坐标
						var geoCoordMap = areaArray;
		
						//定义各条路线
						var BJData = lineArray.map((item) => {
							return [{
								name: item[0]
							}, {
								name: item[1],
								value: item[2]
							},Object.assign({},item[3] || {})]
						});
		
						// 然后根据名称分类
						var typeName = Array.from(new Set(lineArray.map((e) => {
							return e[0]
						})));
						typeName = typeName.map((e) => {
							return [e, BJData.filter((ee) => {
								return ee[0].name === e;
							})]
						})
						//定义传值函数
						var convertData = function(data,style) {
							debugger;
							var res = [];
							for (var i = 0; i < data.length; i++) {
								var dataItem = data[i];
								var fromCoord = geoCoordMap[dataItem[0].name];
								var toCoord = geoCoordMap[dataItem[1].name];
								if (fromCoord && toCoord) {
									res.push([{
										coord: fromCoord,
										// lineStyle: Object.assign(Object.assign({},style),dataItem[2]||{})
									}, {
										coord: toCoord
									}]);
								}
							}
							return res;
						};
		
						// var color = ['#a6c84c', '#ffa022', '#46bee9'];
						var series = [];
						// [['北京', BJData]]
						typeName.forEach(function(item, i) {
							var data = item[1];
							series.push({
								name: item[0],
								type: 'effectScatter',
								coordinateSystem: 'geo',
								zlevel: 2,
								rippleEffect: {
									brushType: 'stroke'
								},
								label: {
									normal: {
										show: true,
										position: 'right',
										formatter: '{b}',
										fontSize: 12,
										...defaultGroupLabel
									}
								},
								itemStyle: {
									normal: {
										color: "#ffffff",
										...defaultGroupItemStyle
									}
								},
								data: [{
										name: item[0],
										value: geoCoordMap[item[0]]
								}]
							})
							for( var i in data ){
								var ite = data[i];
								var lineStyle = ite[2]? ite[2].lineStyle : {};
								var effect = ite[2]? ite[2].effect : {};
								var lineStyleShadow = ite[2]? ite[2].lineStyleShadow : {};
								var effectShadow = ite[2]? ite[2].effectShadow : {};
								var itemStylePoint = ite[2]? ite[2].itemStylePoint : {};
								var labelPoint = ite[2]? ite[2].labelPoint : {};
								series.push({
									name: item[0],
									type: 'lines',
									zlevel: 1,
									effect: {
										show: true,
										period: 6,
										trailLength: 0.7,
										//定以尾部特效
										color: '#fff',
										symbolSize: 4,
										...effectShadow
									},
									lineStyle: {
										normal: {
											color: "#ffa022",
											width: 0,
											curveness: 0.2,
											...lineStyleShadow
										}
									},
									data: convertData([ite])
								}, {
									name: item[0],
									type: 'lines',
									zlevel: 2,
									effect: {
										show: true,
										period: 6,
										trailLength: 0,
										symbol: 'circle',
										symbolSize: 6,
										color: '#fff',
										shadowBlur: 10,
										...effect
									},
									lineStyle: {
										normal: {
											color: '#ffa022',
											width: 2,
											opacity: 0.7,
											curveness: 0.2, //弯曲程度设置0-1逐渐增大
											...lineStyle
										}
									},
									data: convertData([ite])
								}, {
									name: item[0],
									type: 'effectScatter',
									coordinateSystem: 'geo',
									zlevel: 2,
									rippleEffect: {
										brushType: 'stroke'
									},
									label: {
										normal: {
											show: true,
											position: 'right',
											formatter: '{b}',
											fontSize: 12,
											...labelPoint
										}
									},
									// symbolSize: function(v) {
									// 	return 12
									// },
									itemStyle: {
										normal: {
											color: "#a6c84c",
											...itemStylePoint
										}
									},
									data: [{
										name: ite[1].name,
										value: geoCoordMap[ite[1].name].concat([ite[1].value]),
									}]
									// data: item[1].map(function(dataItem) {
									// 	debugger;
									// 	return {
									// 		name: dataItem[1].name,
									// 		value: geoCoordMap[dataItem[1].name].concat([dataItem[1].value]),
									// 		itemStyle: {
									// 			color: item[2] ? item[2].lineColor : defaultParamLineColor
									// 		},
									// 	};
									// }).concat({
									// 	name: item[0],
									// 	value: geoCoordMap[item[0]]
									// })
								});
							}
						});
		
						const option = {
							//        backgroundColor: '#404a59',
							// title: {
							// 	text: 'ArcGIS JS API扩展Echarts3之模拟迁徙',
							// 	/*                    subtext: '',*/
							// 	left: 'center',
							// 	textStyle: {
							// 		color: '#fff'
							// 	}
							// },
							tooltip: {
								trigger: 'item'
							},
							legend: {
								orient: 'vertical',
								top: 'bottom',
								left: 'right',
								data: ['北京 Top10', '上海 Top10', '广州 Top10'],
								textStyle: {
									color: '#fff'
								},
								selectedMode: 'single'
							},
							//设置不同级别数据以不同的显示方式
							// dataRange: {
							// 	show: false, //是否显示调节条
							// 	min: 0,
							// 	max: 100,
							// 	//                    x: '760',
							// 	//                    y: '5', //这里的x\y代表了啥？
							// 	orient: 'horizontal',
							// 	calculable: true,
							// 	color: ['#ff3333', 'orange', 'yellow', 'lime', 'aqua'],
							// 	textStyle: {
							// 		color: '#fff'
							// 	}
							// },
							geo: {
								map: '',
								label: {
									emphasis: {
										show: false
									}
								},
								roam: true,
								itemStyle: {
									normal: {
										areaColor: '#000',
										borderColor: '#000'
									},
									emphasis: {
										areaColor: '#000'
									}
								}
							},
							series: series
						};
						// 使用刚指定的配置项和数据显示图表。
						optionFn && optionFn(option)
						this.setOption(option);
					}
				}
		
			});
			resolve(echartsLayer);
		});

	})

}


