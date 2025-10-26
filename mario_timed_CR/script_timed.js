const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

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

// 新しいゲームモード関連の変数 (timedモード用)
let gameMode = 'timed'; // このファイルはtimedモード
let startTime = 0;
let remainingTime = 0; // 制限時間用
let timerInterval = null; // タイマーのID

// --- クラス定義 ---
class Player {
    constructor() {
        this.position = { x: 100, y: 100 };
        this.velocity = { x: 0, y: 0 };
        this.width = 30;
        this.height = 50;
    }
    draw(offset) { ctx.fillStyle = 'red'; ctx.fillRect(this.position.x - offset, this.position.y, this.width, this.height); }
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
    draw(offset) { if (!this.active) return; ctx.fillStyle = 'gold'; ctx.beginPath(); ctx.arc(this.position.x - offset, this.position.y, this.radius, 0, Math.PI * 2); ctx.fill(); }
}

class Enemy {
    constructor({ x, y, platform }) { this.position = { x, y }; this.velocity = { x: -2, y: 0 }; this.width = 40; this.height = 40; this.patrolRange = { left: platform.position.x, right: platform.position.x + platform.width - this.width }; }
    draw(offset) { ctx.fillStyle = 'purple'; ctx.fillRect(this.position.x - offset, this.position.y, this.width, this.height); }
    update() { this.position.x += this.velocity.x; if (this.position.x <= this.patrolRange.left || this.position.x >= this.patrolRange.right) { this.velocity.x *= -1; } }
}

class Obstacle {
    constructor({ x, y }) { this.position = { x, y }; this.velocity = { x: -3, y: 0 }; this.width = 50; this.height = 50; }
    draw(offset) { ctx.fillStyle = 'brown'; ctx.fillRect(this.position.x - offset, this.position.y, this.width, this.height); }
    update() { this.position.x += this.velocity.x; }
}

class Goal {
    constructor({ x, y }) { this.position = { x, y }; this.width = 10; this.height = 100; }
    draw(offset) { ctx.fillStyle = 'black'; ctx.fillRect(this.position.x - offset, this.position.y, this.width, this.height); ctx.fillStyle = 'blue'; ctx.beginPath(); ctx.moveTo(this.position.x - offset + this.width, this.position.y); ctx.lineTo(this.position.x - offset + this.width + 40, this.position.y + 20); ctx.lineTo(this.position.x - offset + this.width, this.position.y + 40); ctx.closePath(); ctx.fill(); }
}

