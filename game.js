// 抖音小游戏原生环境引导入口 (game.js)
console.log('=== 抖音小游戏《吞噬进化Games》开始装载 ===');

// 检测运行环境
if (typeof tt !== 'undefined') {
  console.log('[Douyin Runtime] 运行在抖音小游戏原生运行环境中');
  
  // 保持屏幕常亮
  if (tt.setKeepScreenOn) {
    tt.setKeepScreenOn({ keepScreenOn: true });
  }

  // 监听内存告警
  if (tt.onMemoryWarning) {
    tt.onMemoryWarning((level) => {
      console.warn('[Douyin Runtime] 收到内存告警:', level);
    });
  }
}

// 引入主游戏模块
import './main.js';
