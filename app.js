// App State
let tasks = [];
let currentXP = 0;
let currentLevel = 1;
let currentStreak = 0;
let lastCompletedDate = null;
let selectedDifficulty = 'easy';
let editingTaskId = null;
let dailyQuests = [];
let questProgress = {};
let lastQuestReset = null;

// XP Requirements
const XP_PER_LEVEL = 100;
const XP_REWARDS = {
    easy: 10,
    medium: 25,
    hard: 50
};

// Daily Quest Definitions
const DAILY_QUESTS = [
    { 
        id: 'complete_3_tasks', 
        title: 'Complete 3 Tasks', 
        description: 'Finish 3 tasks today',
        icon: '✓',
        target: 3, 
        reward: 50,
        type: 'tasks_completed',
        check: () => {
            const today = new Date().toDateString();
            return tasks.filter(t => t.completed && new Date(t.completedAt || t.createdAt).toDateString() === today).length;
        }
    },
    { 
        id: 'complete_hard_task', 
        title: 'Hard Task Challenge', 
        description: 'Complete 1 hard difficulty task',
        icon: '⚡',
        target: 1, 
        reward: 75,
        type: 'hard_tasks',
        check: () => {
            const today = new Date().toDateString();
            return tasks.filter(t => t.completed && t.difficulty === 'hard' && new Date(t.completedAt || t.createdAt).toDateString() === today).length;
        }
    },
    { 
        id: 'earn_100_xp', 
        title: 'XP Hunter', 
        description: 'Earn 100 XP today',
        icon: '⭐',
        target: 100, 
        reward: 100,
        type: 'xp_earned',
        check: () => {
            return questProgress.xpEarnedToday || 0;
        }
    },
    { 
        id: 'create_5_tasks', 
        title: 'Task Creator', 
        description: 'Create 5 new tasks today',
        icon: '➕',
        target: 5, 
        reward: 40,
        type: 'tasks_created',
        check: () => {
            const today = new Date().toDateString();
            return tasks.filter(t => new Date(t.createdAt).toDateString() === today).length;
        }
    }
];

// Badge Definitions
const BADGES = [
    { id: 'first_task', name: 'First Steps', description: 'Complete your first task', icon: '🌱', requirement: 1 },
    { id: 'level_5', name: 'Rising Star', description: 'Reach Level 5', icon: '⭐', requirement: 5, type: 'level' },
    { id: 'level_10', name: 'Expert', description: 'Reach Level 10', icon: '🌟', requirement: 10, type: 'level' },
    { id: 'streak_7', name: 'Week Warrior', description: 'Maintain a 7-day streak', icon: '🔥', requirement: 7, type: 'streak' },
    { id: 'streak_30', name: 'Month Master', description: 'Maintain a 30-day streak', icon: '💪', requirement: 30, type: 'streak' },
    { id: 'tasks_10', name: 'Task Master', description: 'Complete 10 tasks', icon: '📚', requirement: 10, type: 'tasks' },
    { id: 'tasks_50', name: 'Study Legend', description: 'Complete 50 tasks', icon: '🏆', requirement: 50, type: 'tasks' },
    { id: 'hard_10', name: 'Challenge Seeker', description: 'Complete 10 hard tasks', icon: '⚡', requirement: 10, type: 'hard_tasks' }
];

// Initialize App
function init() {
    loadData();
    checkDailyReset();
    initializeQuests();
    setupEventListeners();
    renderTasks();
    renderQuests();
    renderBadges();
    updateStats();
    setupTheme();
}

// Load data from localStorage
function loadData() {
    const savedTasks = localStorage.getItem('studier_tasks');
    const savedXP = localStorage.getItem('studier_xp');
    const savedLevel = localStorage.getItem('studier_level');
    const savedStreak = localStorage.getItem('studier_streak');
    const savedLastDate = localStorage.getItem('studier_lastDate');
    const savedBadges = localStorage.getItem('studier_badges');
    const savedQuestProgress = localStorage.getItem('studier_questProgress');
    const savedLastQuestReset = localStorage.getItem('studier_lastQuestReset');

    if (savedTasks) tasks = JSON.parse(savedTasks);
    if (savedXP) currentXP = parseInt(savedXP);
    if (savedLevel) currentLevel = parseInt(savedLevel);
    if (savedStreak) currentStreak = parseInt(savedStreak);
    if (savedLastDate) lastCompletedDate = savedLastDate;
    if (savedQuestProgress) questProgress = JSON.parse(savedQuestProgress);
    if (savedLastQuestReset) lastQuestReset = savedLastQuestReset;
    
    // Check streak
    checkStreak();
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('studier_tasks', JSON.stringify(tasks));
    localStorage.setItem('studier_xp', currentXP.toString());
    localStorage.setItem('studier_level', currentLevel.toString());
    localStorage.setItem('studier_streak', currentStreak.toString());
    localStorage.setItem('studier_questProgress', JSON.stringify(questProgress));
    if (lastCompletedDate) {
        localStorage.setItem('studier_lastDate', lastCompletedDate);
    }
    if (lastQuestReset) {
        localStorage.setItem('studier_lastQuestReset', lastQuestReset);
    }
}

