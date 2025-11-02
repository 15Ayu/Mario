const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// BGM用のaudio要素を取得
const bgm = document.getElementById('bgm');

// BGMファイルの読み込み確認
if (bgm) {
    bgm.addEventListener('loadeddata', () => {
        console.log('BGMファイルが読み込まれました');
    });
    bgm.addEventListener('error', (e) => {
        console.error('BGMファイルの読み込みエラー:', e);
        console.log('BGMファイルのパス:', bgm.querySelector('source')?.src);
    });
}

// ゲーム設定
const GRAVITY = 0.5;
const PLAYER_SPEED = 5;
const JUMP_POWER = 12;
const COIN_SCORE = 100;
const STAGE_LENGTH = 12000; // ステージの全長

// ゲームの状態
let gameState = 'playing';
let score = 0;
let scrollOffset = 0;
let lastPlatformX = 0;
let lastObstacleX = 0;

// Gamepad関連の変数
let gamepad = null;
let gamepadConnected = false;
let gamepadButtons = {
    left: false,   // 左ボタン（Enter）
    right: false,  // 右ボタン（ジャンプ）
    leftPressed: false,
    rightPressed: false
};

// BGM再生フラグ（ユーザー操作後に再生開始）
let bgmStarted = false;
let connectionStability = {
    lastCheckTime: 0,
    checkInterval: 1000, // 1秒間隔でチェック
    consecutiveFailures: 0,
    maxFailures: 3
};

// 新しいゲームモード関連の変数 (timedモード用)
let gameMode = 'timed'; // このファイルはtimedモード
let startTime = 0;
let remainingTime = 0; // 制限時間用
let timerInterval = null; // タイマーのID
let timerStarted = false; // タイマーが開始されたかどうか

// 統計カウンター
let obstacleCollisions = 0; // ブロック衝突数
let enemyCollisions = 0; // 敵衝突数
let coinsCollected = 0; // 獲得コイン数

// --- クラス定義 ---
class Player {
    constructor() {
        this.position = { x: 100, y: 350 }; // 地面（y=400）の上に配置
        this.velocity = { x: 0, y: 0 };
        this.width = 40; // 少し大きめに
        this.height = 60; // 少し大きめに
        this.onGround = false; // 地面にいるかどうか
    }
    draw(offset) {
        const x = this.position.x - offset;
        const y = this.position.y;
        const w = this.width;
        const h = this.height;
        
        ctx.save();
        
        // うめこの画像が読み込まれている場合は、画像を描画
        if (umekoImage && umekoImage.complete) {
            ctx.drawImage(umekoImage, x, y, w, h);
        } else {
            // 画像が読み込まれていない場合は、ピクセルアートで描画（フォールバック）
            
            // 帽子（赤）
            ctx.fillStyle = '#E60012';
            // 帽子のてっぺん
            ctx.fillRect(x + w*0.2, y, w*0.6, h*0.10);
            // 帽子の縁（つば）
            ctx.fillRect(x + w*0.1, y + h*0.10, w*0.8, h*0.06);
            // 帽子の白いハイライト
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(x + w*0.35, y + h*0.02, w*0.10, h*0.06);
            
            // 顔（肌色）
            ctx.fillStyle = '#FFDBAC';
            ctx.fillRect(x + w*0.2, y + h*0.16, w*0.6, h*0.28);
            
            // もみあげ（髪）
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(x + w*0.15, y + h*0.16, w*0.08, h*0.10);
            ctx.fillRect(x + w*0.77, y + h*0.16, w*0.08, h*0.10);
            
            // 目（白い四角に黒い瞳）- 右目のみ見える
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(x + w*0.60, y + h*0.22, w*0.08, h*0.08);
            ctx.fillStyle = '#000000';
            ctx.fillRect(x + w*0.62, y + h*0.24, w*0.04, h*0.04);
            
            // 鼻（肌色）
            ctx.fillStyle = '#FFCC99';
            ctx.fillRect(x + w*0.50, y + h*0.30, w*0.06, h*0.06);
            
            // 口ひげ（濃い茶色）
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(x + w*0.20, y + h*0.36, w*0.60, h*0.10);
            
            // 赤いシャツ
            ctx.fillStyle = '#E60012';
            // 体部分
            ctx.fillRect(x + w*0.2, y + h*0.46, w*0.6, h*0.30);
            // 左腕（体の横に自然に下がる）
            ctx.fillRect(x - w*0.05, y + h*0.30, w*0.20, h*0.20);
            // 右腕（少し前に、自然に下がる）
            ctx.fillRect(x + w*0.85, y + h*0.28, w*0.20, h*0.20);
            
            // オーバーオール（青）
            ctx.fillStyle = '#0066FF';
            // オーバーオールのズボン部分
            ctx.fillRect(x + w*0.15, y + h*0.68, w*0.7, h*0.32);
            // オーバーオールの胸元部分
            ctx.fillRect(x + w*0.25, y + h*0.46, w*0.5, h*0.22);
            
            // オーバーオールのストラップ（青）
            ctx.fillStyle = '#0066FF';
            // 左ストラップ
            ctx.fillRect(x + w*0.15, y + h*0.16, w*0.10, h*0.30);
            ctx.fillRect(x + w*0.15, y + h*0.46, w*0.15, h*0.08);
            // 右ストラップ
            ctx.fillRect(x + w*0.75, y + h*0.16, w*0.10, h*0.30);
            ctx.fillRect(x + w*0.70, y + h*0.46, w*0.15, h*0.08);
            
            // ボタン（黄色）
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(x + w*0.38, y + h*0.54, w*0.06, h*0.06);
            ctx.fillRect(x + w*0.56, y + h*0.54, w*0.06, h*0.06);
            
            // 手袋（白）
            ctx.fillStyle = '#FFFFFF';
            // 左手
            ctx.fillRect(x - w*0.05, y + h*0.48, w*0.20, h*0.12);
            // 右手
            ctx.fillRect(x + w*0.85, y + h*0.46, w*0.20, h*0.12);
            
            // 靴（茶色）
            ctx.fillStyle = '#654321';
            // 左足
            ctx.fillRect(x - w*0.03, y + h*0.96, w*0.46, h*0.04);
            // 右足
            ctx.fillRect(x + w*0.57, y + h*0.96, w*0.46, h*0.04);
        }
        
        ctx.restore();
    }
    applyGravity() { this.velocity.y += GRAVITY; }
}

