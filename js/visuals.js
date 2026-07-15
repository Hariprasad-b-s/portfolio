// ─── Data Engineering ETL Background Animation ───
// Visualizes an abstract data pipeline: sources → streams → transforms → sinks

const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

let width, height;
let animFrame;
let mouseX = -1000, mouseY = -1000;

// ─── Color palette (reads CSS vars at init) ───
let COLORS = {};
function readColors() {
    const s = getComputedStyle(document.documentElement);
    COLORS = {
        accent: s.getPropertyValue('--accent-primary').trim() || '#00ff9d',
        secondary: s.getPropertyValue('--accent-secondary').trim() || '#00b8ff',
    };
}

// ─── Resize ───
function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    initPipelines();
    initNodes();
    initTransformStages();
}
window.addEventListener('resize', () => { resize(); readColors(); });
document.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; });

// ─── Utility ───
function rand(a, b) { return Math.random() * (b - a) + a; }
function lerp(a, b, t) { return a + (b - a) * t; }

// ═══════════════════════════════════════════════
// 1. SUBTLE GRID (blueprint / warehouse feel)
// ═══════════════════════════════════════════════
function drawGrid() {
    const spacing = 60;
    ctx.strokeStyle = 'rgba(0, 255, 157, 0.08)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < width; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    for (let y = 0; y < height; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
}

// ═══════════════════════════════════════════════
// 2. DATA NODES — floating source/sink hexagons
// ═══════════════════════════════════════════════
const NODE_LABELS = ['S3', 'SQL', 'API', 'Kafka', 'dbt', 'Δ', 'Spark', 'ADLS', 'ETL', 'DW', 'SQS', 'λ'];
let nodes = [];

class DataNode {
    constructor() {
        this.reset(true);
    }

    reset(initial = false) {
        this.x = rand(60, width - 60);
        this.y = rand(60, height - 60);
        this.vx = rand(-0.2, 0.2);
        this.vy = rand(-0.2, 0.2);
        this.size = rand(22, 36);
        this.label = NODE_LABELS[Math.floor(rand(0, NODE_LABELS.length))];
        this.baseAlpha = rand(0.3, 0.55);
        this.pulsePhase = rand(0, Math.PI * 2);
        this.pulseSpeed = rand(0.008, 0.02);
        this.isSecondary = Math.random() > 0.5;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.pulsePhase += this.pulseSpeed;

        if (this.x < -50) this.x = width + 50;
        if (this.x > width + 50) this.x = -50;
        if (this.y < -50) this.y = height + 50;
        if (this.y > height + 50) this.y = -50;
    }

