import { authDb } from './indexedDb';
import { nanoid } from 'nanoid';
import type { User } from '@/types';

export class UserManager {
  /**
   * Create a new user in the database
   */
  async create(email: string, password: string): Promise<string> {
    const id = nanoid();
    const now = new Date().toISOString();
    const name = email.split('@')[0];

    const user: User = {
      id,
      name,
      email,
      password,
      createdAt: now,
    };

    await authDb.users.add(user);
    return id;
  }

  /**
   * Get all users from the database
   */
  async getAll(): Promise<User[]> {
    return await authDb.users.toArray();
  }

  /**
   * Get a user by ID
   */
  async getById(id: string): Promise<User | undefined> {
    return await authDb.users.get(id);
  }

  /**
   * Get a user by email
   */
  async getByEmail(email: string): Promise<User | undefined> {
    return await authDb.users.where('email').equals(email).first();
  }

  /**
   * Update a user
   */
  async update(id: string, updates: Partial<User>): Promise<void> {
    await authDb.users.update(id, updates);
  }

  /**
   * Delete a user
   */
  async delete(id: string): Promise<void> {
    await authDb.users.delete(id);
  }

  /**
   * Check if a user exists
   */
  async isUserExit(email: string, password: string): Promise<boolean> {
    const user = await this.getByEmail(email);
    return user?.password === password;
  }

  /**
   * Verify user credentials and return specific error
   */
  async verifyCredentials(
    email: string,
    password: string
  ): Promise<{
    success: boolean;
    error?: 'user_not_found' | 'invalid_password';
  }> {
    const user = await this.getByEmail(email);

    if (!user) {
      return { success: false, error: 'user_not_found' };
    }

    if (user.password !== password) {
      return { success: false, error: 'invalid_password' };
    }

    return { success: true };
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(userId: string): Promise<boolean> {
    const user = await this.getById(userId);
    return user !== undefined;
  }
}

const userManager = new UserManager();
export default userManager;