class Platform {
    constructor({ x, y, width }) { this.position = { x, y }; this.width = width; this.height = 30; }
    draw(offset) {
        drawBrickPattern(this.position.x, this.position.y, this.width, this.height, offset);
    }
}

class Coin {
    constructor({ x, y }) { this.position = { x, y }; this.radius = 15; this.active = true; }
    draw(offset) { 
        if (!this.active) return; 
        const x = this.position.x - offset;
        const y = this.position.y;
        const r = this.radius;
        
        ctx.save();
        
        // 外側の縁（盛り上がったリム）- 明るい金色
        const rimGradient = ctx.createRadialGradient(x, y, r * 0.7, x, y, r);
        rimGradient.addColorStop(0, '#FFD700'); // 明るい金色
        rimGradient.addColorStop(1, '#FFA500'); // オレンジ金色
        ctx.fillStyle = rimGradient;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        
        // 内側のコイン本体（やや暗めの金色）
        const bodyGradient = ctx.createRadialGradient(x - r/4, y - r/4, 0, x, y, r * 0.85);
        bodyGradient.addColorStop(0, '#FFD700'); // 明るい金色
        bodyGradient.addColorStop(0.6, '#FFA500'); // オレンジ金色
        bodyGradient.addColorStop(1, '#DAA520'); // ダークゴールド
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.arc(x, y, r * 0.85, 0, Math.PI * 2);
        ctx.fill();
        
        // 中央の縦長長方形（浮き上がっているように見える）- より明るい金色
        const rectWidth = r * 0.3;
        const rectHeight = r * 0.8;
        const rectX = x - rectWidth / 2;
        const rectY = y - rectHeight / 2;
        
        // 長方形の影（下側）
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(rectX + 1, rectY + rectHeight * 0.6, rectWidth, rectHeight * 0.4);
        
        // 長方形本体（明るい金色、グラデーション）- 角を丸く
        const rectGradient = ctx.createLinearGradient(rectX, rectY, rectX, rectY + rectHeight);
        rectGradient.addColorStop(0, '#FFF8DC'); // 非常に明るい金色
        rectGradient.addColorStop(0.5, '#FFD700'); // 明るい金色
        rectGradient.addColorStop(1, '#FFA500'); // オレンジ金色
        ctx.fillStyle = rectGradient;
        const cornerRadius = r * 0.1;
        ctx.beginPath();
        ctx.moveTo(rectX + cornerRadius, rectY);
        ctx.lineTo(rectX + rectWidth - cornerRadius, rectY);
        ctx.quadraticCurveTo(rectX + rectWidth, rectY, rectX + rectWidth, rectY + cornerRadius);
        ctx.lineTo(rectX + rectWidth, rectY + rectHeight - cornerRadius);
        ctx.quadraticCurveTo(rectX + rectWidth, rectY + rectHeight, rectX + rectWidth - cornerRadius, rectY + rectHeight);
        ctx.lineTo(rectX + cornerRadius, rectY + rectHeight);
        ctx.quadraticCurveTo(rectX, rectY + rectHeight, rectX, rectY + rectHeight - cornerRadius);
        ctx.lineTo(rectX, rectY + cornerRadius);
        ctx.quadraticCurveTo(rectX, rectY, rectX + cornerRadius, rectY);
        ctx.closePath();
        ctx.fill();
        
        // 長方形のハイライト（上部）
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = 0.6;
        ctx.fillRect(rectX, rectY, rectWidth, rectHeight * 0.3);
        ctx.globalAlpha = 1.0;
        
        // 外側の縁のハイライト（上部左側）
        const highlightGradient = ctx.createRadialGradient(x - r*0.3, y - r*0.3, 0, x, y, r);
        highlightGradient.addColorStop(0, '#FFFFFF');
        highlightGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.5)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = highlightGradient;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

class Enemy {
    constructor({ x, y, platform }) { this.position = { x, y }; this.velocity = { x: -2, y: 0 }; this.width = 40; this.height = 40; this.patrolRange = { left: platform.position.x, right: platform.position.x + platform.width - this.width }; this.collided = false; }
    draw(offset) { 
        const x = this.position.x - offset;
        const y = this.position.y;
        const w = this.width;
        const h = this.height;
        
        // 👾エイリアンのような見た目
        // 体（紫）
        ctx.fillStyle = '#8B00FF';
        ctx.fillRect(x + w*0.1, y + h*0.2, w*0.8, h*0.6);
        
        // 目（白）
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(x + w*0.25, y + h*0.35, w*0.15, 0, Math.PI * 2);
        ctx.arc(x + w*0.75, y + h*0.35, w*0.15, 0, Math.PI * 2);
        ctx.fill();
        
        // 瞳（黒）
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(x + w*0.25, y + h*0.35, w*0.08, 0, Math.PI * 2);
        ctx.arc(x + w*0.75, y + h*0.35, w*0.08, 0, Math.PI * 2);
        ctx.fill();
        
        // 脚（4本）
        ctx.fillStyle = '#8B00FF';
        ctx.fillRect(x + w*0.1, y + h*0.8, w*0.15, h*0.2);
        ctx.fillRect(x + w*0.35, y + h*0.8, w*0.15, h*0.2);
        ctx.fillRect(x + w*0.5, y + h*0.8, w*0.15, h*0.2);
        ctx.fillRect(x + w*0.75, y + h*0.8, w*0.15, h*0.2);
    }
    update() { this.position.x += this.velocity.x; if (this.position.x <= this.patrolRange.left || this.position.x >= this.patrolRange.right) { this.velocity.x *= -1; } }
}

class Obstacle {
    constructor({ x, y }) { this.position = { x, y }; this.velocity = { x: -3, y: 0 }; this.width = 50; this.height = 50; this.collided = false; }
    draw(offset) { 
        const x = this.position.x - offset;
        const y = this.position.y;
        const w = this.width;
        const h = this.height;
        
        // 黒いミサイル風ロケット（横向き）
        ctx.save();
        
        // ロケット本体（黒、横向き）
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.moveTo(x, y + h/2); // 左先端（進行方向）
        ctx.lineTo(x + w*0.6, y + h*0.25); // 上側
        ctx.lineTo(x + w*0.8, y + h*0.25); // 上側後
        ctx.lineTo(x + w, y + h*0.15); // 右尾翼（上）
        ctx.lineTo(x + w*0.9, y + h/2); // 中央後
        ctx.lineTo(x + w, y + h*0.85); // 右尾翼（下）
        ctx.lineTo(x + w*0.8, y + h*0.75); // 下側後
        ctx.lineTo(x + w*0.6, y + h*0.75); // 下側
        ctx.closePath();
        ctx.fill();
        
        // 中央部分（少し明るいグレー）
        ctx.fillStyle = '#333';
        ctx.fillRect(x + w*0.2, y + h*0.3, w*0.4, h*0.4);
        
        // 先端部分（ダークグレー）
        ctx.fillStyle = '#2a2a2a';
        ctx.beginPath();
        ctx.moveTo(x, y + h/2);
        ctx.lineTo(x + w*0.2, y + h*0.3);
        ctx.lineTo(x + w*0.2, y + h*0.7);
        ctx.closePath();
        ctx.fill();
        
        // 尾翼のライン（シルバー）
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + w*0.6, y + h*0.25);
        ctx.lineTo(x + w, y + h*0.15);
        ctx.moveTo(x + w*0.6, y + h*0.75);
        ctx.lineTo(x + w, y + h*0.85);
        ctx.stroke();
        