    draw() {
        const pulse = 0.6 + 0.4 * Math.sin(this.pulsePhase);
        const alpha = this.baseAlpha * pulse;
        const color = this.isSecondary ? COLORS.secondary : COLORS.accent;

        // Outer glow ring
        ctx.save();
        ctx.globalAlpha = alpha * 0.6;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size + 8, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();

        // Hexagon shape
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 6;
            const px = this.x + this.size * Math.cos(angle);
            const py = this.y + this.size * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = (this.isSecondary ? 'rgba(0, 184, 255, 0.12)' : 'rgba(0, 255, 157, 0.12)');
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Label
        ctx.globalAlpha = alpha * 1.5;
        ctx.fillStyle = color;
        ctx.font = `bold ${Math.round(this.size * 0.45)}px 'JetBrains Mono', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.label, this.x, this.y);
        ctx.restore();
    }
}

function initNodes() {
    const count = Math.max(8, Math.floor((width * height) / 140000));
    nodes = [];
    for (let i = 0; i < count; i++) nodes.push(new DataNode());
}

// ═══════════════════════════════════════════════
// 3. DATA PIPELINES — animated flowing streams
// ═══════════════════════════════════════════════
let pipelines = [];

class Pipeline {
    constructor() {
        this.reset();
    }

    reset() {
        const direction = Math.random() > 0.3 ? 'horizontal' : 'diagonal';
        this.y = rand(80, height - 80);
        this.startX = -rand(50, 200);
        this.endX = width + rand(50, 200);

        if (direction === 'diagonal') {
            this.startY = rand(-50, height * 0.3);
            this.endY = rand(height * 0.7, height + 50);
        } else {
            this.startY = this.y;
            this.endY = this.y + rand(-40, 40);
        }

        this.cp1x = lerp(this.startX, this.endX, 0.33) + rand(-60, 60);
        this.cp1y = lerp(this.startY, this.endY, 0.33) + rand(-100, 100);
        this.cp2x = lerp(this.startX, this.endX, 0.66) + rand(-60, 60);
        this.cp2y = lerp(this.startY, this.endY, 0.66) + rand(-100, 100);

        this.lineAlpha = rand(0.15, 0.25);
        this.packets = [];
        const packetCount = Math.floor(rand(3, 7));
        for (let i = 0; i < packetCount; i++) {
            this.packets.push({
                t: rand(0, 1),
                speed: rand(0.0015, 0.005),
                size: rand(4, 8),
                isSecondary: Math.random() > 0.5,
                trail: [],
            });
        }
    }

    getPointOnCurve(t) {
        const t2 = t * t;
        const t3 = t2 * t;
        const mt = 1 - t;
        const mt2 = mt * mt;
        const mt3 = mt2 * mt;
        return {
            x: mt3 * this.startX + 3 * mt2 * t * this.cp1x + 3 * mt * t2 * this.cp2x + t3 * this.endX,
            y: mt3 * this.startY + 3 * mt2 * t * this.cp1y + 3 * mt * t2 * this.cp2y + t3 * this.endY,
        };
    }

    update() {
        this.packets.forEach(p => {
            p.t += p.speed;
            if (p.t > 1) p.t -= 1;
            const pos = this.getPointOnCurve(p.t);
            p.trail.push({ x: pos.x, y: pos.y });
            if (p.trail.length > 15) p.trail.shift();
        });
    }

    draw() {
        // Draw the pipe path (dashed line)
        ctx.save();
        ctx.globalAlpha = this.lineAlpha;
        ctx.beginPath();
        ctx.moveTo(this.startX, this.startY);
        ctx.bezierCurveTo(this.cp1x, this.cp1y, this.cp2x, this.cp2y, this.endX, this.endY);
        ctx.strokeStyle = COLORS.accent;
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 10]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Draw data packets
        this.packets.forEach(p => {
            const pos = this.getPointOnCurve(p.t);
            const color = p.isSecondary ? COLORS.secondary : COLORS.accent;

            // Trail
            p.trail.forEach((tp, i) => {
                const trailAlpha = (i / p.trail.length) * 0.5;
                ctx.save();
                ctx.globalAlpha = trailAlpha;
                ctx.fillStyle = color;
                ctx.fillRect(tp.x - 1.5, tp.y - 1, 3, 2);
                ctx.restore();
            });

            // Glow
            ctx.save();
            ctx.globalAlpha = 0.7;
            ctx.shadowColor = color;
            ctx.shadowBlur = 18;
            ctx.fillStyle = color;
            ctx.fillRect(pos.x - p.size, pos.y - p.size * 0.5, p.size * 2, p.size);
            ctx.restore();

            // Core packet
            ctx.save();
            ctx.globalAlpha = 0.9;
            ctx.fillStyle = color;
            ctx.fillRect(pos.x - p.size * 0.7, pos.y - p.size * 0.3, p.size * 1.4, p.size * 0.6);
            ctx.restore();
        });
    }
}

function initPipelines() {
    const count = Math.max(5, Math.floor(height / 100));
    pipelines = [];
    for (let i = 0; i < count; i++) pipelines.push(new Pipeline());
}

// ═══════════════════════════════════════════════
// 4. FLOATING CODE SNIPPETS
// ═══════════════════════════════════════════════
const CODE_SNIPPETS = [
    'SELECT * FROM staging',
    'INSERT INTO warehouse',
    'GROUP BY date_key',
    'MERGE INTO silver',
    'df.groupBy().agg()',
    'spark.read.parquet()',
    '.write.format("delta")',
    'CREATE TABLE gold.',
    'PARTITION BY (dt)',
    'dbt run --select',
    'dbt test --models',
    'staging → marts',
    'bronze → silver',
    'Autoloader',
    'Delta Live Tables',
    'medallion_arch',
    'OPTIMIZE ZORDER',
    'VACUUM RETAIN',
    '{"pipeline": "ETL"}',
    'schema_check(df)',
    'pipeline.execute()',
    'COPY INTO @stage',
    'Snowpipe → raw',
    'Unity Catalog',
    'STRUCT<col STRING>',
    'ZORDER BY (id)',
    'quality_check()',
    'Airflow DAG >>',
    'Terraform apply',
    'Lambda handler()',
];

let fragments = [];

class CodeFragment {
    constructor() {
        this.reset(true);
    }

    reset(initial = false) {
        this.text = CODE_SNIPPETS[Math.floor(rand(0, CODE_SNIPPETS.length))];
        this.x = rand(20, width - 200);
        this.y = initial ? rand(0, height) : height + 20;
        this.vy = rand(-0.15, -0.4);
        this.vx = rand(-0.08, 0.08);
        this.baseAlpha = rand(0.15, 0.3);
        this.size = rand(10, 14);
        this.life = initial ? rand(0, 800) : 0;
        this.maxLife = rand(700, 1800);
        this.isSecondary = Math.random() > 0.6;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life++;
        if (this.life > this.maxLife || this.y < -30) this.reset();
    }

    draw() {
        const fadeIn = Math.min(1, this.life / 80);
        const fadeOut = this.life > (this.maxLife - 80) ? Math.max(0, 1 - (this.life - (this.maxLife - 80)) / 80) : 1;
        const alpha = this.baseAlpha * Math.min(fadeIn, fadeOut);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.isSecondary ? COLORS.secondary : COLORS.accent;
        ctx.font = `${this.size}px 'JetBrains Mono', monospace`;
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}

function initFragments() {
    const count = Math.max(12, Math.floor((width * height) / 80000));
    fragments = [];
    for (let i = 0; i < count; i++) fragments.push(new CodeFragment());
}

// ═══════════════════════════════════════════════
// 5. TRANSFORM STAGES — E → T → L diamonds
// ═══════════════════════════════════════════════
let transformStages = [];
let transformArrows = [];

class TransformStage {
    constructor(label, x, y) {
        this.label = label;
        this.x = x;
        this.y = y;
        this.size = 44;
        this.pulsePhase = rand(0, Math.PI * 2);
    }

    update() {
        this.pulsePhase += 0.01;
    }

    draw() {
        const pulse = 0.5 + 0.5 * Math.sin(this.pulsePhase);
        const alpha = 0.2 + pulse * 0.15;

        ctx.save();

        // Diamond shape (rotated square)
        ctx.globalAlpha = alpha;
        ctx.translate(this.x, this.y);
        ctx.rotate(Math.PI / 4);

        // Fill
        ctx.fillStyle = 'rgba(0, 255, 157, 0.1)';
        ctx.fillRect(-this.size, -this.size, this.size * 2, this.size * 2);

        // Border
        ctx.strokeStyle = COLORS.accent;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-this.size, -this.size, this.size * 2, this.size * 2);

        // Reset transform for text
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        // Label text
        ctx.globalAlpha = alpha * 2;
        ctx.fillStyle = COLORS.accent;
        ctx.font = 'bold 13px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.label, this.x, this.y);

        ctx.restore();
    }
}

function initTransformStages() {
    transformStages = [];
    transformArrows = [];

    const labels = ['EXTRACT', 'TRANSFORM', 'LOAD'];
    const stageY = height * 0.5;

    labels.forEach((label, i) => {
        const x = width * (0.2 + i * 0.3);
        transformStages.push(new TransformStage(label, x, stageY));
    });

    // Arrows between stages
    for (let i = 0; i < labels.length - 1; i++) {
        transformArrows.push({
            fromX: width * (0.2 + i * 0.3) + 60,
            toX: width * (0.2 + (i + 1) * 0.3) - 60,
            y: stageY,
            dashOffset: 0,
        });
    }
}

function drawTransformArrows() {
    transformArrows.forEach(arrow => {
        arrow.dashOffset -= 0.5;

        ctx.save();
        ctx.globalAlpha = 0.25;
        ctx.strokeStyle = COLORS.accent;
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        ctx.lineDashOffset = arrow.dashOffset;
        ctx.beginPath();
        ctx.moveTo(arrow.fromX, arrow.y);
        ctx.lineTo(arrow.toX, arrow.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Arrowhead
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = COLORS.accent;
        ctx.beginPath();
        ctx.moveTo(arrow.toX, arrow.y);
        ctx.lineTo(arrow.toX - 10, arrow.y - 5);
        ctx.lineTo(arrow.toX - 10, arrow.y + 5);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    });
}

// ═══════════════════════════════════════════════
// 6. NODE CONNECTIONS (proximity lines)
// ═══════════════════════════════════════════════
function drawNodeConnections() {
    const maxDist = 220;
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[i].x - nodes[j].x;
            const dy = nodes[i].y - nodes[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < maxDist) {
                const alpha = (1 - dist / maxDist) * 0.25;
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.strokeStyle = COLORS.secondary;
                ctx.lineWidth = 0.8;
                ctx.setLineDash([3, 5]);
                ctx.beginPath();
                ctx.moveTo(nodes[i].x, nodes[i].y);
                ctx.lineTo(nodes[j].x, nodes[j].y);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.restore();
            }
        }
    }
}

// ═══════════════════════════════════════════════
// 7. MOUSE PROXIMITY GLOW
// ═══════════════════════════════════════════════
function drawMouseGlow() {
    if (mouseX < 0 || mouseY < 0) return;
    const gradient = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 250);
    gradient.addColorStop(0, 'rgba(0, 255, 157, 0.12)');
    gradient.addColorStop(0.5, 'rgba(0, 184, 255, 0.06)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(mouseX - 250, mouseY - 250, 500, 500);
}

// ═══════════════════════════════════════════════
// MAIN ANIMATION LOOP
// ═══════════════════════════════════════════════
function animate() {
    ctx.clearRect(0, 0, width, height);

    // Layer 1: Blueprint grid
    drawGrid();

    // Layer 2: E → T → L stages
    transformStages.forEach(s => { s.update(); s.draw(); });
    drawTransformArrows();

    // Layer 3: Data pipelines with flowing packets
    pipelines.forEach(p => { p.update(); p.draw(); });

    // Layer 4: Node connections
    drawNodeConnections();

    // Layer 5: Hex data nodes
    nodes.forEach(n => { n.update(); n.draw(); });

    // Layer 6: Floating code snippets
    fragments.forEach(f => { f.update(); f.draw(); });

    // Layer 7: Mouse glow
    drawMouseGlow();

    animFrame = requestAnimationFrame(animate);
}

// ─── INIT ───
readColors();
resize();
initFragments();
animate();
