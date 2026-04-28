
  // Import and configure the Supabase client

  // Supabase credentials
      const SUPABASE_URL = "https://kexgliyjjyurshanpxdt.supabase.co";
      const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtleGdsaXlqanl1cnNoYW5weGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NDk4NjYsImV4cCI6MjA3MzUyNTg2Nn0.ltYJ7VODuilex_gbp3dqhwyAsEmPVbhWnExzTppVmR8";

      const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      
      // Make Supabase client globally available
      window.supabaseClient = supabaseClient;

      // Popup notification for status messages
      function showStatusPopup(message, type = 'info') {
        let popup = document.getElementById('statusPopup');
        if (!popup) {
          popup = document.createElement('div');
          popup.id = 'statusPopup';
          document.body.appendChild(popup);
        }
        popup.textContent = message;
        popup.className = 'status-popup ' + (type === 'error' ? 'status-error' : 'status-success');
        popup.style.display = 'block';
        setTimeout(() => {
          popup.style.display = 'none';
        }, 2500);
      }

      //  Email/Password Sign In
      async function signInWithEmail() {
        const email = document.getElementById("signInEmail").value;
        const password = document.getElementById("signInPassword").value;

        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email,
          password 
        });

        if (error) {
          showStatusPopup(error.message, 'error');
        } else {
          showStatusPopup("Signed in successfully!", 'success');
          console.log(data);
          try {
            localStorage.removeItem('client_modal_state');
            localStorage.removeItem('landlord_modal_state');
            localStorage.removeItem('client_active_tab');
            localStorage.removeItem('landlord_active_tab');
          } catch (_) {}
          // Decide destination based on role in user metadata
          const user = data?.user || (await supabaseClient.auth.getUser()).data?.user;
          const role = user?.user_metadata?.role;
          const destination = role === 'landlord' ? 'landlord.html' : 'client.html';
          setTimeout(() => {
            window.location.href = destination;
          }, 800);
        }
      }

      // Email/Password Sign Up
      async function signUpWithEmail() {
        const email = document.getElementById("signUpEmail").value;
        const password = document.getElementById("signUpPassword").value;
        const name = document.getElementById("signUpName").value;
        const role = (document.getElementById("userType") && document.getElementById("userType").value) || "rentor";

        const { data, error } = await supabaseClient.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              role: role
            },
            emailRedirectTo: `${window.location.origin}/login.html`
          }
        });

        if (error) {
          showStatusPopup(error.message, 'error');
        } else {
          showStatusPopup("Sign-up successful! Check your email for verification. After confirming, you can sign in with your registered email.", 'success');
          console.log(data);
          // Persist name/role locally for convenience
          localStorage.setItem('lastUserName', name);
          localStorage.setItem('lastUserRole', role);
          // Store email and password for auto-fill
          const registeredEmail = document.getElementById("signUpEmail").value;
          const registeredPassword = document.getElementById("signUpPassword").value;
          
          // Clear the signup form
          document.getElementById("signUpName").value = "";
          document.getElementById("signUpEmail").value = "";
          document.getElementById("signUpPassword").value = "";
          
          // Switch to sign-in form after 3 seconds and auto-fill credentials
          setTimeout(() => {
            document.getElementById('signInBody').style.display = 'flex';
            document.getElementById('signUpBody').style.display = 'none';
            // Auto-fill the sign-in form with registered credentials
            document.getElementById("signInEmail").value = registeredEmail;
            document.getElementById("signInPassword").value = registeredPassword;
            // Trigger the button state update
            const signInBtn = document.getElementById("signInbtn");
            if (signInBtn) {
              signInBtn.classList.add("active");
            }
          }, 3000);
        }
      }
      // window.signUpWithEmail = signUpWithEmail;

      // Google Sign In
      async function signInWithGoogle() {
        try {
          // Check if running on HTTP (not secure for OAuth)
          if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            showStatusPopup('Google sign-in requires HTTPS. Please use a secure connection.', 'error');
            return;
          }

          // Get the current origin for redirect
          const redirectTo = `${window.location.origin}/login.html`;
          
          const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: redirectTo,
              queryParams: {
                access_type: 'offline',
                prompt: 'consent',
              }
            }
          });

          if (error) {
            console.error('Google OAuth error:', error);
            // Provide more helpful error messages
            if (error.message.includes('deleted_client') || error.message.includes('401') || error.message.includes('deleted')) {
              showStatusPopup('Google OAuth client is not configured or was deleted. Please configure Google OAuth in Supabase dashboard. See GOOGLE_OAUTH_SETUP.md for instructions.', 'error');
            } else if (error.message.includes('redirect_uri_mismatch')) {
              showStatusPopup('OAuth redirect URI mismatch. Please check Google Cloud Console configuration.', 'error');
            } else if (error.message.includes('popup_blocked')) {
              showStatusPopup('Popup was blocked. Please allow popups for this site and try again.', 'error');
            } else if (error.message.includes('invalid_client')) {
              showStatusPopup('Invalid OAuth client. Please check Google OAuth configuration in Supabase.', 'error');
            } else if (error.message.includes('not be secure') || error.message.includes('browser') || error.message.includes('app may not')) {
              showStatusPopup('OAuth consent screen issue: App may be in Testing mode. Add your email as a test user in Google Cloud Console, or publish the app. See GOOGLE_OAUTH_SETUP.md for details.', 'error');
            } else {
              showStatusPopup(error.message || 'Failed to sign in with Google. Please try again.', 'error');
            }
          }
          // If successful, user will be redirected automatically
        } catch (err) {
          console.error('Google sign-in exception:', err);
          // Check for deleted_client error in exception
          if (err.message && (err.message.includes('deleted_client') || err.message.includes('401'))) {
            showStatusPopup('Google OAuth client is not configured. Please set up Google OAuth in Supabase dashboard.', 'error');
          } else {
            showStatusPopup('An unexpected error occurred. Please try again.', 'error');
          }
        }
      }


      // Handle Redirect After Google Login and Auto-fill email from logout
      window.addEventListener('DOMContentLoaded', async () => {
        // Check for URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const isPasswordReset = urlParams.get('reset') === 'true';
        
        if (isPasswordReset) {
          // Check if user has a valid session for password reset
          const { data: { session }, error } = await supabaseClient.auth.getSession();
          
          if (!session) {
            // If no valid session, show error and remove parameter
            showStatusPopup('Invalid or expired reset link. Please request a new password reset.', 'error');
            const url = new URL(window.location);
            url.searchParams.delete('reset');
            window.history.replaceState({}, '', url);
            return;
          }
          
          // Show reset password modal
          showResetPasswordModal();
          return;
        }


        const { data: { session }, error } = await supabaseClient.auth.getSession();
        if (session) {
          // If logged in, ensure we have name and role; if missing, collect them
          const user = session.user;
          const meta = user?.user_metadata || {};
          const currentName = meta.full_name || meta.name || '';
          const currentRole = meta.role || '';
          if (!currentName || !currentRole) {
            showGoogleProfileCompletion(currentName, currentRole);
            return;
          }
          const destination = currentRole === 'landlord' ? 'landlord.html' : 'client.html';
          window.location.replace(destination);
        } else {
          // Auto-fill email from last logout if available
          const lastUserEmail = localStorage.getItem('lastUserEmail');
          if (lastUserEmail) {
            document.getElementById("signInEmail").value = lastUserEmail;
            // Trigger button state update
            const signInBtn = document.getElementById("signInbtn");
            if (signInBtn && document.getElementById("signInPassword").value.trim()) {
              signInBtn.classList.add("active");
            }
          }
          // Prefill signup name and role if available
          const lastUserName = localStorage.getItem('lastUserName');
          const lastUserRole = localStorage.getItem('lastUserRole');
          const nameInput = document.getElementById('signUpName');
          const roleSelect = document.getElementById('userType');
          if (nameInput && lastUserName) nameInput.value = lastUserName;
          if (roleSelect && lastUserRole) roleSelect.value = lastUserRole;
        }
      });

      // Prompt Google users to complete profile (name + role) if missing
      async function showGoogleProfileCompletion(prefillName = '', prefillRole = '') {
        let modal = document.getElementById('googleProfileModal');
        if (!modal) {
          modal = document.createElement('div');
          modal.id = 'googleProfileModal';
          modal.innerHTML = `
            <div style="position:fixed;inset:0;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;z-index:9999;">
              <div style="background:#fff;padding:1.5rem 1.8rem;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,0.18);min-width:320px;">
                <h3 style="margin:0 0 0.75rem 0;">Complete your profile</h3>
                <p style="margin:0 0 1rem 0;font-size:0.95rem;color:#444;">Please enter your name and select your role to continue.</p>
                <label style="font-weight:600;font-size:0.9rem;display:block;margin-bottom:0.25rem;">Name</label>
                <input id="gp_name" type="text" placeholder="Your name" style="width:100%;padding:0.55rem 0.7rem;border:1px solid #ccc;border-radius:8px;margin-bottom:0.8rem;" />
                <label style="font-weight:600;font-size:0.9rem;display:block;margin-bottom:0.25rem;">Role</label>
                <select id="gp_role" style="width:100%;padding:0.55rem 0.7rem;border:1px solid #ccc;border-radius:8px;margin-bottom:1rem;">
                  <option value="">-- Choose your role --</option>
                  <option value="landlord">Landlord</option>
                  <option value="rentor">Rentor</option>
                </select>
                <div style="display:flex;justify-content:flex-end;gap:0.5rem;">
                  <button id="gp_save" style="background:#00c2ff;border:none;color:#fff;font-weight:700;padding:0.5rem 1rem;border-radius:8px;cursor:pointer;">Continue</button>
                </div>
              </div>
            </div>
          `;
          document.body.appendChild(modal);
        }
        // set defaults
        const nameInput = modal.querySelector('#gp_name');
        const roleSelect = modal.querySelector('#gp_role');
        if (prefillName) nameInput.value = prefillName;
        if (prefillRole) roleSelect.value = prefillRole;
        modal.style.display = 'flex';

        modal.querySelector('#gp_save').onclick = async () => {
          const name = nameInput.value.trim();
          const role = roleSelect.value;
          if (!name) { showStatusPopup('Please enter your name.', 'error'); return; }
          if (!role) { showStatusPopup('Please select your role.', 'error'); return; }
          try {
            const { error } = await supabaseClient.auth.updateUser({ data: { full_name: name, role } });
            if (error) { showStatusPopup(error.message, 'error'); return; }
            // Persist latest profile locally for convenience
            localStorage.setItem('lastUserName', name);
            localStorage.setItem('lastUserRole', role);
            modal.style.display = 'none';
            const destination = role === 'landlord' ? 'landlord.html' : 'client.html';
            window.location.replace(destination);
          } catch (e) {
            showStatusPopup(e.message || 'Update failed', 'error');
          }
        };
      }

      // Listen for Auth Changes
      supabaseClient.auth.onAuthStateChange((event, session) => {
        console.log("Auth event:", event);
        console.log("Session:", session);
      });