class Cloud {
    constructor({ x, y, size }) { this.position = { x, y }; this.size = size; }
    draw(offset) {
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.position.x - offset * 0.5, this.position.y, this.size, 0, Math.PI * 2);
        ctx.arc(this.position.x - offset * 0.5 + this.size, this.position.y, this.size, 0, Math.PI * 2);
        ctx.arc(this.position.x - offset * 0.5 - this.size, this.position.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// --- 変数定義 ---
let player, platforms, coins, enemies, obstacles, goal, clouds;
let keys = { right: { pressed: false }, left: { pressed: false } };

// --- 初期化 ---
function init() {
    gameState = 'playing';
    score = 0;
    scrollOffset = 0;
    keys.right.pressed = false;
    keys.left.pressed = false;
    player = new Player();
    platforms = [new Platform({ x: 0, y: 450, width: 500 })];
    goal = new Goal({ x: STAGE_LENGTH, y: 350 });
    coins = []; enemies = []; obstacles = []; clouds = [];
    lastPlatformX = 500;
    lastObstacleX = 700;
    for (let i = 0; i < 20; i++) { // 20個の雲を生成
        clouds.push(new Cloud({ x: Math.random() * STAGE_LENGTH, y: Math.random() * 150, size: Math.random() * 20 + 10 }));
    }

    // timedモードの初期化
    startTime = Date.now();
    if (timerInterval) clearInterval(timerInterval); // 既存のタイマーがあればクリア

    remainingTime = 60; // 60秒
    timerInterval = setInterval(() => {
        if (gameState === 'playing') {
            remainingTime--;
            if (remainingTime <= 0) {
                gameState = 'gameOver';
                clearInterval(timerInterval);
            }
        }
    }, 1000);
}

// --- 背景描画 ---
function drawBackground(offset) {
    // 空
    ctx.fillStyle = '#70c5ce'; // style.cssから移動した空色
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 近景の地面 (速くスクロール)
    ctx.fillStyle = '#5C4033'; // 焦茶色
    const groundScrollOffset = offset * 0.7; // 近景は速く
    ctx.fillRect(0 - groundScrollOffset % canvas.width, 400, canvas.width * 2, canvas.height - 400);
}

// レンガ柄を描画するヘルパー関数
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

// --- メッセージ・スコア描画 ---
function drawMessage(message, subMessage, finalScore) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = '60px sans-serif';
    ctx.fillText(message, canvas.width / 2, canvas.height / 2 - 60);
    if (finalScore !== undefined) {
        ctx.font = '30px sans-serif';
        ctx.fillText(`スコア: ${finalScore}`, canvas.width / 2, canvas.height / 2);
    }
    if (gameMode === 'timed' && gameState === 'gameOver') {
        ctx.font = '24px sans-serif';
        ctx.fillText(`時間切れ！`, canvas.width / 2, canvas.height / 2 + 20);
    }
    ctx.font = '24px sans-serif';
    ctx.fillText(subMessage, canvas.width / 2, canvas.height / 2 + 50);
}

function drawScore() {
    ctx.fillStyle = 'black';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`スコア: ${score}`, 20, 40);
    if (gameMode === 'timed') {
        ctx.fillText(`残り時間: ${remainingTime}秒`, 20, 70);
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
    // プラットフォームと付随オブジェクトの生成
    while (lastPlatformX < scrollOffset + canvas.width + 200 && lastPlatformX < STAGE_LENGTH) {
        const gap = Math.random() * 200 + 100;
        const width = Math.random() * 250 + 150;
        const newX = lastPlatformX + gap;
        const newY = Math.random() * 250 + 200;
        const platform = new Platform({ x: newX, y: newY, width: width });
        platforms.push(platform);
        const rand = Math.random();
        if (rand < 0.8) { coins.push(new Coin({ x: newX + width / 2, y: newY - 40 }));
        } else if (rand < 0.95) { enemies.push(new Enemy({ x: newX + width / 2, y: newY - 40, platform: platform })); }
        lastPlatformX = newX + width;
    }
    // 浮遊障害物の生成
    while (lastObstacleX < scrollOffset + canvas.width + 200 && lastObstacleX < STAGE_LENGTH) {
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

    // Gamepadの入力処理
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    let connectedGamepad = null;
    
    // 実際に接続されているゲームパッドを探す（Macでの不安定な接続に対応）
    for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i] && gamepads[i].connected && gamepads[i].id) {
            // MacでのXBOX360コントローラーを特別にチェック
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
        
        // 左スティックのX軸（移動）
        const xAxis = gamepad.axes[0];
        if (xAxis < -0.5) { // 左に倒す
            keys.left.pressed = true;
            keys.right.pressed = false;
        } else if (xAxis > 0.5) { // 右に倒す
            keys.right.pressed = true;
            keys.left.pressed = false;
        } else { // ニュートラル
            keys.left.pressed = false;
            keys.right.pressed = false;
        }

        // 右ボタン（Bボタン、インデックス1）でジャンプ
        if (gamepad.buttons[1] && gamepad.buttons[1].pressed) {
            if (!gamepadButtons.rightPressed && gameState === 'playing' && player.velocity.y === 0) {
                player.velocity.y = -JUMP_POWER;
                gamepadButtons.rightPressed = true;
            }
        } else {
            gamepadButtons.rightPressed = false;
        }

        // 左ボタン（Xボタン、インデックス2）でEnter
        if (gamepad.buttons[2] && gamepad.buttons[2].pressed) {
            if (!gamepadButtons.leftPressed) {
                if (gameState !== 'playing') {
                    init(); // ゲームリスタート
                }
                gamepadButtons.leftPressed = true;
            }
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
        // 1. 入力
        if (keys.right.pressed) player.velocity.x = PLAYER_SPEED; else if (keys.left.pressed) player.velocity.x = -PLAYER_SPEED; else player.velocity.x = 0;
        
        // 2. 更新
        player.applyGravity();
        player.position.x += player.velocity.x;
        player.position.y += player.velocity.y;
        enemies.forEach(e => e.update());
        obstacles.forEach(o => o.update());

        // 3. 衝突判定
        // Y軸: 地面
        if (player.position.y + player.height > canvas.height) {
            player.velocity.y = 0;
            player.position.y = canvas.height - player.height;
        }
        // Y軸: 天井
        if (player.position.y < 0) { player.position.y = 0; player.velocity.y = 0; }

        // 足場との衝突判定 (ジャンプスルー)
        platforms.forEach(p => {
            if (player.position.x + player.width > p.position.x && player.position.x < p.position.x + p.width) {
                if (player.velocity.y > 0 && // 落下中
                    (player.position.y + player.height) >= p.position.y && // 現在の足がめり込んでいる
                    (player.position.y + player.height - player.velocity.y) <= p.position.y // 1フレーム前は足が上だった
                ) {
                    player.velocity.y = 0;
                    player.position.y = p.position.y - player.height;
                }
            }
        });

        // その他の衝突判定
        obstacles.forEach(o => { if (player.position.x < o.position.x + o.width && player.position.x + player.width > o.position.x && player.position.y < o.position.y + o.height && player.position.y + player.height > o.position.y) gameState = 'gameOver'; });
        enemies.forEach((e, i) => { if (player.position.x < e.position.x + e.width && player.position.x + player.width > e.position.x && player.position.y < e.position.y + e.height && player.position.y + player.height > e.position.y) { if (player.velocity.y > 0 && player.position.y + player.height - player.velocity.y <= e.position.y) { enemies.splice(i, 1); score += 200; player.velocity.y = -JUMP_POWER / 2; } else { gameState = 'gameOver'; } } });
        if (gameState === 'playing') { coins.forEach(c => { if (c.active) { const dist = Math.hypot(player.position.x + player.width/2 - c.position.x, player.position.y+player.height/2 - c.position.y); if (dist < player.width / 2 + c.radius) { c.active = false; score += COIN_SCORE; } } }); }
        if (player.position.y > canvas.height + 100) gameState = 'gameOver';

        // ゴール判定
        if (player.position.x > goal.position.x) { gameState = 'cleared'; }

        // 4. カメラとオブジェクト管理
        if (player.position.x > scrollOffset + canvas.width / 3) scrollOffset = player.position.x - canvas.width / 3;
        if (player.position.x < scrollOffset) player.position.x = scrollOffset;
        generateObjects();
        platforms = platforms.filter(p => p.position.x + p.width > scrollOffset);
        clouds = clouds.filter(c => c.position.x - scrollOffset * 0.5 + c.size * 2 > 0); // 画面外に出た雲を削除
        coins = coins.filter(c => c.position.x + c.radius > scrollOffset);
        enemies = enemies.filter(e => e.position.x + e.width > scrollOffset);
        obstacles = obstacles.filter(o => o.position.x + o.width > scrollOffset);
    }

    // --- 描画処理 ---
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground(scrollOffset); // 背景を描画
    clouds.forEach(c => c.draw(scrollOffset)); // 雲を奥に描画
    platforms.forEach(p => p.draw(scrollOffset));
    obstacles.forEach(o => o.draw(scrollOffset));
    coins.forEach(c => c.draw(scrollOffset));
    enemies.forEach(e => e.draw(scrollOffset));
    goal.draw(scrollOffset);
    player.draw(scrollOffset);
    drawScore();

    if (gameState === 'cleared') drawMessage('クリア！', 'Enterキーまたは左ボタンでリスタート', score);
    if (gameState === 'gameOver') drawMessage('ゲームオーバー', 'Enterキーまたは左ボタンでリスタート', score);
}

// --- イベントリスナー ---
window.addEventListener('keydown', ({ code }) => { if (gameState === 'playing') { switch (code) { case 'ArrowLeft': case 'KeyA': keys.left.pressed = true; break; case 'ArrowRight': case 'KeyD': keys.right.pressed = true; break; case 'Space': case 'ArrowUp': case 'KeyW': player.velocity.y = -JUMP_POWER; break; } } else { if (code === 'Enter') init(); } });
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

init();
animate();