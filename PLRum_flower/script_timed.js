const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// BGM用のaudio要素を取得
const bgm = document.getElementById('bgm');

// 効果音用のaudio要素を取得
const coinSound = document.getElementById('coinSound');
const explosionSound = document.getElementById('explosionSound');
const errorSound = document.getElementById('errorSound');
const retroSound = document.getElementById('retroSound');
const countdownSound = document.getElementById('countdownSound');
const gameOverSound = document.getElementById('gameOverSound');
const jumpSound = document.getElementById('jumpSound');
const modeSwitchSound = document.getElementById('modeSwitchSound');

// 効果音ファイルの読み込み確認
if (coinSound) {
    coinSound.addEventListener('loadeddata', () => {
        console.log('コイン獲得音ファイルが読み込まれました');
    });
    coinSound.addEventListener('error', (e) => {
        console.error('コイン獲得音ファイルの読み込みエラー:', e);
    });
}
if (explosionSound) {
    explosionSound.addEventListener('loadeddata', () => {
        console.log('爆発音ファイルが読み込まれました');
    });
    explosionSound.addEventListener('error', (e) => {
        console.error('爆発音ファイルの読み込みエラー:', e);
    });
}
if (errorSound) {
    errorSound.addEventListener('loadeddata', () => {
        console.log('エラー音ファイルが読み込まれました');
    });
    errorSound.addEventListener('error', (e) => {
        console.error('エラー音ファイルの読み込みエラー:', e);
    });
}
if (retroSound) {
    retroSound.addEventListener('loadeddata', () => {
        console.log('レトロアクション音ファイルが読み込まれました');
    });
    retroSound.addEventListener('error', (e) => {
        console.error('レトロアクション音ファイルの読み込みエラー:', e);
    });
}
if (countdownSound) {
    countdownSound.addEventListener('loadeddata', () => {
        console.log('カウントダウン音ファイルが読み込まれました');
    });
    countdownSound.addEventListener('error', (e) => {
        console.error('カウントダウン音ファイルの読み込みエラー:', e);
    });
}
if (gameOverSound) {
    gameOverSound.addEventListener('loadeddata', () => {
        console.log('終了音ファイルが読み込まれました');
    });
    gameOverSound.addEventListener('error', (e) => {
        console.error('終了音ファイルの読み込みエラー:', e);
    });
}
if (jumpSound) {
    jumpSound.addEventListener('loadeddata', () => {
        console.log('ジャンプ音ファイルが読み込まれました');
    });
    jumpSound.addEventListener('error', (e) => {
        console.error('ジャンプ音ファイルの読み込みエラー:', e);
    });
}

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
const UME_TARGET_COUNT = 7; // 梅の花を咲かせるために必要な梅の数
const UME_DROP_RATE = 0.65; // モンスター撃破時に梅が出る確率
const MODE_TARGET_TIME = 60; // 各モードの目標滞在時間（秒）

// ゲームの状態
let gameState = 'startScreen'; // 初期状態をスタート画面に変更
let score = 0;
let scrollOffset = 0;
let lastPlatformX = 0;
let lastObstacleX = 0;

// カウントダウン関連の変数
let countdownNumber = 3; // カウントダウンの数字（3, 2, 1）
let countdownInterval = null; // カウントダウン用のインターバル
let countdownStarted = false; // カウントダウンが開始されたかどうか

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

// 新しいゲームモード関連の変数 (timedモード用)
let gameMode = 'timed'; // このファイルはtimedモード
let startTime = 0;
let remainingTime = 120; // 制限時間用（2分=120秒）初期値を120に設定
let timerInterval = null; // タイマーのID
let timerStarted = false; // タイマーが開始されたかどうか

// 左右切替関連の変数
let isRightHanded = true; // true: 右利き（左スティック+Bボタン）、false: 左利き（右スティック+十字ボタン）
let nextSwitchTime = 0; // 次の切り替え時刻
let switchCountdown = 0; // 切り替えまでのカウントダウン（秒）


// 統計カウンター
let obstacleCollisions = 0; // ブロック衝突数
let enemyCollisions = 0; // 敵衝突数
let coinsCollected = 0; // 獲得コイン数

// 撃退・獲得カウンター
let rocketsDefeated = 0; // ロケット撃退数（踏みつけた回数）
let enemiesDefeated = 0; // モンスター撃退数（踏みつけた回数）

// 登場回数カウンター
let rocketsSpawned = 0; // ロケット登場数
let enemiesSpawned = 0; // モンスター登場数
let coinsSpawned = 0; // コイン登場数
let plumsSpawned = 0; // 梅の登場数

// モード別統計カウンター
let rightHandedObstacleCollisions = 0; // 右利きモードのロケット被弾回数
let rightHandedEnemyCollisions = 0; // 右利きモードのモンスター衝突回数
let leftHandedObstacleCollisions = 0; // 左利きモードのロケット被弾回数
let leftHandedEnemyCollisions = 0; // 左利きモードのモンスター衝突回数

// モード別撃退・獲得カウンター
let rightHandedRocketsDefeated = 0; // 右利きモードのロケット撃退数
let rightHandedEnemiesDefeated = 0; // 右利きモードのモンスター撃退数
let rightHandedCoinsCollected = 0; // 右利きモードのコイン獲得数
let leftHandedRocketsDefeated = 0; // 左利きモードのロケット撃退数
let leftHandedEnemiesDefeated = 0; // 左利きモードのモンスター撃退数
let leftHandedCoinsCollected = 0; // 左利きモードのコイン獲得数

// モード別登場数カウンター
let rightHandedRocketsSpawned = 0; // 右利きモードのロケット登場数
let rightHandedEnemiesSpawned = 0; // 右利きモードのモンスター登場数
let rightHandedCoinsSpawned = 0; // 右利きモードのコイン登場数
let rightHandedPlumsSpawned = 0; // 右利きモードの梅の登場数
let leftHandedRocketsSpawned = 0; // 左利きモードのロケット登場数
let leftHandedEnemiesSpawned = 0; // 左利きモードのモンスター登場数
let leftHandedCoinsSpawned = 0; // 左利きモードのコイン登場数
let leftHandedPlumsSpawned = 0; // 左利きモードの梅の登場数

// モード別梅獲得カウンター
let rightHandedPlumsCollected = 0; // 右利きモードの梅の獲得数
let leftHandedPlumsCollected = 0; // 左利きモードの梅の獲得数