// Continue button will change color if input has text inside


document.addEventListener("DOMContentLoaded", () => {
  const signInEmail = document.getElementById("signInEmail");
  const signInPass  = document.getElementById("signInPassword");
  const signInBtn   = document.getElementById("signInbtn");
  const signUpName  = document.getElementById("signUpName")
  const signUpEmail = document.getElementById("signUpEmail");
  const signUpPass  = document.getElementById("signUpPassword");
  const signUpBtn   = document.getElementById("signUpbtn");
  const signUpLink  = document.getElementById("signupbtn");
  const signInLink  = document.getElementById("signinbtn");
  const signInBodyEl = document.getElementById("signInBody");
  const signUpBodyEl = document.getElementById("signUpBody");

  function toggleSignIn() {
    const active = signInEmail.value.trim() && signInPass.value.trim();
    signInBtn.classList.toggle("active", !!active);
  }

  function toggleSignUp() {
    const active = signUpName.value.trim() && signUpEmail.value.trim() && signUpPass.value.trim();
    signUpBtn.classList.toggle("active", !!active);
  }

  signInEmail.addEventListener("input", toggleSignIn);
  signInPass.addEventListener("input", toggleSignIn);

  signUpName.addEventListener("input", toggleSignUp)
  signUpEmail.addEventListener("input", toggleSignUp);
  signUpPass.addEventListener("input", toggleSignUp);

  // Run once on load
  toggleSignIn();
  toggleSignUp();

  // Add button state management for reset password modal
  const newPasswordInput = document.getElementById('newPassword');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const resetPasswordBtn = document.querySelector('#resetPasswordModal .btn-primary');

  if (newPasswordInput && confirmPasswordInput && resetPasswordBtn) {
    function toggleResetPassword() {
      const hasNewPassword = newPasswordInput.value.trim().length >= 6;
      const hasConfirmPassword = confirmPasswordInput.value.trim().length >= 6;
      const passwordsMatch = newPasswordInput.value === confirmPasswordInput.value;
      
      resetPasswordBtn.classList.toggle("active", hasNewPassword && hasConfirmPassword && passwordsMatch);
    }

    newPasswordInput.addEventListener("input", toggleResetPassword);
    confirmPasswordInput.addEventListener("input", toggleResetPassword);
    
    // Run once on load
    toggleResetPassword();
  }

  // Toggle between Sign In and Sign Up sections
  if (signUpLink && signInBodyEl && signUpBodyEl) {
    signUpLink.addEventListener("click", () => {
      signInBodyEl.style.display = "none";
      signUpBodyEl.style.display = "flex";
    });
  }

  if (signInLink && signInBodyEl && signUpBodyEl) {
    signInLink.addEventListener("click", () => {
      signInBodyEl.style.display = "flex";
      signUpBodyEl.style.display = "none";
    });
  }
});

