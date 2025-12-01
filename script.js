// Global variables
let items = [];
let skippedItems = new Map(); // item -> skip count
let completedTasks = []; // {task, time, completedEarly, skipCount}
let canvas, ctx;
let isSpinning = false;
let currentRotation = 0;
let selectedItem = null;
let timerInterval = null;
let timeRemaining = 0;
let timerStartTime = 0;

// Sophisticated color palette generator
function getRainbowColors(count) {
    // Elegant, modern color palette
    const baseColors = [
        '#6366f1', // Indigo
        '#8b5cf6', // Purple
        '#ec4899', // Pink
        '#f43f5e', // Rose
        '#f97316', // Orange
        '#eab308', // Yellow
        '#22c55e', // Green
        '#14b8a6', // Teal
        '#0ea5e9', // Sky
        '#3b82f6', // Blue
    ];

    // If we need more colors than in palette, interpolate
    if (count <= baseColors.length) {
        return baseColors.slice(0, count);
    }

    const colors = [];
    for (let i = 0; i < count; i++) {
        const index = (i * baseColors.length) / count;
        colors.push(baseColors[Math.floor(index) % baseColors.length]);
    }
    return colors;
}

// Custom alert function
function showAlert(message) {
    const modal = document.getElementById('alert-modal');
    const messageEl = document.getElementById('alert-message');
    messageEl.textContent = message;
    modal.style.display = 'block';
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
    document.getElementById('done-btn').addEventListener('click', () => {
        completeTask(true);
    });
    document.getElementById('alert-ok-btn').addEventListener('click', () => {
        document.getElementById('alert-modal').style.display = 'none';
    });
    document.getElementById('add-task-btn').addEventListener('click', addNewTask);
    document.getElementById('skip-add-task').addEventListener('click', skipAddTask);
});

function createWheel() {
    const input = document.getElementById('items-input').value.trim();
    if (!input) {
        showAlert('Please enter at least one item!');
        return;
    }

    // Support both commas and newlines as separators
    items = input
        .split(/[\n,]+/)  // Split by newlines OR commas
        .map(item => item.trim())
        .filter(item => item !== '');

    if (items.length < 2) {
        showAlert('Please enter at least 2 items!');
        return;
    }

    skippedItems.clear();
    document.querySelector('.input-section').style.display = 'none';
    document.querySelector('.wheel-section').style.display = 'block';

    // Show completed sidebar if there are completed tasks
    if (completedTasks.length > 0) {
        document.getElementById('completed-sidebar').style.display = 'block';
    }

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
        ctx.font = '500 16px Inter, sans-serif';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 3;
        ctx.fillText(item, radius - 20, 5);
        ctx.restore();

        // Draw warning/fire icons if skipped
        const skipCount = skippedItems.get(item) || 0;
        if (skipCount > 0) {
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(startAngle + anglePerSegment / 2);
            ctx.font = 'bold 24px Arial';

            // Draw up to 6 icons (3 warnings, then 3 fires)
            const iconsToShow = Math.min(skipCount, 6);
            for (let i = 0; i < iconsToShow; i++) {
                // First 3 are warnings, 4th onwards are fire emojis
                const emoji = i < 3 ? '⚠️' : '🔥';
                ctx.fillText(emoji, radius / 2 - 15 - (i * 28), 5);
            }
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

    // Calculate final position
    const newRotation = currentRotation + totalRotation;
    const finalAngle = newRotation % 360;
    const anglePerSegment = 360 / items.length;

    // The pin is at top (12 o'clock), wheel rotates clockwise
    // We need to find which segment ends up under the fixed pin
    // After rotating by finalAngle, the segment that was at (-finalAngle) is now at the top
    const adjustedAngle = (360 - finalAngle) % 360;
    const segmentIndex = Math.floor(adjustedAngle / anglePerSegment) % items.length;
    selectedItem = items[segmentIndex];

    // Animate the spin - always rotate forward (clockwise)
    canvas.style.transform = `rotate(${newRotation}deg)`;
    currentRotation = finalAngle;

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

    // Clear any existing timer
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    modal.style.display = 'block';
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function updateTimerDisplay() {
    const timerDisplay = document.getElementById('timer-display');
    const timerText = document.getElementById('timer-text');
    const spinBtn = document.getElementById('spin-btn');

    if (timeRemaining > 0) {
        timerText.textContent = formatTime(timeRemaining);
        timerDisplay.style.display = 'flex';
        spinBtn.disabled = true;
    } else {
        timerDisplay.style.display = 'none';
        spinBtn.disabled = false;
    }
}

function startTimer() {
    const minutes = parseInt(document.getElementById('timer-input').value);

    if (isNaN(minutes) || minutes < 1 || minutes > 60) {
        showAlert('Please enter a valid time between 1 and 60 minutes!');
        return;
    }

    // Close modal
    document.getElementById('result-modal').style.display = 'none';

    // Initialize timer
    timeRemaining = minutes * 60;
    timerStartTime = minutes * 60;
    updateTimerDisplay();

    // Clear any existing timer
    if (timerInterval) {
        clearInterval(timerInterval);
    }

    // Start countdown
    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();

        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            completeTask(false);
        }
    }, 1000);

    console.log(`Timer started for ${minutes} minutes for task: ${selectedItem}`);
}