        ctx.restore();
    }
    update() { this.position.x += this.velocity.x; }
}

class Cloud {
    constructor({ x, y, size }) { this.position = { x, y }; this.size = size; }
    draw(offset) {
        const x = this.position.x - offset * 0.5;
        const y = this.position.y;
        const s = this.size;
        
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(x, y, s, 0, Math.PI * 2);
        ctx.arc(x + s, y, s, 0, Math.PI * 2);
        ctx.arc(x - s, y, s, 0, Math.PI * 2);
        ctx.arc(x + s/2, y - s/2, s*0.7, 0, Math.PI * 2);
        ctx.arc(x - s/2, y - s/2, s*0.7, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Mountain {
    constructor({ x, y, width, height, colorIndex }) {
        this.position = { x, y };
        this.width = width;
        this.height = height;
        this.colorIndex = colorIndex || 0; // 色のインデックス（0, 1, 2）
    }
    draw(offset) {
        const groundY = 400;
        const x = this.position.x - offset * 0.3;
        const y = groundY - this.height; // 地面の上に配置
        const w = this.width;
        const h = this.height;
        
        // 画面内にあるかチェック（より緩い条件）
        if (x + w < -100 || x > canvas.width + 100) return;
        
        // 2色のパレット（黄緑と緑）
        const colors = [
            '#9ACD32', // 黄緑
            '#228B22'  // 緑
        ];
        
        ctx.fillStyle = colors[this.colorIndex % colors.length];
        ctx.beginPath();
        // 三角形の基本形（頂点付近の角を丸くした形）
        ctx.moveTo(x, groundY);
        // 左側の辺（直線で上昇）
        ctx.lineTo(x + w*0.4, groundY - h*0.85);
        // 頂点付近を丸く（左側から頂点へ）
        ctx.quadraticCurveTo(x + w*0.45, groundY - h, x + w*0.5, groundY - h);
        // 頂点付近を丸く（頂点から右側へ）
        ctx.quadraticCurveTo(x + w*0.55, groundY - h, x + w*0.6, groundY - h*0.85);
        // 右側の辺（直線で下降）
        ctx.lineTo(x + w, groundY);
        ctx.closePath();
        ctx.fill();
    }
    
    // 他の山と被っているかチェック
    overlaps(other) {
        const margin = 50; // 被りのマージン
        return !(this.position.x + this.width + margin < other.position.x || 
                 other.position.x + other.width + margin < this.position.x);
    }
}

// --- 変数定義 ---
let player, platforms, coins, enemies, obstacles, clouds, mountains;
let keys = { right: { pressed: false }, left: { pressed: false } };
let umekoImage = null; // うめこの画像

// --- 初期化 ---
function init() {
    gameState = 'playing';
    score = 0;
    scrollOffset = 0;
    keys.right.pressed = false;
    keys.left.pressed = false;
    // BGMフラグをリセット（リスタート時にも再生できるように）
    bgmStarted = false;
    player = new Player();
    // プレイヤーを地面の上に配置（サイズが大きくなったので調整）
    player.position.y = 400 - player.height;
    const groundY = 400;
    platforms = []; // 最初の足場は不要（邪魔なので削除）
    coins = []; enemies = []; obstacles = []; clouds = []; mountains = [];
    lastPlatformX = 0; // 最初の足場がないので0から開始
    lastObstacleX = 700;
    for (let i = 0; i < 70; i++) { // 70個の雲を生成（さらに増加）
        clouds.push(new Cloud({ x: Math.random() * 50000, y: Math.random() * 150, size: Math.random() * 20 + 10 }));
    }
    
    // 山をランダムに生成（初期生成）
    let lastMountainX = -500;
    while (lastMountainX < canvas.width + 1000) {
        const gap = Math.random() * 600 + 300; // 山の間隔（ランダム）
        const width = Math.random() * 200 + 150; // 山の幅（ランダム）
        const height = Math.random() * 150 + 100; // 山の高さ（ランダム）
        const colorIndex = Math.floor(Math.random() * 2); // ランダムな色
        
        const newX = lastMountainX + gap;
        const mountain = new Mountain({ 
            x: newX, 
            y: groundY, 
            width: width, 
            height: height,
            colorIndex: colorIndex
        });
        
        // 他の山と重ならないかチェック
        let overlaps = false;
        for (const existingMountain of mountains) {
            if (mountain.overlaps(existingMountain)) {
                overlaps = true;
                break;
            }
        }
        
        if (!overlaps) {
            mountains.push(mountain);
            lastMountainX = newX + width;
        } else {
            lastMountainX += gap; // 被っている場合は位置を進める
        }
    }

    // 統計カウンターをリセット
    obstacleCollisions = 0;
    enemyCollisions = 0;
    coinsCollected = 0;

    // timedモードの初期化
    startTime = Date.now();
    if (timerInterval) clearInterval(timerInterval); // 既存のタイマーがあればクリア

    remainingTime = 60; // 60秒
    timerStarted = false; // タイマーはまだ開始していない（最初の操作を待つ）

    // BGMを再生開始（ループ再生）
    startBGM();
}

// BGM再生開始関数
function startBGM() {
    if (bgm && !bgmStarted) {
        bgm.volume = 0.5; // 音量を50%に設定（お好みで調整してください）
        bgm.currentTime = 0; // 再生位置を最初に戻す
        bgm.play().then(() => {
            bgmStarted = true;
            console.log('BGMが再生されました');
        }).catch(error => {
            // 自動再生がブロックされた場合のエラーハンドリング
            console.log('BGMの自動再生がブロックされました。ユーザーの操作が必要です:', error);
        });
    } else if (bgm && bgmStarted) {
        // 既に開始されている場合は再生を続ける
        if (bgm.paused) {
            bgm.play().catch(error => {
                console.log('BGMの再生に失敗しました:', error);
            });
        }
    }
}

// BGM停止関数
function stopBGM() {
    if (bgm && !bgm.paused) {
        bgm.pause();
        bgm.currentTime = 0; // 再生位置を最初に戻す
        console.log('BGMが停止されました');
    }
}

// タイマー開始関数（最初の操作で呼び出される）
function startTimer() {
    if (!timerStarted && gameState === 'playing') {
        timerStarted = true;
        startTime = Date.now();
        timerInterval = setInterval(() => {
            if (gameState === 'playing') {
                remainingTime--;
                if (remainingTime <= 0) {
                    gameState = 'gameOver';
                    clearInterval(timerInterval);
                    // ゲームオーバー時にBGMを停止
                    stopBGM();
                }
            }
        }, 1000);
        console.log('タイマーが開始されました');
    }
}

// --- 背景描画 ---
function drawBackground(offset) {
    // 空（グラデーション）
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGradient.addColorStop(0, '#87CEEB'); // 空色
    skyGradient.addColorStop(1, '#E0F6FF'); // 薄い空色
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 地面（2段分の柄を水平表示）
    const groundY = 400;
    const groundHeight = canvas.height - groundY;
    
    // 地面を描画（2段分だけ）
    drawGroundPattern(offset, groundY, groundHeight);
}

// レンガ柄を描画するヘルパー関数（足場用）
function drawBrickPattern(x, y, width, height, offset) {
    const brickWidth = 40;
    const brickHeight = 20;
    const brickGap = 4;
    const brickColor1 = '#A0522D'; // シエナ
    const brickColor2 = '#8B4513'; // サドルブラウン

    ctx.save();
    ctx.beginPath();
    ctx.rect(x - offset, y, width, height);
    ctx.clip(); // 描画範囲をプラットフォームの領域に限定

    for (let i = 0; i * brickHeight < height; i++) {
        let rowOffset = (i % 2) * (brickWidth / 2); // 互い違いにするためのオフセット
        for (let j = 0; j * brickWidth < width + brickWidth; j++) {
            const brickX = x - offset + j * brickWidth + rowOffset;
            const brickY = y + i * brickHeight;

            ctx.fillStyle = (j + i) % 2 === 0 ? brickColor1 : brickColor2;
            ctx.fillRect(brickX + brickGap / 2, brickY + brickGap / 2, brickWidth - brickGap, brickHeight - brickGap);
        }
    }
    ctx.restore();
}

// 地面用の柄を描画するヘルパー関数（2段分、正方形のみ、水平表示）
function drawGroundPattern(offset, groundY, groundHeight) {
    const blockSize = 40;
    const dirtColor1 = '#8B4513'; // サドルブラウン
    const dirtColor2 = '#A0522D'; // シエナ

    ctx.save();
    
    // 2段分だけ描画するためのクリップ領域
    ctx.beginPath();
    ctx.rect(0, groundY, canvas.width, blockSize * 2);
    ctx.clip();

    // 2段分だけ描画（地面の上部2段のみ）
    for (let i = 0; i < 2; i++) {
        const blockY = groundY + i * blockSize;
        
        // 画面幅+余分なブロックを描画してスクロールに対応
        const numBlocks = Math.ceil(canvas.width / blockSize) + 2;
        const scrollOffset = offset * 0.7;
        const startX = -(scrollOffset % blockSize);
        
        for (let j = -1; j < numBlocks; j++) {
            const blockX = startX + j * blockSize;
            
            // 地面ブロック（正方形、チェッカーボードパターン）
            ctx.fillStyle = ((Math.floor((blockX + scrollOffset) / blockSize) + i) % 2 === 0) ? dirtColor1 : dirtColor2;
            ctx.fillRect(blockX, blockY, blockSize, blockSize);
        }
    }
    
    ctx.restore();
}

// --- メッセージ・スコア描画 ---
function drawMessage(message, subMessage, finalScore) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = '60px sans-serif';
    ctx.fillText(message, canvas.width / 2, canvas.height / 2 - 120);
    
    if (gameMode === 'timed' && gameState === 'gameOver') {
        ctx.font = '30px sans-serif';
        ctx.fillText('獲得スコア:', canvas.width / 2, canvas.height / 2 - 60);
        ctx.fillText(`${finalScore}`, canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = '24px sans-serif';
        ctx.fillText(`ブロック衝突: ${obstacleCollisions}回`, canvas.width / 2, canvas.height / 2 + 20);
        ctx.fillText(`敵衝突: ${enemyCollisions}回`, canvas.width / 2, canvas.height / 2 + 50);
        ctx.fillText(`獲得コイン: ${coinsCollected}個`, canvas.width / 2, canvas.height / 2 + 80);
        ctx.font = '20px sans-serif';
        ctx.fillText(subMessage, canvas.width / 2, canvas.height / 2 + 120);
    } else if (finalScore !== undefined) {
        ctx.font = '30px sans-serif';
        ctx.fillText(`スコア: ${finalScore}`, canvas.width / 2, canvas.height / 2);
        ctx.font = '24px sans-serif';
        ctx.fillText(subMessage, canvas.width / 2, canvas.height / 2 + 50);
    }
}

function drawScore() {
    ctx.fillStyle = 'black';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`スコア: ${score}`, 20, 40);
    if (gameMode === 'timed') {
        if (timerStarted) {
            ctx.fillText(`残り時間: ${remainingTime}秒`, 20, 70);
        } else {
            ctx.fillText(`準備中... ボタンを押して開始`, 20, 70);
        }
    }
    
    // コントローラー接続状態の表示
    if (gamepadConnected) {
        ctx.fillStyle = 'green';
        ctx.font = '16px sans-serif';
        ctx.fillText('コントローラー接続中', 20, 100);
    } else {
        ctx.fillStyle = 'red';
        ctx.font = '16px sans-serif';
        ctx.fillText('コントローラー未接続', 20, 100);
    }
}

// コントローラー状態表示用の関数
function showGamepadStatus(message, type) {
    const statusElement = document.getElementById('gamepadStatus');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.style.color = type === 'success' ? 'green' : 'red';
    }
    console.log(message);
}

// デバッグ用：コントローラー情報を表示
function debugGamepadInfo() {
    console.log("=== ゲームパッド状態チェック ===");
    
    // Gamepad APIのサポート状況をチェック
    if (!navigator.getGamepads) {
        console.log("❌ このブラウザはGamepad APIをサポートしていません");
        console.log("推奨ブラウザ: Chrome, Firefox, Edge");
        return [];
    }
    
    const gamepads = navigator.getGamepads();
    let connectedCount = 0;
    let actualGamepads = [];
    
    console.log("ブラウザ:", navigator.userAgent);
    console.log("Gamepad API サポート: ✓");
    console.log("総スロット数:", gamepads.length);
    
    for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i]) {
            if (gamepads[i].connected) {
                connectedCount++;
                actualGamepads.push(gamepads[i]);
                console.log(`✓ 接続済みゲームパッド ${i}:`, {
                    id: gamepads[i].id,
                    connected: gamepads[i].connected,
                    buttons: gamepads[i].buttons.length,
                    axes: gamepads[i].axes.length,
                    mapping: gamepads[i].mapping
                });
            } else {
                console.log(`✗ 未接続スロット ${i}:`, gamepads[i].id || "不明");
            }
        }
    }
    
    console.log(`実際に接続されているコントローラー数: ${connectedCount}`);
    
    if (connectedCount === 0) {
        console.log("⚠️ コントローラーが接続されていません");
        console.log("詳細な接続手順:");
        
        // Mac用の特別な手順
        if (navigator.platform.includes('Mac')) {
            console.log("🍎 Mac用の接続手順:");
            console.log("1. XBOX360コントローラーをUSBケーブルで接続");
            console.log("2. システム環境設定 > ゲームコントローラーで認識されているか確認");
            console.log("3. コントローラーのXboxボタンを押して接続を安定化");
            console.log("4. このページを更新する");
            console.log("5. 接続が不安定な場合:");
            console.log("   - コントローラーを一度抜いて再度接続");
            console.log("   - Safariブラウザを試す（Macで最も安定）");
            console.log("   - システム環境設定でコントローラーを削除して再認識");
        } else {
            console.log("1. XBOX360コントローラーをUSBケーブルで接続");
            console.log("2. Windowsの場合: デバイスマネージャーでコントローラーが認識されているか確認");
            console.log("3. コントローラーの任意のボタンを押す（Xboxボタン、Aボタンなど）");
            console.log("4. このページを更新する");
            console.log("5. それでも接続されない場合:");
            console.log("   - Chromeブラウザを使用");
            console.log("   - ブラウザを完全に再起動");
            console.log("   - コントローラーのドライバーを更新");
        }
    }
    
    return actualGamepads;
}

