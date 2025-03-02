const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 添加调试检查
if (!canvas) {
    console.error('找不到 canvas 元素！');
}
if (!ctx) {
    console.error('无法获取 canvas 上下文！');
}

// 添加游戏时间相关参数
const GAME_DURATION = 5 * 60 * 1000; // 5分钟，转换为毫秒

// 添加中场休息相关参数
const HALF_TIME = GAME_DURATION / 2;  // 2.5分钟
const BREAK_DURATION = 3000;  // 3秒休息时间

// 添加星星相关常量（放在文件开头其他常量附近）
const STAR_COUNT = 3;  // 每局游戏3个星星
const STAR_SIZE = 30;  // 星星大小
const STAR_SPEED = 2;  // 星星移动速度
const SPEED_BOOST = 0.3;  // 每个星星增加30%速度

// 修改商城物品列表，添加小狗道具
const SHOP_ITEMS = [
    {
        id: 'shield',
        name: '护盾',
        price: 50,
        description: '获得5秒无敌时间',
        duration: 5000,
        icon: '🛡️'
    },
    {
        id: 'magnet',
        name: '磁铁',
        price: 30,
        description: '15秒内自动吸引金币',
        duration: 15000,
        icon: '🧲'
    },
    {
        id: 'dog',  // 添加小狗道具
        name: '黑色小狗',
        price: 60,
        description: '跟随猫咪一起奔跑',
        icon: '🐕'
    },
    {
        id: 'life',
        name: '生命',
        price: 100,
        description: '增加一条生命',
        icon: '❤️'
    }
];

// 添加背包和皮肤相关常量
const SKINS = [
    {
        id: 'default',
        name: '默认小猫',
        description: '可爱的小橘猫',
        price: 0,
        color: '#FFA500',  // 橙色
        unlocked: true
    },
    {
        id: 'black',
        name: '黑猫咪',
        description: '神秘的小黑猫',
        price: 100,
        color: '#333333',
        unlocked: false
    },
    {
        id: 'white',
        name: '白猫咪',
        description: '优雅的小白猫',
        price: 100,
        color: '#FFFFFF',
        unlocked: false
    },
    {
        id: 'grey',
        name: '灰猫咪',
        description: '淘气的小灰猫',
        price: 100,
        color: '#808080',
        unlocked: false
    }
];

// 修改游戏状态对象
let gameState = {
    isRunning: false,
    score: 0,
    startTime: 0,
    timeLeft: GAME_DURATION,
    lives: 3,
    isInvincible: false,
    invincibleTime: 2000,
    frameId: null,
    hadHalfTimeBreak: false,  // 是否已经进行过中场休息
    isInBreak: false,          // 是否正在休息
    coins: 0,        // 金币数量（直接用于购买道具）
    activeItems: [],   // 激活的道具
    showShop: false,    // 商城显示状态
    isPaused: false,     // 暂停状态
    gameCoins: 0,    // 游戏中收集的金币
    shopCoins: 0,    // 商城中的金币
    wasRunning: false,  // 添加新属性，记录商城打开前的游戏状态
    lastGameWon: false,    // 记录上一局是否胜利
    speedMultiplier: 1,    // 游戏速度倍数
    currentLevel: 1,        // 添加当前关卡记录
    stars: [],            // 星星数组
    totalStarsGenerated: 0,  // 添加总星星计数
    speedBoosts: 0,        // 当前获得的加速数量
    notifications: [],      // 添加通知数组
    showBag: false,        // 背包显示状态
    currentSkin: 'default', // 当前使用的皮肤
    unlockedSkins: ['default'],  // 已解锁的皮肤
    inventory: []  // 添加背包
};

// 添加声音效果
const sounds = {
    jump: new Audio('data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAAAAAA=='),
    score: new Audio('data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAAAAAA=='),
    hit: new Audio('data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAAAAAA=='),
    meow: new Audio('data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAAAAAA==')
};

// 加载声音文件
sounds.jump.src = 'https://example.com/jump.mp3';  // 跳跃音效
sounds.score.src = 'https://example.com/score.mp3'; // 得分音效
sounds.hit.src = 'https://example.com/hit.mp3';    // 碰撞音效
sounds.meow.src = 'https://example.com/meow.mp3';  // 喵喵音效

// 加载小鸟图片
const birdImage = new Image();
birdImage.src = 'bird.png';  // 如果您没有图片，我们使用绘制的小鸟

// 小鸟对象
const cat = {
    x: canvas.width / 3,
    y: canvas.height / 2,
    velocity: 0,
    baseGravity: 0.3,     // 基础重力
    baseJump: -7,         // 基础跳跃力度
    width: 80,
    height: 80,
    rotation: 0,
    isJumping: false,
    tailAngle: 0,
    tailSpeed: 0.15,
    legAngle: 0,
    legSpeed: 0.3
};

// 修改障碍物数组的结构
let boxes = [];  // 改名为 boxes 更合适

// 障碍物参数
const PIPE_WIDTH = 70;       // 减小箱子宽度
const PIPE_GAP = 200;       // 减小间隙
const PIPE_SPEED = 2;       // 降低速度
const BOX_COUNT = 2;        // 减少箱子数量

// 添加云朵数组和太阳对象
const clouds = [
    { x: 100, y: 100, size: 60 },
    { x: 400, y: 150, size: 80 }  // 减少云朵数量
];

const sun = {
    x: 120,
    y: 120,
    radius: 50,
    rays: 12
};

// 调整草地高度
const grassHeight = 120;

// 添加箱子的纹理颜色
const boxColors = {
    main: '#8B4513',      // 深棕色（箱子主体）
    light: '#D2691E',     // 浅棕色（高光面）
    dark: '#654321',      // 暗棕色（阴影面）
    metal: '#C0C0C0'      // 银色（金属装饰）
};

// 添加金币数组和相关参数
let coins = [];
const COIN_SIZE = 30;       // 减小金币大小
const COIN_SPEED = 2;       // 匹配箱子速度
const COIN_SCORE = 10;      // 增加金币分数
const COIN_COUNT = 2;       // 减少金币数量

// 添加金币动画参数
const coinAnimation = {
    rotation: 0,
    rotationSpeed: 0.1,
    bounceHeight: 5,
    bounceSpeed: 0.05
};

// 添加本地存储相关函数
function saveShopCoins() {
    localStorage.setItem('shopCoins', gameState.shopCoins);
}

function loadShopCoins() {
    const savedCoins = localStorage.getItem('shopCoins');
    return savedCoins ? parseInt(savedCoins) : 0;
}

// 修改游戏状态对象，添加基础速度常量
const BASE_SPEED = 1;        // 基础速度
const LEVEL_SPEED_UP = 0.5;  // 每关速度增加值

// 添加小狗对象
const dog = {
    active: false,
    x: 0,
    y: 0,
    width: 60,
    height: 60,
    targetX: 0,
    targetY: 0,
    legAngle: 0,
    legSpeed: 0.3
};

