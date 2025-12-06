/**
 * Mock Authentication Service
 * This is a temporary mock implementation for development
 * It simulates a backend authentication service until the real backend is integrated
 */

// Demo user to allow login
const DEMO_USER = {
  email: 'demo@budgettracker.com',
  password: 'demo1234',
  name: '',
  id: 'demo-user-id',
  profileCompleted: false,
  panId: 'DEMO1234Z',
  dateOfBirth: '1990-01-01'
};

// User storage for registered users
class MockUserStorage {
  private users: Record<string, any> = {
    [DEMO_USER.email]: { ...DEMO_USER }
  };

  // Register a new user
  register(name: string, email: string, password: string) {
    // Simulate server validation
    if (!name || !email || !password) {
      throw new Error('All fields are required');
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    if (this.users[email]) {
      throw new Error('User already exists with this email');
    }

    // Create new user
    const newUser = {
      id: `user-${Date.now()}`,
      name,
      email,
      password,
      profileCompleted: false,
      createdAt: new Date().toISOString()
    };

    // Store user
    this.users[email] = newUser;

    // Return user data (without password)
    const { password: _, ...userData } = newUser;
    return {
      success: true,
      token: this.generateToken(newUser.id),
      user: userData
    };
  }

  // Login a user
  login(email: string, password: string) {
    // Simulate server validation
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Check if user exists
    const user = this.users[email];
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check password
    if (user.password !== password) {
      throw new Error('Invalid credentials');
    }

    // Return user data (without password)
    const { password: _, ...userData } = user;
    return {
      success: true,
      token: this.generateToken(user.id),
      user: userData
    };
  }

  // Generate a simple mock token
  private generateToken(userId: string) {
    return `mock-token-${userId}-${Date.now()}`;
  }
}

// Export singleton instance
export const mockAuth = new MockUserStorage(); 