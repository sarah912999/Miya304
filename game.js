// 获取画布和上下文
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 游戏状态
let isGameRunning = true;
let lastTime = 0;

// 小鸟属性
const bird = {
    x: canvas.width / 4,
    y: canvas.height / 2,
    radius: 20,
    velocity: 0,
    gravity: 0.5,
    jumpStrength: -8
};

// 背景属性
const buildings = [];
initBuildings();

function initBuildings() {
    for (let i = 0; i < canvas.width; i += 80) {
        buildings.push({
            x: i,
            height: Math.random() * 200 + 200,
            width: 60
        });
    }
}

// 游戏主循环
function gameLoop(timestamp) {
    // 计算时间差
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    if (!isGameRunning) {
        requestAnimationFrame(gameLoop);
        return;
    }

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 更新和绘制
    updateGame(deltaTime);
    drawGame();
    
    // 继续循环
    requestAnimationFrame(gameLoop);
}

function updateGame(deltaTime) {
    // 更新小鸟位置
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;
    
    // 碰撞检测
    if (bird.y + bird.radius > canvas.height) {
        bird.y = canvas.height - bird.radius;
        gameOver();
    } else if (bird.y - bird.radius < 0) {
        bird.y = bird.radius;
            gameOver();
        }
    }

function drawGame() {
    // 绘制背景
    drawBackground();
    // 绘制小鸟
    drawBird();
    // 绘制分数等UI
    drawUI();
}

function drawBackground() {
    // 绘制天空
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制云朵
    ctx.fillStyle = 'white';
    drawClouds();
    
    // 绘制建筑物
    ctx.fillStyle = '#2F4F4F';
    buildings.forEach(building => {
        ctx.fillRect(building.x, canvas.height - building.height, building.width, building.height);
    });
}

function drawClouds() {
    const clouds = [
        {x: 100, y: 100},
        {x: 300, y: 150},
        {x: 500, y: 80},
        {x: 700, y: 120}
    ];
    
    clouds.forEach(cloud => {
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.arc(cloud.x + 20, cloud.y - 10, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.arc(cloud.x + 40, cloud.y, 30, 0, Math.PI * 2);
    ctx.fill();
    });
}

function drawBird() {
    ctx.save();
    ctx.translate(bird.x, bird.y);
    
    // 绘制小鸟身体
    ctx.beginPath();
    ctx.arc(0, 0, bird.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#FFD700';
    ctx.fill();
    
    // 绘制眼睛
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(8, -5, 3, 0, Math.PI * 2);
    ctx.fill();

    // 绘制嘴巴
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(25, 0);
    ctx.lineTo(15, 5);
    ctx.fillStyle = '#FF6B6B';
    ctx.fill();

    ctx.restore();
}

function drawUI() {
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText('点击或按空格键让小鸟跳跃', 10, 30);

    // 添加支付码显示
    const qrCode = new Image();
    qrCode.src = 'images/qrcode.png';
    qrCode.onload = () => {
        const qrSize = 100;  // 二维码大小
        const qrX = canvas.width - qrSize - 20;  // 右边距离
        const qrY = 20;  // 顶部距离
        
        // 绘制白色背景
        ctx.fillStyle = 'white';
        ctx.fillRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 40);
        
        // 绘制二维码
        ctx.drawImage(qrCode, qrX, qrY, qrSize, qrSize);
        
        // 添加文字说明
        ctx.fillStyle = 'black';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('打开支付宝[扫一扫]', qrX + qrSize/2, qrY + qrSize + 20);
    };
}

function gameOver() {
    isGameRunning = false;
    setTimeout(() => {
        alert('游戏结束！点击确定重新开始');
        resetGame();
    }, 100);
}

function resetGame() {
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    isGameRunning = true;
}

// 事件监听
function handleJump(event) {
    if (event.type === 'keydown' && event.code !== 'Space') {
            return;
        }

    if (isGameRunning) {
        bird.velocity = bird.jumpStrength;
    }
}

document.addEventListener('keydown', handleJump);
document.addEventListener('click', handleJump);

// 启动游戏
requestAnimationFrame(gameLoop); 