// 添加皮肤保存函数
function saveSkins() {
    localStorage.setItem('unlockedSkins', JSON.stringify(gameState.unlockedSkins));
    localStorage.setItem('currentSkin', gameState.currentSkin);
}

// 添加皮肤加载函数
function loadSkins() {
    const savedUnlockedSkins = localStorage.getItem('unlockedSkins');
    const savedCurrentSkin = localStorage.getItem('currentSkin');
    
    if (savedUnlockedSkins) {
        gameState.unlockedSkins = JSON.parse(savedUnlockedSkins);
    } else {
        gameState.unlockedSkins = ['default'];
    }
    
    if (savedCurrentSkin && gameState.unlockedSkins.includes(savedCurrentSkin)) {
        gameState.currentSkin = savedCurrentSkin;
    } else {
        gameState.currentSkin = 'default';
    }
}

// 修改初始化函数
function init() {
    gameState.isRunning = true;
    gameState.score = 0;
    gameState.startTime = Date.now();
    gameState.timeLeft = GAME_DURATION;
    gameState.lives = 3;
    gameState.isInvincible = false;
    
    cat.x = canvas.width / 3;
    cat.y = canvas.height / 2;
    cat.velocity = 0;
    cat.isJumping = false;
    boxes = [];
    generateBoxes();
    coins = [];
    generateCoins();
    sounds.meow.play();
    gameState.hadHalfTimeBreak = false;
    gameState.isInBreak = false;
    gameState.isPaused = false;
    gameState.showShop = false;
    gameState.showBag = false;
    gameState.coins = 0;
    gameState.gameCoins = 35;  // 开局给35个游戏币
    gameState.shopCoins = loadShopCoins();  // 加载保存的商城币
    gameState.wasRunning = false;
    gameState.stars = [];
    gameState.totalStarsGenerated = 0;  // 重置星星计数
    gameState.speedBoosts = 0;
    gameState.speedMultiplier = BASE_SPEED;
    gameState.lastGameWon = false;
    gameState.currentLevel = 1;
    generateStars();
    gameState.showBag = false;
    gameState.currentSkin = 'default';
    gameState.unlockedSkins = ['default'];

    // 根据上一局结果设置速度
    if (gameState.lastGameWon) {
        // 如果上一局胜利，速度增加0.5
        gameState.speedMultiplier = BASE_SPEED + LEVEL_SPEED_UP;
    } else {
        // 如果失败，重置速度
        gameState.speedMultiplier = BASE_SPEED;
        gameState.currentLevel = 1;
    }

    // 加载已保存的皮肤数据
    loadSkins();
}

// 修改生成箱子的函数
function generateBoxes() {
    if (boxes.length >= BOX_COUNT) return;  // 限制箱子数量
    
    const boxCount = BOX_COUNT - boxes.length;
    const boxGroup = [];
    
    // 将画面水平方向分成几个区域
    const sections = [
        { min: canvas.width + 50, max: canvas.width + 150 },
        { min: canvas.width + 250, max: canvas.width + 350 },
        { min: canvas.width + 450, max: canvas.width + 550 },
        { min: canvas.width + 650, max: canvas.width + 750 }
    ];

    // 将垂直方向分成三个区域
    const heightZones = [
        { min: 100, max: canvas.height * 0.3 },                   // 上部区域
        { min: canvas.height * 0.35, max: canvas.height * 0.6 },  // 中部区域
        { min: canvas.height * 0.65, max: canvas.height - grassHeight - PIPE_WIDTH - 50 } // 下部区域
    ];

    // 随机选择不重叠的区域放置箱子
    const usedSections = [];
    const usedHeights = [];

    for(let i = 0; i < boxCount; i++) {
        // 选择水平区域
        let sectionIndex;
        do {
            sectionIndex = Math.floor(Math.random() * sections.length);
        } while (usedSections.includes(sectionIndex));
        usedSections.push(sectionIndex);
        
        // 选择垂直区域
        let heightIndex;
        do {
            heightIndex = Math.floor(Math.random() * heightZones.length);
        } while (usedHeights.includes(heightIndex));
        usedHeights.push(heightIndex);

        const section = sections[sectionIndex];
        const heightZone = heightZones[heightIndex];

        // 在选定区域内随机生成箱子的位置
        const x = Math.random() * (section.max - section.min) + section.min;
        const y = Math.random() * (heightZone.max - heightZone.min) + heightZone.min;
        
        boxGroup.push({
            x: x,
            y: y,
            width: PIPE_WIDTH,
            height: PIPE_WIDTH,
            passed: false
        });
    }
    
    boxes.push(...boxGroup);
}

// 生成金币的函数
function generateCoins() {
    if (coins.length >= COIN_COUNT) return;  // 限制金币数量
    
    const coinCount = COIN_COUNT - coins.length;
    // 在箱子之间生成金币
    
    // 将画面分成几个区域
    const sections = [
        { min: canvas.width + 200, max: canvas.width + 300 },
        { min: canvas.width + 400, max: canvas.width + 500 },
        { min: canvas.width + 600, max: canvas.width + 700 }
    ];

    const heightZones = [
        { min: 150, max: canvas.height * 0.4 },
        { min: canvas.height * 0.4, max: canvas.height * 0.7 }
    ];

    // 生成金币
    for(let i = 0; i < coinCount; i++) {
        const section = sections[Math.floor(Math.random() * sections.length)];
        const heightZone = heightZones[Math.floor(Math.random() * heightZones.length)];
        
        coins.push({
            x: Math.random() * (section.max - section.min) + section.min,
            y: Math.random() * (heightZone.max - heightZone.min) + heightZone.min,
            size: COIN_SIZE,
            collected: false,
            bounceOffset: Math.random() * Math.PI * 2  // 随机初始弹跳相位
        });
    }
}