// 切り替え後10秒間の記録
let postSwitchRecords = []; // 切り替え後10秒間の記録配列
let currentPostSwitchRecord = null; // 現在の切り替え後10秒間の記録
let postSwitchStartTime = 0; // 切り替え後の開始時刻

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
        
        // モードに応じてキャラクター画像を描画
        const currentImage = isRightHanded ? pramImage : plamImage;
        if (currentImage && currentImage.complete) {
            ctx.drawImage(currentImage, x, y, w, h);
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

class Plum {
    constructor({ x, y }) {
        this.position = { x, y };
        this.baseY = y;
        this.radius = 18;
        this.active = true;
        this.floatPhase = Math.random() * Math.PI * 2;
        this.floatSpeed = 0.03 + Math.random() * 0.02;
        this.spawnTime = Date.now(); // 生成時刻を記録
        this.canCollect = false; // 取得可能フラグ（生成直後は取得不可）
    }
    getDisplayY() {
        return this.baseY + Math.sin(this.floatPhase) * 6;
    }
    update() {
        this.floatPhase += this.floatSpeed;
        // 生成から0.3秒経過後に取得可能にする（すぐに取得されないようにする）
        const elapsed = Date.now() - this.spawnTime;
        if (elapsed > 300) { // 300ミリ秒（0.3秒）経過後
            this.canCollect = true;
        }
    }
    draw(offset) {
        if (!this.active) {
            return;
        }
        const x = this.position.x - offset;
        const y = this.getDisplayY();
        
        // 画面内に表示されている梅だけを描画（余裕を持たせる）
        // マージンを大きくして、確実に表示されるようにする
        const margin = 300; // マージンをさらに大きく
        if (x < -margin || x > canvas.width + margin || y < -margin || y > canvas.height + margin) {
            return; // 画面外の梅は描画しない
        }
        
        ctx.save();
        
        // 梅の実（ピンクのグラデーション）
        const gradient = ctx.createRadialGradient(x - 5, y - 5, this.radius * 0.2, x, y, this.radius);
        gradient.addColorStop(0, '#FFE4EC');
        gradient.addColorStop(0.5, '#FF9AC2');
        gradient.addColorStop(1, '#E35285');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // ハイライト
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.ellipse(x - this.radius * 0.4, y - this.radius * 0.4, this.radius * 0.3, this.radius * 0.2, Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();
        
        // 葉っぱ
        ctx.fillStyle = '#5CB85C';
        ctx.beginPath();
        ctx.ellipse(x + this.radius * 0.4, y - this.radius * 0.8, this.radius * 0.4, this.radius * 0.2, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

function trySpawnPlum(x, y) {
    if (Math.random() < UME_DROP_RATE) {
        const plum = new Plum({ x, y });
        plums.push(plum);
        console.log(`梅を生成しました: 位置(${x.toFixed(1)}, ${y.toFixed(1)}), 配列サイズ: ${plums.length}, scrollOffset: ${scrollOffset.toFixed(1)}`);
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
    constructor({ x, y }) { this.position = { x, y }; this.velocity = { x: -3, y: 0 }; this.width = 50; this.height = 50; this.collided = false; this.isFalling = false; this.fallVelocity = 0; }
    draw(offset) { 
        const x = this.position.x - offset;
        const y = this.position.y;
        const w = this.width;
        const h = this.height;
        
        // 黒いミサイル風ロケット（横向き）
        ctx.save();
        
        // ロケット本体のパスを定義
        const rocketPath = new Path2D();
        rocketPath.moveTo(x, y + h/2); // 左先端（進行方向）
        rocketPath.lineTo(x + w*0.6, y + h*0.25); // 上側
        rocketPath.lineTo(x + w*0.8, y + h*0.25); // 上側後
        rocketPath.lineTo(x + w, y + h*0.15); // 右尾翼（上）
        rocketPath.lineTo(x + w*0.9, y + h/2); // 中央後
        rocketPath.lineTo(x + w, y + h*0.85); // 右尾翼（下）
        rocketPath.lineTo(x + w*0.8, y + h*0.75); // 下側後
        rocketPath.lineTo(x + w*0.6, y + h*0.75); // 下側
        rocketPath.closePath();
        
        // 左利きモードの時は白い縁取りを描画
        if (!isRightHanded) {
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 4;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.stroke(rocketPath);
        }
        
        // ロケット本体（黒、横向き）
        ctx.fillStyle = '#1a1a1a';
        ctx.fill(rocketPath);
        
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
    update() { 
        if (this.isFalling) {
            // 落下中の場合は重力を適用して下に落ちる
            this.fallVelocity += GRAVITY;
            this.position.y += this.fallVelocity;
        } else {
            // 通常時は水平移動
            this.position.x += this.velocity.x;
        }
    }
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

class Star {
    constructor({ x, y, size }) { this.position = { x, y }; this.size = size; }
    draw(offset) {
        const x = this.position.x - offset * 0.5;
        const y = this.position.y;
        const s = this.size;
        
        ctx.save();
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 1;
        
        // 星を描画（5角形）
        ctx.beginPath();
        const spikes = 5;
        const outerRadius = s;
        const innerRadius = s * 0.4;
        let rotation = Math.PI / 2 * 3;
        const step = Math.PI / spikes;
        
        for (let i = 0; i < spikes; i++) {
            // 外側の点
            ctx.lineTo(
                x + Math.cos(rotation) * outerRadius,
                y + Math.sin(rotation) * outerRadius
            );
            rotation += step;
            
            // 内側の点
            ctx.lineTo(
                x + Math.cos(rotation) * innerRadius,
                y + Math.sin(rotation) * innerRadius
            );
            rotation += step;
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
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
let player, platforms, coins, enemies, obstacles, clouds, stars, mountains, plums;
// 配列を初期化（undefinedエラーを防ぐ）
clouds = [];
stars = [];
mountains = [];
platforms = [];
coins = [];
enemies = [];
obstacles = [];
let keys = { right: { pressed: false }, left: { pressed: false } };
let pramImage = null; // 右利きモード用の画像（Pram.png）
let plamImage = null; // 左利きモード用の画像（Plam.png）
let flowerImage = null; // 梅の花の画像（flower.png）
let rightHandedTime = 0; // 右利きモード累計時間
let leftHandedTime = 0; // 左利きモード累計時間
let currentModeStartTime = 0; // 現在モードの開始時刻
let umeCollected = 0; // 集めた梅の数
let plumBloomParticles = []; // 梅の花エフェクト
let plumBloomTriggered = false;
let bloomStartTime = 0;

// 左右切替のスケジュールを設定する関数
function scheduleNextSwitch() {
    const now = Date.now();
    let currentAccumulated = isRightHanded ? rightHandedTime : leftHandedTime;
    if (currentModeStartTime > 0) {
        const elapsed = (now - currentModeStartTime) / 1000;
        currentAccumulated += elapsed;
    }
    
    const remaining = MODE_TARGET_TIME - currentAccumulated;
    
    if (remaining <= 0) {
        nextSwitchTime = now;
        console.log('モード累計時間が上限に達したため即時切り替え');
        return;
    }
    
    const switchDelay = Math.max(1000, Math.min(remaining * 1000, 30000)); // 1秒〜30秒
    nextSwitchTime = now + switchDelay;
    console.log(`次の切り替え予定: ${Math.round(switchDelay / 1000)}秒後（残り${remaining.toFixed(1)}秒）`);
}

function accumulateCurrentModeTime(now = Date.now()) {
    if (currentModeStartTime === 0) return;
    const elapsed = (now - currentModeStartTime) / 1000;
    if (elapsed <= 0) return;
    if (isRightHanded) {
        rightHandedTime = Math.min(MODE_TARGET_TIME, rightHandedTime + elapsed);
    } else {
        leftHandedTime = Math.min(MODE_TARGET_TIME, leftHandedTime + elapsed);
    }
}

// --- 初期化 ---
function init() {
    gameState = 'startScreen'; // スタート画面から開始
    score = 0;
    scrollOffset = 0;
    keys.right.pressed = false;
    keys.left.pressed = false;
    // BGMフラグをリセット（リスタート時にも再生できるように）
    bgmStarted = false;
    // カウントダウンをリセット
    countdownNumber = 3;
    countdownStarted = false;
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    player = new Player();
    // プレイヤーを地面の上に配置（サイズが大きくなったので調整）
    player.position.y = 400 - player.height;
    const groundY = 400;
    platforms = []; // 最初の足場は不要（邪魔なので削除）
    coins = []; enemies = []; obstacles = []; clouds = []; stars = []; mountains = []; plums = [];
    lastPlatformX = 0; // 最初の足場がないので0から開始
    lastObstacleX = 700;
    for (let i = 0; i < 70; i++) { // 70個の雲を生成（さらに増加）
        clouds.push(new Cloud({ x: Math.random() * 50000, y: Math.random() * 150, size: Math.random() * 20 + 10 }));
    }
    for (let i = 0; i < 70; i++) { // 70個の星を生成（左利きモード用）
        stars.push(new Star({ x: Math.random() * 50000, y: Math.random() * 150, size: Math.random() * 5 + 5 }));
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
    umeCollected = 0;
    
    // 撃退・獲得カウンターをリセット
    rocketsDefeated = 0;
    enemiesDefeated = 0;
    
    // 登場回数カウンターをリセット
    rocketsSpawned = 0;
    enemiesSpawned = 0;
    coinsSpawned = 0;
    plumsSpawned = 0;
    
    // モード別統計カウンターをリセット
    rightHandedObstacleCollisions = 0;
    rightHandedEnemyCollisions = 0;
    leftHandedObstacleCollisions = 0;
    leftHandedEnemyCollisions = 0;
    
    // モード別撃退・獲得カウンターをリセット
    rightHandedRocketsDefeated = 0;
    rightHandedEnemiesDefeated = 0;
    rightHandedCoinsCollected = 0;
    leftHandedRocketsDefeated = 0;
    leftHandedEnemiesDefeated = 0;
    leftHandedCoinsCollected = 0;
    
    // モード別登場数カウンターをリセット
    rightHandedRocketsSpawned = 0;
    rightHandedEnemiesSpawned = 0;
    rightHandedCoinsSpawned = 0;
    rightHandedPlumsSpawned = 0;
    leftHandedRocketsSpawned = 0;
    leftHandedEnemiesSpawned = 0;
    leftHandedCoinsSpawned = 0;
    leftHandedPlumsSpawned = 0;
    
    // モード別梅獲得カウンターをリセット
    rightHandedPlumsCollected = 0;
    leftHandedPlumsCollected = 0;
    
    // 切り替え後10秒間の記録をリセット
    postSwitchRecords = [];
    currentPostSwitchRecord = null;
    postSwitchStartTime = 0;

    // 梅の花演出のリセット
    plumBloomParticles = [];
    plumBloomTriggered = false;
    bloomStartTime = 0;

    // timedモードの初期化
    startTime = Date.now();
    if (timerInterval) clearInterval(timerInterval); // 既存のタイマーがあればクリア

    remainingTime = 120; // 120秒（2分）
    timerStarted = false; // タイマーはまだ開始していない（最初の操作を待つ）

    // 左右切替の初期化
    isRightHanded = Math.random() < 0.5; // ランダムに初期状態を設定
    rightHandedTime = 0;
    leftHandedTime = 0;
    currentModeStartTime = 0;
    scheduleNextSwitch();
    
    // コントローラー状態を更新
    updateGamepadStatus();
}

// BGM再生開始関数
function startBGM() {
    if (bgm && !bgmStarted) {
        bgm.volume = 0.5; // 音量を50%に設定（お好みで調整してください）
        bgm.currentTime = 0; // 再生位置を最初に戻す
        bgm.play().then(() => {
            bgmStarted = true;
            console.log('BGMが再生されました');
            // BGMが開始されたら、効果音も再生可能にする（事前ロード）
            if (coinSound) coinSound.load();
            if (explosionSound) explosionSound.load();
            if (errorSound) errorSound.load();
            if (retroSound) retroSound.load();
            if (countdownSound) countdownSound.load();
            if (gameOverSound) gameOverSound.load();
            if (jumpSound) jumpSound.load();
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

// 効果音再生関数
function playSoundEffect(sound, name) {
    if (sound) {
        try {
            sound.volume = 0.7; // 音量を設定
            sound.currentTime = 0; // 再生位置をリセット
            const playPromise = sound.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log(`効果音（${name}）が再生されました`);
                }).catch(error => {
                    console.log(`効果音（${name}）の再生に失敗しました:`, error);
                    // ユーザー操作が必要な場合、BGMが開始されている場合は再生を試みる
                    if (bgmStarted) {
                        sound.play().catch(e => {
                            console.log(`効果音（${name}）の再試行も失敗:`, e);
                        });
                    }
                });
            }
        } catch (error) {
            console.error(`効果音（${name}）の再生エラー:`, error);
        }
    }
}

// タイマー開始関数（最初の操作で呼び出される）
function startTimer() {
    if (!timerStarted && gameState === 'playing') {
        timerStarted = true;
        startTime = Date.now();
        if (currentModeStartTime === 0) {
            currentModeStartTime = Date.now();
        }
        timerInterval = setInterval(() => {
            if (gameState === 'playing') {
                remainingTime--;
                // 残り時間10秒以下のカウントダウン音を再生
                if (remainingTime <= 10 && remainingTime > 0) {
                    playSoundEffect(countdownSound, 'カウントダウン');
                }
                if (remainingTime <= 0) {
                    gameState = 'gameOver';
                    clearInterval(timerInterval);
                    handleGameOverTransition();
                    // カウントダウン音を停止
                    if (countdownSound && !countdownSound.paused) {
                        countdownSound.pause();
                        countdownSound.currentTime = 0;
                    }
                    // ゲームオーバー時にBGMを停止
                    stopBGM();
                    // 終了音を再生（少し遅延させて確実に再生）
                    setTimeout(() => {
                        if (gameOverSound) {
                            gameOverSound.volume = 0.7;
                            gameOverSound.currentTime = 0;
                            gameOverSound.play().then(() => {
                                console.log('終了音が再生されました');
                            }).catch(error => {
                                console.log('終了音の再生に失敗しました:', error);
                            });
                        }
                    }, 100);
                }
            }
        }, 1000);
        console.log('タイマーが開始されました');
    }
}

function handleGameOverTransition() {
    const now = Date.now();
    accumulateCurrentModeTime(now);
    currentModeStartTime = 0;
    if (umeCollected >= UME_TARGET_COUNT && !plumBloomTriggered) {
        preparePlumBloom();
    }
}

// --- 背景描画 ---
function drawBackground(offset) {
    // 空（右利きモード：青空、左利きモード：夜空）
    // isRightHandedが未定義の場合はデフォルトで右利きモード（青空）を表示
    const isRight = (typeof isRightHanded !== 'undefined') ? isRightHanded : true;
    if (isRight) {
        // 右利きモード：青空
        const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        skyGradient.addColorStop(0, '#87CEEB'); // 空色
        skyGradient.addColorStop(1, '#E0F6FF'); // 薄い空色
        ctx.fillStyle = skyGradient;
    } else {
        // 左利きモード：曇った夜空
        const nightGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        nightGradient.addColorStop(0, '#3A4A6A'); // 曇った青（濃いめ）
        nightGradient.addColorStop(1, '#2A2A4A'); // より濃い青紫
        ctx.fillStyle = nightGradient;
    }
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

// スタート画面を描画する関数（ゲーム画面の上にオーバーレイとして表示）
function drawStartScreen() {
    // 背景を描画（ゲーム画面を表示）
    drawBackground(scrollOffset);
    
    // 薄暗い背景オーバーレイ（透明度を調整）
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // タイトルを描画（目指せ両利き！PL/Ramちゃんゲーム）
    const titleY = 90; // 上に配置
    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 40px "Fredoka One", cursive';
    
    // タイトル全体の幅を計算して中央揃え
    const fullTitle = '目指せ両利き！PL/Rumちゃんゲーム';
    const fullTitleWidth = ctx.measureText(fullTitle).width;
    let currentX = centerX - fullTitleWidth / 2;
    
    // 目指せ両利き！Pを描画
    const part1 = '目指せ両利き！P';
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    const part1Width = ctx.measureText(part1).width;
    ctx.strokeText(part1, currentX, titleY);
    ctx.fillText(part1, currentX, titleY);
    currentX += part1Width;
    
    // Lを青色で描画
    ctx.fillStyle = '#0066FF'; // 青色
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    const lWidth = ctx.measureText('L').width;
    ctx.strokeText('L', currentX, titleY);
    ctx.fillText('L', currentX, titleY);
    currentX += lWidth;
    
    // /を描画
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    const slashWidth = ctx.measureText('/').width;
    ctx.strokeText('/', currentX, titleY);
    ctx.fillText('/', currentX, titleY);
    currentX += slashWidth;
    
    // Rを赤色で描画
    ctx.fillStyle = '#FF0000'; // 赤色
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    const rWidth = ctx.measureText('R').width;
    ctx.strokeText('R', currentX, titleY);
    ctx.fillText('R', currentX, titleY);
    currentX += rWidth;
    
    // umちゃんゲームを描画
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeText('umちゃんゲーム', currentX, titleY);
    ctx.fillText('umちゃんゲーム', currentX, titleY);
    
    ctx.restore();
    
    // キャラクター画像を描画（中央寄りに配置）
    const imageWidth = 120;
    const imageHeight = 180; // 2:3の比率を維持
    const imageY = 190; // タイトルの下に配置
    
    // Plumちゃん（左側）の光るエフェクト
    if (plamImage && plamImage.complete) {
        const plamX = centerX - 180;
        // 光るエフェクト（グラデーション）
        const glowGradient = ctx.createRadialGradient(
            plamX + imageWidth / 2, imageY + imageHeight / 2, 0,
            plamX + imageWidth / 2, imageY + imageHeight / 2, imageWidth
        );
        glowGradient.addColorStop(0, 'rgba(100, 149, 237, 0.3)');
        glowGradient.addColorStop(1, 'rgba(100, 149, 237, 0)');
        ctx.fillStyle = glowGradient;
        ctx.fillRect(plamX - 10, imageY - 10, imageWidth + 20, imageHeight + 20);
        
        ctx.drawImage(plamImage, plamX, imageY, imageWidth, imageHeight);
    }
    
    // Prumちゃん（右側）の光るエフェクト
    if (pramImage && pramImage.complete) {
        const pramX = centerX + 80;
        // 光るエフェクト（グラデーション）
        const glowGradient = ctx.createRadialGradient(
            pramX + imageWidth / 2, imageY + imageHeight / 2, 0,
            pramX + imageWidth / 2, imageY + imageHeight / 2, imageWidth
        );
        glowGradient.addColorStop(0, 'rgba(255, 99, 71, 0.3)');
        glowGradient.addColorStop(1, 'rgba(255, 99, 71, 0)');
        ctx.fillStyle = glowGradient;
        ctx.fillRect(pramX - 10, imageY - 10, imageWidth + 20, imageHeight + 20);
        
        ctx.drawImage(pramImage, pramX, imageY, imageWidth, imageHeight);
    }
    
    // スタートメッセージ（点滅アニメーション付き）
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 24px "Fredoka One", cursive';
    
    // 点滅効果（時間に基づいて透明度を変更）
    const blinkTime = Date.now() % 2000; // 2秒周期
    const alpha = blinkTime < 1000 ? 1.0 : 0.3 + (blinkTime - 1000) / 1000 * 0.7;
    
    // グラデーション効果
    const messageGradient = ctx.createLinearGradient(centerX - 200, 410, centerX + 200, 410);
    messageGradient.addColorStop(0, `rgba(255, 215, 0, ${alpha})`);
    messageGradient.addColorStop(0.5, `rgba(255, 255, 255, ${alpha})`);
    messageGradient.addColorStop(1, `rgba(255, 215, 0, ${alpha})`);
    ctx.fillStyle = messageGradient;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    
    // メッセージを1行に
    const messageLine1 = 'Enterキーでスタート！';
    const messageLine2 = '';
    const line1Y = 400;
    const line2Y = 430;
    
    ctx.strokeText(messageLine1, centerX, line1Y);
    ctx.fillText(messageLine1, centerX, line1Y);
    ctx.strokeText(messageLine2, centerX, line2Y);
    ctx.fillText(messageLine2, centerX, line2Y);
    
    ctx.restore();
}

// 星を描画するヘルパー関数
function drawStar(x, y, size) {
    ctx.save();
    ctx.beginPath();
    const spikes = 5;
    const outerRadius = size;
    const innerRadius = size * 0.4;
    let rotation = Math.PI / 2 * 3;
    const step = Math.PI / spikes;
    
    for (let i = 0; i < spikes; i++) {
        ctx.lineTo(
            x + Math.cos(rotation) * outerRadius,
            y + Math.sin(rotation) * outerRadius
        );
        rotation += step;
        ctx.lineTo(
            x + Math.cos(rotation) * innerRadius,
            y + Math.sin(rotation) * innerRadius
        );
        rotation += step;
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

// ハートを描画するヘルパー関数
function drawHeart(x, y, size) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.3);
    // 左側の曲線
    ctx.bezierCurveTo(x, y, x - size * 0.5, y, x - size * 0.5, y + size * 0.3);
    ctx.bezierCurveTo(x - size * 0.5, y + size * 0.7, x, y + size * 1.2, x, y + size * 1.5);
    // 右側の曲線
    ctx.bezierCurveTo(x, y + size * 1.2, x + size * 0.5, y + size * 0.7, x + size * 0.5, y + size * 0.3);
    ctx.bezierCurveTo(x + size * 0.5, y, x, y, x, y + size * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

// 手を描画するヘルパー関数
function drawHand(x, y, size, isLeft) {
    ctx.save();
    
    // 手の色（肌色）
    ctx.fillStyle = '#FFDBAC';
    ctx.strokeStyle = '#D4A574';
    ctx.lineWidth = 2;
    
    const handWidth = size * 0.5;
    const handHeight = size * 0.8;
    const fingerWidth = size * 0.12;
    const fingerHeight = size * 0.35;
    const fingerSpacing = size * 0.1;
    
    // 手のひら（楕円）
    ctx.beginPath();
    ctx.ellipse(x, y + handHeight * 0.3, handWidth, handHeight, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // 親指（手のひらの横）
    const thumbX = isLeft ? x - handWidth * 0.6 : x + handWidth * 0.6;
    const thumbY = y + handHeight * 0.2;
    ctx.beginPath();
    ctx.ellipse(thumbX, thumbY, fingerWidth * 1.1, fingerHeight * 0.7, isLeft ? -Math.PI / 6 : Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // 4本の指（上に伸びる）
    const fingerBaseX = x;
    const fingerBaseY = y - handHeight * 0.2;
    
    for (let i = 0; i < 4; i++) {
        const offsetX = (i - 1.5) * fingerSpacing;
        const fingerX = fingerBaseX + offsetX;
        const fingerY = fingerBaseY;
        ctx.beginPath();
        ctx.ellipse(fingerX, fingerY, fingerWidth, fingerHeight, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
    
    ctx.restore();
}

// カウントダウン画面を描画する関数
function drawCountdown() {
    // 背景を描画（ゲーム画面を表示）
    drawBackground(scrollOffset);
    
    // 薄暗い背景オーバーレイ
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // カウントダウンの数字を大きく表示
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 120px "Fredoka One", cursive';
    ctx.fillStyle = '#FFD700';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 8;
    const countdownText = countdownNumber.toString();
    ctx.strokeText(countdownText, centerX, centerY);
    ctx.fillText(countdownText, centerX, centerY);
    ctx.restore();
}

// カウントダウンを開始する関数
function startCountdown() {
    if (countdownStarted) return; // 既に開始されている場合は何もしない
    
    countdownStarted = true;
    countdownNumber = 3;
    gameState = 'countdown';
    
    // カウントダウン音を再生
    if (countdownSound) {
        playSoundEffect(countdownSound, 'カウントダウン');
    }
    
    // カウントダウンを開始
    countdownInterval = setInterval(() => {
        countdownNumber--;
        
        // カウントダウン音を再生
        if (countdownSound && countdownNumber > 0) {
            playSoundEffect(countdownSound, 'カウントダウン');
        }
        
        if (countdownNumber <= 0) {
            // カウントダウン終了、ゲーム開始
            clearInterval(countdownInterval);
            countdownInterval = null;
            gameState = 'playing';
            countdownStarted = false;
            
            // カウントダウン音を停止
            if (countdownSound && !countdownSound.paused) {
                countdownSound.pause();
                countdownSound.currentTime = 0;
            }
            
            // BGMを開始
            startBGM();
            
            // タイマーを自動開始
            startTimer();
            
            // 最初のモードの切り替え後10秒間の記録を開始
            const now = Date.now();
            postSwitchStartTime = now;
            currentPostSwitchRecord = {
                mode: isRightHanded ? 'right' : 'left',
                startTime: now,
                endTime: null,
                obstacleCollisions: 0,
                enemyCollisions: 0
            };
            
            console.log('ゲーム開始！');
        }
    }, 1000);
}

// --- メッセージ・スコア描画 ---
function drawMessage(message, subMessage, finalScore) {
    // 背景（半透明の暗い色）
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 中央位置の計算（全体を中央に配置）
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // メインメッセージ（タイムアップ！）
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 72px "Fredoka One", cursive';
    ctx.strokeStyle = '#FFD700'; // 金色の縁取り
    ctx.lineWidth = 4;
    ctx.fillStyle = '#FF6B6B'; // 赤系の色
    const mainY = centerY - 130;
    ctx.strokeText(message, centerX, mainY);
    ctx.fillText(message, centerX, mainY);
    ctx.restore();
    
    // 終了画面の描画（gameModeとgameStateのチェック）
    if (gameMode === 'timed' && gameState === 'gameOver' && finalScore !== undefined) {
        // 獲得スコア（コインマークなし）
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 48px "Fredoka One", cursive';
        ctx.fillStyle = '#FFD700'; // 金色
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        const scoreY = centerY - 40;
        const scoreText = `獲得スコア: ${String(finalScore).padStart(4, '0')}`;
        ctx.strokeText(scoreText, centerX, scoreY);
        ctx.fillText(scoreText, centerX, scoreY);
        ctx.restore();
        
        // 統計情報（可愛くポップなスタイル）
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 28px "Fredoka One", cursive';
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        const statsY = centerY + 30;
        const spacing = 45;
        
        // ロケット衝突数（実際のロケット画像を使用）
        const rocketLabelY = statsY;
        const rocketText = `ロケット衝突: ${obstacleCollisions}回`;
        const rocketTextWidth = ctx.measureText(rocketText).width;
        const rocketIconSize = 28;
        // アイコンの中心を文字列の中央高さに合わせ、左に配置
        const rocketIconCenterX = centerX - rocketTextWidth / 2 - rocketIconSize / 2 - 8;
        const rocketIconCenterY = rocketLabelY; // 文字列の中央の高さ
        const rocketIconX = rocketIconCenterX - rocketIconSize / 2; // 左上の座標に変換
        const rocketIconY = rocketIconCenterY - rocketIconSize / 2; // 左上の座標に変換
        drawRocketIcon(rocketIconX, rocketIconY, rocketIconSize); // ロケットを描画（コインと同じくらいのサイズ）
        ctx.strokeText(rocketText, centerX, rocketLabelY);
        ctx.fillText(rocketText, centerX, rocketLabelY);
        
        // モンスター衝突数（実際のモンスター画像を使用）
        const enemyLabelY = statsY + spacing;
        const enemyText = `モンスター衝突: ${enemyCollisions}回`;
        const enemyTextWidth = ctx.measureText(enemyText).width;
        const enemyIconSize = 28;
        // アイコンの中心を文字列の中央高さに合わせ、左に配置
        const enemyIconCenterX = centerX - enemyTextWidth / 2 - enemyIconSize / 2 - 8;
        const enemyIconCenterY = enemyLabelY - 3; // 文字列の中央の高さより少し上
        const enemyIconX = enemyIconCenterX - enemyIconSize / 2; // 左上の座標に変換
        const enemyIconY = enemyIconCenterY - enemyIconSize / 2; // 左上の座標に変換
        drawEnemyIcon(enemyIconX, enemyIconY, enemyIconSize); // モンスターを描画（コインと同じくらいのサイズ）
        ctx.strokeText(enemyText, centerX, enemyLabelY);
        ctx.fillText(enemyText, centerX, enemyLabelY);
        
        // 獲得コイン（実際のコイン画像を使用）
        const coinLabelY = statsY + spacing * 2;
        const coinText = `獲得コイン: ${coinsCollected}個`;
        // テキストの幅を測定してコインの位置を調整
        const textWidth = ctx.measureText(coinText).width;
        const coinIconX = centerX - textWidth / 2 - 20; // テキストの左側にコインを配置
        const coinIconY = coinLabelY;
        drawCoinIcon(coinIconX, coinIconY, 14); // コインを描画（半径14）
        ctx.strokeText(coinText, centerX, coinLabelY);
        ctx.fillText(coinText, centerX, coinLabelY);
        
        // 梅の収集状況
        const umeLabelY = statsY + spacing * 3;
        const umeCleared = umeCollected >= UME_TARGET_COUNT;
        // 5個以上のときも個数を表示する
        const umeText = umeCleared ? `満開！おめでとう！ (${umeCollected}個)` : `梅: ${umeCollected}個`;
        const umeTextWidth = ctx.measureText(umeText).width;
        const umeIconX = centerX - umeTextWidth / 2 - 22;
        drawPlumIcon(umeIconX, umeLabelY, 14);
        ctx.fillStyle = umeCleared ? '#FF66B3' : '#FFFFFF';
        ctx.strokeText(umeText, centerX, umeLabelY);
        ctx.fillText(umeText, centerX, umeLabelY);
        ctx.restore();
        
        // リスタート説明（点滅アニメーション付き、スタート画面と同じ色）
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 24px "Fredoka One", cursive';
        
        // 点滅効果（時間に基づいて透明度を変更）
        const blinkTime = Date.now() % 2000; // 2秒周期
        const alpha = blinkTime < 1000 ? 1.0 : 0.3 + (blinkTime - 1000) / 1000 * 0.7;
        
        // スタート画面と同じグラデーション効果
        const restartY = canvas.height - 30; // 画面下部に配置して確実に見えるように
        const messageGradient = ctx.createLinearGradient(centerX - 200, restartY, centerX + 200, restartY);
        messageGradient.addColorStop(0, `rgba(255, 215, 0, ${alpha})`);
        messageGradient.addColorStop(0.5, `rgba(255, 255, 255, ${alpha})`);
        messageGradient.addColorStop(1, `rgba(255, 215, 0, ${alpha})`);
        ctx.fillStyle = messageGradient;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        const restartMessage = 'エンターキーでリスタート';
        ctx.strokeText(restartMessage, centerX, restartY);
        ctx.fillText(restartMessage, centerX, restartY);
        ctx.restore();
        
        // 梅の花が咲いた時はflower.pngを左右に散りばめて配置（回転付き、透過なし）
        if (plumBloomTriggered && flowerImage && flowerImage.complete) {
            const rotationSpeed = 0.002; // 回転速度（ゆっくり）
            
            // 経過時間を取得（回転アニメーション用）
            const elapsed = (Date.now() - bloomStartTime) / 1000;
            
            ctx.save();
            
            // 花の配置データ（左右対称に配置）
            const centerX = canvas.width / 2;
            const flowers = [
                // 左側の花（上から下へ）
                { x: 60, y: 50, size: 90, rotation: 1.0 },
                { x: 40, y: 150, size: 110, rotation: 0.8 },
                { x: 70, y: 250, size: 95, rotation: 1.2 },
                // 右側の花（上から下へ）
                { x: canvas.width - 170, y: 50, size: 90, rotation: 1.0 },
                { x: canvas.width - 150, y: 150, size: 110, rotation: 0.8 },
                { x: canvas.width - 160, y: 250, size: 95, rotation: 1.2 }
            ];
            
            // 各花を描画
            flowers.forEach((flower, index) => {
                const flowerSize = flower.size;
                const flowerX = flower.x;
                const flowerY = flower.y;
                const rotation = elapsed * rotationSpeed * flower.rotation;
                
                ctx.save();
                ctx.translate(flowerX + flowerSize / 2, flowerY + flowerSize / 2);
                ctx.rotate(rotation);
                ctx.drawImage(flowerImage, -flowerSize / 2, -flowerSize / 2, flowerSize, flowerSize);
                ctx.restore();
            });
            
            ctx.restore();
        }
    } else if (finalScore !== undefined) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 36px "Fredoka One", cursive';
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        const scoreText = `スコア: ${finalScore}`;
        ctx.strokeText(scoreText, centerX, centerY);
        ctx.fillText(scoreText, centerX, centerY);
        ctx.restore();
        
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 24px "Fredoka One", cursive';
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeText(subMessage, centerX, centerY + 50);
        ctx.fillText(subMessage, centerX, centerY + 50);
        ctx.restore();
    }
}

function preparePlumBloom() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 + 40;
    plumBloomParticles = [];
    const petalCount = 36;
    for (let i = 0; i < petalCount; i++) {
        plumBloomParticles.push({
            centerX,
            centerY,
            baseAngle: (Math.PI * 2 / petalCount) * i + Math.random() * 0.3,
            radius: 40 + Math.random() * 140,
            size: 12 + Math.random() * 10,
            delay: Math.random() * 0.5,
            spin: (Math.random() - 0.5) * 0.6
        });
    }
    bloomStartTime = Date.now();
    plumBloomTriggered = true;
    console.log('梅の花エフェクトを準備しました');
}

function drawPlumBloom() {
    if (!plumBloomTriggered || plumBloomParticles.length === 0) return;
    const elapsed = (Date.now() - bloomStartTime) / 1000;
    plumBloomParticles.forEach(p => {
        const progress = Math.max(0, elapsed - p.delay);
        if (progress <= 0) return;
        const normalized = Math.min(1, progress / 1.2);
        const distance = p.radius * normalized;
        const angle = p.baseAngle + p.spin * progress;
        const x = p.centerX + Math.cos(angle) * distance;
        const y = p.centerY + Math.sin(angle) * distance;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.globalAlpha = Math.min(1, 0.3 + normalized);
        drawPetalShape(p.size);
        ctx.restore();
    });
}

function drawPetalShape(size) {
    ctx.fillStyle = '#FFC0D9';
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.4, size, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FF8FB4';
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.2, size * 0.5, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
}

// ロケット（Obstacle）を描画するヘルパー関数（小さなサイズ）
function drawRocketIcon(x, y, size) {
    const w = size || 20;
    const h = size || 20;
    
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
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + w*0.6, y + h*0.25);
    ctx.lineTo(x + w, y + h*0.15);
    ctx.moveTo(x + w*0.6, y + h*0.75);
    ctx.lineTo(x + w, y + h*0.85);
    ctx.stroke();
    
    ctx.restore();
}

// モンスター（Enemy）を描画するヘルパー関数（小さなサイズ）
function drawEnemyIcon(x, y, size) {
    const w = size || 20;
    const h = size || 20;
    
    ctx.save();
    
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
    
    ctx.restore();
}

// コインを描画するヘルパー関数（スコア表示用の小さなサイズ）
function drawCoinIcon(x, y, radius) {
    const r = radius || 12; // デフォルト半径12
    
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

function drawPlumIcon(x, y, radius) {
    drawPlumIconWithContext(ctx, x, y, radius);
}

function drawPlumIconToCanvas(targetCtx, x, y, radius) {
    if (!targetCtx) return;
    drawPlumIconWithContext(targetCtx, x, y, radius);
}

function drawPlumIconWithContext(targetCtx, x, y, radius) {
    const r = radius || 14;
    targetCtx.save();
    const gradient = targetCtx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.2, x, y, r);
    gradient.addColorStop(0, '#FFE4EC');
    gradient.addColorStop(0.5, '#FF9AC2');
    gradient.addColorStop(1, '#D94C8A');
    targetCtx.fillStyle = gradient;
    targetCtx.beginPath();
    targetCtx.arc(x, y, r, 0, Math.PI * 2);
    targetCtx.fill();
    
    targetCtx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    targetCtx.beginPath();
    targetCtx.ellipse(x - r * 0.35, y - r * 0.4, r * 0.35, r * 0.2, Math.PI / 6, 0, Math.PI * 2);
    targetCtx.fill();
    
    targetCtx.fillStyle = '#5CB85C';
    targetCtx.beginPath();
    targetCtx.ellipse(x + r * 0.45, y - r * 0.85, r * 0.45, r * 0.2, Math.PI / 4, 0, Math.PI * 2);
    targetCtx.fill();
    
    targetCtx.strokeStyle = 'rgba(128, 0, 64, 0.5)';
    targetCtx.lineWidth = 2;
    targetCtx.beginPath();
    targetCtx.arc(x, y, r, 0, Math.PI * 2);
    targetCtx.stroke();
    targetCtx.restore();
}

function drawScore() {
    // フォント設定（ポップで可愛いフォント）
    const popFont = 'bold 32px "Fredoka One", cursive';
    
    // 左上: 獲得スコアの表示（コインアイコン付き）
    ctx.save();
    ctx.font = popFont;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#FFD700'; // 金色
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    const textY = 45; // テキストの位置
    const textX = 40; // テキストの位置
    const coinX = textX - 20; // コインを数字により近づける（右側に移動）
    const coinY = textY - 10; // コインをもう少し高めに配置
    drawCoinIcon(coinX, coinY, 16); // コインを描画（半径16）
    const scoreText = String(score).padStart(3, '0');
    ctx.strokeText(scoreText, textX, textY);
    ctx.fillText(scoreText, textX, textY);
    ctx.restore();
    
    // 左上: 梅カウンターの表示（アイコンと数字のみ）
    ctx.save();
    ctx.font = 'bold 24px "Fredoka One", cursive';
    ctx.textAlign = 'left';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    const umeTextY = textY + 40;
    const umeTextX = textX;
    const umeText = `${umeCollected}/${UME_TARGET_COUNT}`;
    const umeColor = umeCollected >= UME_TARGET_COUNT ? '#FF66B3' : '#FFFFFF';
    drawPlumIcon(umeTextX - 20, umeTextY - 10, 12);
    ctx.fillStyle = umeColor;
    ctx.strokeText(umeText, umeTextX, umeTextY);
    ctx.fillText(umeText, umeTextX, umeTextY);
    ctx.restore();
    
    // 右上: 残り時間の表示（時計アイコン付き）
    if (gameMode === 'timed') {
        ctx.save();
        ctx.font = popFont;
        ctx.textAlign = 'right';
        if (timerStarted) {
            // 残り時間10秒以下は赤色に変更
            if (remainingTime <= 10) {
                ctx.fillStyle = '#FF0000'; // 赤色
            } else {
                ctx.fillStyle = '#FFFFFF'; // 白色
            }
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            const timeText = `🕐 ${String(remainingTime).padStart(3, '0')}`;
            ctx.strokeText(timeText, canvas.width - 15, 45);
            ctx.fillText(timeText, canvas.width - 15, 45);
        } else {
            // カウントダウン開始前の時間を表示
            ctx.fillStyle = '#FFFFFF';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            const timeText = `🕐 ${String(remainingTime).padStart(3, '0')}`;
            ctx.strokeText(timeText, canvas.width - 15, 45);
            ctx.fillText(timeText, canvas.width - 15, 45);
        }
        ctx.restore();
    }
    
    // 真ん中上: モードの表示（画像付き、文字強調）
    ctx.save();
    ctx.font = popFont;
    ctx.textAlign = 'left';
    const centerX = canvas.width / 2;
    const modeY = 45;
    
    // モードテキスト（左利きモード/右利きモード）を描画
    const modeText = isRightHanded ? '右利きモード：' : '左利きモード：';
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    const modeTextWidth = ctx.measureText(modeText).width;
    const modeTextX = centerX - 200; // 中央より左側に配置
    ctx.strokeText(modeText, modeTextX, modeY);
    ctx.fillText(modeText, modeTextX, modeY);
    
    // 画像を描画（ゲームで使われている画像比率そのまま：40:60 = 2:3）
    const currentImage = isRightHanded ? pramImage : plamImage;
    const imageWidth = 40; // プレイヤーのwidthと同じ
    const imageHeight = 60; // プレイヤーのheightと同じ
    const imageX = modeTextX + modeTextWidth + 5; // モードテキストのすぐ右隣
    const imageY = modeY - imageHeight / 2 - 10; // もう少し上に
    
    if (currentImage && currentImage.complete) {
        ctx.drawImage(currentImage, imageX, imageY, imageWidth, imageHeight);
    }
    
    // テキストを描画（文字の強調表示、プラムちゃんのすぐ右隣に）
    if (isRightHanded) {
        // 右利きモード：PRumちゃん（Rを赤色で強調）
        const textX = imageX + imageWidth + 5; // プラムちゃんのすぐ右隣
        ctx.textAlign = 'left';
        
        // Pを描画
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeText('P', textX, modeY);
        ctx.fillText('P', textX, modeY);
        
        // Rを赤色で強調描画
        const pWidth = ctx.measureText('P').width;
        ctx.fillStyle = '#FF0000'; // 赤色
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeText('R', textX + pWidth, modeY);
        ctx.fillText('R', textX + pWidth, modeY);
        
        // umちゃんを描画
        const rWidth = ctx.measureText('R').width;
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeText('umちゃん', textX + pWidth + rWidth, modeY);
        ctx.fillText('umちゃん', textX + pWidth + rWidth, modeY);
    } else {
        // 左利きモード：PLumちゃん（Lを青色で強調）
        const textX = imageX + imageWidth + 5; // プラムちゃんのすぐ右隣
        ctx.textAlign = 'left';
        
        // Pを描画
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeText('P', textX, modeY);
        ctx.fillText('P', textX, modeY);
        
        // Lを青色で強調描画
        const pWidth = ctx.measureText('P').width;
        ctx.fillStyle = '#0066FF'; // 青色
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeText('L', textX + pWidth, modeY);
        ctx.fillText('L', textX + pWidth, modeY);
        
        // umちゃんを描画
        const lWidth = ctx.measureText('L').width;
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeText('umちゃん', textX + pWidth + lWidth, modeY);
        ctx.fillText('umちゃん', textX + pWidth + lWidth, modeY);
    }
    
    ctx.restore();

    // 切り替えカウントダウン表示（10秒前から）
    if (switchCountdown > 0 && switchCountdown <= 10) {
        ctx.save();
        ctx.fillStyle = '#FF0000';
        ctx.font = 'bold 36px "Fredoka One", cursive';
        ctx.textAlign = 'center';
        const countdownText = `切り替えまで: ${switchCountdown}秒`;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 4;
        ctx.strokeText(countdownText, canvas.width / 2, canvas.height - 50);
        ctx.fillText(countdownText, canvas.width / 2, canvas.height - 50);
        ctx.restore();
    }
    
    // 左下: 各モードの経過時間
    if (timerStarted || gameState === 'gameOver') {
        ctx.save();
        ctx.font = 'bold 20px "Fredoka One", cursive';
        ctx.textAlign = 'left';
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#000000';
        const now = Date.now();
        let currentRight = rightHandedTime;
        let currentLeft = leftHandedTime;
        if (currentModeStartTime > 0) {
            const elapsed = (now - currentModeStartTime) / 1000;
            if (isRightHanded) {
                currentRight = Math.min(MODE_TARGET_TIME, currentRight + elapsed);
            } else {
                currentLeft = Math.min(MODE_TARGET_TIME, currentLeft + elapsed);
            }
        }
        const baseY = canvas.height - 90;
        ctx.fillStyle = '#FF6B6B';
        const rightText = `右利き: ${currentRight.toFixed(1)}秒 / ${MODE_TARGET_TIME}秒`;
        ctx.strokeText(rightText, 20, baseY);
        ctx.fillText(rightText, 20, baseY);
        
        ctx.fillStyle = '#4ECDC4';
        const leftText = `左利き: ${currentLeft.toFixed(1)}秒 / ${MODE_TARGET_TIME}秒`;
        ctx.strokeText(leftText, 20, baseY + 30);
        ctx.fillText(leftText, 20, baseY + 30);
        ctx.restore();
    }
}

// 統計情報を更新する関数
function updateStatisticsDisplay() {
    // 全体統計を更新
    const totalRocketsDefeatedEl = document.getElementById('totalRocketsDefeated');
    const totalRocketsSpawnedEl = document.getElementById('totalRocketsSpawned');
    const totalRocketDefeatRateEl = document.getElementById('totalRocketDefeatRate');
    const totalEnemiesDefeatedEl = document.getElementById('totalEnemiesDefeated');
    const totalEnemiesSpawnedEl = document.getElementById('totalEnemiesSpawned');
    const totalEnemyDefeatRateEl = document.getElementById('totalEnemyDefeatRate');
    const totalCoinsCollectedEl = document.getElementById('totalCoinsCollected');
    const totalCoinsSpawnedEl = document.getElementById('totalCoinsSpawned');
    const totalCoinCollectionRateEl = document.getElementById('totalCoinCollectionRate');
    const totalPlumsCollectedEl = document.getElementById('totalPlumsCollected');
    const totalPlumsSpawnedEl = document.getElementById('totalPlumsSpawned');
    const totalPlumCollectionRateEl = document.getElementById('totalPlumCollectionRate');
    const totalRocketCollisionsEl = document.getElementById('totalRocketCollisions');
    const totalRocketCollisionRateEl = document.getElementById('totalRocketCollisionRate');
    
    if (totalRocketsDefeatedEl) totalRocketsDefeatedEl.textContent = rocketsDefeated;
    if (totalRocketsSpawnedEl) totalRocketsSpawnedEl.textContent = rocketsSpawned;
    if (totalRocketDefeatRateEl) {
        const rate = rocketsSpawned > 0 ? (rocketsDefeated / rocketsSpawned * 100).toFixed(1) : '0.0';
        totalRocketDefeatRateEl.textContent = rate;
    }
    
    if (totalRocketCollisionsEl) totalRocketCollisionsEl.textContent = obstacleCollisions;
    if (totalRocketCollisionRateEl) {
        const rate = rocketsSpawned > 0 ? (obstacleCollisions / rocketsSpawned * 100).toFixed(1) : '0.0';
        totalRocketCollisionRateEl.textContent = rate;
    }
    
    if (totalEnemiesDefeatedEl) totalEnemiesDefeatedEl.textContent = enemiesDefeated;
    if (totalEnemiesSpawnedEl) totalEnemiesSpawnedEl.textContent = enemiesSpawned;
    if (totalEnemyDefeatRateEl) {
        const rate = enemiesSpawned > 0 ? (enemiesDefeated / enemiesSpawned * 100).toFixed(1) : '0.0';
        totalEnemyDefeatRateEl.textContent = rate;
    }
    
    if (totalCoinsCollectedEl) totalCoinsCollectedEl.textContent = coinsCollected;
    if (totalCoinsSpawnedEl) totalCoinsSpawnedEl.textContent = coinsSpawned;
    if (totalCoinCollectionRateEl) {
        const rate = coinsSpawned > 0 ? (coinsCollected / coinsSpawned * 100).toFixed(1) : '0.0';
        totalCoinCollectionRateEl.textContent = rate;
    }
    
    if (totalPlumsCollectedEl) totalPlumsCollectedEl.textContent = umeCollected;
    if (totalPlumsSpawnedEl) totalPlumsSpawnedEl.textContent = plumsSpawned;
    if (totalPlumCollectionRateEl) {
        const rate = plumsSpawned > 0 ? (umeCollected / plumsSpawned * 100).toFixed(1) : '0.0';
        totalPlumCollectionRateEl.textContent = rate;
    }
    
    // モード別統計を更新
    const rightObstacleElement = document.getElementById('rightHandedObstacleCount');
    const rightEnemyElement = document.getElementById('rightHandedEnemyCount');
    const leftObstacleElement = document.getElementById('leftHandedObstacleCount');
    const leftEnemyElement = document.getElementById('leftHandedEnemyCount');
    
    if (rightObstacleElement) rightObstacleElement.textContent = rightHandedObstacleCollisions;
    if (rightEnemyElement) rightEnemyElement.textContent = rightHandedEnemyCollisions;
    if (leftObstacleElement) leftObstacleElement.textContent = leftHandedObstacleCollisions;
    if (leftEnemyElement) leftEnemyElement.textContent = leftHandedEnemyCollisions;
    
    // モード別撃退・獲得統計を更新
    const rightRocketsDefeatedEl = document.getElementById('rightHandedRocketsDefeated');
    const rightRocketsSpawnedEl = document.getElementById('rightHandedRocketsSpawned');
    const rightRocketDefeatRateEl = document.getElementById('rightHandedRocketDefeatRate');
    const rightEnemiesDefeatedEl = document.getElementById('rightHandedEnemiesDefeated');
    const rightEnemiesSpawnedEl = document.getElementById('rightHandedEnemiesSpawned');
    const rightEnemyDefeatRateEl = document.getElementById('rightHandedEnemyDefeatRate');
    const rightCoinsCollectedEl = document.getElementById('rightHandedCoinsCollected');
    const rightCoinsSpawnedEl = document.getElementById('rightHandedCoinsSpawned');
    const rightCoinCollectionRateEl = document.getElementById('rightHandedCoinCollectionRate');
    const rightPlumsCollectedEl = document.getElementById('rightHandedPlumsCollected');
    const rightPlumsSpawnedEl = document.getElementById('rightHandedPlumsSpawned');
    const rightPlumCollectionRateEl = document.getElementById('rightHandedPlumCollectionRate');
    const rightObstacleCollisionsEl = document.getElementById('rightHandedObstacleCollisions');
    const rightRocketCollisionRateEl = document.getElementById('rightHandedRocketCollisionRate');
    
    if (rightRocketsDefeatedEl) rightRocketsDefeatedEl.textContent = rightHandedRocketsDefeated;
    if (rightRocketsSpawnedEl) rightRocketsSpawnedEl.textContent = rightHandedRocketsSpawned;
    if (rightRocketDefeatRateEl) {
        const rate = rightHandedRocketsSpawned > 0 ? (rightHandedRocketsDefeated / rightHandedRocketsSpawned * 100).toFixed(1) : '0.0';
        rightRocketDefeatRateEl.textContent = rate;
    }
    
    if (rightEnemiesDefeatedEl) rightEnemiesDefeatedEl.textContent = rightHandedEnemiesDefeated;
    if (rightEnemiesSpawnedEl) rightEnemiesSpawnedEl.textContent = rightHandedEnemiesSpawned;
    if (rightEnemyDefeatRateEl) {
        const rate = rightHandedEnemiesSpawned > 0 ? (rightHandedEnemiesDefeated / rightHandedEnemiesSpawned * 100).toFixed(1) : '0.0';
        rightEnemyDefeatRateEl.textContent = rate;
    }
    
    if (rightCoinsCollectedEl) rightCoinsCollectedEl.textContent = rightHandedCoinsCollected;
    if (rightCoinsSpawnedEl) rightCoinsSpawnedEl.textContent = rightHandedCoinsSpawned;
    if (rightCoinCollectionRateEl) {
        const rate = rightHandedCoinsSpawned > 0 ? (rightHandedCoinsCollected / rightHandedCoinsSpawned * 100).toFixed(1) : '0.0';
        rightCoinCollectionRateEl.textContent = rate;
    }
    
    if (rightPlumsCollectedEl) rightPlumsCollectedEl.textContent = rightHandedPlumsCollected;
    if (rightPlumsSpawnedEl) rightPlumsSpawnedEl.textContent = rightHandedPlumsSpawned;
    if (rightPlumCollectionRateEl) {
        const rate = rightHandedPlumsSpawned > 0 ? (rightHandedPlumsCollected / rightHandedPlumsSpawned * 100).toFixed(1) : '0.0';
        rightPlumCollectionRateEl.textContent = rate;
    }
    
    if (rightObstacleCollisionsEl) rightObstacleCollisionsEl.textContent = rightHandedObstacleCollisions;
    if (rightRocketCollisionRateEl) {
        const rate = rightHandedRocketsSpawned > 0 ? (rightHandedObstacleCollisions / rightHandedRocketsSpawned * 100).toFixed(1) : '0.0';
        rightRocketCollisionRateEl.textContent = rate;
    }
    
    const leftRocketsDefeatedEl = document.getElementById('leftHandedRocketsDefeated');
    const leftRocketsSpawnedEl = document.getElementById('leftHandedRocketsSpawned');
    const leftRocketDefeatRateEl = document.getElementById('leftHandedRocketDefeatRate');
    const leftEnemiesDefeatedEl = document.getElementById('leftHandedEnemiesDefeated');
    const leftEnemiesSpawnedEl = document.getElementById('leftHandedEnemiesSpawned');
    const leftEnemyDefeatRateEl = document.getElementById('leftHandedEnemyDefeatRate');
    const leftCoinsCollectedEl = document.getElementById('leftHandedCoinsCollected');
    const leftCoinsSpawnedEl = document.getElementById('leftHandedCoinsSpawned');
    const leftCoinCollectionRateEl = document.getElementById('leftHandedCoinCollectionRate');
    const leftPlumsCollectedEl = document.getElementById('leftHandedPlumsCollected');
    const leftPlumsSpawnedEl = document.getElementById('leftHandedPlumsSpawned');
    const leftPlumCollectionRateEl = document.getElementById('leftHandedPlumCollectionRate');
    const leftObstacleCollisionsEl = document.getElementById('leftHandedObstacleCollisions');
    const leftRocketCollisionRateEl = document.getElementById('leftHandedRocketCollisionRate');
    
    if (leftRocketsDefeatedEl) leftRocketsDefeatedEl.textContent = leftHandedRocketsDefeated;
    if (leftRocketsSpawnedEl) leftRocketsSpawnedEl.textContent = leftHandedRocketsSpawned;
    if (leftRocketDefeatRateEl) {
        const rate = leftHandedRocketsSpawned > 0 ? (leftHandedRocketsDefeated / leftHandedRocketsSpawned * 100).toFixed(1) : '0.0';
        leftRocketDefeatRateEl.textContent = rate;
    }
    
    if (leftEnemiesDefeatedEl) leftEnemiesDefeatedEl.textContent = leftHandedEnemiesDefeated;
    if (leftEnemiesSpawnedEl) leftEnemiesSpawnedEl.textContent = leftHandedEnemiesSpawned;
    if (leftEnemyDefeatRateEl) {
        const rate = leftHandedEnemiesSpawned > 0 ? (leftHandedEnemiesDefeated / leftHandedEnemiesSpawned * 100).toFixed(1) : '0.0';
        leftEnemyDefeatRateEl.textContent = rate;
    }
    
    if (leftCoinsCollectedEl) leftCoinsCollectedEl.textContent = leftHandedCoinsCollected;
    if (leftCoinsSpawnedEl) leftCoinsSpawnedEl.textContent = leftHandedCoinsSpawned;
    if (leftCoinCollectionRateEl) {
        const rate = leftHandedCoinsSpawned > 0 ? (leftHandedCoinsCollected / leftHandedCoinsSpawned * 100).toFixed(1) : '0.0';
        leftCoinCollectionRateEl.textContent = rate;
    }
    
    if (leftPlumsCollectedEl) leftPlumsCollectedEl.textContent = leftHandedPlumsCollected;
    if (leftPlumsSpawnedEl) leftPlumsSpawnedEl.textContent = leftHandedPlumsSpawned;
    if (leftPlumCollectionRateEl) {
        const rate = leftHandedPlumsSpawned > 0 ? (leftHandedPlumsCollected / leftHandedPlumsSpawned * 100).toFixed(1) : '0.0';
        leftPlumCollectionRateEl.textContent = rate;
    }
    
    if (leftObstacleCollisionsEl) leftObstacleCollisionsEl.textContent = leftHandedObstacleCollisions;
    if (leftRocketCollisionRateEl) {
        const rate = leftHandedRocketsSpawned > 0 ? (leftHandedObstacleCollisions / leftHandedRocketsSpawned * 100).toFixed(1) : '0.0';
        leftRocketCollisionRateEl.textContent = rate;
    }
    
    // 切り替え後10秒間の記録を更新
    const recordsListElement = document.getElementById('postSwitchRecordsList');
    if (recordsListElement) {
        let html = '';
        
        // 既存の記録を表示
        postSwitchRecords.forEach((record, index) => {
            const modeName = record.mode === 'right' ? '右利きモード' : '左利きモード';
            const duration = record.endTime ? ((record.endTime - record.startTime) / 1000).toFixed(1) : '10.0';
            html += `
                <div class="post-switch-record">
                    <p><span class="record-mode">${modeName}</span> (記録 #${index + 1})</p>
                    <p>ロケット被弾: ${record.obstacleCollisions}回</p>
                    <p>モンスター衝突: ${record.enemyCollisions}回</p>
                    <p>記録時間: ${duration}秒</p>
                </div>
            `;
        });
        
        // 現在進行中の記録を表示
        if (currentPostSwitchRecord) {
            const now = Date.now();
            const elapsed = (now - currentPostSwitchRecord.startTime) / 1000;
            const modeName = currentPostSwitchRecord.mode === 'right' ? '右利きモード' : '左利きモード';
            html += `
                <div class="post-switch-record" style="border-left-color: #FFD700;">
                    <p><span class="record-mode">${modeName}</span> (記録中...)</p>
                    <p>ロケット被弾: ${currentPostSwitchRecord.obstacleCollisions}回</p>
                    <p>モンスター衝突: ${currentPostSwitchRecord.enemyCollisions}回</p>
                    <p>経過時間: ${elapsed.toFixed(1)}秒 / 10.0秒</p>
                </div>
            `;
        }
        
        if (html === '') {
            html = '<p style="color: #999; text-align: center;">まだ記録がありません</p>';
        }
        
        recordsListElement.innerHTML = html;
    }
}

// コントローラー状態表示用の関数
function showGamepadStatus(message, type) {
    const statusElement = document.getElementById('gamepadStatus');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.style.color = type === 'success' ? '#00AA00' : '#AA0000';
    }
    console.log(message);
    
    // ゲーム中は常に状態を更新
    updateGamepadStatus();
}

// コントローラー状態を更新する関数
function updateGamepadStatus() {
    const statusElement = document.getElementById('gamepadStatus');
    if (statusElement) {
        if (gamepadConnected) {
            statusElement.textContent = '🎮 コントローラー接続中';
            statusElement.style.color = '#00AA00';
        } else {
            statusElement.textContent = '❌ コントローラー未接続';
            statusElement.style.color = '#AA0000';
        }
    }
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
    
    for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i]) {
            if (gamepads[i].connected) {
                connectedCount++;
                actualGamepads.push(gamepads[i]);
            }
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
                coinsSpawned++; // コイン登場数をカウント
                // モード別カウンターを更新
                if (isRightHanded) {
                    rightHandedCoinsSpawned++;
                } else {
                    leftHandedCoinsSpawned++;
                }
            }
        } else if (rand < 0.95) { 
            enemies.push(new Enemy({ x: newX + width / 2, y: newY - 40, platform: platform })); 
            enemiesSpawned++; // モンスター登場数をカウント
            // モード別カウンターを更新
            if (isRightHanded) {
                rightHandedEnemiesSpawned++;
            } else {
                leftHandedEnemiesSpawned++;
            }
        }
        lastPlatformX = newX + width;
    }
    // 浮遊障害物の生成（無限に生成）
    while (lastObstacleX < scrollOffset + canvas.width + 200) {
        const gap = Math.random() * 400 + 400;
        const newX = lastObstacleX + gap;
        const newY = Math.random() * (canvas.height - 150) + 50;
        obstacles.push(new Obstacle({ x: newX, y: newY }));
        rocketsSpawned++; // ロケット登場数をカウント
        // モード別カウンターを更新
        if (isRightHanded) {
            rightHandedRocketsSpawned++;
        } else {
            leftHandedRocketsSpawned++;
        }
        lastObstacleX = newX;
    }
}

// --- ゲームループ ---
function animate() {
    requestAnimationFrame(animate);

    // 左右切替の処理
    if (gameState === 'playing' && timerStarted) {
        const now = Date.now();
        if (currentModeStartTime === 0) {
            currentModeStartTime = now;
        }
        const timeUntilSwitch = Math.max(0, nextSwitchTime - now);
        switchCountdown = Math.ceil(timeUntilSwitch / 1000);

        // 切り替え時刻になったら切り替え
        if (now >= nextSwitchTime) {
            accumulateCurrentModeTime(now);
            
            // 切り替え後10秒間の記録を開始
            if (currentPostSwitchRecord) {
                // 前の記録を終了して配列に追加
                currentPostSwitchRecord.endTime = now;
                postSwitchRecords.push(currentPostSwitchRecord);
            }
            
            // モードを切り替え
            isRightHanded = !isRightHanded;
            
            // 新しい記録を開始（切り替え後のモードを記録）
            postSwitchStartTime = now;
            currentPostSwitchRecord = {
                mode: isRightHanded ? 'right' : 'left', // 切り替え後のモード
                startTime: now,
                endTime: null,
                obstacleCollisions: 0,
                enemyCollisions: 0
            };
            currentModeStartTime = now;
            console.log(`モード切り替え: ${isRightHanded ? '右利き' : '左利き'}モード（右: ${rightHandedTime.toFixed(1)}秒 / 左: ${leftHandedTime.toFixed(1)}秒）`);
            // モード切り替え音を再生（音量を大きく）
            if (modeSwitchSound) {
                try {
                    modeSwitchSound.volume = 1.0; // 音量を最大に
                    modeSwitchSound.currentTime = 0;
                    const playPromise = modeSwitchSound.play();
                    if (playPromise !== undefined) {
                        playPromise.then(() => {
                            console.log('モード切り替え音が再生されました');
                        }).catch(error => {
                            console.log('モード切り替え音の再生に失敗しました:', error);
                        });
                    }
                } catch (error) {
                    console.error('モード切り替え音の再生エラー:', error);
                }
            }
            scheduleNextSwitch(); // 次の切り替えをスケジュール
        }
        
        // 切り替え後10秒間の記録をチェック
        if (currentPostSwitchRecord && postSwitchStartTime > 0) {
            const elapsed = (now - postSwitchStartTime) / 1000; // 経過時間（秒）
            if (elapsed >= 10) {
                // 10秒経過したら記録を終了
                currentPostSwitchRecord.endTime = now;
                postSwitchRecords.push(currentPostSwitchRecord);
                currentPostSwitchRecord = null;
                postSwitchStartTime = 0;
            }
        }
    }

    // Gamepadの入力処理
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    let connectedGamepad = null;
    
    // 実際に接続されているゲームパッドを探す
    for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i] && gamepads[i].connected && gamepads[i].id) {
            if (gamepads[i].id.includes('STANDARD GAMEPAD') || 
                gamepads[i].id.includes('Xbox') || 
                gamepads[i].id.includes('045e')) {
                connectedGamepad = gamepads[i];
                break;
            }
        }
    }
    
    if (connectedGamepad) {
        gamepad = connectedGamepad;
        if (!gamepadConnected) {
            gamepadConnected = true;
            showGamepadStatus("コントローラーが接続されました", "success");
        }
        
        // スタート画面：コントローラではスタートできない（エンターキーのみ）
        // 終了画面：コントローラではリスタートできない（エンターキーのみ）
        // ゲーム中：通常の操作
        else if (gameState === 'playing') {
            // 右利きモード: 左スティックで移動、Bボタンでジャンプ
            // 左利きモード: 右スティックで移動、十字ボタン右でジャンプ
            if (isRightHanded) {
                // 右利きモード: 左スティックのX軸（移動）
                const xAxis = gamepad.axes[0];
                if (xAxis < -0.5) { // 左に倒す
                    keys.left.pressed = true;
                    keys.right.pressed = false;
                    startTimer();
                } else if (xAxis > 0.5) { // 右に倒す
                    keys.right.pressed = true;
                    keys.left.pressed = false;
                    startTimer();
                } else { // ニュートラル
                    keys.left.pressed = false;
                    keys.right.pressed = false;
                }

                // 右ボタン（Bボタン、インデックス1）でジャンプ
                if (gamepad.buttons[1] && gamepad.buttons[1].pressed) {
                    if (!gamepadButtons.rightPressed && gameState === 'playing' && player.velocity.y === 0) {
                        player.velocity.y = -JUMP_POWER;
                        gamepadButtons.rightPressed = true;
                        // ジャンプ時の効果音
                        playSoundEffect(jumpSound, 'ジャンプ');
                    }
                    startBGM();
                    startTimer();
                } else {
                    gamepadButtons.rightPressed = false;
                }

            } else {
                // 左利きモード: 右スティックのX軸（移動）- axes[2]が右スティックのX軸
                const rightStickX = gamepad.axes[2];
                if (rightStickX < -0.5) { // 左に倒す
                    keys.left.pressed = true;
                    keys.right.pressed = false;
                    startTimer();
                } else if (rightStickX > 0.5) { // 右に倒す
                    keys.right.pressed = true;
                    keys.left.pressed = false;
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
                            // ジャンプ時の効果音
                            playSoundEffect(jumpSound, 'ジャンプ');
                        }
                    }
                    startBGM();
                    startTimer();
                } else {
                    gamepadButtons.rightPressed = false;
                }

            }
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
        if (plums && plums.length > 0) {
            plums.forEach(p => p.update());
        }

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
        obstacles.forEach((o, i) => { 
            // 落下中のロケットは衝突判定をスキップ
            if (o.isFalling) return;
            
            const isColliding = player.position.x < o.position.x + o.width && player.position.x + player.width > o.position.x && player.position.y < o.position.y + o.height && player.position.y + player.height > o.position.y;
            if (isColliding) { 
                // 上から踏みつけた場合（ロケットを踏みつけた）
                if (player.velocity.y > 0 && player.position.y + player.height - player.velocity.y <= o.position.y && !o.collided) {
                    // ロケットを落下状態にする（削除しない）
                    o.isFalling = true;
                    o.fallVelocity = 2; // 初期落下速度
                    o.collided = true; // 衝突済みフラグを立てる
                    score += 100;
                    rocketsDefeated++; // ロケット撃退数をカウント
                    // モード別カウンターを更新
                    if (isRightHanded) {
                        rightHandedRocketsDefeated++;
                    } else {
                        leftHandedRocketsDefeated++;
                    }
                    player.velocity.y = -JUMP_POWER / 2;
                    // ロケットを踏みつけた時の効果音
                    playSoundEffect(retroSound, 'レトロアクション');
                } else if (!o.collided) {
                    // 横や下から衝突した場合
                    score -= 100; 
                    if (score < 0) score = 0; 
                    obstacleCollisions++;
                    
                    // モード別カウンターを更新
                    if (isRightHanded) {
                        rightHandedObstacleCollisions++;
                    } else {
                        leftHandedObstacleCollisions++;
                    }
                    
                    // 切り替え後10秒間の記録を更新
                    if (currentPostSwitchRecord) {
                        currentPostSwitchRecord.obstacleCollisions++;
                    }
                    
                    o.collided = true;
                    // ロケット接触時の効果音
                    playSoundEffect(explosionSound, '爆発');
                }
            } else {
                o.collided = false;
            }
        });
        enemies.forEach((e, i) => { 
            const isColliding = player.position.x < e.position.x + e.width && player.position.x + player.width > e.position.x && player.position.y < e.position.y + e.height && player.position.y + player.height > e.position.y;
            if (isColliding) { 
                if (player.velocity.y > 0 && player.position.y + player.height - player.velocity.y <= e.position.y && !e.collided) { 
                    const enemyCenterX = e.position.x + e.width / 2;
                    const enemyCenterY = e.position.y + e.height / 2;
                    // モンスターを倒したら65%の確率で梅アイコンに変わる
                    if (Math.random() < UME_DROP_RATE) {
                        // モンスターが梅アイコン（plumIcon）に変わる
                        // 生成位置を少し上にずらして、プレイヤーと離れるようにする
                        const plumY = enemyCenterY - 30; // モンスターの中心より30ピクセル上に配置
                        const plum = new Plum({ x: enemyCenterX, y: plumY });
                        plums.push(plum);
                        plumsSpawned++; // 梅の登場数をカウント
                        // モード別カウンターを更新
                        if (isRightHanded) {
                            rightHandedPlumsSpawned++;
                        } else {
                            leftHandedPlumsSpawned++;
                        }
                        console.log(`モンスターが梅アイコンに変わりました: 位置(${enemyCenterX.toFixed(1)}, ${plumY.toFixed(1)}), 配列サイズ: ${plums.length}`);
                    }
                    enemies.splice(i, 1); 
                    score += 100; 
                    enemiesDefeated++; // モンスター撃退数をカウント
                    // モード別カウンターを更新
                    if (isRightHanded) {
                        rightHandedEnemiesDefeated++;
                    } else {
                        leftHandedEnemiesDefeated++;
                    }
                    player.velocity.y = -JUMP_POWER / 2;
                    // 敵を踏み潰した時の効果音
                    playSoundEffect(retroSound, 'レトロアクション');
                } else if (!e.collided) { 
                    score -= 100; 
                    if (score < 0) score = 0; 
                    enemyCollisions++;
                    
                    // モード別カウンターを更新
                    if (isRightHanded) {
                        rightHandedEnemyCollisions++;
                    } else {
                        leftHandedEnemyCollisions++;
                    }
                    
                    // 切り替え後10秒間の記録を更新
                    if (currentPostSwitchRecord) {
                        currentPostSwitchRecord.enemyCollisions++;
                    }
                    
                    e.collided = true;
                    // モンスター接触時の効果音
                    playSoundEffect(errorSound, 'エラー');
                }
            } else {
                e.collided = false;
            }
        });
        coins.forEach(c => { 
            if (c.active) { 
                const dist = Math.hypot(player.position.x + player.width/2 - c.position.x, player.position.y+player.height/2 - c.position.y); 
                if (dist < player.width / 2 + c.radius) { 
                    c.active = false; 
                    score += COIN_SCORE; 
                    coinsCollected++;
                    // モード別カウンターを更新
                    if (isRightHanded) {
                        rightHandedCoinsCollected++;
                    } else {
                        leftHandedCoinsCollected++;
                    }
                    // コイン獲得時の効果音
                    playSoundEffect(coinSound, 'コイン');
                } 
            } 
        });
        // 梅アイコン（plumIcon）の取得判定（梅が実際に存在し、画面内に表示され、取得された時だけカウント）
        if (plums && plums.length > 0) {
            plums.forEach((p, index) => {
                // 梅が存在し、かつactiveで、取得可能な時だけ処理
                if (!p || !p.active || !p.canCollect) return; // 既に取得済み、存在しない、または取得不可の梅はスキップ
                
                const plumY = p.getDisplayY();
                const plumX = p.position.x;
                
                // プレイヤーと梅の絶対位置で衝突判定（スクロールオフセットを考慮しない）
                const playerCenterX = player.position.x + player.width / 2;
                const playerCenterY = player.position.y + player.height / 2;
                const distX = plumX - playerCenterX;
                const distY = plumY - playerCenterY;
                const dist = Math.sqrt(distX * distX + distY * distY);
                
                // 梅の半径 + プレイヤーの半径内にプレイヤーが触れているか確認
                // 取得判定を少し緩和して、確実に取得できるようにする
                const playerRadius = Math.max(player.width, player.height) / 2;
                const collisionRadius = p.radius + playerRadius + 5; // 少し余裕を持たせる
                if (dist < collisionRadius) {
                    // 梅アイコンを獲得したら梅の数を加算する
                    if (p.active && p.canCollect) {
                        p.active = false;
                        umeCollected++; // 梅の数を加算
                        // モード別カウンターを更新
                        if (isRightHanded) {
                            rightHandedPlumsCollected++;
                        } else {
                            leftHandedPlumsCollected++;
                        }
                        playSoundEffect(coinSound, '梅');
                        console.log(`梅アイコンを取得しました: 現在の梅数=${umeCollected}`);
                    }
                }
            });
        }
        // 落下したら少し後ろに戻す
        if (player.position.y > groundY + 100) { player.position.x -= 50; player.position.y = groundY - player.height; player.velocity = { x: 0, y: 0 }; }

        // 4. カメラとオブジェクト管理
        if (player.position.x > scrollOffset + canvas.width / 3) scrollOffset = player.position.x - canvas.width / 3;
        if (player.position.x < scrollOffset) player.position.x = scrollOffset;
        generateObjects();
        platforms = platforms.filter(p => p.position.x + p.width > scrollOffset);
        clouds = clouds.filter(c => c.position.x - scrollOffset * 0.5 + c.size * 2 > 0); // 画面外に出た雲を削除
        stars = stars.filter(s => s.position.x - scrollOffset * 0.5 + s.size * 2 > 0); // 画面外に出た星を削除
        mountains = mountains.filter(m => m.position.x - scrollOffset * 0.3 + m.width > 0); // 画面外に出た山を削除
        coins = coins.filter(c => c.position.x + c.radius > scrollOffset);
        enemies = enemies.filter(e => e.position.x + e.width > scrollOffset);
        console.log(`梅のフィルタリング前: 全梅数=${plums ? plums.length : 0}, scrollOffset=${scrollOffset}`);
        if (plums && plums.length > 0) {
            plums.forEach(p => {
                const condition = p.active && p.position.x + p.radius > scrollOffset - 100;
                console.log(`梅フィルタリング: position=(${p.position.x}, ${p.position.y}), active=${p.active}, x+radius=${p.position.x + p.radius}, scrollOffset-100=${scrollOffset - 100}, 条件=${condition}`);
            });
        }
        // 梅は画面外に出た時だけ削除（余裕を持たせる）
        plums = (plums || []).filter(p => {
            if (!p || !p.active) return false; // activeでない梅は削除
            // 画面外に出た梅だけを削除（大きなマージンで確実に表示されるようにする）
            return p.position.x + p.radius > scrollOffset - 500;
        });
        console.log(`梅のフィルタリング後: 全梅数=${plums ? plums.length : 0}`);
        // 落下中のロケットは画面下に落ちた時に削除、通常のロケットは画面左に出た時に削除
        obstacles = obstacles.filter(o => {
            if (o.isFalling) {
                // 落下中のロケットは地面より下に落ちた時に削除
                return o.position.y < canvas.height + 100;
            } else {
                // 通常のロケットは画面左に出た時に削除
                return o.position.x + o.width > scrollOffset;
            }
        });
    }

    // 統計情報を更新（ゲーム中のみ）
    if (gameState === 'playing' || gameState === 'gameOver') {
        updateStatisticsDisplay();
    }
    
    // --- 描画処理 ---
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // スタート画面
    if (gameState === 'startScreen') {
        drawStartScreen();
    }
    // カウントダウン画面
    else if (gameState === 'countdown') {
        drawCountdown();
    }
    // ゲーム中または終了画面
    else {
        drawBackground(scrollOffset); // 背景を描画
        
        // 右利きモード：雲を描画、左利きモード：星を描画（背景レイヤー）
        if (clouds && clouds.length > 0) {
            if (isRightHanded) {
                clouds.forEach(c => {
                    if (c.position.x - scrollOffset * 0.5 + c.size * 2 > 0 && c.position.x - scrollOffset * 0.5 - c.size * 2 < canvas.width) {
                        c.draw(scrollOffset);
                    }
                });
            } else if (stars && stars.length > 0) {
                stars.forEach(s => {
                    if (s.position.x - scrollOffset * 0.5 + s.size * 2 > 0 && s.position.x - scrollOffset * 0.5 - s.size * 2 < canvas.width) {
                        s.draw(scrollOffset);
                    }
                });
            }
        }
        
        // 山を描画（雲/星の後、地面の前の背景レイヤー）
        if (mountains && mountains.length > 0) {
            mountains.forEach(m => {
                m.draw(scrollOffset);
            });
        }
        
        if (gameState === 'playing') {
            if (platforms && platforms.length > 0) platforms.forEach(p => p.draw(scrollOffset));
            if (obstacles && obstacles.length > 0) obstacles.forEach(o => o.draw(scrollOffset));
            if (coins && coins.length > 0) coins.forEach(c => c.draw(scrollOffset));
            if (enemies && enemies.length > 0) enemies.forEach(e => e.draw(scrollOffset));
            // 梅は敵の後に描画して、確実に表示されるようにする
            // 生成された梅（active=true）は100%表示される
            if (plums && plums.length > 0) {
                plums.forEach((p, index) => {
                    if (p && p.active) {
                        const screenX = p.position.x - scrollOffset;
                        const screenY = p.getDisplayY();
                        // 画面内にある梅は必ず描画
                        if (screenX > -300 && screenX < canvas.width + 300 && screenY > -300 && screenY < canvas.height + 300) {
                            p.draw(scrollOffset);
                        }
                    }
                });
            }
            if (player) player.draw(scrollOffset);
            drawScore();
        } else if (gameState === 'gameOver') {
            // ゲーム終了時も背景とプレイヤーを描画（最後の状態を表示）
            if (platforms && platforms.length > 0) platforms.forEach(p => p.draw(scrollOffset));
            if (obstacles && obstacles.length > 0) obstacles.forEach(o => o.draw(scrollOffset));
            if (coins && coins.length > 0) coins.forEach(c => c.draw(scrollOffset));
            if (plums && plums.length > 0) plums.forEach(p => p.draw(scrollOffset));
            if (enemies && enemies.length > 0) enemies.forEach(e => e.draw(scrollOffset));
            if (player) player.draw(scrollOffset);
            // ゲーム終了時にBGMを停止
            stopBGM();
            // 終了画面を描画（最後に描画して上書きされないように）
            drawMessage('タイムアップ！', 'エンターキーでリスタート', score);
        }
    }
    
}

// --- イベントリスナー ---
window.addEventListener('keydown', (e) => { 
    const code = e.code;
    // ゲームで使用するキーのデフォルト動作を防止
    if (code === 'ArrowUp' || code === 'ArrowDown' || code === 'ArrowLeft' || code === 'ArrowRight' || code === 'Space') {
        e.preventDefault();
    }
    if (gameState === 'startScreen') {
        // スタート画面：エンターキーでカウントダウン開始
        if (code === 'Enter') {
            e.preventDefault();
            startCountdown();
        }
    } else if (gameState === 'playing') {
        // ゲーム中のみBGMを開始（エンターキー以外）
        if (code !== 'Enter') {
            startBGM();
        } 
        // タイマーを開始
        startTimer();
        switch (code) { 
            case 'ArrowLeft': case 'KeyA': keys.left.pressed = true; break; 
            case 'ArrowRight': case 'KeyD': keys.right.pressed = true; break; 
            case 'Space': case 'ArrowUp': case 'KeyW': 
                player.velocity.y = -JUMP_POWER;
                // ジャンプ時の効果音
                playSoundEffect(jumpSound, 'ジャンプ');
                startTimer(); // ジャンプでもタイマー開始
                break; 
        } 
    } else if (gameState === 'gameOver') {
        // 終了画面：エンターキーでリスタート
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

// コントローラー接続を手動でチェックする関数
function checkGamepadConnection() {
    const actualGamepads = debugGamepadInfo();
    if (actualGamepads.length > 0 && !gamepadConnected) {
        console.log("コントローラーが検出されました！接続状態を更新します。");
        gamepad = actualGamepads[0];
        gamepadConnected = true;
        showGamepadStatus("コントローラーが接続されました", "success");
        return true;
    } else if (actualGamepads.length === 0 && gamepadConnected) {
        // 接続が切れた場合
        console.log("コントローラーの接続が切れました");
        gamepad = null;
        gamepadConnected = false;
        showGamepadStatus("コントローラーが切断されました", "error");
        return false;
    }
    return false;
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
    if (!gamepadConnected) {
        checkGamepadConnection();
    }
});

// キャラクター画像を読み込む
pramImage = new Image();
pramImage.src = '../Image/Pram.png';
pramImage.onload = function() {
    console.log('Pramの画像が読み込まれました');
};

plamImage = new Image();
plamImage.src = '../Image/Plam.png';
plamImage.onload = function() {
    console.log('Plamの画像が読み込まれました');
};

// 梅の花の画像を読み込む
flowerImage = new Image();
flowerImage.src = '../Image/flower.png';
flowerImage.onload = function() {
    console.log('flowerの画像が読み込まれました');
};

// 説明部分のアイコンを描画する関数
function drawExplanationIcons() {
    // コインアイコン
    const coinCanvas = document.getElementById('coinIcon');
    if (coinCanvas) {
        const coinCtx = coinCanvas.getContext('2d');
        drawCoinIconToCanvas(coinCtx, 10, 10, 8);
    }
    
    // ロケットアイコン（canvasの中央に配置）
    const rocketCanvas = document.getElementById('rocketIcon');
    if (rocketCanvas) {
        const rocketCtx = rocketCanvas.getContext('2d');
        const rocketSize = 18; // サイズをさらに大きく
        const rocketX = 10; // canvasの中央X
        const rocketY = 10; // canvasの中央Y
        drawRocketIconToCanvas(rocketCtx, rocketX - rocketSize/2, rocketY - rocketSize/2, rocketSize);
    }
    
    // モンスターアイコン（canvasの中央に配置）
    const enemyCanvas = document.getElementById('enemyIcon');
    if (enemyCanvas) {
        const enemyCtx = enemyCanvas.getContext('2d');
        const enemySize = 18; // サイズをさらに大きく
        const enemyX = 10; // canvasの中央X
        const enemyY = 10; // canvasの中央Y
        drawEnemyIconToCanvas(enemyCtx, enemyX - enemySize/2, enemyY - enemySize/2, enemySize);
    }
    
    // ロケットアイコン2（ロケットに衝突の項目用）
    const rocketCanvas2 = document.getElementById('rocketIcon2');
    if (rocketCanvas2) {
        const rocketCtx2 = rocketCanvas2.getContext('2d');
        const rocketSize2 = 18;
        const rocketX2 = 10;
        const rocketY2 = 10;
        drawRocketIconToCanvas(rocketCtx2, rocketX2 - rocketSize2/2, rocketY2 - rocketSize2/2, rocketSize2);
    }
    
    // モンスターアイコン2（敵に衝突の項目用）
    const enemyCanvas2 = document.getElementById('enemyIcon2');
    if (enemyCanvas2) {
        const enemyCtx2 = enemyCanvas2.getContext('2d');
        const enemySize2 = 18;
        const enemyX2 = 10;
        const enemyY2 = 10;
        drawEnemyIconToCanvas(enemyCtx2, enemyX2 - enemySize2/2, enemyY2 - enemySize2/2, enemySize2);
    }

    // 梅アイコン
    const plumCanvas = document.getElementById('plumIcon');
    if (plumCanvas) {
        const plumCtx = plumCanvas.getContext('2d');
        drawPlumIconToCanvas(plumCtx, 10, 10, 8);
    }
}

// コインを任意のcanvasに描画する関数
function drawCoinIconToCanvas(ctx, x, y, radius) {
    const r = radius || 8;
    
    ctx.save();
    
    // 外側の縁（盛り上がったリム）- 明るい金色
    const rimGradient = ctx.createRadialGradient(x, y, r * 0.7, x, y, r);
    rimGradient.addColorStop(0, '#FFD700');
    rimGradient.addColorStop(1, '#FFA500');
    ctx.fillStyle = rimGradient;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    
    // 内側のコイン本体
    const bodyGradient = ctx.createRadialGradient(x - r/4, y - r/4, 0, x, y, r * 0.85);
    bodyGradient.addColorStop(0, '#FFD700');
    bodyGradient.addColorStop(0.6, '#FFA500');
    bodyGradient.addColorStop(1, '#DAA520');
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.85, 0, Math.PI * 2);
    ctx.fill();
    
    // 中央の縦長長方形
    const rectWidth = r * 0.3;
    const rectHeight = r * 0.8;
    const rectX = x - rectWidth / 2;
    const rectY = y - rectHeight / 2;
    
    // 長方形の影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(rectX + 1, rectY + rectHeight * 0.6, rectWidth, rectHeight * 0.4);
    
    // 長方形本体
    const rectGradient = ctx.createLinearGradient(rectX, rectY, rectX, rectY + rectHeight);
    rectGradient.addColorStop(0, '#FFF8DC');
    rectGradient.addColorStop(0.5, '#FFD700');
    rectGradient.addColorStop(1, '#FFA500');
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
    
    // ハイライト
    ctx.fillStyle = '#FFFFFF';
    ctx.globalAlpha = 0.6;
    ctx.fillRect(rectX, rectY, rectWidth, rectHeight * 0.3);
    ctx.globalAlpha = 1.0;
    
    ctx.restore();
}

// ロケットを任意のcanvasに描画する関数
function drawRocketIconToCanvas(ctx, x, y, size) {
    const w = size || 14;
    const h = size || 14;
    
    ctx.save();
    
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.moveTo(x, y + h/2);
    ctx.lineTo(x + w*0.6, y + h*0.25);
    ctx.lineTo(x + w*0.8, y + h*0.25);
    ctx.lineTo(x + w, y + h*0.15);
    ctx.lineTo(x + w*0.9, y + h/2);
    ctx.lineTo(x + w, y + h*0.85);
    ctx.lineTo(x + w*0.8, y + h*0.75);
    ctx.lineTo(x + w*0.6, y + h*0.75);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#333';
    ctx.fillRect(x + w*0.2, y + h*0.3, w*0.4, h*0.4);
    
    ctx.fillStyle = '#2a2a2a';
    ctx.beginPath();
    ctx.moveTo(x, y + h/2);
    ctx.lineTo(x + w*0.2, y + h*0.3);
    ctx.lineTo(x + w*0.2, y + h*0.7);
    ctx.closePath();
    ctx.fill();
    
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + w*0.6, y + h*0.25);
    ctx.lineTo(x + w, y + h*0.15);
    ctx.moveTo(x + w*0.6, y + h*0.75);
    ctx.lineTo(x + w, y + h*0.85);
    ctx.stroke();
    
    ctx.restore();
}

// モンスターを任意のcanvasに描画する関数
function drawEnemyIconToCanvas(ctx, x, y, size) {
    const w = size || 14;
    const h = size || 14;
    
    ctx.save();
    
    ctx.fillStyle = '#8B00FF';
    ctx.fillRect(x + w*0.1, y + h*0.2, w*0.8, h*0.6);
    
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(x + w*0.25, y + h*0.35, w*0.15, 0, Math.PI * 2);
    ctx.arc(x + w*0.75, y + h*0.35, w*0.15, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(x + w*0.25, y + h*0.35, w*0.08, 0, Math.PI * 2);
    ctx.arc(x + w*0.75, y + h*0.35, w*0.08, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#8B00FF';
    ctx.fillRect(x + w*0.1, y + h*0.8, w*0.15, h*0.2);
    ctx.fillRect(x + w*0.35, y + h*0.8, w*0.15, h*0.2);
    ctx.fillRect(x + w*0.5, y + h*0.8, w*0.15, h*0.2);
    ctx.fillRect(x + w*0.75, y + h*0.8, w*0.15, h*0.2);
    
    ctx.restore();
}

// フォント読み込みを待つ
if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
        console.log('フォントが読み込まれました');
        drawExplanationIcons(); // 説明部分のアイコンを描画
        init();
        animate();
    });
} else {
    // フォントAPIがサポートされていない場合は即座に開始
    setTimeout(() => {
        drawExplanationIcons(); // 説明部分のアイコンを描画
        init();
        animate();
    }, 100);
}

