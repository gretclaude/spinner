// Global variables
let items = [];
let skippedItems = new Set();
let canvas, ctx;
let isSpinning = false;
let currentRotation = 0;
let selectedItem = null;

// Rainbow colors generator
function getRainbowColors(count) {
    const colors = [];
    for (let i = 0; i < count; i++) {
        const hue = (i * 360) / count;
        colors.push(`hsl(${hue}, 70%, 60%)`);
    }
    return colors;
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('wheel-canvas');
    ctx = canvas.getContext('2d');

    document.getElementById('create-wheel-btn').addEventListener('click', createWheel);
    document.getElementById('spin-btn').addEventListener('click', spinWheel);
    document.getElementById('reset-btn').addEventListener('click', resetWheel);
    document.getElementById('start-btn').addEventListener('click', startTimer);
    document.querySelector('.skip-text').addEventListener('click', skipTask);
});

function createWheel() {
    const input = document.getElementById('items-input').value.trim();
    if (!input) {
        alert('Please enter at least one item!');
        return;
    }

    items = input.split('\n').filter(item => item.trim() !== '');
    if (items.length < 2) {
        alert('Please enter at least 2 items!');
        return;
    }

    skippedItems.clear();
    document.querySelector('.input-section').style.display = 'none';
    document.querySelector('.wheel-section').style.display = 'block';

    drawWheel();
}

function drawWheel() {
    const size = 500;
    canvas.width = size;
    canvas.height = size;

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 10;

    ctx.clearRect(0, 0, size, size);

    const colors = getRainbowColors(items.length);
    const anglePerSegment = (2 * Math.PI) / items.length;

    // Draw segments
    items.forEach((item, index) => {
        const startAngle = index * anglePerSegment - Math.PI / 2;
        const endAngle = (index + 1) * anglePerSegment - Math.PI / 2;

        // Draw segment
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = colors[index];
        ctx.fill();

        // Draw border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Draw text
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + anglePerSegment / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 3;
        ctx.fillText(item, radius - 20, 5);
        ctx.restore();

        // Draw warning icon if skipped
        if (skippedItems.has(item)) {
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(startAngle + anglePerSegment / 2);
            ctx.font = 'bold 30px Arial';
            ctx.fillText('⚠️', radius - 60, 5);
            ctx.restore();
        }
    });

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    ctx.stroke();
}

function spinWheel() {
    if (isSpinning) return;

    isSpinning = true;
    document.getElementById('spin-btn').disabled = true;

    // Random spins between 5 and 8 full rotations plus random angle
    const minSpins = 5;
    const maxSpins = 8;
    const spins = Math.random() * (maxSpins - minSpins) + minSpins;
    const randomAngle = Math.random() * 360;
    const totalRotation = spins * 360 + randomAngle;

    // Calculate which segment we'll land on
    const finalAngle = (currentRotation + totalRotation) % 360;
    const anglePerSegment = 360 / items.length;

    // Adjust for pin at top (12 o'clock)
    const adjustedAngle = (360 - finalAngle + 90) % 360;
    const segmentIndex = Math.floor(adjustedAngle / anglePerSegment) % items.length;
    selectedItem = items[segmentIndex];

    // Animate the spin
    canvas.style.transform = `rotate(${currentRotation + totalRotation}deg)`;
    currentRotation = (currentRotation + totalRotation) % 360;

    // Show result after animation
    setTimeout(() => {
        showResult();
        isSpinning = false;
        document.getElementById('spin-btn').disabled = false;
    }, 4000);
}

function showResult() {
    const modal = document.getElementById('result-modal');
    document.getElementById('selected-item').textContent = selectedItem;
    document.getElementById('timer-input').value = 25;
    modal.style.display = 'block';
}

function startTimer() {
    const minutes = parseInt(document.getElementById('timer-input').value);

    if (isNaN(minutes) || minutes < 1 || minutes > 60) {
        alert('Please enter a valid time between 1 and 60 minutes!');
        return;
    }

    // Close modal
    document.getElementById('result-modal').style.display = 'none';

    // Show timer alert
    alert(`Timer started for ${minutes} minute(s)!\n\nTask: ${selectedItem}\n\nGood luck! 🚀`);

    // You could integrate a real timer here
    console.log(`Timer started for ${minutes} minutes for task: ${selectedItem}`);
}

function skipTask() {
    // Add to skipped items
    skippedItems.add(selectedItem);

    // Close modal
    document.getElementById('result-modal').style.display = 'none';

    // Redraw wheel with warning
    drawWheel();

    // Show feedback
    alert(`Task "${selectedItem}" skipped! A warning has been added to the segment. ⚠️`);
}

function resetWheel() {
    document.querySelector('.input-section').style.display = 'block';
    document.querySelector('.wheel-section').style.display = 'none';
    document.getElementById('result-modal').style.display = 'none';
    items = [];
    skippedItems.clear();
    currentRotation = 0;
    canvas.style.transform = 'rotate(0deg)';
    document.getElementById('items-input').value = '';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('result-modal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}