// 修改更新函数
function update() {
    if (!gameState.isRunning || gameState.isInBreak) return;

    // 检查是否到达中场时间
    if (!gameState.hadHalfTimeBreak && gameState.timeLeft <= HALF_TIME) {
        startHalfTimeBreak();
        return;
    }

    // 根据当前速度调整重力和跳跃力度
    const currentGravity = cat.baseGravity * (gameState.speedMultiplier ** 2);  // 使用平方关系
    cat.velocity += currentGravity;
    cat.y += cat.velocity;

    // 简化碰撞检测
    const groundY = canvas.height - grassHeight - cat.height/2;
    if (cat.y > groundY) {
        cat.y = groundY;
        cat.velocity = 0;
        cat.isJumping = false;
    }

    // 天花板碰撞检测
    if (cat.y < cat.height/2) {
        cat.y = cat.height/2;
        cat.velocity = 0;
    }

    // 优化箱子更新
    for (let i = boxes.length - 1; i >= 0; i--) {
        const box = boxes[i];
        box.x -= PIPE_SPEED * gameState.speedMultiplier;
        
        if (box.x + box.width < -50) {
            boxes.splice(i, 1);
            continue;
        }

        if (!box.passed && box.x + box.width < cat.x) {
            box.passed = true;
            gameState.gameCoins += 5;  // 通过箱子也获得5个游戏币
            
            // 检查是否需要自动兑换
            if (gameState.gameCoins >= 50) {
                gameState.gameCoins -= 50;
                gameState.shopCoins += 10;
                saveShopCoins();
                showExchangeNotification();
                sounds.score.play();
            } else {
                sounds.score.play();
            }
        }

        // 添加箱子碰撞检测
        if (checkCollision(box)) {
            gameOver();
        }
    }

    // 优化金币更新
    for (let i = coins.length - 1; i >= 0; i--) {
        const coin = coins[i];
        coin.x -= COIN_SPEED * gameState.speedMultiplier;
        
        // 恢复金币碰撞检测
        if (!coin.collected && checkCoinCollision(coin)) {
            coin.collected = true;
            gameState.score += COIN_SCORE;
            sounds.score.play();
        }
        
        if (coin.x + coin.size < -50 || coin.collected) {
            coins.splice(i, 1);
            continue;
        }
    }

    // 更新星星
    for (let i = gameState.stars.length - 1; i >= 0; i--) {
        const star = gameState.stars[i];
        star.x -= STAR_SPEED * gameState.speedMultiplier;
        
        // 检查星星碰撞
        if (!star.collected && checkStarCollision(star)) {
            star.collected = true;
            gameState.speedBoosts++;
            gameState.speedMultiplier += SPEED_BOOST;  // 增加速度
            sounds.score.play();
        }
        
        if (star.x + star.size < -50 || star.collected) {
            gameState.stars.splice(i, 1);
        }
    }

    // 生成新的星星
    generateStars();

    // 按需生成新的箱子和金币
    if (boxes.length < BOX_COUNT) generateBoxes();
    if (coins.length < COIN_COUNT) generateCoins();

    // 简化动画更新
    coinAnimation.rotation = (coinAnimation.rotation + coinAnimation.rotationSpeed) % (Math.PI * 2);

    // 更新小狗位置
    if (dog.active) {
        // 设置目标位置在猫咪后面
        dog.targetX = cat.x - 100;
        dog.targetY = cat.y;

        // 平滑移动到目标位置
        const dx = dog.targetX - dog.x;
        const dy = dog.targetY - dog.y;
        dog.x += dx * 0.1;
        dog.y += dy * 0.1;

        // 更新腿部动画
        dog.legAngle += dog.legSpeed;
    }
}

// 修改碰撞检测
function checkCollision(box) {
    if (gameState.isInvincible) return false;  // 无敌状态下不检测碰撞

    const catHitbox = {
        left: cat.x - cat.width/3,
        right: cat.x + cat.width/3,
        top: cat.y - cat.height/3,
        bottom: cat.y + cat.height/3
    };

    const boxHitbox = {
        left: box.x,
        right: box.x + box.width,
        top: box.y,
        bottom: box.y + box.height
    };

    if (catHitbox.right > boxHitbox.left && 
        catHitbox.left < boxHitbox.right && 
        catHitbox.bottom > boxHitbox.top && 
        catHitbox.top < boxHitbox.bottom) {
        
        if (gameState.lives > 0) {
            handleCollision();
            return false;  // 不结束游戏
        }
        sounds.hit.play();
        return true;  // 生命值为0时结束游戏
    }
    return false;
}

// 金币碰撞检测
function checkCoinCollision(coin) {
    const catHitbox = {
        left: cat.x - cat.width/3,
        right: cat.x + cat.width/3,
        top: cat.y - cat.height/3,
        bottom: cat.y + cat.height/3
    };

    const coinHitbox = {
        left: coin.x - coin.size/2,
        right: coin.x + coin.size/2,
        top: coin.y - coin.size/2,
        bottom: coin.y + coin.size/2
    };

    return catHitbox.right > coinHitbox.left && 
           catHitbox.left < coinHitbox.right && 
           catHitbox.bottom > coinHitbox.top && 
           catHitbox.top < coinHitbox.bottom;
}

// 添加碰撞处理函数
function handleCollision() {
    gameState.lives--;
    sounds.hit.play();
    
    // 设置无敌状态
    gameState.isInvincible = true;
    setTimeout(() => {
        gameState.isInvincible = false;
    }, gameState.invincibleTime);
}

// 修改游戏结束函数
function gameOver() {
    gameState.isRunning = false;
    gameState.isPaused = false;  // 确保游戏结束时不是暂停状态
    
    // 判断是否胜利（时间用完而不是撞到箱子）
    if (gameState.timeLeft <= 0) {
        gameState.lastGameWon = true;
        gameState.currentLevel++;
    } else {
        gameState.lastGameWon = false;
        gameState.currentLevel = 1;
    }
    
    // 关闭商城，但不关闭背包
    gameState.showShop = false;
    
    if (gameState.frameId) {
        cancelAnimationFrame(gameState.frameId);
        gameState.frameId = null;
    }
    
    sounds.hit.play();
    setTimeout(() => {
        sounds.meow.play();
    }, 500);
}

// 添加中场休息函数
function startHalfTimeBreak() {
    gameState.isInBreak = true;
    gameState.hadHalfTimeBreak = true;
    
    // 播放提示音效
    sounds.meow.play();
    
    // 3秒后恢复游戏
    setTimeout(() => {
        gameState.isInBreak = false;
        // 给予短暂无敌时间
        gameState.isInvincible = true;
        setTimeout(() => {
            gameState.isInvincible = false;
        }, gameState.invincibleTime);
    }, BREAK_DURATION);
}

// 修改游戏结束显示函数
function drawGameOver() {
    // 绘制半透明背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制游戏结束文字
    ctx.fillStyle = 'white';
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('游戏结束', canvas.width/2, canvas.height/2 - 100);
    
    // 绘制收集的金币信息
    ctx.font = 'bold 40px Arial';
    ctx.fillText(`收集金币: ${Math.max(0, gameState.gameCoins - 35)}`, canvas.width/2, canvas.height/2);
    ctx.fillText(`总游戏币: ${gameState.gameCoins}`, canvas.width/2, canvas.height/2 + 50);
    ctx.fillText(`商城币: ${gameState.shopCoins}`, canvas.width/2, canvas.height/2 + 100);
    
    // 绘制速度信息
    ctx.font = 'bold 30px Arial';
    ctx.fillText(`速度重置为 1.0x`, canvas.width/2, canvas.height/2 + 150);
    
    // 绘制重新开始提示
    ctx.fillText('点击重新开始', canvas.width/2, canvas.height/2 + 200);
}