// dropdown

const userType = document.getElementById("userType");

userType.addEventListener("change", () => {
  if (userType.value === "landlord") {
    console.log("User selected Landlord");
  } else if (userType.value === "rentor") {
    console.log("User selected Rentor");
  }
});

// Forgot Password Functionality
let resetEmail = '';

// Show forgot password modal
function showForgotPasswordModal() {
  const modal = document.getElementById('forgotPasswordModal');
  modal.style.display = 'flex';
  document.getElementById('forgotEmail').value = '';
}

// Close forgot password modal
function closeForgotPasswordModal() {
  const modal = document.getElementById('forgotPasswordModal');
  modal.style.display = 'none';
}

// Close new password modal
function closeNewPasswordModal() {
  const modal = document.getElementById('newPasswordModal');
  modal.style.display = 'none';
}

// Close reset password modal
function closeResetPasswordModal() {
  const modal = document.getElementById('resetPasswordModal');
  modal.style.display = 'none';
  // Clear the URL parameter
  const url = new URL(window.location);
  url.searchParams.delete('reset');
  window.history.replaceState({}, '', url);
}

// Show reset password modal
function showResetPasswordModal() {
  const modal = document.getElementById('resetPasswordModal');
  document.getElementById('newPassword').value = '';
  document.getElementById('confirmPassword').value = '';
  modal.style.display = 'flex';
}

