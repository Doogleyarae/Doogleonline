// Simple authentication system without Firebase
interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  emailVerified: boolean;
  metadata: {
    creationTime: string;
    lastSignInTime: string;
  };
}

interface AuthUser {
  email: string;
  password: string;
  displayName: string;
  createdAt: string;
}

const STORAGE_KEYS = {
  USERS: 'simple_auth_users',
  CURRENT_USER: 'simple_auth_current_user',
  SESSION: 'simple_auth_session'
};

class SimpleAuth {
  private users: AuthUser[] = [];
  private currentUser: User | null = null;
  private listeners: ((user: User | null) => void)[] = [];

  constructor() {
    this.loadUsers();
    this.loadCurrentUser();
  }

  private loadUsers() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USERS);
      if (stored) {
        this.users = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load users:', error);
    }
  }

  private saveUsers() {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(this.users));
    } catch (error) {
      console.warn('Failed to save users:', error);
    }
  }

  private loadCurrentUser() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (stored) {
        this.currentUser = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load current user:', error);
    }
  }

  private saveCurrentUser() {
    try {
      if (this.currentUser) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(this.currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }
    } catch (error) {
      console.warn('Failed to save current user:', error);
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentUser));
  }

  private generateUserId(): string {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  async signUpWithEmail(email: string, password: string, displayName: string): Promise<User> {
    // Check if user already exists
    const existingUser = this.users.find(u => u.email === email);
    if (existingUser) {
      throw new Error('auth/email-already-in-use');
    }

    // Create new user
    const newAuthUser: AuthUser = {
      email,
      password, // In production, this should be hashed
      displayName,
      createdAt: new Date().toISOString()
    };

    this.users.push(newAuthUser);
    this.saveUsers();

    // Create user object
    const user: User = {
      uid: this.generateUserId(),
      email,
      displayName,
      emailVerified: true, // Simplified for demo
      metadata: {
        creationTime: newAuthUser.createdAt,
        lastSignInTime: new Date().toISOString()
      }
    };

    this.currentUser = user;
    this.saveCurrentUser();
    this.notifyListeners();

    return user;
  }

  async signInWithEmail(email: string, password: string): Promise<User> {
    const authUser = this.users.find(u => u.email === email && u.password === password);
    if (!authUser) {
      throw new Error('auth/invalid-credential');
    }

    const user: User = {
      uid: this.generateUserId(),
      email: authUser.email,
      displayName: authUser.displayName,
      emailVerified: true,
      metadata: {
        creationTime: authUser.createdAt,
        lastSignInTime: new Date().toISOString()
      }
    };

    this.currentUser = user;
    this.saveCurrentUser();
    this.notifyListeners();

    return user;
  }

  async resetPassword(email: string): Promise<void> {
    const user = this.users.find(u => u.email === email);
    if (!user) {
      throw new Error('auth/user-not-found');
    }
    // In a real app, this would send an email
    // For demo purposes, we'll just resolve
    return Promise.resolve();
  }

  async signOut(): Promise<void> {
    this.currentUser = null;
    this.saveCurrentUser();
    this.notifyListeners();
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    this.listeners.push(callback);
    // Call immediately with current state
    callback(this.currentUser);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  getAuthErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/invalid-credential':
        return 'Invalid email or password.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      default:
        return 'An error occurred. Please try again.';
    }
  }
}

export const simpleAuth = new SimpleAuth();
export type { User };