// 修改绘制函数
function draw() {
    console.log('绘制中...', '小鸟位置:', cat.x, cat.y);
    
    // 清除特定区域而不是整个画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 使用简化的背景绘制
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制太阳
    ctx.save();
    // 太阳光晕
    const gradient = ctx.createRadialGradient(sun.x, sun.y, 0, sun.x, sun.y, sun.radius * 2);
    gradient.addColorStop(0, 'rgba(255, 255, 190, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 255, 190, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(sun.x, sun.y, sun.radius * 2, 0, Math.PI * 2);
    ctx.fill();

    // 太阳本体
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(sun.x, sun.y, sun.radius, 0, Math.PI * 2);
    ctx.fill();

    // 太阳光芒
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    for (let i = 0; i < sun.rays; i++) {
        const angle = (i * Math.PI * 2) / sun.rays;
        const innerRadius = sun.radius + 10;
        const outerRadius = sun.radius + 25;
        ctx.beginPath();
        ctx.moveTo(
            sun.x + Math.cos(angle) * innerRadius,
            sun.y + Math.sin(angle) * innerRadius
        );
        ctx.lineTo(
            sun.x + Math.cos(angle) * outerRadius,
            sun.y + Math.sin(angle) * outerRadius
        );
        ctx.stroke();
    }
    ctx.restore();

    // 绘制云朵
    clouds.forEach(cloud => {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        
        // 主体
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.size * 0.8, cloud.y - cloud.size * 0.2, cloud.size * 0.6, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.size * 1.4, cloud.y, cloud.size * 0.8, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.size * 0.5, cloud.y + cloud.size * 0.2, cloud.size * 0.7, 0, Math.PI * 2);
        ctx.fill();

        // 添加阴影效果
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.beginPath();
        ctx.arc(cloud.x + 2, cloud.y + 2, cloud.size, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.size * 0.8 + 2, cloud.y - cloud.size * 0.2 + 2, cloud.size * 0.6, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.size * 1.4 + 2, cloud.y + 2, cloud.size * 0.8, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.size * 0.5 + 2, cloud.y + cloud.size * 0.2 + 2, cloud.size * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 移动云朵
        cloud.x -= 0.2;  // 缓慢移动
        if (cloud.x + cloud.size * 2 < 0) {
            cloud.x = canvas.width + cloud.size;
            cloud.y = Math.random() * canvas.height / 3;  // 随机高度
        }
    });

    // 绘制草地
    const groundY = canvas.height - grassHeight;
    
    // 绘制地面
    ctx.fillStyle = '#8B4513';  // 深棕色土地
    ctx.fillRect(0, groundY + 20, canvas.width, grassHeight - 20);
    
    // 绘制草地
    ctx.fillStyle = '#90EE90';  // 浅绿色草地
    ctx.beginPath();
    for(let x = 0; x < canvas.width; x += 4) {
        ctx.moveTo(x, groundY + 20);
        ctx.lineTo(x, groundY);
        ctx.lineTo(x + 2, groundY + 10);
    }
    ctx.fill();

    // 绘制猫咪
    drawCat();

    // 绘制箱子
    for (let box of boxes) {
        drawBox(box.x, box.y, box.width, box.height);
    }

    // 绘制金币
    for (let coin of coins) {
        if (!coin.collected) {
            drawCoin(coin);
        }
    }

    // 左侧显示游戏币和得分
    ctx.fillStyle = 'black';
    ctx.font = 'bold 40px Arial';
    ctx.fillText(`游戏币: ${gameState.gameCoins}/50`, 20, 60);

    // 右侧显示时间
    const minutes = Math.floor(gameState.timeLeft / 60000);
    const seconds = Math.floor((gameState.timeLeft % 60000) / 1000);
    ctx.textAlign = 'right';
    ctx.fillText(`时间: ${minutes}:${seconds.toString().padStart(2, '0')}`, canvas.width - 20, 60);

    // 顶部中间显示生命值
    ctx.textAlign = 'center';
    const hearts = '❤️'.repeat(gameState.lives);
    ctx.font = '30px Arial';
    ctx.fillText(hearts, canvas.width / 2, 40);

    // 重置文本对齐
    ctx.textAlign = 'left';

    // 绘制暂停按钮
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(canvas.width - 180, 80, 80, 40);
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(gameState.isPaused ? '继续' : '暂停', canvas.width - 160, 105);

    // 绘制商城按钮
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(canvas.width - 100, 80, 80, 40);
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText('商城', canvas.width - 80, 105);

    // 绘制暂停界面
    if (gameState.isPaused && !gameState.showShop && !gameState.showBag && gameState.isRunning) {  // 添加 isRunning 检查
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 绘制暂停文字
        ctx.fillStyle = 'white';
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('游戏暂停', canvas.width/2, canvas.height/2);
        ctx.font = 'bold 30px Arial';
        ctx.fillText('点击继续按钮继续游戏', canvas.width/2, canvas.height/2 + 60);

        // 绘制背包按钮
        drawBagButton();
    }

    // 绘制商城界面
    if (gameState.showShop) {
        drawShop();
    }

    // 如果游戏结束，绘制游戏结束界面
    if (!gameState.isRunning && !gameState.showBag && !gameState.showShop) {
        drawGameOver();
    }

    // 如果显示背包，绘制背包界面
    if (gameState.showBag) {
        drawBag();
    }

    // 绘制星星
    gameState.stars.forEach(star => {
        if (!star.collected) {
            drawStar(star);
        }
    });

    // 显示当前速度倍数
    ctx.fillStyle = 'black';
    ctx.font = 'bold 30px Arial';
    ctx.fillText(`速度: ${gameState.speedMultiplier.toFixed(1)}x`, 20, 200);

    // 绘制通知
    if (gameState.notifications && gameState.notifications.length > 0) {
        const currentTime = Date.now();
        gameState.notifications = gameState.notifications.filter(notification => {
            const elapsed = currentTime - notification.startTime;
            if (elapsed < notification.duration) {
                // 计算透明度
                const alpha = 1 - (elapsed / notification.duration);
                
                // 绘制通知
                ctx.save();
                ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.7})`;
                ctx.fillRect(canvas.width/2 - 150, 100, 300, 60);
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.font = 'bold 20px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(notification.text, canvas.width/2, 140);
                ctx.restore();
                return true;
            }
            return false;
        });
    }

    // 显示道具状态
    gameState.activeItems.forEach((item, index) => {
        const timeLeft = Math.ceil((item.endTime - Date.now()) / 1000);
        if (timeLeft > 0) {
            ctx.fillStyle = 'black';
            ctx.font = 'bold 20px Arial';
            let itemText = '';
            if (item.id === 'magnet') {
                itemText = `🧲 ${timeLeft}秒`;
            } else if (item.id === 'shield') {
                itemText = `🛡️ ${timeLeft}秒`;
            }
            ctx.fillText(itemText, 20, 160 + index * 30);
        }
    });

    // 绘制小狗
    if (dog.active) {
        drawDog(dog.x, dog.y, dog.legAngle);
    }
}

// 修改绘制猫咪函数
function drawCat() {
    ctx.save();
    ctx.translate(cat.x, cat.y);
    
    // 更新动画角度
    cat.rotation = cat.velocity * 0.1;
    ctx.rotate(cat.rotation);
    cat.tailAngle += cat.tailSpeed;
    cat.legAngle += cat.legSpeed;

    // 获取当前皮肤
    const currentSkin = SKINS.find(skin => skin.id === gameState.currentSkin);
    const catColor = currentSkin ? currentSkin.color : '#FFA500';  // 默认橙色

    // 绘制尾巴
    ctx.beginPath();
    const tailWag = Math.sin(cat.tailAngle) * 0.5;
    ctx.moveTo(-15, 0);
    ctx.quadraticCurveTo(
        -25 + Math.cos(tailWag) * 10,
        -20 + Math.sin(tailWag) * 10,
        -30 + Math.cos(tailWag) * 15,
        -30 + Math.sin(tailWag) * 15
    );
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.strokeStyle = catColor;
    ctx.stroke();

    // 绘制腿部
    const legLength = 15;
    const footSize = 6;
    const legSwing = Math.sin(cat.legAngle) * 8;

    // 后腿
    drawLeg(-10, 10, legSwing, catColor);
    drawLeg(-5, 10, -legSwing, catColor);
    // 前腿
    drawLeg(10, 10, -legSwing, catColor);
    drawLeg(15, 10, legSwing, catColor);

    // 绘制身体
    ctx.beginPath();
    ctx.ellipse(0, 0, cat.width/2, cat.height/3, 0, 0, Math.PI * 2);
    const bodyGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, cat.width/2);
    bodyGradient.addColorStop(0, catColor);
    bodyGradient.addColorStop(1, shadeColor(catColor, -20));
    ctx.fillStyle = bodyGradient;
    ctx.fill();
    ctx.strokeStyle = shadeColor(catColor, -30);
    ctx.lineWidth = 1;
    ctx.stroke();

    // 绘制头部
    ctx.beginPath();
    ctx.arc(15, -5, cat.width/3, 0, Math.PI * 2);
    ctx.fillStyle = catColor;
    ctx.fill();
    ctx.strokeStyle = shadeColor(catColor, -30);
    ctx.stroke();

    // 绘制耳朵（使用相同的颜色）
    ctx.fillStyle = catColor;
    drawEar(5, -15, 0, -35, 15, -20);  // 左耳
    drawEar(20, -15, 25, -35, 30, -20); // 右耳

    // 保持眼睛、鼻子和胡须的颜色不变
    drawEyes();
    drawNose();
    drawWhiskers();

    ctx.restore();
}

// 添加颜色处理辅助函数
function shadeColor(color, percent) {
    let R = parseInt(color.substring(1,3),16);
    let G = parseInt(color.substring(3,5),16);
    let B = parseInt(color.substring(5,7),16);

    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);

    R = (R<255)?R:255;  
    G = (G<255)?G:255;  
    B = (B<255)?B:255;  

    const RR = ((R.toString(16).length==1)?"0"+R.toString(16):R.toString(16));
    const GG = ((G.toString(16).length==1)?"0"+G.toString(16):G.toString(16));
    const BB = ((B.toString(16).length==1)?"0"+B.toString(16):B.toString(16));

    return "#"+RR+GG+BB;
}

// 分离眼睛绘制函数
function drawEyes() {
    // 左眼
    ctx.beginPath();
    ctx.ellipse(10, -10, 4, 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#87CEEB';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(10, -10, 2, 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'black';
    ctx.fill();
    // 左眼高光
    ctx.beginPath();
    ctx.arc(11, -12, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();

    // 右眼
    ctx.beginPath();
    ctx.ellipse(20, -10, 4, 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#87CEEB';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(20, -10, 2, 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'black';
    ctx.fill();
    // 右眼高光
    ctx.beginPath();
    ctx.arc(21, -12, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
}

// 分离鼻子绘制函数
function drawNose() {
    ctx.beginPath();
    ctx.moveTo(15, -5);
    ctx.lineTo(12, -2);
    ctx.lineTo(18, -2);
    ctx.closePath();
    ctx.fillStyle = '#FFB6C1';
    ctx.fill();
}

// 辅助函数
function drawLeg(x, y, swing, color) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + swing, y + 15);
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.stroke();

    // 脚掌
    ctx.beginPath();
    ctx.ellipse(x + swing, y + 15, 6, 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = shadeColor(color, 20); // 稍微亮一点的颜色
    ctx.fill();
    ctx.strokeStyle = shadeColor(color, -30); // 暗一点的轮廓
    ctx.lineWidth = 1;
    ctx.stroke();
}

function drawEar(x1, y1, x2, y2, x3, y3) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.fillStyle = '#FFB6C1';
    ctx.fill();
}

function drawWhiskers() {
    ctx.beginPath();
    // 左边胡须
    ctx.moveTo(5, -3);
    ctx.lineTo(-10, -8);
    ctx.moveTo(5, -1);
    ctx.lineTo(-10, -1);
    ctx.moveTo(5, 1);
    ctx.lineTo(-10, 6);
    // 右边胡须
    ctx.moveTo(25, -3);
    ctx.lineTo(40, -8);
    ctx.moveTo(25, -1);
    ctx.lineTo(40, -1);
    ctx.moveTo(25, 1);
    ctx.lineTo(40, 6);
    ctx.strokeStyle = '#C0C0C0';
    ctx.lineWidth = 1;
    ctx.stroke();
}

// 修改绘制障碍物的部分
function drawBox(x, y, width, height) {
    // 箱子主体
    ctx.fillStyle = boxColors.main;
    ctx.fillRect(x, y, width, height);

    // 箱子边框
    ctx.strokeStyle = boxColors.dark;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    // 木纹效果
    ctx.strokeStyle = boxColors.light;
    ctx.lineWidth = 1;
    for (let i = 10; i < width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(x + i, y);
        ctx.lineTo(x + i, y + height);
        ctx.stroke();
    }

    // 金属装饰
    const cornerSize = 10;
    // 左上角
    drawCornerMetal(x, y, cornerSize);
    // 右上角
    drawCornerMetal(x + width - cornerSize, y, cornerSize);
    // 左下角
    drawCornerMetal(x, y + height - cornerSize, cornerSize);
    // 右下角
    drawCornerMetal(x + width - cornerSize, y + height - cornerSize, cornerSize);
}

// 绘制金属角装饰
function drawCornerMetal(x, y, size) {
    ctx.fillStyle = boxColors.metal;
    ctx.beginPath();
    ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = boxColors.dark;
    ctx.lineWidth = 1;
    ctx.stroke();

    // 添加螺丝效果
    ctx.beginPath();
    ctx.moveTo(x + size/2 - 2, y + size/2);
    ctx.lineTo(x + size/2 + 2, y + size/2);
    ctx.moveTo(x + size/2, y + size/2 - 2);
    ctx.lineTo(x + size/2, y + size/2 + 2);
    ctx.strokeStyle = boxColors.dark;
    ctx.stroke();
}

// 修改金币绘制函数
function drawCoin(coin) {
    ctx.save();
    ctx.translate(coin.x, coin.y + Math.sin(coin.bounceOffset + coinAnimation.rotation * coinAnimation.bounceSpeed) * coinAnimation.bounceHeight);
    ctx.rotate(coinAnimation.rotation);

    // 金币外圈
    ctx.beginPath();
    ctx.arc(0, 0, coin.size/2, 0, Math.PI * 2);
    ctx.fillStyle = '#FFD700';  // 金色
    ctx.fill();
    ctx.strokeStyle = '#DAA520';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 绘制¥符号
    ctx.fillStyle = '#8B4513';  // 深棕色文字
    ctx.font = `bold ${coin.size * 0.8}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('¥', 0, 0);  // 改回¥符号

    // 添加闪光效果
    ctx.beginPath();
    ctx.arc(-coin.size/6, -coin.size/6, coin.size/8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fill();

    ctx.restore();
}

// 修改游戏循环
function gameLoop() {
    // 绘制游戏画面
    draw();
    
    // 只有在游戏运行且未暂停时才更新游戏状态
    if (gameState.isRunning && !gameState.isPaused && !gameState.showShop && !gameState.showBag) {
        const currentTime = Date.now();
        gameState.timeLeft = Math.max(0, GAME_DURATION - (currentTime - gameState.startTime));
        
        if (gameState.timeLeft <= 0) {
            gameOver();
            return;
        }

        update();
    }

    // 继续游戏循环
    gameState.frameId = requestAnimationFrame(gameLoop);
}

// 修改游戏开始函数
function startGame() {
    init();
    gameState.isRunning = true;
    gameState.isPaused = false;
    gameState.showShop = false;
    requestAnimationFrame(gameLoop);
}

// 修改点击事件
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 如果背包打开，优先处理背包的点击事件
    if (gameState.showBag) {
        // 检查是否点击了关闭按钮
        if (x >= canvas.width - 60 && x <= canvas.width - 20 && y >= 20 && y <= 60) {
            gameState.showBag = false;
            return;
        }

        // 处理皮肤选择
        SKINS.forEach((skin, index) => {
            const skinX = canvas.width/4;
            const skinY = 150 + index * 100;
            if (x >= skinX && x <= skinX + canvas.width/2 && 
                y >= skinY && y <= skinY + 80) {
                if (gameState.unlockedSkins.includes(skin.id)) {
                    gameState.currentSkin = skin.id;
                    saveSkins();  // 保存皮肤选择
                } else if (gameState.shopCoins >= skin.price) {
                    gameState.shopCoins -= skin.price;
                    gameState.unlockedSkins.push(skin.id);
                    gameState.currentSkin = skin.id;
                    saveShopCoins();
                    saveSkins();  // 保存新购买的皮肤和选择
                }
            }
        });
        return;
    }

    // 检查背包按钮点击
    if (x >= 20 && x <= 120 && y >= canvas.height - 80 && y <= canvas.height - 40) {
        gameState.showBag = true;
        return;
    }

    // 如果游戏结束且背包没打开，点击任意位置重新开始
    if (!gameState.isRunning && !gameState.showBag) {
        startGame();
        return;
    }

    // 检查商城界面点击
    if (gameState.showShop) {
        // 关闭按钮
        if (x > canvas.width - 40 && x < canvas.width && y < 40) {
            toggleShop();  // 关闭商城并恢复游戏
            return;
        }

        // 商品点击
        SHOP_ITEMS.forEach((item, index) => {
            const itemY = 180 + index * 100;
            if (x > canvas.width/4 && x < canvas.width*3/4 && 
                y > itemY && y < itemY + 80) {
                buyItem(item.id);
            }
        });
        return;
    }

    // 检查暂停按钮点击
    if (gameState.isRunning && x > canvas.width - 180 && x < canvas.width - 100 && y > 80 && y < 120) {
        gameState.isPaused = !gameState.isPaused;
        if (!gameState.showShop && !gameState.showBag) {
            if (gameState.isPaused) {
                gameState.wasRunning = true;
            } else {
                if (gameState.wasRunning) {
                    gameState.wasRunning = false;
                }
            }
        }
        return;
    }

    // 检查商城按钮点击
    if (x > canvas.width - 100 && x < canvas.width - 20 && y > 80 && y < 120) {
        toggleShop();
        return;
    }

    // 游戏正常点击处理
    if (!gameState.isPaused && !gameState.showShop) {
        if (!gameState.isRunning) {
            startGame();
        } else if (!cat.isJumping || cat.velocity < 0) {
            // 根据当前速度调整跳跃力度
            cat.velocity = cat.baseJump * (gameState.speedMultiplier ** 2);  // 使用平方关系
            cat.isJumping = true;
            sounds.jump.play();
        }
    }
});

// 修改商城切换函数
function toggleShop() {
    if (!gameState.showShop) {
        // 打开商城时
        gameState.showShop = true;
        gameState.isRunning = false;
    } else {
        // 关闭商城时
        gameState.showShop = false;
        if (!gameState.isPaused) {
            gameState.isRunning = true;
            // 检查是否有磁铁道具待使用
            if (gameState.inventory && gameState.inventory.includes('magnet')) {
                // 使用磁铁
                activateMagnet();
                // 从背包中移除磁铁
                gameState.inventory = gameState.inventory.filter(item => item !== 'magnet');
            }
        }
    }
}

// 购买道具
function buyItem(itemId) {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item || gameState.shopCoins < item.price) return;
    
    gameState.shopCoins -= item.price;
    saveShopCoins();
    
    switch(itemId) {
        case 'shield':
            activateShield();
            break;
        case 'magnet':
            // 购买磁铁时不直接激活，而是存储到背包
            if (!gameState.inventory) {
                gameState.inventory = [];
            }
            gameState.inventory.push('magnet');
            break;
        case 'life':
            if (gameState.lives < 5) {
                gameState.lives++;
            }
            break;
        case 'dog':
            activateDog();
            break;
    }
}

// 道具效果
function activateShield() {
    gameState.isInvincible = true;
    gameState.activeItems.push({
        id: 'shield',
        endTime: Date.now() + 5000
    });
    setTimeout(() => {
        gameState.isInvincible = false;
        gameState.activeItems = gameState.activeItems.filter(item => item.id !== 'shield');
    }, 5000);
}

function activateMagnet() {
    const magnetRange = 200;  // 增加磁铁吸引范围
    const magnetItem = {
        id: 'magnet',
        endTime: Date.now() + 15000  // 修改为15秒
    };
    gameState.activeItems.push(magnetItem);
    
    // 添加磁铁效果
    const magnetEffect = setInterval(() => {
        if (!gameState.isRunning) return;
        
        coins.forEach(coin => {
            if (!coin.collected) {
                const dx = cat.x - coin.x;
                const dy = cat.y - coin.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < magnetRange) {
                    // 增加吸引力
                    coin.x += dx * 0.15;  // 增加吸引速度
                    coin.y += dy * 0.15;
                }
            }
        });
    }, 16);

    // 15秒后关闭效果
    setTimeout(() => {
        clearInterval(magnetEffect);
        gameState.activeItems = gameState.activeItems.filter(item => item.id !== 'magnet');
    }, 15000);
}

