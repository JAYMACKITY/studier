// Simple localStorage-based database for user management
// In production, this would connect to a real backend API

const DB_PREFIX = 'studier_';
const USERS_KEY = DB_PREFIX + 'users';
const SESSIONS_KEY = DB_PREFIX + 'sessions';

// Initialize database
function initDatabase() {
    if (!localStorage.getItem(USERS_KEY)) {
        localStorage.setItem(USERS_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(SESSIONS_KEY)) {
        localStorage.setItem(SESSIONS_KEY, JSON.stringify({}));
    }
}

// Get all users
function getUsers() {
    const users = localStorage.getItem(USERS_KEY);
    return users ? JSON.parse(users) : [];
}

// Save users
function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Find user by email
function findUserByEmail(email) {
    const users = getUsers();
    return users.find(user => user.email.toLowerCase() === email.toLowerCase());
}

// Find user by ID
function findUserById(userId) {
    const users = getUsers();
    return users.find(user => user.id === userId);
}

// Create new user
function createUser(userData) {
    const users = getUsers();
    
    // Check if user already exists
    if (findUserByEmail(userData.email)) {
        throw new Error('User with this email already exists');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
        throw new Error('Invalid email format');
    }

    // Validate password (skip for OAuth providers like Google)
    if (userData.provider !== 'google' && (!userData.password || userData.password.length < 8)) {
        throw new Error('Password must be at least 8 characters');
    }

    // Create user object
    const newUser = {
        id: Date.now().toString(),
        name: userData.name.trim(),
        email: userData.email.toLowerCase().trim(),
        password: userData.provider === 'google' ? '' : hashPassword(userData.password), // In production, use proper hashing
        plan: userData.plan || 'free', // 'free' or 'premium'
        trialEndDate: userData.plan === 'premium' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null,
        createdAt: new Date().toISOString(),
        provider: userData.provider || 'email' // 'email' or 'google'
    };

    users.push(newUser);
    saveUsers(users);
    
    return newUser;
}

// Simple password hashing (in production, use bcrypt or similar)
function hashPassword(password) {
    // This is a simple hash - in production, use proper hashing
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
}

// Verify password
function verifyPassword(password, hashedPassword) {
    return hashPassword(password) === hashedPassword;
}

// Authenticate user
function authenticateUser(email, password) {
    const user = findUserByEmail(email);
    
    if (!user) {
        throw new Error('Invalid email or password');
    }

    if (user.provider === 'google') {
        throw new Error('Please sign in with Google');
    }

    if (!verifyPassword(password, user.password)) {
        throw new Error('Invalid email or password');
    }

    return user;
}

// Create session
function createSession(userId) {
    const sessions = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '{}');
    const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const session = {
        userId: userId,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    };
    
    sessions[sessionId] = session;
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    localStorage.setItem(DB_PREFIX + 'current_session', sessionId);
    
    return sessionId;
}

// Get current session
function getCurrentSession() {
    const sessionId = localStorage.getItem(DB_PREFIX + 'current_session');
    if (!sessionId) return null;
    
    const sessions = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '{}');
    const session = sessions[sessionId];
    
    if (!session) return null;
    
    // Check if session expired
    if (new Date(session.expiresAt) < new Date()) {
        deleteSession(sessionId);
        return null;
    }
    
    return session;
}

// Get current user
function getCurrentUser() {
    const session = getCurrentSession();
    if (!session) return null;
    
    return findUserById(session.userId);
}

// Delete session (logout)
function deleteSession(sessionId) {
    const sessions = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '{}');
    delete sessions[sessionId];
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    localStorage.removeItem(DB_PREFIX + 'current_session');
}

// Logout
function logout() {
    const sessionId = localStorage.getItem(DB_PREFIX + 'current_session');
    if (sessionId) {
        deleteSession(sessionId);
    }
}

// Update user
function updateUser(userId, updates) {
    const users = getUsers();
    const userIndex = users.findIndex(user => user.id === userId);
    
    if (userIndex === -1) {
        throw new Error('User not found');
    }
    
    // Don't allow updating password directly (use separate function)
    delete updates.password;
    delete updates.id;
    delete updates.email; // Email shouldn't be changed easily
    
    users[userIndex] = { ...users[userIndex], ...updates };
    saveUsers(users);
    
    return users[userIndex];
}

// Initialize on load
initDatabase();

