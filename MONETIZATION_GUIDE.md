# 《吞噬进化Games》多平台变现与直接赚钱落地指南

已完成全平台变现底层技术开发，并将更新全量推送到公网在线版本与离线发行包中。
以下为针对**支付宝国内直收款**、**itch.io 全球独立游戏赞助打赏**以及 **CrazyGames / 4399 广告收益分成**的实操落地步骤。

---

## ⚡ 一、支付宝直接收款系统（已上线，100% 零手续费直达个人账户）

我们已在游戏中全面植入了【👑 赞助/特权】与【支付宝扫码赞助】系统：

1. **公网试玩验证**：
   - 打开公网地址：[https://weny102211-cyber.github.io/devour-evolution-games/](https://weny102211-cyber.github.io/devour-evolution-games/)
   - 主菜单右上角点击【👑 赞助/特权】，或在暂停/结算面板点击【👑 赞助作者】。
2. **如何替换为您自己的支付宝收款码**：
   - 打开手机支付宝 -> 点击【收付款】 -> 选择【二维码收款】 -> 保存收款码图片到手机/电脑。
   - 将图片重命名为 `alipay_qr.png`，替换项目根目录下的 `alipay_qr.png`。
   - 玩家扫码赞助的所有款项将 **100% 秒级直入您的支付宝余额，无任何中间商抽成**。
3. **内置特权兑换码（已开箱即用）**：
   - `DEVOUR666`：领取 666 🪙 狂欢金币
   - `VIP888`：领取 888 🪙 进阶金币
   - `GOLD888`：立即解锁并装备限定皮肤【日耀炽金】
   - `GOD2026`：赞助者专属兑换码！解锁限定神级皮肤【赛博神明·终极奇点】（含全光谱彩虹流光核心 + 初始移速永久额外加成 +20% + 2026 🪙）！

---

## 🌍 二、itch.io 部署指引（全球独立游戏自愿打赏，无审核，10分钟开通）

### 1. 账号注册（仅需 1 分钟）
- 访问注册链接：[https://itch.io/register](https://itch.io/register)
- 填入：
  - **Username**（开发者昵称，如 `cyber-games-studio`）
  - **Password**（密码）
  - **Email address**（您的常用邮箱）
  - 勾选同意服务条款，点击 `Create account`。

### 2. 发布新游戏（Create New Project）
- 登录后访问：[https://itch.io/game/new](https://itch.io/game/new)
- **Title**：`Devour Evolution 3D Games`
- **Short description**：`Satisfying 3D Black Hole io devour casual game. Eat everything in the cyber city!`
- **Classification**：选择 `Games`
- **Kind of project（极其关键）**：选择 `HTML`（Run in the browser）
- **Pricing（定价方式）**：
  - 选择 `$0 or donate`
  - Suggested donation 设为 `$2.00` 或 `$5.00`
- **Uploads（上传游戏包）**：
  - 点击 `Upload files`，上传项目中的 `devour-evolution-games-v1.1.0-monetized.zip`。
  - 上传成功后勾选：☑ **This file will be played in the browser**。
- **Embed options（嵌入选项）**：
  - Viewport dimensions：`1280` × `720`
  - 勾选 ☑ **Fullscreen button**
  - 勾选 ☑ **Mobile friendly**（已内置虚拟摇杆与触屏适配）
- **Visibility**：设置为 `Public`
- 点击 **Save & View Page**，游戏立即全球上线！

### 3. 收款绑定
- 进入 `Settings -> Publisher -> Payment configured`：
- 绑定您的 **PayPal** 或 **Payoneer**（万里汇/派安盈，可直接提现结汇至国内储蓄卡）。
- 收益分成滑块（Open Revenue Sharing）：可自由拖动至 0%（平台抽 0%，开发者拿 100%）。

---

## 🎮 三、CrazyGames 开发者后台提交（广告收益分成）

代码中已完整嵌入 CrazyGames SDK v3（开局打点、结算插屏广告、复活/翻倍激励视频已全自动就绪）：

1. **注册**：访问 [CrazyGames Developer Portal](https://developer.crazygames.com/) 注册个人开发者账号。
2. **提交游戏**：
   - 点击 `Submit Game`。
   - 上传发行包 `devour-evolution-games-v1.1.0-monetized.zip`。
   - 上传图标 `douyin_app_icon.png`。
3. **收益结算**：
   - 试跑阶段积累留存数据后，开启 50/50 广告分成。
   - 通过国际 Tipalti 支付系统，每个月自动将美金电汇至您的国内银联银行卡。

---

## 📦 四、生成物料与文件清单

- **全平台发行包 (含多渠道广告+赞助系统)**：  
  `devour-evolution-games-v1.1.0-monetized.zip` (2.05 MB)
- **512×512 炫彩高清图标**：  
  `douyin_app_icon.png`
- **在线试玩地址（GitHub Pages 全球免翻墙 CDN）**：  
  `https://weny102211-cyber.github.io/devour-evolution-games/`