// --- オブジェクト生成 ---
function generateObjects() {
    // 山の生成（無限に生成）
    const groundY = 400;
    let furthestMountainX = mountains.length > 0 ? Math.max(...mountains.map(m => m.position.x + m.width)) : 0;
    while (furthestMountainX < scrollOffset + canvas.width + 1000) {
        const gap = Math.random() * 600 + 300; // 山の間隔（ランダム）
        const width = Math.random() * 200 + 150; // 山の幅（ランダム）
        const height = Math.random() * 150 + 100; // 山の高さ（ランダム）
        const colorIndex = Math.floor(Math.random() * 2); // ランダムな色
        
        const newX = furthestMountainX + gap;
        const mountain = new Mountain({ 
            x: newX, 
            y: groundY, 
            width: width, 
            height: height,
            colorIndex: colorIndex
        });
        
        // 他の山と重ならないかチェック
        let overlaps = false;
        for (const existingMountain of mountains) {
            if (mountain.overlaps(existingMountain)) {
                overlaps = true;
                break;
            }
        }
        
        if (!overlaps) {
            mountains.push(mountain);
            furthestMountainX = newX + width;
        } else {
            furthestMountainX += gap; // 被っている場合は位置を進める
        }
    }
    
    // プラットフォームと付随オブジェクトの生成（無限に生成）
    while (lastPlatformX < scrollOffset + canvas.width + 200) {
        const gap = Math.random() * 200 + 100;
        const width = Math.random() * 250 + 150;
        const newX = lastPlatformX + gap;
        // 足場は地面にかぶらないように生成（足場のheight=30を考慮して、y + 30 < 400、つまりy < 370）
        // 低めの位置に生成（150から300の間）- 高すぎないように
        const platformHeight = 30;
        const maxY = groundY - platformHeight; // 370以下
        const minY = 150; // 最低位置を150に設定（低めに）
        const maxPlatformY = Math.min(maxY, 300); // 最大でも300まで（高すぎないように）
        const newY = Math.random() * (maxPlatformY - minY) + minY; // 150から300の間
        const platform = new Platform({ x: newX, y: newY, width: width });
        platforms.push(platform);
        
        // 足場ごとにランダムな数のコインを生成（1-3個）
        const coinCount = Math.floor(Math.random() * 3) + 1; // 1から3個
        const coinSpacing = width / (coinCount + 1); // 均等に配置
        
        const rand = Math.random();
        if (rand < 0.7) { // コインを配置する確率
            for (let i = 0; i < coinCount; i++) {
                coins.push(new Coin({ 
                    x: newX + coinSpacing * (i + 1), 
                    y: newY - 40 
                }));
            }
        } else if (rand < 0.95) { 
            enemies.push(new Enemy({ x: newX + width / 2, y: newY - 40, platform: platform })); 
        }
        lastPlatformX = newX + width;
    }
    // 浮遊障害物の生成（無限に生成）
    while (lastObstacleX < scrollOffset + canvas.width + 200) {
        const gap = Math.random() * 400 + 400;
        const newX = lastObstacleX + gap;
        const newY = Math.random() * (canvas.height - 150) + 50;
        obstacles.push(new Obstacle({ x: newX, y: newY }));
        lastObstacleX = newX;
    }
}