// 添加小狗激活函数
function activateDog() {
    dog.active = true;
    dog.x = cat.x - 100;  // 初始位置在猫咪后面
    dog.y = cat.y;
}

// 修改金币收集逻辑
function collectCoin(coin) {
    if (coin.collected) return;
    
    coin.collected = true;
    gameState.gameCoins += 5;  // 每个金币增加5个游戏币
    sounds.score.play();       // 播放收集音效
    
    // 每收集50个游戏币自动兑换为商城中的10个金币
    if (gameState.gameCoins >= 50) {
        gameState.gameCoins -= 50;    // 扣除50个游戏币
        gameState.shopCoins += 10;    // 增加10个商城币
        saveShopCoins();              // 保存商城币数量
        
        // 显示兑换提示
        showExchangeNotification();
        sounds.score.play();          // 播放兑换音效
    }
}

// 修改兑换提示显示时间和位置
function showExchangeNotification() {
    const notification = {
        text: '50游戏币已兑换为10商城币！',
        startTime: Date.now(),
        duration: 2000  // 显示2秒
    };
    
    // 将通知添加到游戏状态
    if (!gameState.notifications) {
        gameState.notifications = [];
    }
    gameState.notifications.push(notification);
}

// 修改商城绘制函数
function drawShop() {
    if (!gameState.showShop) return;

    // 绘制商城背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制标题和金币信息
    ctx.fillStyle = 'white';
    ctx.font = 'bold 40px Arial';
    ctx.fillText('商城', canvas.width/2 - 50, 60);
    ctx.font = 'bold 30px Arial';
    ctx.fillText(`游戏币: ${gameState.gameCoins}/50`, 20, 60);
    ctx.fillText(`商城币: ${gameState.shopCoins}`, 20, 100);
    
    // 修改兑换说明文字
    ctx.font = 'bold 20px Arial';
    ctx.fillText('每收集50个游戏币自动兑换为10个商城币', canvas.width/2 - 150, 140);

    // 绘制商品
    SHOP_ITEMS.forEach((item, index) => {
        const x = canvas.width/4;
        const y = 180 + index * 100;
        
        ctx.fillStyle = gameState.shopCoins >= item.price ? 'rgba(255,255,255,0.2)' : 'rgba(255,0,0,0.2)';
        ctx.fillRect(x, y, canvas.width/2, 80);
        
        ctx.fillStyle = 'white';
        ctx.font = '30px Arial';
        ctx.fillText(`${item.icon} ${item.name}`, x + 20, y + 35);
        ctx.fillText(`${item.price} 商城币`, x + 20, y + 65);
        ctx.font = '20px Arial';
        
        // 为磁铁添加特殊说明
        if (item.id === 'magnet') {
            ctx.fillText(item.description + '（退出商城后自动使用）', x + 200, y + 50);
        } else {
            ctx.fillText(item.description, x + 200, y + 50);
        }
    });

    // 绘制关闭按钮
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.fillText('×', canvas.width - 40, 40);
}