function completeTask(completedEarly) {
    const elapsed = timerStartTime - timeRemaining;
    const skipCount = skippedItems.get(selectedItem) || 0;

    completedTasks.push({
        task: selectedItem,
        time: Math.floor(elapsed / 60),
        completedEarly: completedEarly,
        skipCount: skipCount
    });

    // Clear timer
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    timeRemaining = 0;
    updateTimerDisplay();

    // Update completed list
    updateCompletedList();

    // Show replace task modal
    showReplaceTaskModal();
}

function showReplaceTaskModal() {
    const modal = document.getElementById('replace-task-modal');
    document.getElementById('new-task-input').value = '';
    modal.style.display = 'block';
}

function addNewTask() {
    const newTask = document.getElementById('new-task-input').value.trim();

    if (!newTask) {
        showAlert('Please enter a task name!');
        return;
    }

    // Find the index of the completed task and replace it
    const taskIndex = items.indexOf(selectedItem);
    if (taskIndex !== -1) {
        items[taskIndex] = newTask;
        // Remove skip count for the old task, don't carry it over
        skippedItems.delete(selectedItem);
    }

    // Close modal
    document.getElementById('replace-task-modal').style.display = 'none';

    // Redraw the wheel with the new task
    drawWheel();
}

function skipAddTask() {
    // Remove the completed task from the wheel
    const taskIndex = items.indexOf(selectedItem);
    if (taskIndex !== -1) {
        items.splice(taskIndex, 1);
        skippedItems.delete(selectedItem);
    }

    // Close modal
    document.getElementById('replace-task-modal').style.display = 'none';

    // If no items left, show input section
    if (items.length === 0) {
        resetWheel();
    } else {
        drawWheel();
    }
}

function updateCompletedList() {
    const sidebar = document.getElementById('completed-sidebar');
    const list = document.getElementById('completed-list');

    sidebar.style.display = 'block';
    list.innerHTML = '';

    completedTasks.forEach(task => {
        const item = document.createElement('div');
        item.className = 'completed-item';

        let taskName = task.task;
        if (task.completedEarly) taskName = '⭐ ' + taskName;

        // Add warning/fire emojis based on skip count
        if (task.skipCount > 0) {
            let emojis = '';
            const iconsToShow = Math.min(task.skipCount, 6);
            for (let i = 0; i < iconsToShow; i++) {
                // First 3 are warnings, 4th onwards are fire emojis
                emojis += i < 3 ? '⚠️' : '🔥';
            }
            taskName += ' ' + emojis;
        }

        item.innerHTML = `
            <div class="task-name">${taskName}</div>
            <div class="task-time">${task.time} min</div>
        `;

        list.appendChild(item);
    });
}

function skipTask() {
    // Increment skip count
    const currentCount = skippedItems.get(selectedItem) || 0;
    skippedItems.set(selectedItem, currentCount + 1);

    // Close modal
    document.getElementById('result-modal').style.display = 'none';

    // Redraw wheel with warning
    drawWheel();
}

function resetWheel() {
    // Clear timer
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    timeRemaining = 0;
    updateTimerDisplay();

    document.querySelector('.input-section').style.display = 'block';
    document.querySelector('.wheel-section').style.display = 'none';
    document.getElementById('result-modal').style.display = 'none';
    document.getElementById('completed-sidebar').style.display = 'none';
    items = [];
    skippedItems.clear();
    completedTasks = [];
    currentRotation = 0;
    canvas.style.transform = 'rotate(0deg)';
    document.getElementById('items-input').value = '';
}

// Close modals when clicking outside
window.onclick = function(event) {
    const resultModal = document.getElementById('result-modal');
    const alertModal = document.getElementById('alert-modal');
    const replaceModal = document.getElementById('replace-task-modal');

    if (event.target === resultModal) {
        resultModal.style.display = 'none';
    }
    if (event.target === alertModal) {
        alertModal.style.display = 'none';
    }
    if (event.target === replaceModal) {
        replaceModal.style.display = 'none';
    }
}