// --- ゲームループ ---
function animate() {
    requestAnimationFrame(animate);

    // Gamepadの入力処理 - LR版（右スティックと十字ボタン）
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    let connectedGamepad = null;
    
    // 接続されているゲームパッドを探す
    for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i] && gamepads[i].connected) {
            connectedGamepad = gamepads[i];
            break;
        }
    }
    
    if (connectedGamepad) {
        gamepad = connectedGamepad;
        if (!gamepadConnected) {
            gamepadConnected = true;
            showGamepadStatus("コントローラーが接続されました", "success");
        }
        
        // 右スティックのX軸（移動）- axes[2]が右スティックのX軸
        const rightStickX = gamepad.axes[2];
        if (rightStickX < -0.5) { // 左に倒す
            keys.left.pressed = true;
            keys.right.pressed = false;
            // タイマーを開始
            startTimer();
        } else if (rightStickX > 0.5) { // 右に倒す
            keys.right.pressed = true;
            keys.left.pressed = false;
            // タイマーを開始
            startTimer();
        } else { // ニュートラル
            keys.left.pressed = false;
            keys.right.pressed = false;
        }

        // 十字ボタンの右ボタン（DPad Right、インデックス15）でジャンプ
        if (gamepad.buttons[15] && gamepad.buttons[15].pressed) {
            if (!gamepadButtons.rightPressed && gameState === 'playing') {
                // ジャンプ条件を緩和
                if (player.velocity.y === 0 || player.velocity.y > -2) {
                    player.velocity.y = -JUMP_POWER;
                    gamepadButtons.rightPressed = true;
                }
            }
            // BGMを開始
            startBGM();
            // タイマーを開始
            startTimer();
        } else {
            gamepadButtons.rightPressed = false;
        }

        // 十字ボタンの左ボタン（DPad Left、インデックス14）でEnter
        if (gamepad.buttons[14] && gamepad.buttons[14].pressed) {
            if (!gamepadButtons.leftPressed) {
                if (gameState !== 'playing') {
                    init(); // ゲームリスタート
                }
                gamepadButtons.leftPressed = true;
            }
            // BGMを開始
            startBGM();
        } else {
            gamepadButtons.leftPressed = false;
        }
    } else {
        if (gamepadConnected) {
            gamepadConnected = false;
            showGamepadStatus("コントローラーが切断されました", "error");
        }
        gamepad = null;
    }

    if (gameState === 'playing') {
        // 最初の操作でタイマーを開始
        if (keys.right.pressed || keys.left.pressed) {
            startTimer();
        }
        
        // 1. 入力
        if (keys.right.pressed) player.velocity.x = PLAYER_SPEED; else if (keys.left.pressed) player.velocity.x = -PLAYER_SPEED; else player.velocity.x = 0;
        
        // 2. 更新
        player.applyGravity();
        player.position.x += player.velocity.x;
        player.position.y += player.velocity.y;
        enemies.forEach(e => e.update());
        obstacles.forEach(o => o.update());

        // 3. 衝突判定
        // Y軸: 地面（y=400）- プレイヤーのサイズが大きくなったので位置を調整
        const groundY = 400;
        player.onGround = false;
        
        if (player.position.y + player.height > groundY) {
            player.velocity.y = 0;
            player.position.y = groundY - player.height;
            player.onGround = true;
        }
        
        // Y軸: 天井
        if (player.position.y < 0) { player.position.y = 0; player.velocity.y = 0; }

        // 足場との衝突判定 (ジャンプスルー)
        platforms.forEach(p => {
            if (player.position.x + player.width > p.position.x && player.position.x < p.position.x + p.width) {
                if (player.velocity.y > 0 && // 落下中
                    (player.position.y + player.height) >= p.position.y && // 現在の足がめり込んでいる
                    (player.position.y + player.height - player.velocity.y) <= p.position.y && // 1フレーム前は足が上だった
                    p.position.y < groundY // 地面より上にある場合のみ
                ) {
                    player.velocity.y = 0;
                    player.position.y = p.position.y - player.height;
                    player.onGround = true;
                }
            }
        });

        // その他の衝突判定
        obstacles.forEach(o => { 
            const isColliding = player.position.x < o.position.x + o.width && player.position.x + player.width > o.position.x && player.position.y < o.position.y + o.height && player.position.y + player.height > o.position.y;
            if (isColliding && !o.collided) { 
                score -= 100; 
                if (score < 0) score = 0; 
                obstacleCollisions++;
                o.collided = true; 
            } else if (!isColliding) {
                o.collided = false;
            }
        });
        enemies.forEach((e, i) => { 
            const isColliding = player.position.x < e.position.x + e.width && player.position.x + player.width > e.position.x && player.position.y < e.position.y + e.height && player.position.y + player.height > e.position.y;
            if (isColliding) { 
                if (player.velocity.y > 0 && player.position.y + player.height - player.velocity.y <= e.position.y && !e.collided) { 
                    enemies.splice(i, 1); 
                    score += 200; 
                    player.velocity.y = -JUMP_POWER / 2; 
                } else if (!e.collided) { 
                    score -= 200; 
                    if (score < 0) score = 0; 
                    enemyCollisions++;
                    e.collided = true; 
                }
            } else {
                e.collided = false;
            }
        });
        if (gameState === 'playing') { coins.forEach(c => { if (c.active) { const dist = Math.hypot(player.position.x + player.width/2 - c.position.x, player.position.y+player.height/2 - c.position.y); if (dist < player.width / 2 + c.radius) { c.active = false; score += COIN_SCORE; coinsCollected++; } } }); }
        // 落下したら少し後ろに戻す
        if (player.position.y > groundY + 100) { player.position.x -= 50; player.position.y = groundY - player.height; player.velocity = { x: 0, y: 0 }; }

        // 4. カメラとオブジェクト管理
        if (player.position.x > scrollOffset + canvas.width / 3) scrollOffset = player.position.x - canvas.width / 3;
        if (player.position.x < scrollOffset) player.position.x = scrollOffset;
        generateObjects();
        platforms = platforms.filter(p => p.position.x + p.width > scrollOffset);
        clouds = clouds.filter(c => c.position.x - scrollOffset * 0.5 + c.size * 2 > 0); // 画面外に出た雲を削除
        mountains = mountains.filter(m => m.position.x - scrollOffset * 0.3 + m.width > 0); // 画面外に出た山を削除
        coins = coins.filter(c => c.position.x + c.radius > scrollOffset);
        enemies = enemies.filter(e => e.position.x + e.width > scrollOffset);
        obstacles = obstacles.filter(o => o.position.x + o.width > scrollOffset);
    }

    // --- 描画処理 ---
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground(scrollOffset); // 背景を描画
    
    // 雲を描画（背景レイヤー）
    clouds.forEach(c => {
        if (c.position.x - scrollOffset * 0.5 + c.size * 2 > 0 && c.position.x - scrollOffset * 0.5 - c.size * 2 < canvas.width) {
            c.draw(scrollOffset);
        }
    });
    
    // 山を描画（雲の後、地面の前の背景レイヤー）
    mountains.forEach(m => {
        m.draw(scrollOffset);
    });
    
    platforms.forEach(p => p.draw(scrollOffset));
    obstacles.forEach(o => o.draw(scrollOffset));
    coins.forEach(c => c.draw(scrollOffset));
    enemies.forEach(e => e.draw(scrollOffset));
    player.draw(scrollOffset);
    drawScore();

    if (gameState === 'gameOver') {
        // ゲーム終了時にBGMを停止
        stopBGM();
        drawMessage('終了！', 'Enterキーまたは十字ボタン左でリスタート', score);
    }
}