// 修改暂停切换函数
function togglePause() {
    // 只有在游戏运行时才能暂停
    if (gameState.isRunning && !gameState.showShop && !gameState.showBag) {
        gameState.isPaused = !gameState.isPaused;
        if (gameState.isPaused) {
            // 暂停时停止游戏更新，但保持isRunning为true
            gameState.wasRunning = true;
        } else {
            // 取消暂停时恢复游戏
            if (gameState.wasRunning) {
                gameState.wasRunning = false;
            }
        }
    }
}

// 修改星星生成函数
function generateStars() {
    // 如果已经生成了3个星星，就不再生成
    if (gameState.totalStarsGenerated >= STAR_COUNT) return;
    
    // 如果当前屏幕上有星星，也不生成新的
    if (gameState.stars.length > 0) return;

    // 生成一个新星星
    const sections = [
        { min: canvas.width + 300, max: canvas.width + 500 },
        { min: canvas.width + 700, max: canvas.width + 900 },
        { min: canvas.width + 1100, max: canvas.width + 1300 }
    ];

    const heightZones = [
        { min: 150, max: canvas.height * 0.4 },
        { min: canvas.height * 0.4, max: canvas.height * 0.7 }
    ];

    const section = sections[gameState.totalStarsGenerated];  // 每个星星使用不同的区域
    const heightZone = heightZones[Math.floor(Math.random() * heightZones.length)];
    
    gameState.stars.push({
        x: Math.random() * (section.max - section.min) + section.min,
        y: Math.random() * (heightZone.max - heightZone.min) + heightZone.min,
        size: STAR_SIZE,
        collected: false,
        rotation: Math.random() * Math.PI * 2,
        bounceOffset: Math.random() * Math.PI * 2
    });
    
    gameState.totalStarsGenerated++;  // 增加已生成星星计数
}