// Check and update streak
function checkStreak() {
    const today = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    if (!lastCompletedDate) {
        // No previous completion
        return;
    }

    if (lastCompletedDate === today) {
        // Already completed today
        return;
    }

    if (lastCompletedDate === yesterdayStr) {
        // Continue streak
        currentStreak++;
    } else {
        // Streak broken
        currentStreak = 1;
    }
}

// Check if daily reset is needed
function checkDailyReset() {
    const today = new Date().toDateString();
    
    if (!lastQuestReset || lastQuestReset !== today) {
        // Reset quests for new day
        questProgress = {
            xpEarnedToday: 0,
            completedQuests: []
        };
        lastQuestReset = today;
        saveData();
    }
}

// Initialize quests
function initializeQuests() {
    dailyQuests = DAILY_QUESTS.map(quest => ({ ...quest }));
    if (!questProgress.xpEarnedToday) {
        questProgress.xpEarnedToday = 0;
    }
    if (!questProgress.completedQuests) {
        questProgress.completedQuests = [];
    }
}

// Render quests
function renderQuests() {
    const questsList = document.getElementById('questsList');
    
    questsList.innerHTML = dailyQuests.map(quest => {
        const progress = quest.check();
        const isCompleted = questProgress.completedQuests.includes(quest.id);
        const progressPercent = Math.min((progress / quest.target) * 100, 100);
        
        return `
            <div class="quest-card ${isCompleted ? 'completed' : ''}">
                <div class="quest-header">
                    <div class="quest-title">
                        ${isCompleted ? '<span class="quest-checkmark">✓</span>' : `<span class="quest-icon">${quest.icon}</span>`}
                        <span>${quest.title}</span>
                    </div>
                    <div class="quest-reward">+${quest.reward} XP</div>
                </div>
                <div class="quest-description-text">${quest.description}</div>
                <div class="quest-progress">
                    <div class="quest-progress-bar">
                        <div class="quest-progress-fill" style="width: ${progressPercent}%"></div>
                    </div>
                    <div class="quest-progress-text">${progress} / ${quest.target}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Update quest progress
function updateQuestProgress() {
    let questCompleted = false;
    
    dailyQuests.forEach(quest => {
        if (questProgress.completedQuests.includes(quest.id)) {
            return; // Already completed
        }
        
        const progress = quest.check();
        if (progress >= quest.target) {
            // Quest completed!
            questProgress.completedQuests.push(quest.id);
            currentXP += quest.reward;
            questCompleted = true;
            
            // Show notification
            showNotification(`Quest Complete: ${quest.title}! +${quest.reward} XP`);
            
            // Check for level up
            const newLevel = Math.floor(currentXP / XP_PER_LEVEL) + 1;
            if (newLevel > currentLevel) {
                currentLevel = newLevel;
                animateLevelUp();
            }
        }
    });
    
    if (questCompleted) {
        saveData();
        updateStats();
        renderQuests();
        createConfetti();
    } else {
        renderQuests();
    }
}

// Setup event listeners
function setupEventListeners() {
    // Task form
    const taskForm = document.getElementById('taskForm');
    taskForm.addEventListener('submit', handleAddTask);

    // Difficulty buttons
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedDifficulty = btn.dataset.difficulty;
        });
    });

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.addEventListener('click', toggleTheme);

    // Modal close
    const closeModal = document.getElementById('closeModal');
    closeModal.addEventListener('click', closeBadgeModal);

    const modalOverlay = document.getElementById('badgeModal');
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeBadgeModal();
        }
    });
}

// Handle add task
function handleAddTask(e) {
    e.preventDefault();
    
    const titleInput = document.getElementById('taskTitle');
    const descriptionInput = document.getElementById('taskDescription');
    
    const task = {
        id: Date.now(),
        title: titleInput.value.trim(),
        description: descriptionInput.value.trim(),
        difficulty: selectedDifficulty,
        completed: false,
        createdAt: new Date().toISOString()
    };

    tasks.push(task);
    saveData();
    renderTasks();
    updateQuestProgress();
    
    // Reset form
    titleInput.value = '';
    descriptionInput.value = '';
    document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.difficulty-btn[data-difficulty="easy"]').classList.add('active');
    selectedDifficulty = 'easy';
}

// Render tasks
function renderTasks() {
    const tasksList = document.getElementById('tasksList');
    
    if (tasks.length === 0) {
        tasksList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">No tasks yet. Add your first task to get started! 🚀</p>';
        return;
    }

    tasksList.innerHTML = tasks.map(task => {
        const isEditing = editingTaskId === task.id;
        const editInput = isEditing ? `
            <input type="text" class="task-edit-input" value="${escapeHtml(task.title)}" data-edit-title>
            <textarea class="task-edit-textarea" data-edit-description>${escapeHtml(task.description)}</textarea>
            <div class="task-actions">
                <button class="task-btn complete-btn" onclick="saveEdit(${task.id})">Save</button>
                <button class="task-btn edit-btn" onclick="cancelEdit()">Cancel</button>
            </div>
        ` : '';

        return `
            <div class="task-card ${task.difficulty} ${task.completed ? 'completed' : ''} ${isEditing ? 'editing' : ''}">
                ${!isEditing ? `
                    <div class="task-header">
                        <div class="task-title">${escapeHtml(task.title)}</div>
                        <div class="task-actions">
                            ${!task.completed ? `
                                <button class="task-btn complete-btn" onclick="completeTask(${task.id})">Complete</button>
                                <button class="task-btn edit-btn" onclick="editTask(${task.id})">Edit</button>
                            ` : ''}
                            <button class="task-btn delete-btn" onclick="deleteTask(${task.id})">Delete</button>
                        </div>
                    </div>
                    ${task.description ? `<div class="task-description-text">${escapeHtml(task.description)}</div>` : ''}
                    <div class="task-meta">
                        <span class="task-difficulty ${task.difficulty}">${task.difficulty}</span>
                        ${task.completed ? '<span>✓ Completed</span>' : ''}
                    </div>
                ` : editInput}
            </div>
        `;
    }).join('');
}

// Complete task
function completeTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task || task.completed) return;

    task.completed = true;
    task.completedAt = new Date().toISOString();
    
    // Award XP
    const xpGained = XP_REWARDS[task.difficulty];
    currentXP += xpGained;
    
    // Track XP earned today for quests
    if (!questProgress.xpEarnedToday) {
        questProgress.xpEarnedToday = 0;
    }
    questProgress.xpEarnedToday += xpGained;
    
    // Update streak
    const today = new Date().toDateString();
    if (lastCompletedDate !== today) {
        checkStreak();
        lastCompletedDate = today;
    }
    
    // Check for level up
    const newLevel = Math.floor(currentXP / XP_PER_LEVEL) + 1;
    const leveledUp = newLevel > currentLevel;
    
    if (leveledUp) {
        currentLevel = newLevel;
        animateLevelUp();
    }
    
    saveData();
    renderTasks();
    updateStats();
    checkBadges();
    updateQuestProgress();
    
    // Show XP gain animation
    showXPGain(xpGained);
    
    // Check for streak milestones
    if (currentStreak > 0 && (currentStreak === 7 || currentStreak === 30)) {
        createConfetti();
    }
}

// Delete task
function deleteTask(id) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(t => t.id !== id);
        saveData();
        renderTasks();
    }
}

// Edit task
function editTask(id) {
    editingTaskId = id;
    renderTasks();
    
    // Focus on title input
    setTimeout(() => {
        const titleInput = document.querySelector('[data-edit-title]');
        if (titleInput) {
            titleInput.focus();
            titleInput.select();
        }
    }, 100);
}

// Save edit
function saveEdit(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const titleInput = document.querySelector('[data-edit-title]');
    const descriptionInput = document.querySelector('[data-edit-description]');
    
    if (titleInput && titleInput.value.trim()) {
        task.title = titleInput.value.trim();
        task.description = descriptionInput.value.trim();
        
        saveData();
        editingTaskId = null;
        renderTasks();
    }
}

// Cancel edit
function cancelEdit() {
    editingTaskId = null;
    renderTasks();
}

// Update stats display
function updateStats() {
    document.getElementById('level').textContent = currentLevel;
    document.getElementById('totalXP').textContent = currentXP;
    document.getElementById('streak').textContent = currentStreak;
    
    // Update XP progress bar
    const xpInCurrentLevel = currentXP % XP_PER_LEVEL;
    const xpNeeded = XP_PER_LEVEL;
    const progress = (xpInCurrentLevel / xpNeeded) * 100;
    
    document.getElementById('xpProgressText').textContent = `${xpInCurrentLevel} / ${xpNeeded}`;
    const progressFill = document.getElementById('xpProgressFill');
    progressFill.style.width = `${progress}%`;
}

// Animate level up
function animateLevelUp() {
    const progressFill = document.getElementById('xpProgressFill');
    progressFill.classList.add('level-up');
    
    setTimeout(() => {
        progressFill.classList.remove('level-up');
    }, 800);
    
    createConfetti();
    
    // Show level up notification
    showNotification(`🎉 Level Up! You're now Level ${currentLevel}!`);
}

// Show XP gain
function showXPGain(xp) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--success);
        color: var(--white);
        border: 2px solid var(--black);
        padding: 15px 25px;
        border-radius: 8px;
        font-weight: 600;
        z-index: 1001;
        animation: slideInRight 0.3s ease;
        box-shadow: var(--shadow-hover);
    `;
    notification.textContent = `+${xp} XP`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--bg-secondary);
        color: var(--text-primary);
        border: 2px solid var(--black);
        padding: 15px 25px;
        border-radius: 8px;
        font-weight: 600;
        z-index: 1001;
        animation: slideInRight 0.3s ease;
        box-shadow: var(--shadow-hover);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Check badges
function checkBadges() {
    const earnedBadges = getEarnedBadges();
    const savedBadges = JSON.parse(localStorage.getItem('studier_badges') || '[]');
    
    earnedBadges.forEach(badge => {
        if (!savedBadges.includes(badge.id)) {
            // New badge earned!
            savedBadges.push(badge.id);
            localStorage.setItem('studier_badges', JSON.stringify(savedBadges));
            showBadgeModal(badge);
            renderBadges();
        }
    });
}

// Get earned badges
function getEarnedBadges() {
    const completedTasks = tasks.filter(t => t.completed);
    const completedCount = completedTasks.length;
    const hardTasksCount = completedTasks.filter(t => t.difficulty === 'hard').length;
    
    return BADGES.filter(badge => {
        if (badge.type === 'level') {
            return currentLevel >= badge.requirement;
        } else if (badge.type === 'streak') {
            return currentStreak >= badge.requirement;
        } else if (badge.type === 'tasks') {
            return completedCount >= badge.requirement;
        } else if (badge.type === 'hard_tasks') {
            return hardTasksCount >= badge.requirement;
        } else {
            return completedCount >= badge.requirement;
        }
    });
}

// Render badges
function renderBadges() {
    const badgesList = document.getElementById('badgesList');
    const earnedBadges = JSON.parse(localStorage.getItem('studier_badges') || '[]');
    
    badgesList.innerHTML = BADGES.map(badge => {
        const isEarned = earnedBadges.includes(badge.id);
        return `
            <div class="badge-item ${isEarned ? '' : 'locked'}" onclick="${isEarned ? `showBadgeModal(${JSON.stringify(badge)})` : ''}">
                <div class="badge-icon">${badge.icon}</div>
                <div class="badge-name">${badge.name}</div>
                ${isEarned ? '' : '<div class="badge-description-text">Locked</div>'}
            </div>
        `;
    }).join('');
}

// Show badge modal
function showBadgeModal(badge) {
    const modal = document.getElementById('badgeModal');
    document.getElementById('badgeTitle').textContent = badge.name;
    document.getElementById('badgeDescription').textContent = badge.description;
    document.querySelector('.badge-icon-large').textContent = badge.icon;
    modal.classList.add('show');
    
    createConfetti();
}

// Close badge modal
function closeBadgeModal() {
    const modal = document.getElementById('badgeModal');
    modal.classList.remove('show');
}

// Create confetti
function createConfetti() {
    const container = document.getElementById('confettiContainer');
    const colors = ['#0066ff', '#808080'];
    
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 0.5 + 's';
        confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
        container.appendChild(confetti);
        
        setTimeout(() => confetti.remove(), 3000);
    }
}

// Theme management
function setupTheme() {
    const savedTheme = localStorage.getItem('studier_theme') || 'light';
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.querySelector('.theme-icon').textContent = '☀️';
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('studier_theme', newTheme);
    document.querySelector('.theme-icon').textContent = newTheme === 'dark' ? '☀️' : '🌙';
}

// Utility function
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);