// --- イベントリスナー ---
window.addEventListener('keydown', (e) => { 
    const code = e.code;
    // BGMを開始
    startBGM();
    // ゲームで使用するキーのデフォルト動作を防止
    if (code === 'ArrowUp' || code === 'ArrowDown' || code === 'ArrowLeft' || code === 'ArrowRight' || code === 'Space') {
        e.preventDefault();
    }
    if (gameState === 'playing') { 
        // タイマーを開始
        startTimer();
        switch (code) { 
            case 'ArrowLeft': case 'KeyA': keys.left.pressed = true; break; 
            case 'ArrowRight': case 'KeyD': keys.right.pressed = true; break; 
            case 'Space': case 'ArrowUp': case 'KeyW': 
                player.velocity.y = -JUMP_POWER; 
                startTimer(); // ジャンプでもタイマー開始
                break; 
        } 
    } else { 
        if (code === 'Enter') {
            e.preventDefault();
            init(); 
        }
    } 
});
window.addEventListener('keyup', ({ code }) => { if (gameState !== 'playing') return; switch (code) { case 'ArrowLeft': case 'KeyA': keys.left.pressed = false; break; case 'ArrowRight': case 'KeyD': keys.right.pressed = false; break; } });

// Gamepad接続/切断イベントリスナー
window.addEventListener("gamepadconnected", (e) => {
    console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.",
        e.gamepad.index, e.gamepad.id, e.gamepad.buttons.length, e.gamepad.axes.length);
    gamepad = e.gamepad;
    gamepadConnected = true;
    showGamepadStatus("コントローラーが接続されました", "success");
    debugGamepadInfo();
});