// 添加星星绘制函数
function drawStar(star) {
    ctx.save();
    ctx.translate(star.x, star.y + Math.sin(star.bounceOffset + Date.now() * 0.003) * 5);
    ctx.rotate(star.rotation + Date.now() * 0.001);

    // 绘制五角星
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const x = Math.cos(angle) * star.size/2;
        const y = Math.sin(angle) * star.size/2;
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.closePath();

    // 填充蓝色
    ctx.fillStyle = '#4169E1';  // 皇家蓝
    ctx.fill();
    
    // 添加闪光效果
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(-star.size/6, -star.size/6, star.size/8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

// 添加星星碰撞检测
function checkStarCollision(star) {
    const catHitbox = {
        left: cat.x - cat.width/3,
        right: cat.x + cat.width/3,
        top: cat.y - cat.height/3,
        bottom: cat.y + cat.height/3
    };

    const starHitbox = {
        left: star.x - star.size/2,
        right: star.x + star.size/2,
        top: star.y - star.size/2,
        bottom: star.y + star.size/2
    };

    return catHitbox.right > starHitbox.left && 
           catHitbox.left < starHitbox.right && 
           catHitbox.bottom > starHitbox.top && 
           catHitbox.top < starHitbox.bottom;
}

// 修改小狗绘制函数
function drawDog(x, y, legAngle) {
    ctx.save();
    ctx.translate(x, y);

    // 绘制蓬松的尾巴
    ctx.beginPath();
    const tailWag = Math.sin(Date.now() * 0.01) * 10;
    ctx.moveTo(-25, -5);
    // 更蓬松的尾巴曲线
    ctx.quadraticCurveTo(-35, -20 + tailWag, -45, -15 + tailWag);
    ctx.quadraticCurveTo(-40, -5 + tailWag, -35, 0 + tailWag);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    // 尾巴的毛发效果
    ctx.strokeStyle = '#F8F8F8';
    ctx.lineWidth = 2;
    for(let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(-30 - i * 3, -10 + tailWag);
        ctx.lineTo(-35 - i * 2, -15 + tailWag);
        ctx.stroke();
    }

    // 绘制蓬松的身体
    const bodyGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 30);
    bodyGradient.addColorStop(0, '#FFFFFF');
    bodyGradient.addColorStop(1, '#F0F0F0');
    ctx.fillStyle = bodyGradient;
    // 更大更蓬松的身体
    ctx.beginPath();
    ctx.ellipse(0, 0, 30, 25, 0, 0, Math.PI * 2);
    ctx.fill();

    // 绘制毛发效果
    ctx.strokeStyle = '#F8F8F8';
    ctx.lineWidth = 2;
    for(let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        ctx.beginPath();
        ctx.moveTo(
            Math.cos(angle) * 25,
            Math.sin(angle) * 20
        );
        ctx.lineTo(
            Math.cos(angle) * 32,
            Math.sin(angle) * 26
        );
        ctx.stroke();
    }

    // 绘制萨摩耶特征的头部
    const headGradient = ctx.createRadialGradient(25, -10, 0, 25, -10, 22);
    headGradient.addColorStop(0, '#FFFFFF');
    headGradient.addColorStop(1, '#F0F0F0');
    ctx.fillStyle = headGradient;
    ctx.beginPath();
    ctx.arc(25, -10, 22, 0, Math.PI * 2); // 更大的头部
    ctx.fill();

    // 绘制标志性的萨摩耶微笑
    ctx.beginPath();
    ctx.moveTo(35, -8);
    ctx.quadraticCurveTo(40, -5, 45, -8);
    ctx.strokeStyle = '#FFB6C1';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 绘制特征性的三角形耳朵
    // 左耳
    ctx.beginPath();
    ctx.moveTo(15, -25);
    ctx.lineTo(10, -40);
    ctx.lineTo(25, -25);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    // 右耳
    ctx.beginPath();
    ctx.moveTo(35, -25);
    ctx.lineTo(30, -40);
    ctx.lineTo(45, -25);
    ctx.fill();

    // 绘制大眼睛
    // 白色眼球
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(20, -12, 6, 0, Math.PI * 2);
    ctx.arc(30, -12, 6, 0, Math.PI * 2);
    ctx.fill();
    // 黑色瞳孔
    ctx.fillStyle = 'black'; // 萨摩耶通常是黑色眼睛
    ctx.beginPath();
    ctx.arc(20, -12, 3, 0, Math.PI * 2);
    ctx.arc(30, -12, 3, 0, Math.PI * 2);
    ctx.fill();
    // 眼睛高光
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(21, -13, 1.5, 0, Math.PI * 2);
    ctx.arc(31, -13, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // 绘制黑色鼻子（萨摩耶特征）
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(40, -8, 4, 0, Math.PI * 2);
    ctx.fill();

    // 绘制蓬松的腿
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 8; // 更粗的腿部
    const frontLegSwing = Math.sin(legAngle) * 8;
    const backLegSwing = Math.sin(legAngle + Math.PI) * 8;

    // 前腿
    drawFluffyLeg(10, 15, 10 + frontLegSwing, 30);
    drawFluffyLeg(20, 15, 20 - frontLegSwing, 30);
    // 后腿
    drawFluffyLeg(-10, 15, -10 + backLegSwing, 30);
    drawFluffyLeg(-20, 15, -20 - backLegSwing, 30);

    ctx.restore();
}

// 添加蓬松腿部绘制辅助函数
function drawFluffyLeg(startX, startY, endX, endY) {
    // 主要腿部
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // 添加毛发效果
    ctx.strokeStyle = '#F8F8F8';
    ctx.lineWidth = 2;
    const dx = endX - startX;
    const dy = endY - startY;
    const angle = Math.atan2(dy, dx);
    
    for(let i = 0; i < 4; i++) {
        const t = i / 3;
        const x = startX + dx * t;
        const y = startY + dy * t;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(
            x + Math.cos(angle + Math.PI/2) * 5,
            y + Math.sin(angle + Math.PI/2) * 5
        );
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(
            x + Math.cos(angle - Math.PI/2) * 5,
            y + Math.sin(angle - Math.PI/2) * 5
        );
        ctx.stroke();
    }
}

// 添加背包按钮绘制函数
function drawBagButton() {
    // 绘制背包按钮背景
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(20, canvas.height - 80, 100, 40);
    
    // 绘制背包图标和文字
    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('🎒 背包', 35, canvas.height - 50);
}

// 添加背包界面绘制函数
function drawBag() {
    if (!gameState.showBag) return;

    // 绘制背包背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制标题
    ctx.fillStyle = 'white';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('皮肤背包', canvas.width/2, 60);

    // 显示商城币
    ctx.font = 'bold 25px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`商城币: ${gameState.shopCoins}`, 20, 100);

    // 绘制皮肤列表
    SKINS.forEach((skin, index) => {
        const x = canvas.width/4;
        const y = 150 + index * 100;
        
        // 皮肤框
        ctx.fillStyle = skin.id === gameState.currentSkin ? 
            'rgba(0, 255, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(x, y, canvas.width/2, 80);

        // 皮肤预览
        ctx.fillStyle = skin.color;
        ctx.beginPath();
        ctx.arc(x + 40, y + 40, 30, 0, Math.PI * 2);
        ctx.fill();

        // 皮肤信息
        ctx.fillStyle = 'white';
        ctx.font = '25px Arial';
        ctx.fillText(skin.name, x + 90, y + 35);
        ctx.font = '20px Arial';
        ctx.fillText(skin.description, x + 90, y + 60);

        // 状态/价格
        if (gameState.unlockedSkins.includes(skin.id)) {
            if (skin.id === gameState.currentSkin) {
                ctx.fillText('使用中', x + 300, y + 45);
            } else {
                ctx.fillText('点击使用', x + 300, y + 45);
            }
        } else {
            ctx.fillText(`${skin.price} 商城币`, x + 300, y + 45);
        }
    });

    // 绘制关闭按钮
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.fillText('×', canvas.width - 40, 40);
}

// 添加游戏启动代码
window.onload = function() {
    // 确保canvas和上下文都已经准备好
    if (canvas && ctx) {
        startGame();
    } else {
        console.error('Canvas或上下文未准备好');
    }
}; 