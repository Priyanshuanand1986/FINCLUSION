import axios from 'axios';
import { supabase } from './supabaseClient';
import { mockAuth } from './mockAuth';
import * as realApi from './realApi';

// Enable mock mode for development
const USE_MOCK_AUTH = true; // Set to false when real backend is available

// API Configuration
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Types
interface AuthResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    profileCompleted: boolean;
    panId?: string;
    dateOfBirth?: string;
  };
  error?: string;
}

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color?: string;
  icon?: string;
  budget?: number;
}

interface Transaction {
  _id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
}



// Auth Services
export const authAPI = {
  register: async (name: string, email: string, password: string): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Create a profile record
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            name,
            email
          });

        if (profileError) throw profileError;
      }

      return {
        success: true,
        token: data.session?.access_token || '',
        user: {
          id: data.user?.id || '',
          name,
          email,
          profileCompleted: false
        }
      };
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.message);
    }
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    if (USE_MOCK_AUTH) {
      // Use mock implementation
      try {
        return mockAuth.login(email, password);
      } catch (error: any) {
        throw new Error(error.message);
      }
    }

    // Use real implementation
    try {
      const response = await realApi.authAPI.login(email, password);
      // Transform response to match expected format
      return {
        success: response.success,
        token: response.data.token,
        user: {
          id: response.data._id,
          name: response.data.name,
          email: response.data.email,
          profileCompleted: true,
          panId: response.data.panId,
          dateOfBirth: response.data.dateOfBirth
        }
      };
    } catch (error) {
      console.error('Login API error:', error);
      throw error;
    }
  },

  getProfile: async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error('No user found');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      return {
        success: true,
        user: {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          profileCompleted: true,
          panId: profile.pan_id,
          dateOfBirth: profile.date_of_birth
        }
      };
    } catch (error: any) {
      throw error;
    }
  }
};

// Profile Services
export const profileAPI = {
  getProfile: async () => {
    if (USE_MOCK_AUTH) {
      // In mock mode, try to get profile from localStorage
      const storedProfile = localStorage.getItem('userProfile');
      if (storedProfile) {
        return { success: true, data: JSON.parse(storedProfile) };
      }

      // Fallback to userData if userProfile not found (e.g. fresh login)
      const userData = localStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        return {
          success: true,
          data: {
            name: user.name || '',
            email: user.email || '',
            profileImage: null,
            dateOfBirth: '',
            panId: ''
          }
        };
      }

      return { success: false, error: 'No profile found' };
    }

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  updateProfile: async (profileData: any) => {
    if (USE_MOCK_AUTH) {
      // In mock mode, update profile in localStorage
      // We check userData first to get the email if needed
      const userDataStr = localStorage.getItem('userData');
      const userProfileStr = localStorage.getItem('userProfile');

      let baseProfile = {};
      if (userProfileStr) {
        baseProfile = JSON.parse(userProfileStr);
      } else if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        baseProfile = { email: userData.email };
      }

      const updatedProfile = { ...baseProfile, ...profileData };

      localStorage.setItem('userProfile', JSON.stringify(updatedProfile));

      // Also update userData name if present, to keep them in sync
      if (userDataStr && profileData.name) {
        const userData = JSON.parse(userDataStr);
        userData.name = profileData.name;
        userData.full_name = profileData.name;
        localStorage.setItem('userData', JSON.stringify(userData));
      }

      return { success: true, data: updatedProfile };
    }

    // Use real implementation
    return realApi.profileAPI.updateProfile(profileData);
  },

  uploadProfileImage: async (formData: FormData) => {
    if (USE_MOCK_AUTH) {
      // Mock image upload - just return a success message
      // In a real implementation, this would handle the file upload
      // Since we can't actually process files in localStorage, we'll just
      // pretend it worked and return a mock URL
      try {
        const currentProfile = localStorage.getItem('userProfile');
        if (currentProfile) {
          const profile = JSON.parse(currentProfile);
          profile.profileImage = `https://ui-avatars.com/api/?name=${profile.name.replace(' ', '+')}&size=200&background=random`;
          localStorage.setItem('userProfile', JSON.stringify(profile));
        }

        return {
          success: true,
          data: {
            imageUrl: `https://ui-avatars.com/api/?name=User&size=200&background=random`
          }
        };
      } catch (error) {
        return { success: false, error: 'Error uploading image' };
      }
    }

    // Use real implementation
    return realApi.profileAPI.uploadProfileImage(formData);
  },

  updatePanId: async (panId: string) => {
    return api.put('/profile/panid', { panId });
  },

  updateDateOfBirth: async (dateOfBirth: string) => {
    return api.put('/profile/dob', { dateOfBirth });
  }
};