window.addEventListener("gamepaddisconnected", (e) => {
    console.log("Gamepad disconnected from index %d: %s",
        e.gamepad.index, e.gamepad.id);
    gamepad = null;
    gamepadConnected = false;
    showGamepadStatus("コントローラーが切断されました", "error");
});

// コントローラー接続を手動でチェックする関数（Macの接続不安定問題に対応）
function checkGamepadConnection() {
    const actualGamepads = debugGamepadInfo();
    if (actualGamepads.length > 0 && !gamepadConnected) {
        console.log("コントローラーが検出されました！接続状態を更新します。");
        gamepad = actualGamepads[0];
        gamepadConnected = true;
        connectionStability.consecutiveFailures = 0; // リセット
        connectionStability.checkInterval = 1000; // 正常間隔に戻す
        showGamepadStatus("コントローラーが接続されました", "success");
        return true;
    } else if (actualGamepads.length === 0 && gamepadConnected) {
        // 接続が切れた場合
        console.log("コントローラーの接続が切れました");
        gamepad = null;
        gamepadConnected = false;
        connectionStability.consecutiveFailures++;
        showGamepadStatus("コントローラー接続が不安定です", "error");
        return false;
    }
    return false;
}

// Macでの接続安定化のための特別な関数
function stabilizeConnection() {
    console.log("Macでの接続安定化を試行中...");
    
    // 接続チェック間隔を短縮
    connectionStability.checkInterval = 200;
    connectionStability.consecutiveFailures = 0;
    
    // 強制的に接続を再チェック
    setTimeout(() => {
        checkGamepadConnection();
        connectionStability.checkInterval = 1000; // 元に戻す
    }, 1000);
}

// ページ読み込み時にコントローラー状態をチェック
window.addEventListener('load', () => {
    console.log("ページ読み込み完了 - コントローラー状態をチェック中...");
    checkGamepadConnection();
    
    // 定期的にコントローラー状態をチェック（2秒間隔でMacの不安定な接続に対応）
    setInterval(checkGamepadConnection, 2000);
});

// ユーザーがボタンを押したときにコントローラーをチェック
document.addEventListener('keydown', () => {
    if (!gamepadConnected) {
        checkGamepadConnection();
    }
});

// マウスクリック時にもコントローラーをチェック
document.addEventListener('click', () => {
    // BGMを開始
    startBGM();
    if (!gamepadConnected) {
        checkGamepadConnection();
    }
});

// うめこの画像を読み込む
umekoImage = new Image();
umekoImage.src = '../Umeko.png';
umekoImage.onload = function() {
    console.log('うめこの画像が読み込まれました');
};

init();
animate();

