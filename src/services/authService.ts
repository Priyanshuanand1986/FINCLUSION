// Enhanced Authentication Service for Supabase Integration
import { supabase } from './supabaseClient';
import { mockAuth } from './mockAuth';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  full_name?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  token?: string;
  error?: string;
  needsEmailConfirmation?: boolean;
}

class AuthService {
  constructor() {
    // Set up auth state listener to handle email confirmations
    this.setupAuthStateListener();
  }

  // Setup auth state listener for handling email confirmation and redirects
  private setupAuthStateListener() {
    supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      // Handle email confirmation
      if (event === 'SIGNED_IN' && session?.user) {
        this.handleAuthenticatedUser(session.user);
      }
      
      // Handle token refresh
      if (event === 'TOKEN_REFRESHED' && session) {
        this.updateStoredToken(session.access_token);
      }
      
      // Handle sign out
      if (event === 'SIGNED_OUT') {
        this.clearLocalStorageOnly();
      }
    });
  }

  // Handle authenticated user (from login or email confirmation)
  private async handleAuthenticatedUser(user: any, retryCount = 0): Promise<void> {
    try {
      console.log(`Handling authenticated user ${user.email}, retry: ${retryCount}`);
      
      // Check if profile exists
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profile && !profileError?.code?.includes('PGRST116')) {
        console.log('Profile fetch error:', profileError);
        
        // Try to create profile manually using our helper function
        try {
          const { error: createError } = await supabase.rpc('create_user_profile', {
            p_user_id: user.id,
            p_email: user.email || '',
            p_full_name: user.user_metadata?.full_name || null
          });
          
          if (createError) {
            console.log('Manual profile creation failed:', createError);
            
            // If helper function doesn't exist, try direct insert
            try {
              const { error: insertError } = await supabase
                .from('user_profiles')
                .insert({
                  id: user.id,
                  full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
                  email: user.email || '',
                  account_status: user.email_confirmed_at ? 'active' : 'pending_verification'
                });
              
              if (insertError) {
                console.log('Direct profile insert also failed:', insertError);
              } else {
                console.log('Direct profile insert succeeded, checking again...');
                await new Promise(resolve => setTimeout(resolve, 1000));
                return this.handleAuthenticatedUser(user, retryCount + 1);
              }
            } catch (directError) {
              console.log('Error with direct profile insert:', directError);
            }
          } else {
            console.log('Manual profile creation succeeded, checking again...');
            // Wait a bit and check again
            await new Promise(resolve => setTimeout(resolve, 1000));
            return this.handleAuthenticatedUser(user, retryCount + 1);
          }
        } catch (createError) {
          console.log('Error calling create_user_profile:', createError);
        }
        
        if (retryCount < 3) {
          console.log(`Retrying profile check in ${(retryCount + 1) * 1000}ms...`);
          setTimeout(() => this.handleAuthenticatedUser(user, retryCount + 1), (retryCount + 1) * 1000);
          return;
        }
      }

      if (!profile) {
        console.log('No profile found after retries, user may still be in registration process');
        // Don't redirect yet - let registration complete
        return;
      }

      console.log('Profile found:', profile);
      
      // Store authentication state
      localStorage.setItem('userToken', user.session?.access_token || '');
      localStorage.setItem('refreshToken', user.session?.refresh_token || '');
      localStorage.setItem('userEmail', user.email || '');
      localStorage.setItem('userId', user.id);
      localStorage.setItem('isAuthenticated', 'true');

      // Navigate to dashboard
      if (typeof window !== 'undefined') {
        window.location.hash = '/dashboard';
        window.location.reload();
      }
      
    } catch (error) {
      console.error('Error in handleAuthenticatedUser:', error);
      if (retryCount < 3) {
        setTimeout(() => this.handleAuthenticatedUser(user, retryCount + 1), (retryCount + 1) * 2000);
      }
    }
  };

  // Save user credentials securely
  private saveUserCredentials(user: AuthUser, token: string) {
    try {
      localStorage.setItem('token', token);
      localStorage.setItem('userData', JSON.stringify(user));
      localStorage.setItem('userProfile', JSON.stringify({
        name: user.name || user.full_name,
        email: user.email,
        profileImage: null,
        dateOfBirth: '',
        panId: ''
      }));
      
      console.log('✅ User credentials saved successfully');
    } catch (error) {
      console.error('Error saving user credentials:', error);
    }
  }

  // Update stored token (for token refresh)
  private updateStoredToken(newToken: string) {
    try {
      localStorage.setItem('token', newToken);
      console.log('🔄 Token refreshed and updated');
    } catch (error) {
      console.error('Error updating token:', error);
    }
  }

  // Login with Supabase
  async login(email: string, password: string): Promise<AuthResponse> {
    // Check for demo login or mock mode
    if (email === 'demo@budgettracker.com' && password === 'demo1234') {
       console.log('Using mock auth for demo user');
       try {
         const response = mockAuth.login(email, password);
         if (response.success) {
            const user: AuthUser = {
              id: response.user.id,
              email: response.user.email,
              name: response.user.name,
              full_name: response.user.name
            };
            this.saveUserCredentials(user, response.token);
            
            // Also set the flags that handleAuthenticatedUser sets
            localStorage.setItem('userToken', response.token);
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('userId', user.id);
            localStorage.setItem('userEmail', user.email);

            return {
              success: true,
              user,
              token: response.token
            };
         }
       } catch (e: any) {
         return { success: false, error: e.message };
       }
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

        if (data.user && data.session) {
        // Get user profile from our custom table
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        const user: AuthUser = {
          id: data.user.id,
          email: data.user.email!,
          name: profile?.full_name || profile?.name || data.user.user_metadata?.name,
          full_name: profile?.full_name || profile?.name || data.user.user_metadata?.full_name,
        };

        // Save credentials for future logins
        this.saveUserCredentials(user, data.session.access_token);

        return {
          success: true,
          user,
          token: data.session.access_token,
        };
      }      return {
        success: false,
        error: 'No user data received',
      };
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.message || 'Login failed',
      };
    }
  }

  // Register with Supabase
  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    try {
      // First cleanup any orphaned profiles for this email
      try {
        await supabase.rpc('cleanup_orphaned_profile', { user_email: email.toLowerCase() });
        console.log('✅ Cleaned up any orphaned profiles for', email);
      } catch (cleanupError) {
        console.log('Cleanup function not available or failed, continuing with registration...');
      }

      // Check user_profiles table for existing email
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('email, id')
        .eq('email', email.toLowerCase())
        .maybeSingle(); // Use maybeSingle to avoid error if no record found

      if (existingProfile) {
        // Try to find the corresponding auth user
        console.log('Found existing profile for', email, 'checking auth status...');
        return {
          success: false,
          error: 'An account with this email already exists. Please try logging in instead.',
        };
      }

      // Set redirect URL for email confirmation
      const redirectUrl = `${window.location.origin}/#/dashboard`;
      
      // Attempt registration with retry logic for constraint errors
      let registrationData, registrationError;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount <= maxRetries) {
        try {
          // Clean up any orphaned profile first
          if (retryCount === 0) {
            try {
              await supabase.rpc('cleanup_orphaned_profile', { user_email: email });
            } catch (cleanupError) {
              console.log('Cleanup error (non-critical):', cleanupError);
            }
          }

          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: redirectUrl,
              data: {
                full_name: name,
                name: name,
              }
            }
          });

          registrationData = data;
          registrationError = error;
          
          if (!error && data?.user) {
            console.log('✅ Registration successful on attempt', retryCount + 1);
            
            // Wait and verify profile was created
            let profileCheckAttempts = 0;
            const maxProfileChecks = 5;
            let profileExists = false;
            
            while (profileCheckAttempts < maxProfileChecks && !profileExists) {
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
              
              try {
                const { data: profile, error: profileError } = await supabase
                  .from('user_profiles')
                  .select('id')
                  .eq('id', data.user.id)
                  .single();
                
                if (profile && !profileError) {
                  profileExists = true;
                  console.log('✅ Profile verified for user:', data.user.id);
                } else if (!profileError?.code?.includes('PGRST116')) {
                  console.log('Profile check error:', profileError);
                }
              } catch (profileCheckError) {
                console.log('Error checking profile:', profileCheckError);
              }
              
              profileCheckAttempts++;
            }
            
            if (!profileExists) {
              console.log('⚠️ Profile not found after registration, user will need to complete setup on login');
            }
            
            break;
          }

          // Handle specific errors that shouldn't be retried
          if (error && (error.message.includes('User already registered') || 
              error.message.includes('already exists') ||
              error.message.includes('email rate limit exceeded'))) {
            break;
          }

          // For foreign key constraints and similar issues, retry
          if ((error && (error.message.includes('constraint') || 
              error.message.includes('foreign key'))) ||
              retryCount < maxRetries) {
            retryCount++;
            console.log(`⚠️ Registration attempt ${retryCount} failed, retrying...`, error?.message);
            // eslint-disable-next-line no-loop-func
            await new Promise(resolve => setTimeout(resolve, 500 * retryCount)); // Progressive delay
            continue;
          }

          break;
        } catch (err: any) {
          registrationError = err;
          retryCount++;
          if (retryCount > maxRetries) break;
          console.log(`⚠️ Registration attempt ${retryCount} failed with exception, retrying...`, err.message);
          // eslint-disable-next-line no-loop-func
          await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
        }
      }

      if (registrationError) {
        // Handle specific Supabase auth errors
        if (registrationError.message.includes('User already registered') || 
            registrationError.message.includes('already exists')) {
          return {
            success: false,
            error: 'An account with this email already exists. Please try logging in instead.',
          };
        }
        if (registrationError.message.includes('email rate limit')) {
          return {
            success: false,
            error: 'Too many registration attempts. Please wait a few minutes and try again.',
          };
        }
        throw registrationError;
      }

      if (registrationData?.user) {
        // Check if email confirmation is required
        if (!registrationData.session) {
          // Store pending user info for when they confirm email
          sessionStorage.setItem('pendingUserRegistration', 'true');
          sessionStorage.setItem('pendingUserName', name);
          
          return {
            success: true,
            needsEmailConfirmation: true,
            error: 'Please check your email and click the confirmation link. You will be redirected to your dashboard automatically.',
          };
        }

        // User is immediately logged in (email confirmation disabled)
        const user: AuthUser = {
          id: registrationData.user.id,
          email: registrationData.user.email!,
          name: name,
          full_name: name,
        };

        // Save credentials immediately for direct login
        this.saveUserCredentials(user, registrationData.session!.access_token);

        return {
          success: true,
          user,
          token: registrationData.session!.access_token,
        };
      }

      return {
        success: false,
        error: 'Registration failed - no user data received',
      };
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle duplicate key constraint error specifically
      if (error.message?.includes('duplicate key value') || 
          error.message?.includes('profiles_email_key') ||
          error.code === '23505') {
        return {
          success: false,
          error: 'An account with this email already exists. Please try logging in instead.',
        };
      }
      
      return {
        success: false,
        error: error.message || 'Registration failed',
      };
    }
  }

  // Logout with Supabase - ONLY clears local session, preserves database data
  async logout(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔓 Logging out user - clearing session only, preserving database data');
      
      // Only sign out from Supabase auth (clears session)
      // This does NOT delete any user data from database tables
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Supabase logout error:', error);
        // Even if Supabase logout fails, we should clear local data
      }

      // Clear ONLY local storage and session - database remains untouched
      this.clearLocalStorageOnly();
      
      console.log('✅ Logout successful - user data preserved in database');
      return { success: true };
    } catch (error: any) {
      console.error('Logout error:', error);
      // Clear local storage even if logout fails - database remains safe
      this.clearLocalStorageOnly();
      return { 
        success: true, // Return success even if API fails, since we cleared local data
        error: error.message 
      };
    }
  }

  // Clear ONLY local storage and session data - PRESERVES all database data
  private clearLocalStorageOnly(): void {
    console.log('🧹 Clearing local storage only - database data remains intact');
    
    // Clear only client-side cached data
    const keysToRemove = [
      'token',
      'userData',
      'currentUser',
      'userProfile',
      'transactions',        // Only cached transactions, not database
      'customCategories',    // Only cached categories, not database
      'reminders',          // Only cached reminders, not database
      'monthlyBudget',      // Only cached budget, not database
      'cartItems',
      'paidRemindersHistory',
      'profileData',
      'sb-hyakzfaxrfsistgwlzln-auth-token', // Supabase auth token only
    ];

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🗑️ Removed local cache: ${key}`);
    });

    // Clear session storage (temporary data only)
    sessionStorage.clear();
    console.log('🗑️ Cleared session storage');
    
    console.log('✅ Local cleanup complete - all database data preserved');
  }

  // Keep old method for compatibility but rename it
  private clearLocalStorage(): void {
    this.clearLocalStorageOnly();
  }

  // Get current user session
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Get user profile from our custom table
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        return {
          id: user.id,
          email: user.email!,
          name: profile?.full_name || profile?.name || user.user_metadata?.name,
          full_name: profile?.full_name || profile?.name || user.user_metadata?.full_name,
        };
      }

      // Fallback for mock mode
      const userData = localStorage.getItem('userData');
      if (userData) {
        return JSON.parse(userData);
      }
      
      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      
      // Fallback for mock mode on error
      const userData = localStorage.getItem('userData');
      if (userData) {
        return JSON.parse(userData);
      }
      
      return null;
    }
  }

  // Check if user is logged in
  async isLoggedIn(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) return true;
      
      // Fallback for mock mode
      const token = localStorage.getItem('token');
      const isAuthenticated = localStorage.getItem('isAuthenticated');
      return !!(token && isAuthenticated === 'true');
    } catch (error) {
      console.error('Session check error:', error);
      
      // Fallback for mock mode on error
      const token = localStorage.getItem('token');
      const isAuthenticated = localStorage.getItem('isAuthenticated');
      return !!(token && isAuthenticated === 'true');
    }
  }

  // Check if user needs email confirmation
  async checkEmailConfirmationStatus(): Promise<{ needsConfirmation: boolean; message?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { needsConfirmation: false };
      }

      if (!user.email_confirmed_at) {
        return { 
          needsConfirmation: true, 
          message: 'Please check your email and click the confirmation link to complete your registration.' 
        };
      }

      return { needsConfirmation: false };
    } catch (error) {
      console.error('Error checking email confirmation:', error);
      return { needsConfirmation: false };
    }
  }

  // Resend confirmation email
  async resendConfirmation(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/#/dashboard`
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to resend confirmation email' };
    }
  }

  // Check for auto-login from email confirmation
  async checkForEmailConfirmation(): Promise<boolean> {
    try {
      // Check if we're coming from an email confirmation link
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user && session.user.email_confirmed_at) {
        // User just confirmed email, handle the login
        await this.handleAuthenticatedUser(session.user);
        
        // Clear any pending registration flags
        sessionStorage.removeItem('pendingUserRegistration');
        sessionStorage.removeItem('pendingUserName');
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking email confirmation:', error);
      return false;
    }
  }

  // Listen to auth state changes
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      if (session?.user) {
        const user = await this.getCurrentUser();
        callback(user);
      } else {
        callback(null);
      }
    });
  }
}

export const authService = new AuthService();
export default authService;