// Send reset link to email
async function sendResetLink() {
  const email = document.getElementById('forgotEmail').value.trim();
  
  if (!email) {
    showStatusPopup('Please enter your email address.', 'error');
    return;
  }

  if (!isValidEmail(email)) {
    showStatusPopup('Please enter a valid email address.', 'error');
    return;
  }

  try {
    // Disable button to prevent multiple requests
    const sendBtn = document.querySelector('#forgotPasswordModal .btn-primary');
    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending...';

    const { data, error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login.html?reset=true`
    });

    if (error) {
      showStatusPopup(error.message, 'error');
    } else {
      showStatusPopup('Password reset link sent to your email! Check your inbox and click the link to reset your password.', 'success');
      
      // Close modal after showing success message
      setTimeout(() => {
        closeForgotPasswordModal();
      }, 2000);
    }
  } catch (err) {
    showStatusPopup('Failed to send reset link. Please try again.', 'error');
  } finally {
    // Re-enable button
    const sendBtn = document.querySelector('#forgotPasswordModal .btn-primary');
    sendBtn.disabled = false;
    sendBtn.textContent = 'Send Reset Link';
  }
}

// Reset password from the modal
async function resetPasswordFromModal() {
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  
  if (!newPassword || !confirmPassword) {
    showStatusPopup('Please fill in all password fields.', 'error');
    return;
  }

  if (newPassword.length < 6) {
    showStatusPopup('Password must be at least 6 characters long.', 'error');
    return;
  }

  if (newPassword !== confirmPassword) {
    showStatusPopup('Passwords do not match.', 'error');
    return;
  }

  try {
    // Disable button to prevent multiple requests
    const resetBtn = document.querySelector('#resetPasswordModal .btn-primary');
    resetBtn.disabled = true;
    resetBtn.textContent = 'Resetting...';

    const { data, error } = await supabaseClient.auth.updateUser({
      password: newPassword
    });

    if (error) {
      showStatusPopup(error.message, 'error');
    } else {
      showStatusPopup('Password reset successfully! You can now sign in with your new password.', 'success');
      
      // Close modal and clear URL parameter
      closeResetPasswordModal();
      
      // Switch to sign-in form
      setTimeout(() => {
        document.getElementById('signInBody').style.display = 'flex';
        document.getElementById('signUpBody').style.display = 'none';
      }, 2000);
    }
  } catch (err) {
    showStatusPopup('Failed to reset password. Please try again.', 'error');
  } finally {
    // Re-enable button
    const resetBtn = document.querySelector('#resetPasswordModal .btn-primary');
    resetBtn.disabled = false;
    resetBtn.textContent = 'Reset Password';
  }
}

// Email validation helper
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Close modals when clicking outside
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    e.target.style.display = 'none';
  }
});

// Close modals with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
      if (modal.style.display === 'flex') {
        modal.style.display = 'none';
      }
    });
  }
});