// Transaction Services
export const transactionAPI = {
  getTransactions: async () => {
    if (USE_MOCK_AUTH) {
      // In mock mode, get transactions from localStorage
      const storedTransactions = localStorage.getItem('transactions');
      return {
        success: true,
        data: storedTransactions ? JSON.parse(storedTransactions) : []
      };
    }

    // Use real implementation
    return realApi.transactionAPI.getTransactions();
  },

  createTransaction: async (transaction: Omit<Transaction, '_id'>) => {
    if (USE_MOCK_AUTH) {
      // In mock mode, add to localStorage
      const storedTransactions = localStorage.getItem('transactions');
      const transactions = storedTransactions ? JSON.parse(storedTransactions) : [];
      const newTransaction = {
        ...transaction,
        _id: `trans-${Date.now()}`,
        createdAt: new Date().toISOString()
      };

      localStorage.setItem('transactions', JSON.stringify([...transactions, newTransaction]));
      return { success: true, data: newTransaction };
    }

    // Use real implementation
    return realApi.transactionAPI.createTransaction(transaction);
  },

  updateTransaction: async (id: string, transaction: Partial<Transaction>) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('transactions')
        .update(transaction)
        .eq('id', id)
        .eq('user_id', user.id)
        .select('*, categories(name, type, color, icon)')
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  deleteTransaction: async (id: string) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      return { success: true, data: {} };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  getMonthlyTransactions: async (year: number, month: number) => {
    if (USE_MOCK_AUTH) {
      // In mock mode, filter transactions by month from localStorage
      const storedTransactions = localStorage.getItem('transactions');
      if (!storedTransactions) return { success: true, data: { transactions: [], summary: { income: 0, expense: 0, balance: 0 } } };

      const transactions = JSON.parse(storedTransactions);

      // Filter by month/year
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const filteredTransactions = transactions.filter((t: any) => {
        const date = new Date(t.date);
        return date >= startDate && date <= endDate;
      });

      // Calculate totals
      const summary = filteredTransactions.reduce((acc: any, curr: any) => {
        if (curr.type === 'income') {
          acc.income += curr.amount;
        } else {
          acc.expense += curr.amount;
        }
        return acc;
      }, { income: 0, expense: 0 });

      summary.balance = summary.income - summary.expense;

      return {
        success: true,
        data: {
          transactions: filteredTransactions,
          summary
        }
      };
    }

    // Use real implementation
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error('No user found');

      const startDate = new Date(year, month - 1, 1).toISOString();
      const endDate = new Date(year, month, 0).toISOString();

      const { data, error } = await supabase
        .from('transactions')
        .select('*, categories(name, type, color, icon)')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) throw error;

      // Calculate summary
      const summary = data.reduce((acc: any, curr: any) => {
        if (curr.type === 'income') {
          acc.income += curr.amount;
        } else {
          acc.expense += curr.amount;
        }
        return acc;
      }, { income: 0, expense: 0 });

      summary.balance = summary.income - summary.expense;

      return {
        success: true,
        data: {
          transactions: data,
          summary
        }
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  getTransactionsByCategory: async (startDate: string, endDate: string) => {
    if (USE_MOCK_AUTH) {
      // In mock mode, group transactions by category from localStorage
      const storedTransactions = localStorage.getItem('transactions');
      if (!storedTransactions) return { success: true, data: [] };

      const transactions = JSON.parse(storedTransactions);
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Filter by date range
      const filteredTransactions = transactions.filter((t: any) => {
        const date = new Date(t.date);
        return date >= start && date <= end;
      });

      // Group by category
      const categoriesMap: Record<string, any> = {};

      filteredTransactions.forEach((t: any) => {
        if (!categoriesMap[t.category]) {
          categoriesMap[t.category] = {
            _id: t.category,
            total: 0,
            count: 0,
            transactions: []
          };
        }

        categoriesMap[t.category].total += t.amount;
        categoriesMap[t.category].count += 1;
        categoriesMap[t.category].transactions.push(t);
      });

      // Convert to array and sort by total
      const categoriesArray = Object.values(categoriesMap);
      categoriesArray.sort((a, b) => b.total - a.total);

      return { success: true, data: categoriesArray };
    }
    return api.get(`/transactions/by-category?startDate=${startDate}&endDate=${endDate}`);
  }
};

// Category Services
export const categoryAPI = {
  getCategories: async () => {
    if (USE_MOCK_AUTH) {
      // In mock mode, get categories from localStorage
      const storedCategories = localStorage.getItem('categories');

      // Default categories if none exist
      const defaultCategories = [
        { _id: 'cat-1', name: 'Food', type: 'expense', color: '#FF7D7D', icon: 'food' },
        { _id: 'cat-2', name: 'Shopping', type: 'expense', color: '#8B5CF6', icon: 'shopping' },
        { _id: 'cat-3', name: 'Fun', type: 'expense', color: '#F59E0B', icon: 'movie' },
        { _id: 'cat-4', name: 'Transport', type: 'expense', color: '#10B981', icon: 'car' },
        { _id: 'cat-5', name: 'Utilities', type: 'expense', color: '#3B82F6', icon: 'bolt' },
        { _id: 'cat-6', name: 'Medical', type: 'expense', color: '#EC4899', icon: 'hospital' },
        { _id: 'cat-7', name: 'Education', type: 'expense', color: '#06B6D4', icon: 'book' },
        { _id: 'cat-8', name: 'Income', type: 'income', color: '#00BF63', icon: 'cash' }
      ];

      // If no categories stored, use defaults
      if (!storedCategories) {
        localStorage.setItem('categories', JSON.stringify(defaultCategories));
        return { success: true, data: defaultCategories };
      }

      return { success: true, data: JSON.parse(storedCategories) };
    }

    // Use real implementation
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  createCategory: async (category: Omit<Category, '_id'>) => {
    if (USE_MOCK_AUTH) {
      // In mock mode, add to localStorage
      const storedCategories = localStorage.getItem('categories');
      const categories = storedCategories ? JSON.parse(storedCategories) : [];

      // Check if category already exists
      const existingCategory = categories.find((c: any) =>
        c.name.toLowerCase() === category.name.toLowerCase() && c.type === category.type
      );

      if (existingCategory) {
        return { success: false, error: 'Category already exists' };
      }

      const newCategory = {
        ...category,
        _id: `cat-${Date.now()}`,
        createdAt: new Date().toISOString()
      };

      localStorage.setItem('categories', JSON.stringify([...categories, newCategory]));
      return { success: true, data: newCategory };
    }

    // Use real implementation
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error('No user found');

      // Check if category already exists
      const { data: existingCategory, error: checkError } = await supabase
        .from('categories')
        .select()
        .eq('name', category.name)
        .eq('type', category.type)
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError) throw checkError;
      if (existingCategory) {
        return { success: false, error: 'Category already exists' };
      }

      const { data, error } = await supabase
        .from('categories')
        .insert({
          ...category,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  updateCategory: async (id: string, category: Partial<Category>) => {
    if (USE_MOCK_AUTH) {
      // In mock mode, update in localStorage
      const storedCategories = localStorage.getItem('categories');
      if (!storedCategories) return { success: false, error: 'No categories found' };

      const categories = JSON.parse(storedCategories);
      const index = categories.findIndex((c: any) => c._id === id);

      if (index === -1) return { success: false, error: 'Category not found' };

      categories[index] = { ...categories[index], ...category };
      localStorage.setItem('categories', JSON.stringify(categories));
      return { success: true, data: categories[index] };
    }

    // Use real implementation
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('categories')
        .update(category)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  deleteCategory: async (id: string) => {
    if (USE_MOCK_AUTH) {
      // In mock mode, delete from localStorage
      const storedCategories = localStorage.getItem('categories');
      if (!storedCategories) return { success: false, error: 'No categories found' };

      const categories = JSON.parse(storedCategories);
      const categoryToDelete = categories.find((c: any) => c._id === id);

      if (!categoryToDelete) return { success: false, error: 'Category not found' };

      const filteredCategories = categories.filter((c: any) => c._id !== id);
      localStorage.setItem('categories', JSON.stringify(filteredCategories));

      // Also remove this category from transactions
      const storedTransactions = localStorage.getItem('transactions');
      if (storedTransactions) {
        const transactions = JSON.parse(storedTransactions);
        const updatedTransactions = transactions.filter((t: any) => t.category !== categoryToDelete.name);
        localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
      }

      return { success: true, data: {} };
    }

    // Use real implementation
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error('No user found');

      // First get the category to check if it exists
      const { data: category, error: getError } = await supabase
        .from('categories')
        .select()
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (getError) throw getError;
      if (!category) return { success: false, error: 'Category not found' };

      // Delete the category
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Remove this category from transactions
      await supabase
        .from('transactions')
        .update({ category_id: null })
        .eq('category_id', id)
        .eq('user_id', user.id);

      return { success: true, data: {} };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  getCategoryStats: async (startDate: string, endDate: string) => {
    if (USE_MOCK_AUTH) {
      // In mock mode, calculate category stats from localStorage
      const storedCategories = localStorage.getItem('categories');
      const storedTransactions = localStorage.getItem('transactions');

      if (!storedCategories) return { success: true, data: [] };

      const categories = JSON.parse(storedCategories);
      const transactions = storedTransactions ? JSON.parse(storedTransactions) : [];

      const start = new Date(startDate);
      const end = new Date(endDate);

      // Get transactions in date range
      const filteredTransactions = transactions.filter((t: any) => {
        const date = new Date(t.date);
        return date >= start && date <= end;
      });

      // Calculate stats for each category
      const categoryStats = categories.map((category: any) => {
        const categoryTransactions = filteredTransactions.filter(
          (t: any) => t.category === category.name
        );

        const total = categoryTransactions.reduce((sum: number, trans: any) => sum + trans.amount, 0);
        const percentageOfBudget = category.budget ? (total / category.budget) * 100 : null;

        return {
          category: category.name,
          type: category.type,
          color: category.color,
          icon: category.icon,
          budget: category.budget,
          spent: total,
          percentageOfBudget,
          transactionCount: categoryTransactions.length
        };
      });

      return { success: true, data: categoryStats };
    }
    return api.get(`/categories/stats?startDate=${startDate}&endDate=${endDate}`);
  }
};