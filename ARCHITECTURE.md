# 风云战机架构说明

## 设计目标

项目保持零运行时依赖、支持直接打开 `index.html`，同时把配置、玩法系统、绘制和服务层分开。所有脚本通过 `window.FY` 共享命名空间，加载顺序集中定义在 `index.html`。

## 模块职责

| 目录 | 职责 |
| --- | --- |
| `src/core` | Canvas、通用工具、Game 生命周期、输入、主循环和公共状态 |
| `src/data` | 战机/关卡目录和集中平衡参数 |
| `src/systems` | 关卡导演、天气、武器、战斗、BOSS 更新逻辑 |
| `src/render` | 背景、实体、特效、HUD 的纯绘制逻辑 |
| `src/services` | 存档版本迁移与合成音效 |
| `src/ui` | 根据配置生成机库界面 |

系统和绘制模块以 mixin 形式注册到 `FY.mixins`，最后由 `core/game.js` 合并到 `Game.prototype`。这样保留了原有游戏对象和存档行为，同时避免单文件持续膨胀。

## 新增战机

1. 把运行图片放入 `assets/ships`，高清母版放入 `assets/source`。
2. 在 `src/data/catalog.js` 的 `FIGHTERS` 中添加名称、武器、图片、说明和样式。
3. 在 `src/data/balance.js` 中添加该武器的集中数值。
4. 在 `src/systems/weapons.js` 中实现武器更新逻辑。
5. 在 `src/render/entities.js`、`src/render/effects.js` 或 `src/render/hud.js` 添加必要绘制。
6. 在 `tests/catalog.test.js` 和 `tests/smoke.js` 中补充验证。

机库按钮、关卡按钮、选中状态和本地保存验证会自动读取 `FIGHTERS` 与 `LEVELS`，不再需要为每架战机或每个关卡手工增加入口事件。

## 新增关卡

1. 在 `src/data/catalog.js` 的 `LEVELS` 中增加关卡信息。
2. 在 `src/systems/director.js` 中增加波次与关卡导演。
3. 在 `src/render/backgrounds.js` 中实现独立背景。
4. 如有新环境机制，加入 `src/systems/hazards.js`。
5. 如有新 BOSS，更新 `src/systems/bosses.js` 与 `src/render/entities.js`。
6. 增加关卡与解锁测试。

## 存档兼容

存档继续使用键 `fengyun-fighter-save-v1`，数据中包含 `schemaVersion`。当前版本为 `4`，新增 `growth` 共享成长分配；旧存档会根据合法的 `bestRanks` 自动计算已获得点数并补齐零值配置。以后改变字段结构时，应在 `services/storage.js` 中迁移旧数据，不直接丢弃玩家记录。

## 验证

```powershell
npm test
```

测试分为配置和平衡测试、存档迁移测试、完整闯关/无尽集成测试。每次修改系统模块后都应运行全部测试。
