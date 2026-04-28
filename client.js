// Reviews sort dropdown behavior
document.addEventListener('DOMContentLoaded', function(){
  // Ensure requirement uploads accept images only on client side
  (function(){
    var ids = ['proofOfIncome','validId','barangayClearance','policeClearance','birth-certificate-upload','brgy-clearance-upload','valid-id-upload','lease-agreement-upload'];
    ids.forEach(function(id){
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('change', function(){
        var f = this.files && this.files[0];
        if (!f) return;
        if (!f.type || !f.type.startsWith('image/')) {
          alert('Please upload an image file (JPEG/PNG).');
          this.value = '';
        }
      });
    });
  })();
  const dd = document.getElementById('reviewsSort');
  if (!dd) return;
  const btn = dd.querySelector('.sd-btn');
  const label = dd.querySelector('.sd-label');
  const menu = dd.querySelector('.sd-menu');
  function closeAll(){ dd.classList.remove('open'); if (btn) btn.setAttribute('aria-expanded','false'); }
  if (btn) btn.addEventListener('click', function(e){
    e.stopPropagation();
    const isOpen = dd.classList.contains('open');
    if (isOpen) { closeAll(); } else { dd.classList.add('open'); btn.setAttribute('aria-expanded','true'); }
  });
  if (menu) menu.addEventListener('click', function(e){
    const item = e.target.closest('li[role="option"][data-sort-value]');
    if (!item) return;
    const val = item.getAttribute('data-sort-value');
    // update selected state
    menu.querySelectorAll('li').forEach(li => li.classList.remove('selected'));
    item.classList.add('selected');
    // update label text
    if (label) label.textContent = item.textContent.trim();
    // emit event so sorting logic can respond
    document.dispatchEvent(new CustomEvent('reviews-sort-change', { detail: { sort: val }}));
    closeAll();
  });
  document.addEventListener('click', function(){ closeAll(); });
});

document.addEventListener('DOMContentLoaded', function () {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const minDate = `${yyyy}-${mm}-${dd}`;
  document.querySelectorAll('input[name="moveInDate"]').forEach((input) => {
    input.min = minDate;
  });
});

function showFAQ() {
  const frequentquestion = document.querySelector('.frequentquestion')
  console.log("FAQ clicked:");
  frequentquestion.style.display = 'flex'
}
function closeFAQ() {
  const frequentquestion = document.querySelector('.frequentquestion')
  frequentquestion.style.display = 'none'
}
function openUserAcc() {
  const toggle = document.querySelector('.useracc')
  toggle.style.display = 'flex'
}
function closeUserAcc() {
  const toggle = document.querySelector('.useracc')
  toggle.style.display = 'none'
}
function openLogOut() {
  const toggle = document.querySelector('.outlog')
  toggle.style.display = 'flex'
}
function closeLogOut() {
  // event.stopPropagation();
  const toggle = document.querySelector('.outlog')
  toggle.style.display = 'none'
}

function toggleMessageBox(button) {
  const contactCard = button.closest('.contact-card');
  const toOwner = contactCard.querySelector('.to-owner');
  const messageBox = contactCard.querySelector('.message-box');
  
  if (toOwner && messageBox) {
    const isVisible = toOwner.style.display !== 'none';
    toOwner.style.display = isVisible ? 'none' : 'block';
    messageBox.style.display = isVisible ? 'none' : 'block';
    
    // Update button text
    button.textContent = isVisible ? 'Send Message' : 'Hide Message';
  }
}

function showAns(el) {
  const answer = el.nextElementSibling;
  if (answer.style.display === "flex") {
    answer.style.display = "none";
  } else {
    answer.style.display = "flex";
  }
}
const clientOuters = document.querySelectorAll('.outer');
clientOuters.forEach(card => {
  card.addEventListener('click', () => {
    // Find the parent sidelp (Dashboard, Saved, etc.)
    const parentPage = card.closest('.sidelp');
    if (!parentPage) return;

    // Hide everything except .selectedrightside
    parentPage.querySelectorAll(':scope > div:not(.selectedrightside)')
      .forEach(el => el.style.display = 'none');

    // Show the selectedrightside of that page
    const detailPage = parentPage.querySelector('.selectedrightside');
    if (detailPage) {
      detailPage.style.display = 'flex';
    }

    // Store the current parent page for goBack
    parentPage.setAttribute("data-detail-open", "true");
  });
});

// Helper: render photos (single or carousel) into a container
function renderClientPhotos(containerEl, ad) {
  if (!containerEl || !ad) return;
  
  // Debug logging
  console.log('renderClientPhotos called with ad:', {
    id: ad.id,
    primaryImageDataUrls: ad.primaryImageDataUrls?.length || 0,
    imagesUrls: ad.imagesUrls?.length || 0,
    primaryImageDataUrl: ad.primaryImageDataUrl ? 'Yes' : 'No'
  });
  
  // Check multiple possible image sources
  let urls = [];
  if (Array.isArray(ad.primaryImageDataUrls) && ad.primaryImageDataUrls.length) {
    urls = ad.primaryImageDataUrls.filter(Boolean);
    console.log('Using primaryImageDataUrls:', urls.length, 'photos');
  } else if (Array.isArray(ad.imagesUrls) && ad.imagesUrls.length) {
    urls = ad.imagesUrls.filter(Boolean);
    console.log('Using imagesUrls fallback:', urls.length, 'photos');
  } else if (ad.primaryImageDataUrl) {
    urls = [ad.primaryImageDataUrl];
    console.log('Using single primaryImageDataUrl');
  }
  
  // Safety check - limit to maximum 6 photos to prevent floor plan inclusion
  if (urls.length > 6) {
    console.warn(`Too many photos in carousel (${urls.length}), limiting to 6`);
    urls = urls.slice(0, 6);
  }
  
  if (!urls.length) { 
    containerEl.innerHTML = '<img src="final logo.PNG" alt="photos" style="width:100%;height:100%;object-fit:cover;border-radius:12px"/>'; 
    return; 
  }
  if (urls.length === 1) {
    containerEl.innerHTML = `<img src="${urls[0]}" style="width:100%;height:100%;object-fit:cover;border-radius:12px"/>`;
    return;
  }
  containerEl.innerHTML = `
    <div class="photo-carousel" style="position:relative;width:100%;height:100%;display:flex;justify-content:center;align-items:center;">
      <button type="button" class="pc-prev" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);z-index:2;background:rgba(0,0,0,0.4);color:#fff;border:none;border-radius:50%;width:32px;height:32px;cursor:pointer">‹</button>
      <img class="pc-image" src="${urls[0]}" style="width:auto;height:100%;object-fit:cover;border-radius:12px;border:none;"/>
      <button type="button" class="pc-next" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);z-index:2;background:rgba(0,0,0,0.4);color:#fff;border:none;border-radius:50%;width:32px;height:32px;cursor:pointer">›</button>
      <div class="pc-dots" style="position:absolute;left:0;right:0;bottom:8px;display:flex;gap:6px;justify-content:center;z-index:2"></div>
      <div class="pc-counter" style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,0.6);color:#fff;padding:4px 8px;border-radius:12px;font-size:12px;z-index:2">1/${urls.length}</div>
    </div>`;
  const imgEl = containerEl.querySelector('.pc-image');
  const prevBtn = containerEl.querySelector('.pc-prev');
  const nextBtn = containerEl.querySelector('.pc-next');
  const dotsEl = containerEl.querySelector('.pc-dots');
  const counterEl = containerEl.querySelector('.pc-counter');
  let idx = 0;
  dotsEl.innerHTML = urls.map((_, i) => `<span data-idx="${i}" style="width:8px;height:8px;border-radius:50%;background:${i===0?'#fff':'rgba(255,255,255,0.6)'};display:inline-block;cursor:pointer"></span>`).join('');
  function update(n) {
    if (n < 0) n = urls.length - 1;
    if (n >= urls.length) n = 0;
    idx = n;
    imgEl.src = urls[idx];
    counterEl.textContent = `${idx + 1}/${urls.length}`;
    dotsEl.querySelectorAll('span').forEach((d, i) => {
      d.style.background = i === idx ? '#fff' : 'rgba(255,255,255,0.6)';
    });
  }
  prevBtn.addEventListener('click', (ev) => { ev.stopPropagation(); update(idx - 1); });
  nextBtn.addEventListener('click', (ev) => { ev.stopPropagation(); update(idx + 1); });
  dotsEl.addEventListener('click', (ev) => {
    const dot = ev.target.closest('span[data-idx]');
    if (!dot) return;
    ev.stopPropagation();
    update(parseInt(dot.getAttribute('data-idx'), 10));
  });

}

// Works for all containers: .mainright, .savedright, .rentedright
// Safe whether you call goBack() or goBack(this)
function goBack(triggerEl) {
  let parentPage = null;
  let selectedRight = null;

  // 1) If the inline HTML passes `this`, use it to locate the correct page
  if (triggerEl && typeof triggerEl.closest === 'function') {
    parentPage = triggerEl.closest('.sidelp');
    if (parentPage) {
      selectedRight = parentPage.querySelector(
        '#selectedRightSide, .selectedRightSide, .selectedrightside'
      );
    }
  }

  // 2) Otherwise find the *visible* selectedRightSide anywhere (IDs are duplicated)
  if (!parentPage) {
    const candidates = document.querySelectorAll(
      '#selectedRightSide, .selectedRightSide, .selectedrightside'
    );
    selectedRight = Array.from(candidates).find((el) => {
      const cs = window.getComputedStyle(el);
      return cs.display !== 'none' && el.offsetParent !== null;
    }) || null;

    if (selectedRight) {
      parentPage = selectedRight.closest('.sidelp');
    }
  }

  // 3) Fallback: use the page that has data-detail-open="true"
  if (!parentPage) {
    parentPage = document.querySelector('.sidelp[data-detail-open="true"]') || null;
  }

  // 4) Last-resort fallback: if we *still* didn't find, bail out
  if (!parentPage) return;

  // Ensure we have the selectedRight for this page
  if (!selectedRight) {
    selectedRight = parentPage.querySelector(
      '#selectedRightSide, .selectedRightSide, .selectedrightside'
    );
  }

  // Hide the details panel(s)
  if (selectedRight) {
    selectedRight.style.display = 'none';
    const rentClicked = selectedRight.querySelector('#rentClicked, .rentclicked');
    if (rentClicked) rentClicked.style.display = 'none';
  }

  // Show the page's normal sections again (siblings of selectedRight)
  const isRentedPage = parentPage.id === 'Rented';
  const rentedEmptyStateEl = isRentedPage
    ? parentPage.querySelector('#noRentedListingsMessage')
    : null;

  parentPage.querySelectorAll(':scope > div').forEach((el) => {
    if (selectedRight && el === selectedRight) return; // keep details hidden

    // Special handling for client's rented empty state so it doesn't conflict
    if (isRentedPage && rentedEmptyStateEl && el === rentedEmptyStateEl) {
      const hasCards = !!parentPage.querySelector('.availistings .outer');
      el.style.display = hasCards ? 'none' : 'block';
      return;
    }

    el.style.removeProperty('display'); // restores layout (flex, etc.)
  });

  // Clear the page flag so the page is considered "not in details mode"
  parentPage.removeAttribute('data-detail-open');

  clearClientModalState();
  // Nice UX
  window.scrollTo({ top: 0, behavior: 'smooth' });
}



// const signinBtn = document.getElementById('signinbtn');
// if (signinBtn) {
//   signinBtn.addEventListener('click', function () {
//     document.getElementById('signInBody').style.display = 'flex';
//     document.getElementById('signUpBody').style.display = 'none';
//   });
// }

// const signupBtn = document.getElementById('signupbtn');
// if (signupBtn) {
//   signupBtn.addEventListener('click', function () {
//     document.getElementById('signUpBody').style.display = 'flex';
//     document.getElementById('signInBody').style.display = 'none';
//   });
// }

// Logout function for Supabase
async function logout() {
  try {
    showStatusOverlay('Logging out…', 'loading');
    // Ensure Supabase client is available
    if (window.supabase && !window.supabaseClient) {
      window.supabaseClient = supabase.createClient(
        "https://kexgliyjjyurshanpxdt.supabase.co",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtleGdsaXlqanl1cnNoYW5weGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NDk4NjYsImV4cCI6MjA3MzUyNTg2Nn0.ltYJ7VODuilex_gbp3dqhwyAsEmPVbhWnExzTppVmR8"
      );
    }

    if (window.supabaseClient) {
      // Get current session data BEFORE signing out
      const { data } = await window.supabaseClient.auth.getSession();
      const user = data?.session?.user;

      if (user) {
        // Save user info to localStorage for auto-fill
        const email = user.email || "";
        const name = user.user_metadata?.full_name || user.user_metadata?.name || "";
        const role = user.user_metadata?.role || "";

        if (email) localStorage.setItem("lastUserEmail", email);
        if (name) localStorage.setItem("lastUserName", name);
        if (role) localStorage.setItem("lastUserRole", role);
      }

      // Sign out from Supabase
      await window.supabaseClient.auth.signOut({ scope: 'global' });
    }
  } catch (e) {
    console.error("Logout error:", e);
    // Continue with redirect even if there's an error
  } finally {
    // Aggressively clear Supabase auth storage to prevent auto-redirect on login.html
    try {
      const clearAuthStorage = (storage) => {
        if (!storage) return;
        try {
          const keys = Object.keys(storage);
          keys.forEach((k) => {
            if (k && k.startsWith('sb-') && k.endsWith('-auth-token')) {
              storage.removeItem(k);
            }
          });
        } catch(_) {}
      };
      clearAuthStorage(window.localStorage);
      clearAuthStorage(window.sessionStorage);
    } catch(_) {}
    // Always redirect to login page
    window.location.href = "login.html";
  }
}

let statusOverlayTimer = null;

function showStatusOverlay(message, type = 'loading') {
  const overlay = document.getElementById('statusOverlay');
  if (!overlay) return;
  const msgEl = overlay.querySelector('.status-message');
  if (msgEl) msgEl.textContent = message || 'Loading…';
  overlay.classList.remove('success', 'error');
  if (type === 'success') overlay.classList.add('success');
  if (type === 'error') overlay.classList.add('error');
  overlay.classList.add('show');
  overlay.setAttribute('aria-hidden', 'false');
  if (statusOverlayTimer) {
    clearTimeout(statusOverlayTimer);
    statusOverlayTimer = null;
  }
}

function hideStatusOverlay(delay = 0) {
  const overlay = document.getElementById('statusOverlay');
  if (!overlay) return;
  const hide = () => {
    overlay.classList.remove('show', 'success', 'error');
    overlay.setAttribute('aria-hidden', 'true');
  };
  if (delay > 0) {
    statusOverlayTimer = setTimeout(hide, delay);
  } else {
    hide();
  }
}

// Show logout confirmation modal
function showLogoutPrompt() {
  let modal = document.getElementById('logoutModal');
  modal.style.display = 'flex';
  // Attach listeners
  document.getElementById('confirmLogoutBtn').onclick = function () {
    modal.style.display = 'none';
    showStatusOverlay('Logging out…', 'loading');
    logout();
  };
  document.getElementById('cancelLogoutBtn').onclick = function () {
    modal.style.display = 'none';
    window.location.href = 'main.html';
  };
}

// Show Change Email modal
function showChangeEmailModal() {
  let modal = document.getElementById('changeEmailModal');
  modal.style.display = 'flex';
  document.getElementById('changeEmailError').style.display = 'none';
  document.getElementById('newEmailInput').value = '';
  document.getElementById('submitChangeEmailBtn').onclick = async function () {
    const newEmail = document.getElementById('newEmailInput').value.trim();
    if (!newEmail) {
      const err = document.getElementById('changeEmailError');
      err.textContent = 'Please enter a valid email.';
      err.style.display = 'block';
      return;
    }
    try {
      const { error } = await window.supabaseClient.auth.updateUser({ email: newEmail });
      if (error) {
        const err = document.getElementById('changeEmailError');
        err.textContent = error.message;
        err.style.display = 'block';
        return;
      }
      modal.style.display = 'none';
      alert('A confirmation email has been sent to ' + newEmail + '. Please check your inbox and confirm the change.');
    } catch (e) {
      const err = document.getElementById('changeEmailError');
      err.textContent = e.message || 'An error occurred.';
      err.style.display = 'block';
    }
  };
  document.getElementById('cancelChangeEmailBtn').onclick = function () {
    modal.style.display = 'none';
  };
}

// Utility to set user name and email in all relevant places
function setUserNameAndEmail(name, email) {
  // Dashboard, Saved, Rented, etc. (all .regedacc and .regacc)
  document.querySelectorAll('.regedacc p').forEach(el => {
    el.textContent = name ? `Hello, ${name}!` : (email ? `Hello, ${email}!` : 'Hello, Client!');
  });
  // For the icon area in Dashboard
  var greetingSpan = document.querySelector('.regacc .user-greeting-name');
  if (greetingSpan) greetingSpan.textContent = name ? `Hello, ${name}!` : (email ? `Hello, ${email}!` : 'Hello, Client!');
  // User account modal
  const userAccName = document.querySelector('.useraccwbg > p:nth-child(3)');
  if (userAccName) userAccName.textContent = name ? `Hello, ${name}!` : (email ? `Hello, ${email}!` : 'Hello, Client!');
  const userAccMail = document.querySelector('.useraccwbg > p:nth-child(4)');
  if (userAccMail) userAccMail.textContent = email ? email : '@gmail';
}

// On page load, fetch session and set name/email
async function updateUserNameAndEmailFromSession() {
  const client = initSupabaseClient();
  if (!client) return;
  const { data } = await client.auth.getSession();
  const session = data?.session;
  let email = null;
  let name = null;
  if (session && session.user) {
    email = session.user.email;
    // Try to get name from user_metadata (Google provider)
    if (session.user.user_metadata) {
      name = session.user.user_metadata.full_name || session.user.user_metadata.name || null;
    }
  }
  setUserNameAndEmail(name, email);
}

// Change Email handler: sign out and redirect to login
function handleChangeEmail() {
  showChangeEmailModal();
}

// Enhance logout modal buttons for .outlog modal
function setupOutlogModalButtons() {
  const outlog = document.querySelector('.outlog');
  if (!outlog) return;
  const logoutBtn = outlog.querySelector('.logoutBtn button');
  const cancelBtn = outlog.querySelector('.logoutCancelBtn button');
  if (logoutBtn) {
    logoutBtn.onclick = function () {
      showStatusOverlay('Logging out…', 'loading');
      // Call the actual logout function
      logout();
    };
  }
  if (cancelBtn) {
    cancelBtn.onclick = function () {
      outlog.style.display = 'none';
      // Optionally, you can add logic to show the dashboard if needed
    };
  }
}

// Call setupOutlogModalButtons on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupOutlogModalButtons);
} else {
  setupOutlogModalButtons();
}


document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelectorAll('.sidemenu .page');
  const contentPages = document.querySelectorAll('.sidelp');

  const setActiveTab = (targetId) => {
    if (!targetId) return;
    navLinks.forEach(item => item.classList.remove('active'));
    const activeLink = document.querySelector(`.sidemenu .page[data-target="${targetId}"]`);
    if (activeLink) activeLink.classList.add('active');
    contentPages.forEach(page => page.classList.remove('actsidelp'));
    const targetPage = document.getElementById(targetId);
    if (targetPage) targetPage.classList.add('actsidelp');
  };

  const savedTab = localStorage.getItem('client_active_tab');
  if (savedTab) {
    setActiveTab(savedTab);
  } else {
    setActiveTab('Dashboard');
    localStorage.setItem('client_active_tab', 'Dashboard');
  }

  navLinks.forEach(link => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      if (link.textContent.trim() === "Logout") {
        openLogOut();
        return;
      }
      const targetId = link.getAttribute('data-target');
      setActiveTab(targetId);
      if (targetId) {
        localStorage.setItem('client_active_tab', targetId);
      }
    });
  });
});

function persistClientModalState(state) {
  try {
    if (!state || !state.type) {
      localStorage.removeItem('client_modal_state');
      return;
    }
    localStorage.setItem('client_modal_state', JSON.stringify(state));
  } catch (_) {}
}

function clearClientModalState() {
  try { localStorage.removeItem('client_modal_state'); } catch (_) {}
}

function restoreClientModalState(listings) {
  let state = null;
  try {
    state = JSON.parse(localStorage.getItem('client_modal_state') || 'null');
  } catch (_) { state = null; }
  if (!state || !state.type || !state.adId) return;

  const openCard = (selector) => {
    const card = document.querySelector(selector);
    if (card) card.click();
    return !!card;
  };

  if (state.type === 'dashboard-details' || state.type === 'rent-form') {
    if (openCard(`#clientListings .outer[data-ad-id="${state.adId}"]`)) {
      if (state.type === 'rent-form') {
        setTimeout(() => {
          const rentBtn = document.querySelector('#Dashboard .selectedrightside .rentbtn, #Dashboard #selectedRightSide .rentbtn');
          if (rentBtn) rentBtn.click();
        }, 150);
      }
    }
    return;
  }

  if (state.type === 'saved-details') {
    if (openCard(`#savedlistings .outer[data-ad-id="${state.adId}"]`)) return;
  }

  if (state.type === 'rented-details') {
    // Only reopen rented details if the corresponding card still exists.
    // If it doesn't, clear the state and make sure the rented details panel is hidden.
    if (openCard(`#Rented .availistings .outer[data-ad-id="${state.adId}"]`)) return;

    try {
      const rentedPage = document.getElementById('Rented');
      if (rentedPage) {
        rentedPage.removeAttribute('data-detail-open');
        const rentedSelected = rentedPage.querySelector(
          '#selectedRightSide, .selectedRightSide, .selectedrightside'
        );
        if (rentedSelected) {
          rentedSelected.style.display = 'none';
        }
      }
      if (typeof clearClientModalState === 'function') {
        clearClientModalState();
      }
    } catch (_) {}
    return;
  }

  if (state.type === 'payment-modal') {
    const fromListings = Array.isArray(listings) ? listings.find(x => String(x.id) === String(state.adId)) : null;
    const fromRented = window.currentRentedApartment && String(window.currentRentedApartment.id) === String(state.adId)
      ? window.currentRentedApartment
      : null;
    const ad = fromRented || fromListings || window.currentSelectedAd || null;
  }
}

// this display the user name and email in all relevant places
document.addEventListener('DOMContentLoaded', function () {
  if (window.updateUserNameAndEmailFromSession) {
    window.updateUserNameAndEmailFromSession();
  } else if (typeof updateUserNameAndEmailFromSession === 'function') {
    updateUserNameAndEmailFromSession();
  }
});


document.addEventListener('DOMContentLoaded', function () {
  var rentNowBtns = document.querySelectorAll('.rentNowBtn, #rentNowBtn');

  function handleRentNowClick(clickedEl) {
    var parentPage = clickedEl.closest('.sidelp');

    if (parentPage) {
      var selectedRightSide = parentPage.querySelector('.selectedrightside, #selectedRightSide, .selectedRightSide');
      var pageRentClicked = selectedRightSide ? selectedRightSide.querySelector('.rentclicked') : null;
      if (!pageRentClicked) {
        // Fallback: allow rent form to live anywhere inside the same page
        pageRentClicked = parentPage.querySelector('.rentclicked');
      }

      if (pageRentClicked) {
        // Do not allow Rent Now if all units are already rented
        if (window.currentSelectedAd) {
          const ad = window.currentSelectedAd;
          const totU = ad.totalUnits != null ? ad.totalUnits : (ad.total_units != null ? ad.total_units : 1);
          const occArr = Array.isArray(ad.occupiedUnitNumbers) ? ad.occupiedUnitNumbers : [];
          const occSet = new Set(occArr.map(n => Number(n)).filter(n => !isNaN(n)));
          const availableUnits = Math.max(0, totU - occSet.size);
          if (availableUnits <= 0) {
            // Just show a notice and skip opening the rent form
            alert('All apartment units are already rented for this listing.');
            return;
          }
          // Populate rent details from the currently selected ad
          populateRentDetails(pageRentClicked, ad);
        }
        if (selectedRightSide) {
          selectedRightSide.querySelectorAll(':scope > div').forEach(function (el) {
            el.style.display = 'none';
          });
          // Ensure the container is visible if it was hidden
          selectedRightSide.style.display = 'flex';
        }

        pageRentClicked.style.display = 'flex';
        if (window.currentSelectedAd && window.currentSelectedAd.id) {
          persistClientModalState({
            type: 'rent-form',
            adId: window.currentSelectedAd.id
          });
        }

        parentPage.setAttribute('data-detail-open', 'true');

        window.scrollTo({ top: 0, behavior: 'smooth' });
        // Populate reviews for this apartment inside the rent view (shows past clients' reviews only)
        try {
          if (window.currentSelectedAd && typeof renderApartmentReviews === 'function') {
            renderApartmentReviews(window.currentSelectedAd.id, pageRentClicked);
          }
        } catch(_) {}
        
        return;
      }
    }
  }
  rentNowBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      handleRentNowClick(btn);
    });
  });
  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('.rentNowBtn, #rentNowBtn');
    if (trigger) {
      handleRentNowClick(trigger);
    }
  });
}
);


document.addEventListener('click', function (e) {
  const btn = e.target.closest('.backBtn');
  if (!btn) return;

  // Back button must live inside the details panel
  const rentClicked = btn.closest('#rentClicked, .rentclicked');   // id OR class
  if (!rentClicked) return;

  // The container that owns this details panel
  let container = rentClicked.closest('#selectedRightSide, .selectedRightSide, .selectedrightside'); // id OR class
  if (!container) {
    // Fallback: find the selectedRightSide inside the same page
    const page = rentClicked.closest('.sidelp');
    if (page) container = page.querySelector('#selectedRightSide, .selectedRightSide, .selectedrightside');
  }
  if (!container) return;

  // Hide the detail view
  rentClicked.style.display = 'none';

  // Show siblings again
  Array.from(container.children).forEach(function (el) {
    if (el !== rentClicked) el.style.removeProperty('display');
  });

  // Clear the page flag
  const page = container.closest('.sidelp');
  if (page) page.removeAttribute('data-detail-open');

  clearClientModalState();
  // Optional: scroll to top for a smooth feel
  window.scrollTo({ top: 0, behavior: 'smooth' });
});







// ------- Initialize Supabase client globally -------
function initSupabaseClient() {
  if (window.supabaseClient) return window.supabaseClient;
  if (window.supabase && !window.supabaseClient) {
    window.supabaseClient = supabase.createClient(
      "https://kexgliyjjyurshanpxdt.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtleGdsaXlqanl1cnNoYW5weGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NDk4NjYsImV4cCI6MjA3MzUyNTg2Nn0.ltYJ7VODuilex_gbp3dqhwyAsEmPVbhWnExzTppVmR8"
    );
  }
  return window.supabaseClient || null;
}

// ------- Pull listings to client dashboard from storage/Supabase -------
function getStoredListings() {
  try {
    const raw = localStorage.getItem('apartrent_listings');
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

async function fetchListings() {
  // Prefer Supabase `apartment` with joined `images`; fallback to localStorage
  try {
    const client = initSupabaseClient();
    if (client) {
      // 1) Fetch apartments (include available + rented)
      const { data: apts, error: aErr } = await client
        .from('apartments')
        .select('id, price, location, description, unit_size, total_units, available_units, occupied_unit_numbers, amenities, contact, email, requirements, status, created_at, landlord_id, latitude, longitude')
        .order('created_at', { ascending: false })
        .limit(100);
      if (aErr) throw aErr;
      const list = Array.isArray(apts) ? apts : [];
      if (!list.length) return [];

      // 2) Fetch related data in parallel (profiles, ratings, images, payment methods)
      const landlordIds = [...new Set(list.map(apt => apt.landlord_id).filter(Boolean))];
      const apartmentIds = list.map(apt => apt.id);
      const ids = list.map(r => r.id);
      let landlordNamesMap = new Map();
      let ratingsMap = new Map();
      let paymentMethodsMap = new Map();

      // Helper to fetch apartment images in smaller batches to avoid very long `in.(...)` filters (Supabase 500)
      async function fetchApartmentImagesInBatches(apartmentIds, batchSize = 50) {
        let allData = [];
        let lastError = null;
        for (let i = 0; i < apartmentIds.length; i += batchSize) {
          const batch = apartmentIds.slice(i, i + batchSize);
          const { data, error } = await client
            .from('apartment_images')
            .select('apartment_id, image_url, is_primary, is_floorplan')
            .in('apartment_id', batch);
          if (error) {
            lastError = error;
            break;
          }
          if (data) {
            allData = allData.concat(data);
          }
        }
        return { data: allData, error: lastError };
      }

      const profilesPromise = landlordIds.length > 0
        ? client.from('profiles').select('id, full_name, email').in('id', landlordIds)
        : Promise.resolve({ data: [], error: null });
      const reviewsPromise = apartmentIds.length > 0
        ? client.from('reviews').select('apartment_id, rating').in('apartment_id', apartmentIds)
        : Promise.resolve({ data: [], error: null });
      const imagesPromise = ids.length > 0
        ? fetchApartmentImagesInBatches(ids)
        : Promise.resolve({ data: [], error: null });
      const paymentPromise = landlordIds.length > 0
        ? client.from('landlord_payment_methods').select('landlord_id, payment_method, account_name, account_number, qr_code_url').in('landlord_id', landlordIds)
        : Promise.resolve({ data: [], error: null });
      // Fetch "locked" units (approved/accepted online applications) so availability
      // in the client dashboard reflects real occupancy even if apartments.occupied_unit_numbers
      // wasn't updated yet.
      const appsPromise = apartmentIds.length > 0
        ? client
            .from('rental_applications')
            .select('apartment_id, status, unit_number, data')
            .in('apartment_id', apartmentIds)
            .in('status', ['approved', 'accepted'])
            .limit(1000)
        : Promise.resolve({ data: [], error: null });

      const [profilesRes, reviewsRes, imagesRes, paymentRes, appsRes] = await Promise.all([
        profilesPromise,
        reviewsPromise,
        imagesPromise,
        paymentPromise,
        appsPromise
      ]);

      if (!profilesRes.error && profilesRes.data) {
        profilesRes.data.forEach(profile => {
          const name = profile.full_name || profile.email?.split('@')[0] || 'Property Owner';
          landlordNamesMap.set(profile.id, name);
        });
      }

      if (!reviewsRes.error && reviewsRes.data) {
        reviewsRes.data.forEach(review => {
          const aptId = String(review.apartment_id);
          if (!ratingsMap.has(aptId)) ratingsMap.set(aptId, []);
          ratingsMap.get(aptId).push(review.rating);
        });
      }

      if (!paymentRes.error && paymentRes.data) {
        paymentRes.data.forEach(pm => {
          if (!paymentMethodsMap.has(pm.landlord_id)) {
            paymentMethodsMap.set(pm.landlord_id, []);
          }
          paymentMethodsMap.get(pm.landlord_id).push({
            method: pm.payment_method,
            accountName: pm.account_name,
            accountNumber: pm.account_number,
            qrCodeUrl: pm.qr_code_url
          });
        });
      }

      const byApt = new Map();
      if (imagesRes.error) throw imagesRes.error;
      (imagesRes.data || []).forEach(img => {
        const key = String(img.apartment_id);
        if (!byApt.has(key)) byApt.set(key, []);
        byApt.get(key).push(img);
      });

      // Build apartment_id -> Set(unit_number) for approved/accepted applications
      const lockedUnitsByApt = new Map();
      if (!appsRes?.error && Array.isArray(appsRes?.data)) {
        (appsRes.data || []).forEach(app => {
          const aptId = app?.apartment_id != null ? String(app.apartment_id) : '';
          if (!aptId) return;
          const unit = app?.unit_number != null
            ? Number(app.unit_number)
            : (app?.data && app.data.unit_number != null ? Number(app.data.unit_number) : null);
          if (unit == null || isNaN(unit) || unit < 1) return;
          if (!lockedUnitsByApt.has(aptId)) lockedUnitsByApt.set(aptId, new Set());
          lockedUnitsByApt.get(aptId).add(unit);
        });
      }

      // 4) Normalize
      return list.map(row => {
        const images = byApt.get(String(row.id)) || [];
        const primary = images.find(i => i.is_primary) || images[0] || null;
        const floor = images.find(i => {
          const isFloorplan = i.is_floorplan;
          return isFloorplan === true || isFloorplan === 'true' || isFloorplan === 1;
        }) || null;
        
        // Separate regular photos from floor plans
        // Handle cases where is_floorplan might be null, undefined, or string
        const regularPhotos = images.filter(img => {
          const isFloorplan = img.is_floorplan;
          // Only include if it's explicitly NOT a floor plan
          return isFloorplan !== true && isFloorplan !== 'true' && isFloorplan !== 1 && isFloorplan !== '1';
        });
        let photoUrls = regularPhotos.map(i => i.image_url || i.url).filter(Boolean);
        
        // Additional safety check - cap photo count to keep payload light
        if (photoUrls.length > 6) {
          photoUrls = photoUrls.slice(0, 6);
        }
        const reviewRatings = ratingsMap.get(String(row.id)) || [];
        const averageRating = reviewRatings.length > 0
          ? reviewRatings.reduce((sum, r) => sum + r, 0) / reviewRatings.length
          : 0;
        const reviewCount = reviewRatings.length;
        
        // Get landlord name and payment methods
        const landlordName = landlordNamesMap.get(row.landlord_id) || 'Property Owner';
        const landlordPaymentMethods = paymentMethodsMap.get(row.landlord_id) || [];
        
        return {
          id: String(row.id),
          price: row.price,
          location: row.location,
          description: row.description,
          unitSize: row.unit_size,
          totalUnits: row.total_units != null ? row.total_units : 1,
          availableUnits: row.available_units != null ? row.available_units : (String(row.status || 'available').toLowerCase() === 'rented' ? 0 : 1),
          occupiedUnitNumbers: (() => {
            const o = row.occupied_unit_numbers;
            let base = [];
            if (Array.isArray(o)) base = o;
            else if (o && typeof o === 'string') {
              try { base = JSON.parse(o); } catch (_) { base = []; }
            }
            const locked = lockedUnitsByApt.get(String(row.id));
            if (!locked || locked.size === 0) return base;
            const merged = new Set((base || []).map(n => Number(n)).filter(n => !isNaN(n) && n >= 1));
            locked.forEach(u => merged.add(u));
            return Array.from(merged).sort((a, b) => a - b);
          })(),
          amenities: row.amenities || '',
          contact: row.contact || '',
          email: row.email || '',
          messenger: row.messenger || '',
          requirements: (() => { try { return Array.isArray(row.requirements ? JSON.parse(row.requirements) : []) ? JSON.parse(row.requirements) : []; } catch(_) { return []; } })(),
          status: row.status,
          primaryImageDataUrl: primary ? (primary.image_url || primary.url) : '',
          primaryImageDataUrls: photoUrls, // Only regular photos for carousel
          floorPlanDataUrl: floor ? (floor.image_url || floor.url) : '',
          imagesUrls: photoUrls, // Only regular photos, no floor plans
          paymentMethods: landlordPaymentMethods,
          landlord_id: row.landlord_id,
          landlord_name: landlordName,
          latitude: row.latitude != null ? (typeof row.latitude === 'string' ? parseFloat(row.latitude) : row.latitude) : null,
          longitude: row.longitude != null ? (typeof row.longitude === 'string' ? parseFloat(row.longitude) : row.longitude) : null,
          landlordName: landlordName,
          average_rating: averageRating,
          rating: averageRating,
          review_count: reviewCount,
          reviewCount: reviewCount
        };
      });
    }
  } catch (e) {
    console.warn('Supabase fetchListings fallback to local:', e?.message || e);
  }
  const listings = getStoredListings();
  return Array.isArray(listings) ? listings.filter(ad => (ad.status || 'available') === 'available') : [];
}

// --- Bookmarks (per-user, Supabase) ---
async function getCurrentUserId() {
  try {
    const client = initSupabaseClient();
    if (!client) return null;
    const { data } = await client.auth.getSession();
    return data?.session?.user?.id || null;
  } catch (_) { return null; }
}

function isValidUuid(val) {
  return typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);
}

async function fetchUserBookmarks() {
  const result = new Set();
  try {
    const client = initSupabaseClient();
    const uid = await getCurrentUserId();
    if (!client || !uid) return result;
    const { data, error } = await client
      .from('bookmarks')
      .select('apartment_id')
      .eq('user_id', uid)
      .limit(500);
    if (error) throw error;
    (data || []).forEach(r => { if (r && r.apartment_id) result.add(String(r.apartment_id)); });
  } catch (_) {}
  return result;
}

async function addBookmark(apartmentId) {
  try {
    const client = initSupabaseClient();
    const uid = await getCurrentUserId();
    if (!client || !uid) return false;
    if (!isValidUuid(apartmentId)) return false;

    // Idempotent insert: keep row in Supabase, avoid duplicates.
    const { error } = await client
      .from('bookmarks')
      .upsert(
        [{ user_id: uid, apartment_id: apartmentId }],
        { onConflict: 'user_id,apartment_id', ignoreDuplicates: true }
      );
    
    if (error) {
      const msg = String(error.message || '').toLowerCase();
      const code = String(error.code || '');
      const status = Number(error.status || 0);
      // Treat unique-constraint conflicts as success (bookmark already exists).
      if (status === 409 || code === '23505' || msg.includes('duplicate') || msg.includes('unique')) {
        return true;
      }
      console.error('Error adding bookmark:', error, { apartmentId, uid });
      throw error;
    }
    return true;
  } catch (e) {
    console.error('addBookmark failed:', e);
    return false;
  }
}

async function removeBookmark(apartmentId) {
  try {
    const client = initSupabaseClient();
    const uid = await getCurrentUserId();
    if (!client || !uid) return false;
    if (!isValidUuid(apartmentId)) return false;
    const { error } = await client
      .from('bookmarks')
      .delete()
      .eq('user_id', uid)
      .eq('apartment_id', apartmentId);
    if (error) {
      const msg = String(error.message || '').toLowerCase();
      const status = Number(error.status || 0);
      // If it's already gone, treat as success.
      if (status === 404 || msg.includes('not found')) return true;
      throw error;
    }
    return true;
  } catch (e) {
    console.error('removeBookmark failed:', e);
    return false;
  }
}

function renderSavedFromBookmarks(listings) {
  const container = document.getElementById('savedlistings');
  if (!container) return;
  container.innerHTML = '';
  const bm = window.__userBookmarks || new Set();
  const map = new Map(listings.map(ad => [String(ad.id), ad]));
  bm.forEach(id => {
    const ad = map.get(String(id));
    if (!ad) return; // hidden if not available
    const card = document.createElement('div');
    card.className = 'outer';
    card.dataset.adId = ad.id;
    // Create photo display - carousel for multiple photos, single image for one photo
    let photoHtml = '';
    const photoUrls = ad.primaryImageDataUrls || ad.imagesUrls || [];
    
    if (photoUrls && photoUrls.length > 1) {
      // Multiple photos - show carousel
      photoHtml = `
        <div class="photo-carousel" style="position:relative;width:100%;height:100%;display:flex;justify-content:center;align-items:center;">
          <button type="button" class="pc-prev" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);z-index:2;background:rgba(0,0,0,0.4);color:#fff;border:none;border-radius:50%;width:32px;height:32px;cursor:pointer">‹</button>
          <img class="pc-image" src="${photoUrls[0]}" alt="photos" style="width:100%;height:100%;object-fit:cover;border-radius:12px"/>
          <button type="button" class="pc-next" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);z-index:2;background:rgba(0,0,0,0.4);color:#fff;border:none;border-radius:50%;width:32px;height:32px;cursor:pointer">›</button>
          <div class="pc-dots" style="position:absolute;left:0;right:0;bottom:8px;display:flex;gap:6px;justify-content:center;z-index:2"></div>
          <div class="pc-counter" style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,0.6);color:#fff;padding:4px 8px;border-radius:12px;font-size:12px;z-index:2">1/${photoUrls.length}</div>
        </div>
      `;
    } else if (ad.primaryImageDataUrl) {
      // Single photo
      photoHtml = `<img src="${ad.primaryImageDataUrl}" alt="photos" style="width:100%;height:100%;object-fit:cover;border-radius:12px"/>`;
    } else {
      // No photo - show default
      photoHtml = `<img src="final logo.PNG" alt="photos">`;
    }
    
    // Generate star rating display
    const rating = ad.average_rating || ad.rating || 0;
    const reviewCount = ad.review_count || ad.reviewCount || 0;
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    let starsHtml = '';
    for (let i = 0; i < fullStars; i++) starsHtml += '<span class="star-filled">★</span>';
    if (hasHalfStar) starsHtml += '<span class="star-filled">★</span>';
    for (let i = 0; i < emptyStars; i++) starsHtml += '<span class="star-empty">☆</span>';
    
    // Normalize unit counts for display - same logic as renderClientListings
    const totalUnits = ad.totalUnits != null ? ad.totalUnits : (ad.total_units != null ? ad.total_units : 1);
    // IMPORTANT: availability shown in badges must reflect *actual occupied units*.
    // Do not trust advertised available_units if there are occupied unit numbers.
    const occArr = Array.isArray(ad.occupiedUnitNumbers)
      ? ad.occupiedUnitNumbers
      : (Array.isArray(ad.occupied_unit_numbers) ? ad.occupied_unit_numbers : []);
    const occSet = new Set(occArr.map(n => Number(n)).filter(n => !isNaN(n) && n >= 1));
    // If no explicit occupied units stored yet but landlord initially
    // advertised fewer available units than total, infer occupied purely for UI.
    if (occSet.size === 0 && totalUnits > 1) {
      const storedAvailable = ad.availableUnits != null
        ? ad.availableUnits
        : (ad.available_units != null ? ad.available_units : totalUnits);
      const inferredOccupiedCount = Math.max(0, Math.min(totalUnits, totalUnits - Number(storedAvailable)));
      for (let i = 1; i <= inferredOccupiedCount; i++) occSet.add(i);
    }
    const availableUnits = Math.max(0, totalUnits - occSet.size);

    const isFullyRented = availableUnits <= 0;
    if (isFullyRented) {
      card.classList.add('fully-rented');
    }
    
    card.innerHTML = `
      <div class="photo" style="position:relative;${isFullyRented ? 'filter: grayscale(1); opacity: 0.7;' : ''}">
        ${photoHtml}
        <div class="unit-badge" style="position:absolute;top:8px;left:8px;background:rgba(15,23,42,0.9);color:#fff;padding:5px 10px;border-radius:8px;font-size:0.8rem;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,0.2);">
          ${availableUnits > 0
            ? `${availableUnits}/${totalUnits} unit${totalUnits > 1 ? 's' : ''} available`
            : `All apartment units are rented`}
        </div>
      </div>
      <div class="listinfo">
        <div class="listinfoleft">
          <div class="price-location">₱${ad.price} - ${ad.location}</div>
          <div class="card-rating">
            <span class="stars-inline">${starsHtml}</span>
            <span class="rating-text">${rating.toFixed(1)} (${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'})</span>
          </div>
          <div class="landlord-info">
            <i class="fa-solid fa-user"></i>
            <span class="landlord-name">${ad.landlord_name || ad.landlordName || 'Property Owner'}</span>
          </div>
        </div>
        <div class="listinforight"><i class="fa-solid fa-bookmark"></i></div>
      </div>`;
    
    // Add carousel functionality if multiple photos
    if (photoUrls && photoUrls.length > 1) {
      const imgEl = card.querySelector('.pc-image');
      const prevBtn = card.querySelector('.pc-prev');
      const nextBtn = card.querySelector('.pc-next');
      const dotsEl = card.querySelector('.pc-dots');
      const counterEl = card.querySelector('.pc-counter');
      let idx = 0;
      
      dotsEl.innerHTML = photoUrls.map((_, i) => `<span data-idx="${i}" style="width:8px;height:8px;border-radius:50%;background:${i===0?'#fff':'rgba(255,255,255,0.6)'};display:inline-block;cursor:pointer"></span>`).join('');
      
      function update(n) {
        if (n < 0) n = photoUrls.length - 1;
        if (n >= photoUrls.length) n = 0;
        idx = n;
        imgEl.src = photoUrls[idx];
        counterEl.textContent = `${idx + 1}/${photoUrls.length}`;
        dotsEl.querySelectorAll('span').forEach((d, i) => {
          d.style.background = i === idx ? '#fff' : 'rgba(255,255,255,0.6)';
        });
      }
      
      prevBtn.addEventListener('click', (ev) => { ev.stopPropagation(); update(idx - 1); });
      nextBtn.addEventListener('click', (ev) => { ev.stopPropagation(); update(idx + 1); });
      dotsEl.addEventListener('click', (ev) => {
        const dot = ev.target.closest('span[data-idx]');
        if (!dot) return;
        ev.stopPropagation();
        update(parseInt(dot.getAttribute('data-idx'), 10));
      });
    }
    container.appendChild(card);
  });

}

function renderClientListings(listings) {
  const container = document.getElementById('clientListings');
  if (!container) return;
  
  // Use DocumentFragment for better performance - reduces reflows
  const fragment = document.createDocumentFragment();
  container.innerHTML = '';
  
  listings.forEach((ad) => {
    const card = document.createElement('div');
    card.className = 'outer';
    card.dataset.adId = ad.id;
    const isSaved = (window.__userBookmarks && window.__userBookmarks.has(String(ad.id))) ? true : false;
    
    // Create photo display - carousel for multiple photos, single image for one photo
    let photoHtml = '';
    
    // Get photo URLs from the apartment data
    const photoUrls = ad.primaryImageDataUrls || ad.imagesUrls || [];
    
    // Safety check - limit photos to maximum 6 to prevent floor plan inclusion
    const limitedPhotoUrls = photoUrls.length > 6 ? photoUrls.slice(0, 6) : photoUrls;
    
    if (limitedPhotoUrls && limitedPhotoUrls.length > 1) {
      // Multiple photos - show carousel
      photoHtml = `
        <div class="photo-carousel" style="position:relative;width:100%;height:100%;display:flex;justify-content:center;align-items:center;">
          <button type="button" class="pc-prev" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);z-index:2;background:rgba(0,0,0,0.4);color:#fff;border:none;border-radius:50%;width:32px;height:32px;cursor:pointer">‹</button>
          <img class="pc-image" src="${limitedPhotoUrls[0]}" alt="photos" loading="lazy" style="width:100%;height:100%;object-fit:cover;border-radius:12px"/>
          <button type="button" class="pc-next" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);z-index:2;background:rgba(0,0,0,0.4);color:#fff;border:none;border-radius:50%;width:32px;height:32px;cursor:pointer">›</button>
          <div class="pc-dots" style="position:absolute;left:0;right:0;bottom:8px;display:flex;gap:6px;justify-content:center;z-index:2"></div>
          <div class="pc-counter" style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,0.6);color:#fff;padding:4px 8px;border-radius:12px;font-size:12px;z-index:2">1/${limitedPhotoUrls.length}</div>
        </div>
      `;
    } else if (ad.primaryImageDataUrl) {
      // Single photo
      photoHtml = `<img src="${ad.primaryImageDataUrl}" alt="photos" loading="lazy" style="width:100%;height:100%;object-fit:cover;border-radius:12px"/>`;
    } else {
      // No photo - show default
      photoHtml = `<img src="final logo.PNG" alt="photos" loading="lazy">`;
    }
    
    // Generate star rating display
    const rating = ad.average_rating || ad.rating || 0;
    const reviewCount = ad.review_count || ad.reviewCount || 0;
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    let starsHtml = '';
    for (let i = 0; i < fullStars; i++) starsHtml += '<span class="star-filled">★</span>';
    if (hasHalfStar) starsHtml += '<span class="star-filled">★</span>';
    for (let i = 0; i < emptyStars; i++) starsHtml += '<span class="star-empty">☆</span>';
    
    // Normalize unit counts for display
    const totalUnits = ad.totalUnits != null ? ad.totalUnits : (ad.total_units != null ? ad.total_units : 1);
    // IMPORTANT: availability shown in badges must reflect *actual occupied units*.
    const occArr = Array.isArray(ad.occupiedUnitNumbers)
      ? ad.occupiedUnitNumbers
      : (Array.isArray(ad.occupied_unit_numbers) ? ad.occupied_unit_numbers : []);
    const occSet = new Set(occArr.map(n => Number(n)).filter(n => !isNaN(n) && n >= 1));
    // If no explicit occupied units stored yet but landlord initially
    // advertised fewer available units than total, infer occupied purely for UI.
    if (occSet.size === 0 && totalUnits > 1) {
      const storedAvailable = ad.availableUnits != null
        ? ad.availableUnits
        : (ad.available_units != null ? ad.available_units : totalUnits);
      const inferredOccupiedCount = Math.max(0, Math.min(totalUnits, totalUnits - Number(storedAvailable)));
      for (let i = 1; i <= inferredOccupiedCount; i++) occSet.add(i);
    }
    const availableUnits = Math.max(0, totalUnits - occSet.size);

    const isFullyRented = availableUnits <= 0;
    if (isFullyRented) {
      card.classList.add('fully-rented');
    }

    card.innerHTML = `
      <div class="photo" style="position:relative;${isFullyRented ? 'filter: grayscale(1); opacity: 0.7;' : ''}">
        ${photoHtml}
        <div class="unit-badge" style="position:absolute;top:8px;left:8px;background:rgba(15,23,42,0.9);color:#fff;padding:5px 10px;border-radius:8px;font-size:0.8rem;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,0.2);">
          ${availableUnits > 0
            ? `${availableUnits}/${totalUnits} unit${totalUnits > 1 ? 's' : ''} available`
            : `All apartment units are rented`}
        </div>
      </div>
      <div class="listinfo">
        <div class="listinfoleft">
          <div class="price-location">₱${ad.price} - ${ad.location}</div>
          <div class="card-rating">
            <span class="stars-inline">${starsHtml}</span>
            <span class="rating-text">${rating.toFixed(1)} (${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'})</span>
          </div>
          <div class="landlord-info">
            <i class="fa-solid fa-user"></i>
            <span class="landlord-name">${ad.landlord_name || ad.landlordName || 'Property Owner'}</span>
          </div>
        </div>
        <div class="listinforight"><i class="${isSaved ? 'fa-solid' : 'fa-regular'} fa-bookmark"></i></div>
      </div>
    `;
    
    // Add carousel functionality if multiple photos
    if (limitedPhotoUrls && limitedPhotoUrls.length > 1) {
      const imgEl = card.querySelector('.pc-image');
      const prevBtn = card.querySelector('.pc-prev');
      const nextBtn = card.querySelector('.pc-next');
      const dotsEl = card.querySelector('.pc-dots');
      const counterEl = card.querySelector('.pc-counter');
      let idx = 0;
      
      dotsEl.innerHTML = limitedPhotoUrls.map((_, i) => `<span data-idx="${i}" style="width:8px;height:8px;border-radius:50%;background:${i===0?'#fff':'rgba(255,255,255,0.6)'};display:inline-block;cursor:pointer"></span>`).join('');
      
      function update(n) {
        if (n < 0) n = limitedPhotoUrls.length - 1;
        if (n >= limitedPhotoUrls.length) n = 0;
        idx = n;
        imgEl.src = limitedPhotoUrls[idx];
        counterEl.textContent = `${idx + 1}/${limitedPhotoUrls.length}`;
        dotsEl.querySelectorAll('span').forEach((d, i) => {
          d.style.background = i === idx ? '#fff' : 'rgba(255,255,255,0.6)';
        });
      }
      
      prevBtn.addEventListener('click', (ev) => { ev.stopPropagation(); update(idx - 1); });
      nextBtn.addEventListener('click', (ev) => { ev.stopPropagation(); update(idx + 1); });
      dotsEl.addEventListener('click', (ev) => {
        const dot = ev.target.closest('span[data-idx]');
        if (!dot) return;
        ev.stopPropagation();
        update(parseInt(dot.getAttribute('data-idx'), 10));
      });
    }

    // Direct bookmark click handler (Dashboard card)
    // This avoids cases where delegated clicks don't fire due to overlays/targets.
    const bookmarkBtn = card.querySelector('.listinforight');
    if (bookmarkBtn && !bookmarkBtn.__wired) {
      bookmarkBtn.__wired = true;
      bookmarkBtn.addEventListener('click', async (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        const id = String(ad.id);
        const icon = bookmarkBtn.querySelector('.fa-bookmark') || card.querySelector('.fa-bookmark');
        const saved = window.__userBookmarks || new Set();
        const wasSaved = saved.has(id);

        // optimistic toggle
        if (wasSaved) saved.delete(id); else saved.add(id);
        window.__userBookmarks = saved;
        if (icon) {
          icon.classList.toggle('fa-solid', saved.has(id));
          icon.classList.toggle('fa-regular', !saved.has(id));
        }
        renderSavedFromBookmarks(listings);

        // persist
        const ok = wasSaved ? await removeBookmark(id) : await addBookmark(id);
        if (!ok) {
          if (wasSaved) saved.add(id); else saved.delete(id);
          window.__userBookmarks = saved;
          if (icon) {
            icon.classList.toggle('fa-solid', saved.has(id));
            icon.classList.toggle('fa-regular', !saved.has(id));
          }
          renderSavedFromBookmarks(listings);
        }
      });
    }
    fragment.appendChild(card);
  });
  
  // Append all cards at once - single reflow instead of multiple
  container.appendChild(fragment);
}

// Fetch and render rating summary inside a card for client side
async function renderCardRatingSummaryClient(apartmentId, cardEl) {
  try {
    const client = initSupabaseClient();
    if (!client || !apartmentId || !cardEl) return;
    const host = cardEl.querySelector(`.card-rating[data-apartment-id="${apartmentId}"]`);
    if (!host) return;
    const starsEl = host.querySelector('.stars-inline');
    const textEl = host.querySelector('.rating-text');
    if (starsEl) starsEl.textContent = '★★★★★';
    if (textEl) textEl.textContent = 'Fetching…';

    const { data: rows } = await client
      .from('reviews')
      .select('rating, visible')
      .eq('apartment_id', apartmentId)
      .eq('visible', true)
      .limit(200);
    const list = Array.isArray(rows) ? rows : [];
    const count = list.length;
    const avg = count ? (list.reduce((s, r) => s + (parseInt(r.rating, 10) || 0), 0) / count) : 0;
    const filled = Math.round(avg);
    if (starsEl) {
      // Create stars with individual styling - filled stars are gold, empty stars are grey
      const starsHTML = Array.from({length: 5}, (_, i) => {
        if (i < filled) {
          return `<span class="star-filled">★</span>`;
        } else {
          return `<span class="star-empty">☆</span>`;
        }
      }).join('');
      starsEl.innerHTML = starsHTML;
      starsEl.setAttribute('aria-label', `${avg.toFixed(1)} out of 5`);
    }
    if (textEl) textEl.textContent = `${avg.toFixed(1)} • ${count} review${count===1?'':'s'}`;
  } catch(_) {}
}

function attachClientCardHandlers(listings) {
  const container = document.getElementById('clientListings');
  if (!container) return;
  container.addEventListener('click', function (e) {
    const card = e.target.closest('.outer');
    if (!card) return;
    const adId = String(card.dataset.adId || '');
    const ad = listings.find(x => String(x?.id) === adId);
    if (!ad) return;

    // if bookmark area/icon clicked, toggle saved state (copy/remove in saved listings)
    const clickedBookmarkIcon = e.target.closest('.listinforight, .fa-bookmark');
    if (clickedBookmarkIcon) {
      e.preventDefault();
      e.stopPropagation();
      (async () => {
        const id = String(ad.id);
        const icon = card.querySelector('.listinforight .fa-bookmark') || card.querySelector('.fa-bookmark');
        const saved = window.__userBookmarks || new Set();
        const wasSaved = saved.has(id);
        // optimistic toggle
        if (wasSaved) saved.delete(id); else saved.add(id);
        window.__userBookmarks = saved;
        if (icon) {
          icon.classList.toggle('fa-solid', saved.has(id));
          icon.classList.toggle('fa-regular', !saved.has(id));
        }
        renderSavedFromBookmarks(listings);
        // persist
        const ok = wasSaved ? await removeBookmark(id) : await addBookmark(id);
        if (!ok) {
          // revert on failure
          if (wasSaved) saved.add(id); else saved.delete(id);
          window.__userBookmarks = saved;
          if (icon) {
            icon.classList.toggle('fa-solid', saved.has(id));
            icon.classList.toggle('fa-regular', !saved.has(id));
          }
          renderSavedFromBookmarks(listings);
        }
      })();
      return;
    }
    // remember selection for Rent Now population
    window.currentSelectedAd = ad;
    // set current apartment id for chat scoping so messages are routed correctly
    window.currentApartmentId = ad.id;
    // re-subscribe chat listener for this apartment so landlord replies are received
    try {
      if (window.__chatChannel && typeof window.__chatChannel.unsubscribe === 'function') {
        window.__chatChannel.unsubscribe();
      }
    } catch (_) { }
    listenForMessages();
    // populate details panel with ad info
    const parentPage = document.querySelector('#Dashboard.sidelp');
    const selected = parentPage ? parentPage.querySelector('.selectedrightside') : document.querySelector('.mainright .selectedrightside');
    if (parentPage && selected) {
      // show the details panel, hide siblings
      parentPage.querySelectorAll(':scope > div:not(.selectedrightside)').forEach(el => el.style.display = 'none');
      selected.style.display = 'flex';
      parentPage.setAttribute('data-detail-open', 'true');
      persistClientModalState({
        type: 'dashboard-details',
        adId: ad.id
      });
      // price & location
      const priceEl = selected.querySelector('.button-bar .price p');
      if (priceEl) priceEl.textContent = `₱${ad.price}`;
      const locEl = selected.querySelector('.button-bar .location p');
      if (locEl) locEl.textContent = ad.location || 'Location';
      // photos / rent photos: single or carousel
      const heroWrap = selected.querySelector('.availphts .photos');
      if (heroWrap) renderClientPhotos(heroWrap, ad);
      const rentWrap = selected.querySelector('.availrentphts .rentphotos');
      if (rentWrap) renderClientPhotos(rentWrap, ad);
      // Store location for use in modal (map is only shown in modal now)
      console.log('🔍 Checking coordinates for apartment:', ad.id);
      console.log('🔍 Raw latitude:', ad.latitude, 'type:', typeof ad.latitude);
      console.log('🔍 Raw longitude:', ad.longitude, 'type:', typeof ad.longitude);
      
      // More robust coordinate check - handle null, undefined, empty string, and 0
      const lat = ad.latitude;
      const lng = ad.longitude;
      const hasCoordinates = (lat !== null && lat !== undefined && lat !== '' && lat !== 0) &&
                             (lng !== null && lng !== undefined && lng !== '' && lng !== 0) &&
                             !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng)) &&
                             parseFloat(lat) !== 0 && parseFloat(lng) !== 0;
      
      if (hasCoordinates) {
        const location = {
          lat: parseFloat(ad.latitude),
          lng: parseFloat(ad.longitude)
        };
        
        // Validate coordinates
        if (!isNaN(location.lat) && !isNaN(location.lng) && 
            location.lat >= -90 && location.lat <= 90 && 
            location.lng >= -180 && location.lng <= 180) {
          // Store location for THIS specific apartment (tied to apartment ID)
          window.currentApartmentLocation = location;
          window.currentApartmentTitle = ad.title || ad.location || 'Apartment Location';
          window.currentApartmentId = ad.id; // Ensure apartment ID is set
          console.log('✅ Valid coordinates found for apartment ID:', ad.id);
          console.log('✅ Stored location for modal:', location, 'Title:', window.currentApartmentTitle);
        } else {
          console.warn('⚠️ Invalid coordinates for apartment ID:', ad.id, 'Location:', location);
          window.currentApartmentLocation = null;
          window.currentApartmentId = ad.id; // Still set ID even if no coordinates
        }
      } else {
        console.warn('⚠️ No valid coordinates for apartment ID:', ad.id, 'lat:', ad.latitude, 'lng:', ad.longitude);
        console.warn('⚠️ Landlord needs to set location using the map picker and update the property');
        window.currentApartmentLocation = null;
        window.currentApartmentId = ad.id; // Still set ID even if no coordinates
      }
      
      // description
      const detsInfo = selected.querySelector('.fuldetails .detsinfo');
      if (detsInfo) {
    const totalUnits = ad.totalUnits != null ? ad.totalUnits : (ad.total_units != null ? ad.total_units : 1);
    const occArr = Array.isArray(ad.occupiedUnitNumbers) ? ad.occupiedUnitNumbers : [];
    const occSet = new Set(occArr.map(n => Number(n)).filter(n => !isNaN(n)));
    // If no explicit occupied units stored yet but landlord initially
    // advertised fewer available units than total, infer the originally
    // occupied units purely for the client UI (this does not affect
    // the Rented view because nothing is written back to the DB).
    if (occSet.size === 0 && totalUnits > 1) {
      const storedAvailable = ad.availableUnits != null
        ? ad.availableUnits
        : (ad.available_units != null ? ad.available_units : totalUnits);
      const inferredOccupiedCount = Math.max(0, Math.min(totalUnits, totalUnits - Number(storedAvailable)));
      for (let i = 1; i <= inferredOccupiedCount; i++) {
        occSet.add(i);
      }
    }
    const availableCount = totalUnits - occSet.size;
    const unitSummaryText = availableCount > 0
      ? `${availableCount} of ${totalUnits} unit${totalUnits > 1 ? 's' : ''} available`
      : `All ${totalUnits} unit${totalUnits > 1 ? 's' : ''} occupied`;

    // Build per-unit status grid from actual occupied_unit_numbers
    const unitGridHtml = (() => {
      const items = [];
      for (let i = 1; i <= totalUnits; i++) {
        const isOccupied = occSet.has(i);
        items.push(
          `<span class="unit-pill ${isOccupied ? 'unit-pill-occupied' : 'unit-pill-available'}">` +
          `Unit ${i}: ${isOccupied ? 'Occupied' : 'Available'}` +
          `</span>`
        );
      }
      return `<div class="unit-grid" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px;">${items.join('')}</div>`;
    })();

        let paymentMethodsText = '';
        if (ad.paymentMethods && ad.paymentMethods.length > 0) {
          paymentMethodsText = ad.paymentMethods.map(pm => {
            return pm.method.charAt(0).toUpperCase() + pm.method.slice(1);
          }).join(', ');
        } else {
          paymentMethodsText = 'No payment methods available';
        }
        
        detsInfo.innerHTML = `
          <p><strong>Description:</strong><br>${ad.description || ''}</p>
          <p><strong>Unit type:</strong><br>${ad.unitSize || ''}</p>
          <p><strong>Units:</strong><br>${unitSummaryText}</p>
          ${unitGridHtml}
          <p><strong>Amenities:</strong><br>${ad.amenities || ''}</p>
          <p><strong>Requirements:</strong><br>${(ad.requirements || []).map(r => `- ${r}`).join('<br>')}</p>
          <p><strong>Floor Plan:</strong><br>${ad.floorPlanDataUrl ? `<a href="#" id="viewFloorPlanLink">View Floor Plan</a>` : 'None'}</p>
          <p><strong>Payment Method:</strong><br>${paymentMethodsText}</p>
        `;
      }
      // Wire "View my application details" modal button
      const viewAppBtn = selected.querySelector('#viewMyApplicationBtn');
      if (viewAppBtn) {
        viewAppBtn.onclick = function () {
          if (typeof openClientApplicationModal === 'function') {
            openClientApplicationModal(ad.myApplication);
          }
        };
      }
      // Rent Now availability label
      const rentStatusLabel = selected.querySelector('#rentStatusLabel, .rent-status-label');
      const rentNowBtn = selected.querySelector('#rentNowBtn, .rentbtn');
      // IMPORTANT: Rent Now should be disabled based on actual occupied units.
      const totU2 = ad.totalUnits != null ? ad.totalUnits : (ad.total_units != null ? ad.total_units : 1);
      const occArr2 = Array.isArray(ad.occupiedUnitNumbers)
        ? ad.occupiedUnitNumbers
        : (Array.isArray(ad.occupied_unit_numbers) ? ad.occupied_unit_numbers : []);
      const occSet2 = new Set(occArr2.map(n => Number(n)).filter(n => !isNaN(n) && n >= 1));
      if (occSet2.size === 0 && totU2 > 1) {
        const storedAvailable2 = ad.availableUnits != null
          ? ad.availableUnits
          : (ad.available_units != null ? ad.available_units : totU2);
        const inferredOccupiedCount2 = Math.max(0, Math.min(totU2, totU2 - Number(storedAvailable2)));
        for (let i = 1; i <= inferredOccupiedCount2; i++) occSet2.add(i);
      }
      const availForAd = Math.max(0, totU2 - occSet2.size);
      const isFullyRented = availForAd <= 0;
      if (rentStatusLabel) {
        if (isFullyRented) {
          rentStatusLabel.textContent = 'Unavailable – all apartment units are rented';
          rentStatusLabel.style.display = 'inline';
        } else {
          rentStatusLabel.textContent = '';
          rentStatusLabel.style.display = 'none';
        }
      }
      if (rentNowBtn) {
        rentNowBtn.disabled = isFullyRented;
        rentNowBtn.style.opacity = isFullyRented ? '0.6' : '';
        rentNowBtn.style.cursor = isFullyRented ? 'not-allowed' : '';
      }
      // contact card
      const contactPhone = selected.querySelector('.contact-card .contact-option span');
      if (contactPhone && ad.contact) contactPhone.textContent = ad.contact;
      
      // Update landlord email
      const landlordEmail = selected.querySelector('.contact-card .landlord-email');
      if (landlordEmail && ad.email) landlordEmail.textContent = ad.email;
      // scroll to top for good UX
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Unified reviews (use the same renderer as Rented Apartment)
      try { if (typeof renderApartmentReviews === 'function') { renderApartmentReviews(ad.id, selected); } } catch(_) {}
      // Load 360° panoramas for Dashboard view
      try { if (typeof window.loadClientPanoramas === 'function') { window.loadClientPanoramas(ad.id, 'dashboardClientPanoramaList'); } } catch(_) {}
      // floor plan link modal/view
      if (ad.floorPlanDataUrl) {
        const link = selected.querySelector('#viewFloorPlanLink');
        if (link) {
          link.addEventListener('click', function (ev) {
            ev.preventDefault();
            showFloorPlan(ad.floorPlanDataUrl);
          });
        }
      }
      // details view bookmark toggle
      const detailsBookmark = selected.querySelector('.svicon .fa-bookmark');
      if (detailsBookmark) {
        // reflect current saved state
        const isSaved = !!(window.__userBookmarks && window.__userBookmarks.has(String(ad.id)));
        detailsBookmark.classList.toggle('fa-solid', isSaved);
        detailsBookmark.classList.toggle('fa-regular', !isSaved);

        detailsBookmark.onclick = function (e) {
          e.preventDefault();
          e.stopPropagation();
          (async () => {
            const id = String(ad.id);
            const saved = window.__userBookmarks || new Set();
            const wasSaved = saved.has(id);
            // optimistic toggle
            if (wasSaved) saved.delete(id); else saved.add(id);
            window.__userBookmarks = saved;
            detailsBookmark.classList.toggle('fa-solid', saved.has(id));
            detailsBookmark.classList.toggle('fa-regular', !saved.has(id));
            const listIcon = document.querySelector(`#clientListings .outer[data-ad-id="${ad.id}"] .fa-bookmark`);
            if (listIcon) {
              listIcon.classList.toggle('fa-solid', saved.has(id));
              listIcon.classList.toggle('fa-regular', !saved.has(id));
            }
            renderSavedFromBookmarks(listings);
            // persist
            const ok = wasSaved ? await removeBookmark(id) : await addBookmark(id);
            if (!ok) {
              // revert on failure
              if (wasSaved) saved.add(id); else saved.delete(id);
              window.__userBookmarks = saved;
              detailsBookmark.classList.toggle('fa-solid', saved.has(id));
              detailsBookmark.classList.toggle('fa-regular', !saved.has(id));
              if (listIcon) {
                listIcon.classList.toggle('fa-solid', saved.has(id));
                listIcon.classList.toggle('fa-regular', !saved.has(id));
              }
              renderSavedFromBookmarks(listings);
            }
          })();
        };
      }
    }
  });
  // Handle clicks inside saved listings to unsave
  const savedContainer = document.getElementById('savedlistings');
  if (savedContainer) {
    savedContainer.addEventListener('click', function (e) {
      const savedCard = e.target.closest('.outer');
      if (!savedCard) return;
      const isBookmark = e.target.closest('.fa-bookmark');
      const adId = savedCard.dataset.adId;
      if (isBookmark) {
        e.preventDefault();
        e.stopPropagation();
        (async () => {
          const id = String(adId || '');
          if (!id) return;

          const saved = window.__userBookmarks || new Set();
          const wasSaved = saved.has(id);

          // Only action here is "unbookmark"
          if (wasSaved) saved.delete(id);
          window.__userBookmarks = saved;

          // Update dashboard listing card icon (if present)
          const originalIcon = document.querySelector(`#clientListings .outer[data-ad-id="${CSS.escape(id)}"] .fa-bookmark`);
          if (originalIcon) {
            originalIcon.classList.toggle('fa-solid', saved.has(id));
            originalIcon.classList.toggle('fa-regular', !saved.has(id));
          }

          // Update details panel icon if currently showing same apartment
          try {
            const parentPage = document.querySelector('#Dashboard.sidelp');
            const selected = parentPage ? parentPage.querySelector('.selectedrightside') : null;
            const detailsIcon = selected ? selected.querySelector('.svicon .fa-bookmark') : null;
            const currentId = String(window.currentSelectedAd?.id || '');
            if (detailsIcon && currentId && currentId === id) {
              detailsIcon.classList.toggle('fa-solid', saved.has(id));
              detailsIcon.classList.toggle('fa-regular', !saved.has(id));
            }
          } catch (_) {}

          // Re-render saved list from source of truth
          renderSavedFromBookmarks(listings);

          // Persist: delete bookmark in DB
          const ok = await removeBookmark(id);
          if (!ok) {
            if (wasSaved) saved.add(id);
            window.__userBookmarks = saved;
            if (originalIcon) {
              originalIcon.classList.toggle('fa-solid', saved.has(id));
              originalIcon.classList.toggle('fa-regular', !saved.has(id));
            }
            try {
              const parentPage = document.querySelector('#Dashboard.sidelp');
              const selected = parentPage ? parentPage.querySelector('.selectedrightside') : null;
              const detailsIcon = selected ? selected.querySelector('.svicon .fa-bookmark') : null;
              const currentId = String(window.currentSelectedAd?.id || '');
              if (detailsIcon && currentId && currentId === id) {
                detailsIcon.classList.toggle('fa-solid', saved.has(id));
                detailsIcon.classList.toggle('fa-regular', !saved.has(id));
              }
            } catch (_) {}
            renderSavedFromBookmarks(listings);
          }
        })();
        return;
      }
      // Not a bookmark click: redirect to Dashboard and show this apartment there
      const ad = (Array.isArray(listings) ? listings.find(x => String(x.id) === String(adId)) : null);
      if (!ad) return;
      
      // Switch to Dashboard tab
      const dashboardLink = document.querySelector('.sidemenu .page[data-target="Dashboard"]');
      if (dashboardLink) dashboardLink.click();
      
      // Wait a moment for Dashboard tab to activate, then trigger the card click in Dashboard
      setTimeout(() => {
        const dashboardCard = document.querySelector(`#clientListings .outer[data-ad-id="${adId}"]`);
        if (dashboardCard) {
          dashboardCard.click();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100);
    });
  }
}

function showFloorPlan(dataUrl) {
  // simple lightbox
  let box = document.getElementById('floorPlanLightbox');
  if (!box) {
    box = document.createElement('div');
    box.id = 'floorPlanLightbox';
    box.style.position = 'fixed';
    box.style.inset = '0';
    box.style.background = 'rgba(0,0,0,0.6)';
    box.style.display = 'flex';
    box.style.alignItems = 'center';
    box.style.justifyContent = 'center';
    box.style.zIndex = '10000';
    box.innerHTML = '<div id="fpInner" style="background:#fff;max-width:90vw;max-height:90vh;padding:10px;border-radius:8px;overflow:auto"></div>';
    document.body.appendChild(box);
    box.addEventListener('click', function (e) { if (e.target === box) box.remove(); });
  } else {
    const inner = box.querySelector('#fpInner');
    if (inner) inner.innerHTML = '';
  }
  const inner = box.querySelector('#fpInner');
  if (inner) {
    if (dataUrl.startsWith('data:application/pdf') || dataUrl.includes('.pdf')) {
      inner.innerHTML = `<iframe src="${dataUrl}" style="width:80vw;height:80vh;border:none;"></iframe>`;
    } else {
      inner.innerHTML = `<img src="${dataUrl}" style="max-width:85vw;max-height:85vh;object-fit:contain;" />`;
    }
  }
  box.style.display = 'flex';
}

function applyRequirementVisibility(rentContainer, ad) {
  if (!rentContainer || !ad) return;
  const reqs = Array.isArray(ad.requirements) ? ad.requirements.map(r => String(r).toLowerCase()) : [];
  const hasReq = (label) => reqs.includes(String(label).toLowerCase());

  const setRequired = (selector, isRequired) => {
    const field = rentContainer.querySelector(selector);
    if (!field) return;
    if (isRequired) {
      field.setAttribute('required', 'required');
    } else {
      field.removeAttribute('required');
      if (field.type === 'radio' || field.type === 'checkbox') {
        field.checked = false;
      } else if (field.tagName === 'SELECT') {
        field.value = '';
      } else if (field.type === 'file') {
        field.value = '';
      }
    }
  };

  const toggleSection = (sectionEl, show) => {
    if (!sectionEl) return;
    sectionEl.style.display = show ? '' : 'none';
  };

  const incomeSection = rentContainer.querySelector('[data-requirement-section="income"]');
  const showIncome = hasReq('Proof of Income');
  toggleSection(incomeSection, showIncome);
  setRequired('#employmentStatus', showIncome);
  setRequired('#monthlyIncome', showIncome);
  setRequired('#proofOfIncome', showIncome);

  const idSection = rentContainer.querySelector('[data-requirement-section="identification"]');
  const validIdGroup = rentContainer.querySelector('[data-requirement="Valid ID"]');
  const barangayGroup = rentContainer.querySelector('[data-requirement="Barangay Clearance"]');
  const policeGroup = rentContainer.querySelector('[data-requirement="Police Clearance"]');
  const showValidId = hasReq('Valid ID');
  const showBarangay = hasReq('Barangay Clearance');
  const showPolice = hasReq('Police Clearance');

  if (validIdGroup) validIdGroup.style.display = showValidId ? '' : 'none';
  if (barangayGroup) barangayGroup.style.display = showBarangay ? '' : 'none';
  if (policeGroup) policeGroup.style.display = showPolice ? '' : 'none';
  toggleSection(idSection, showValidId || showBarangay || showPolice);
  setRequired('#validId', showValidId);
  setRequired('#barangayClearance', showBarangay);
  setRequired('#policeClearance', showPolice);

  const lifestyleSection = rentContainer.querySelector('[data-requirement-section="lifestyle"]');
  const showLifestyle = hasReq('No pets agreement');
  toggleSection(lifestyleSection, showLifestyle);
  rentContainer.querySelectorAll('input[name="hasPets"]').forEach((el) => {
    if (showLifestyle) {
      el.setAttribute('required', 'required');
    } else {
      el.removeAttribute('required');
      el.checked = false;
    }
  });
  rentContainer.querySelectorAll('input[name="hasVehicle"]').forEach((el) => {
    if (showLifestyle) {
      el.setAttribute('required', 'required');
    } else {
      el.removeAttribute('required');
      el.checked = false;
    }
  });

}

function populateRentDetails(rentContainer, ad) {
  if (!rentContainer || !ad) return;
  applyRequirementVisibility(rentContainer, ad);
  const rows = rentContainer.querySelectorAll('.detailcard .detail-row');
  const setVal = (index, text) => {
    const row = rows[index];
    if (!row) return;
    const val = row.querySelector('.detail-value');
    if (val) val.textContent = text || '';
  };
  setVal(0, (ad.price ? `₱${ad.price}/month` : ''));
  setVal(1, ad.location || '');
  setVal(2, ad.description || '');
  setVal(3, ad.unitSize || '');
  setVal(4, ad.amenities || '');
  // floor plan link (index 5)
  const floorPlanRow = rows[5];
  if (floorPlanRow) {
    const valEl = floorPlanRow.querySelector('.detail-value');
    if (valEl) {
      if (ad.floorPlanDataUrl) {
        // Render link and attach handler
        valEl.innerHTML = `<a href="#" class="rent-floorplan-link">View Floor Plan</a>`;
        const link = valEl.querySelector('.rent-floorplan-link');
        if (link) {
          link.addEventListener('click', function (ev) {
            ev.preventDefault();
            if (typeof showFloorPlan === 'function') {
              showFloorPlan(ad.floorPlanDataUrl);
            } else {
              window.open(ad.floorPlanDataUrl, '_blank');
            }
          });
        }
      } else {
        valEl.textContent = 'None';
      }
    }
  }
  setVal(6, (ad.requirements || []).join(', '));
  
  // Payment methods - display only method names
  const paymentRow = rows[7];
  if (paymentRow) {
    const valEl = paymentRow.querySelector('.detail-value');
    if (valEl) {
      if (ad.paymentMethods && ad.paymentMethods.length > 0) {
        const methodNames = ad.paymentMethods.map(pm => {
          return pm.method.charAt(0).toUpperCase() + pm.method.slice(1);
        }).join(', ');
        valEl.textContent = methodNames;
      } else {
        valEl.textContent = 'No payment methods available';
      }
    }
  }
  
  // Load 360° panoramas for Rent Now view
  try {
    if (ad.id && typeof window.loadClientPanoramas === 'function') {
      window.loadClientPanoramas(ad.id, 'clientPanoramaList');
    }
  } catch(_) {}
  
  // Unit selector: show when building has multiple units and at least one available
  const unitSections = rentContainer.querySelectorAll('.unit-selector-section');
  const totU = ad.totalUnits != null ? ad.totalUnits : (ad.total_units != null ? ad.total_units : 1);
  const occArr = Array.isArray(ad.occupiedUnitNumbers) ? ad.occupiedUnitNumbers : [];
  const occSet = new Set(occArr.map(n => Number(n)).filter(n => !isNaN(n)));
  // Infer initially occupied units for client unit selector when none
  // are explicitly stored yet, based on total vs available units.
  if (occSet.size === 0 && totU > 1) {
    const storedAvailable = ad.availableUnits != null
      ? ad.availableUnits
      : (ad.available_units != null ? ad.available_units : totU);
    const inferredOccupiedCount = Math.max(0, Math.min(totU, totU - Number(storedAvailable)));
    for (let i = 1; i <= inferredOccupiedCount; i++) {
      occSet.add(i);
    }
  }
  const availableUnits = [];
  for (let i = 1; i <= totU; i++) {
    if (!occSet.has(i)) availableUnits.push(i);
  }
  unitSections.forEach(section => {
    const container = section.querySelector('.unit-selector-container');
    const hiddenInput = rentContainer.querySelector('#selectedUnitNumber');
    if (!container || !hiddenInput) return;
    if (totU > 1 && availableUnits.length > 0) {
      section.style.display = '';
      container.innerHTML = '';
      availableUnits.forEach(u => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'unit-select-btn';
        btn.dataset.unit = String(u);
        btn.textContent = 'Unit ' + u;
        btn.style.cssText = '';
        btn.addEventListener('click', function () {
          container.querySelectorAll('.unit-select-btn').forEach(b => {
            b.style.borderColor = '';
            b.style.background = '';
          });
          this.style.borderColor = 'var(--primary-color)';
          this.style.background = 'rgba(var(--primary-rgb,0,123,255),0.1)';
          hiddenInput.value = String(u);
        });
        container.appendChild(btn);
      });
      hiddenInput.value = '';
    } else {
      section.style.display = 'none';
      if (totU === 1 && availableUnits.length === 1) {
        hiddenInput.value = '1';
      } else {
        hiddenInput.value = '';
      }
    }
  });
  
  // Note: Payment options will be shown during payment process, not during application
}

function setupClientSearch(listings) {
  const input = document.getElementById('clientSearch');
  if (!input) return;
  
  // Store current filter type
  let currentFilter = 'default';
  
  // Search functionality
  input.addEventListener('input', async () => {
    const q = input.value.toLowerCase();
    const filtered = listings.filter(ad => {
      return (
        (ad.location || '').toLowerCase().includes(q) ||
        (ad.price || '').toString().toLowerCase().includes(q) ||
        (ad.description || '').toLowerCase().includes(q)
      );
    });
    // Apply current filter to search results
    const sorted = await applySortFilter(filtered, currentFilter);
    renderClientListings(sorted);
  });
  
  // Filter dropdown functionality
  const filterIcon = document.getElementById('filterIcon');
  const filterMenu = document.getElementById('filterMenu');
  const filterOptions = document.querySelectorAll('.filter-option');
  
  if (filterIcon && filterMenu) {
    // Toggle filter menu
    filterIcon.addEventListener('click', (e) => {
      e.stopPropagation();
      filterMenu.classList.toggle('show');
      filterIcon.classList.toggle('active');
    });
    
    // Close filter menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.filter-dropdown')) {
        filterMenu.classList.remove('show');
        filterIcon.classList.remove('active');
      }
    });
    
    // Handle filter option selection
    filterOptions.forEach(option => {
      option.addEventListener('click', async (e) => {
        e.stopPropagation();
        const filterType = option.getAttribute('data-filter');
        currentFilter = filterType;
        
        // Update active state
        filterOptions.forEach(opt => opt.classList.remove('active'));
        option.classList.add('active');
        
        // Close menu
        filterMenu.classList.remove('show');
        filterIcon.classList.remove('active');
        
        // Apply filter to current listings (considering search)
        const q = input.value.toLowerCase();
        let filtered = listings;
        if (q) {
          filtered = listings.filter(ad => {
            return (
              (ad.location || '').toLowerCase().includes(q) ||
              (ad.price || '').toString().toLowerCase().includes(q) ||
              (ad.description || '').toLowerCase().includes(q)
            );
          });
        }
        const sorted = await applySortFilter(filtered, filterType);
        renderClientListings(sorted);
      });
    });
  }
}

// Helper function to apply sorting filters
async function applySortFilter(listings, filterType) {
  const client = initSupabaseClient();
  
  switch(filterType) {
    case 'location':
      // Sort alphabetically by location (A-Z)
      return [...listings].sort((a, b) => {
        const locA = (a.location || '').toLowerCase();
        const locB = (b.location || '').toLowerCase();
        return locA.localeCompare(locB);
      });
      
    case 'price':
      // Sort by price (lowest to highest)
      return [...listings].sort((a, b) => {
        const priceA = parseFloat(a.price) || 0;
        const priceB = parseFloat(b.price) || 0;
        return priceA - priceB;
      });
      
    case 'rating':
      // Sort by rating (highest to lowest)
      // Need to fetch ratings for each apartment
      if (!client) return listings;
      
      try {
        const apartmentIds = listings.map(ad => ad.id);
        const { data: reviews } = await client
          .from('reviews')
          .select('apartment_id, rating, visible')
          .in('apartment_id', apartmentIds)
          .eq('visible', true);
        
        // Calculate average rating for each apartment
        const ratingMap = new Map();
        (reviews || []).forEach(review => {
          const aptId = String(review.apartment_id);
          if (!ratingMap.has(aptId)) {
            ratingMap.set(aptId, { total: 0, count: 0 });
          }
          const data = ratingMap.get(aptId);
          data.total += parseInt(review.rating, 10) || 0;
          data.count += 1;
        });
        
        // Sort by average rating (highest to lowest)
        return [...listings].sort((a, b) => {
          const ratingA = ratingMap.has(String(a.id)) 
            ? ratingMap.get(String(a.id)).total / ratingMap.get(String(a.id)).count 
            : 0;
          const ratingB = ratingMap.has(String(b.id)) 
            ? ratingMap.get(String(b.id)).total / ratingMap.get(String(b.id)).count 
            : 0;
          return ratingB - ratingA; // Descending order
        });
      } catch (e) {
        console.warn('Failed to sort by rating:', e);
        return listings;
      }
      
    case 'default':
    default:
      // Default sorting (newest first, as fetched from database)
      return listings;
  }
}

function setupSavedSearch(listings) {
  const input = document.getElementById('savedSearch');
  const savedContainer = document.getElementById('savedlistings');
  if (!input || !savedContainer) return;
  const filterSaved = () => {
    const q = (input.value || '').toLowerCase();
    const cards = savedContainer.querySelectorAll('.outer');
    cards.forEach(card => {
      const adId = card.dataset.adId;
      const ad = listings.find(x => String(x.id) === String(adId));
      const haystack = [
        (ad && ad.location) ? ad.location : '',
        (ad && ad.price != null) ? String(ad.price) : '',
        (ad && ad.description) ? ad.description : ''
      ].join(' ').toLowerCase();
      card.style.display = haystack.includes(q) ? '' : 'none';
    });
  };
  input.addEventListener('input', filterSaved);
}


// Realtime: when landlord approves any of this user's applications, switch to Rented
async function subscribeToClientApprovalUpdates() {
  try {
    const client = initSupabaseClient();
    if (!client) return;
    const { data } = await client.auth.getSession();
    const userId = data?.session?.user?.id || null;
    if (!userId) return;

    // Clean existing channel
    try { if (window.__clientAppsChannel && typeof window.__clientAppsChannel.unsubscribe === 'function') { window.__clientAppsChannel.unsubscribe(); } } catch (_) {}

    const channel = client.channel('client-rental-approvals');
    window.__clientAppsChannel = channel;
    channel
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'rental_applications',
        filter: `applicant_user_id=eq.${userId}`
      }, async (payload) => {
        const row = payload?.new || {};
        const status = String(row.status || '').toLowerCase();
        if (status === 'approved' || status === 'accepted') {
          // Notify the client immediately
          try {
            const aptId = row.apartment_id ? String(row.apartment_id) : '';
            const title = 'Application approved';
            const body = aptId ? `Your application for apartment ${aptId} was approved.` : 'Your rental application was approved.';
            showErrorNotification(title, body);
          } catch (_) {}
          // Refresh rented tab content
          await refreshClientRentedTab();
          // Switch UI to Rented tab
          try {
            const navLinks = document.querySelectorAll('.sidemenu .page');
            const contentPages = document.querySelectorAll('.sidelp');
            navLinks.forEach(l => l.classList.remove('active'));
            const rentedLink = document.querySelector('.sidemenu .page[data-target="Rented"]');
            if (rentedLink) rentedLink.classList.add('active');
            contentPages.forEach(p => p.classList.remove('actsidelp'));
            const rentedPage = document.getElementById('Rented');
            if (rentedPage) rentedPage.classList.add('actsidelp');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } catch (_) {}
        } else if (status === 'declined' || status === 'rejected') {
          // Notify the client that they were declined; allow re-application
          try {
            const aptId = row.apartment_id ? String(row.apartment_id) : '';
            const title = 'Application declined';
            const body = aptId ? `Your application for apartment ${aptId} was declined. You can submit another application.` : 'Your rental application was declined. You can submit another application.';
            showErrorNotification(title, body);
          } catch (_) {}
          // Show decline banner in the currently visible rent form
          try { showDeclineBanner(row.apartment_id ? String(row.apartment_id) : ''); } catch (_) {}
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'rental_applications',
        filter: `applicant_user_id=eq.${userId}`
      }, async (payload) => {
        const row = payload?.new || {};
        const status = String(row.status || '').toLowerCase();
        if (status === 'approved' || status === 'accepted') {
          try {
            const aptId = row.apartment_id ? String(row.apartment_id) : '';
            const title = 'Application approved';
            const body = aptId ? `Your application for apartment ${aptId} was approved.` : 'Your rental application was approved.';
            showErrorNotification(title, body);
          } catch (_) {}
          await refreshClientRentedTab();
          try {
            const navLinks = document.querySelectorAll('.sidemenu .page');
            const contentPages = document.querySelectorAll('.sidelp');
            navLinks.forEach(l => l.classList.remove('active'));
            const rentedLink = document.querySelector('.sidemenu .page[data-target="Rented"]');
            if (rentedLink) rentedLink.classList.add('active');
            contentPages.forEach(p => p.classList.remove('actsidelp'));
            const rentedPage = document.getElementById('Rented');
            if (rentedPage) rentedPage.classList.add('actsidelp');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } catch (_) {}
        } else if (status === 'declined' || status === 'rejected') {
          // Notify the client that they were declined; allow re-application
          try {
            const aptId = row.apartment_id ? String(row.apartment_id) : '';
            const title = 'Application declined';
            const body = aptId ? `Your application for apartment ${aptId} was declined. You can submit another application.` : 'Your rental application was declined. You can submit another application.';
            showErrorNotification(title, body);
          } catch (_) {}
          // Show decline banner in the currently visible rent form
          try { showDeclineBanner(row.apartment_id ? String(row.apartment_id) : ''); } catch (_) {}
        }
      })
      .subscribe();
  } catch (_) {}
}

// Renders a small, dismissible banner inside the visible rent form to inform the user
function showDeclineBanner(apartmentId) {
  // Find the currently open rent form area
  const rentPanel = document.querySelector('#rentClicked, .rentclicked');
  if (!rentPanel) return;
  // Avoid duplicates
  let banner = rentPanel.querySelector('.decline-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.className = 'decline-banner';
    // Lightweight, inline-safe styling to blend with existing UI
    banner.style.background = '#fff4e5';
    banner.style.border = '1px solid #ffd8a8';
    banner.style.color = '#8b5e00';
    banner.style.padding = '10px 12px';
    banner.style.borderRadius = '8px';
    banner.style.margin = '0 0 10px 0';
    banner.style.display = 'flex';
    banner.style.alignItems = 'center';
    banner.style.justifyContent = 'space-between';
    banner.innerHTML = `
      <span style="font-size:.95rem;">
        Your previous application ${apartmentId ? `for apartment ${apartmentId} ` : ''}was declined. You can submit a new application below.
      </span>
      <button type="button" aria-label="Dismiss" style="margin-left:12px;background:#fff;border:1px solid #ffd8a8;color:#8b5e00;border-radius:6px;padding:4px 8px;cursor:pointer;">Dismiss</button>
    `;
    // Insert near the top of the form container
    const host = rentPanel.querySelector('.detailcard') || rentPanel;
    host.insertBefore(banner, host.firstChild);
    const btn = banner.querySelector('button');
    if (btn) btn.addEventListener('click', function(){ banner.remove(); });
  } else {
    // If it exists, ensure it's visible
    banner.style.display = 'flex';
  }
}

document.addEventListener('DOMContentLoaded', async function () {
  showStatusOverlay('Loading', 'loading');
  // Cleanup local data if auth user changed or is gone
  try {
    const client = initSupabaseClient();
    if (client) {
      const { data } = await client.auth.getSession();
      const currentId = data?.session?.user?.id || null;
      window.__currentUserId = currentId || null;
      const lastId = localStorage.getItem('lastUserId') || null;
      if (!currentId) {
        // no user -> clear locally stored postings and saved clones container
        localStorage.removeItem('apartrent_listings');
        const savedContainer = document.getElementById('savedlistings');
        if (savedContainer) savedContainer.innerHTML = '';
      } else if (lastId && lastId !== currentId) {
        // different user -> remove postings that belonged to the previous user
        try {
          const raw = localStorage.getItem('apartrent_listings');
          const arr = raw ? JSON.parse(raw) : [];
          const filtered = Array.isArray(arr) ? arr.filter(ad => ad && ad.owner_user_id !== lastId) : [];
          localStorage.setItem('apartrent_listings', JSON.stringify(filtered));
        } catch (_) {}
        const savedContainer = document.getElementById('savedlistings');
        if (savedContainer) savedContainer.innerHTML = '';
      }
      if (currentId) localStorage.setItem('lastUserId', currentId); else localStorage.removeItem('lastUserId');
    }
  } catch (_) {}

  // Bookmarks for the logged-in user
  window.__userBookmarks = await fetchUserBookmarks();

  // Fast path: if we have cached listings for the current client, show them
  // immediately so the page feels responsive on slow connections.
  try {
    const rawCached = localStorage.getItem('apartrent_client_listings');
    const cachedListings = rawCached ? JSON.parse(rawCached) : null;
    if (Array.isArray(cachedListings) && cachedListings.length > 0) {
      console.log('📦 Using cached client listings for fast initial render:', cachedListings.length);
      window.currentListings = cachedListings;
      renderClientListings(cachedListings);
      renderSavedFromBookmarks(cachedListings);
      attachClientCardHandlers(cachedListings);
      setupClientSearch(cachedListings);
      setupSavedSearch(cachedListings);
    }
  } catch (_) {
    // Ignore cache errors and fall back to network-only path
  }

  // Always fetch fresh listings to keep data up to date.
  const listings = await fetchListings();
  window.currentListings = listings; // Store globally for debugging

  // Persist latest listings for the next visit (used by the cache above)
  try {
    localStorage.setItem('apartrent_client_listings', JSON.stringify(listings));
  } catch (_) {}

  renderClientListings(listings);
  renderSavedFromBookmarks(listings);
  attachClientCardHandlers(listings);
  setupClientSearch(listings);
  setupSavedSearch(listings);
  hideStatusOverlay(300);
  checkRentDueDates().catch(() => {});
  // Listen for approvals and auto-switch to Rented when approved
  subscribeToClientApprovalUpdates();
  // Also listen for apartment status changes as a secondary trigger
  subscribeToApartmentStatusUpdates();
  // And reflect general apartment detail updates (price, availability, etc.) in the dashboard in realtime
  subscribeToApartmentDetailUpdates();
  // Reflect approved/accepted applications as occupied units in realtime (locks unit numbers)
  subscribeToRentalApplicationOccupancyUpdates();
  // Refresh due red-borders when landlord confirms payments as paid
  subscribeToClientPaymentReceiptUpdates();
  // Start fallback polling at a low frequency in case realtime is blocked.
  // This reduces Supabase egress while keeping behavior if Realtime is unavailable.
  try { __lastApprovedIdsSnapshot = new Set((await fetchApprovedRentalsForClient()).map(a => String(a.id))); } catch(_) {}
  setInterval(checkApprovedAndSwitch, 60000);
});

// Subscribe to apartments status updates (e.g., landlord marks rented)
function subscribeToApartmentStatusUpdates() {
  try {
    const client = initSupabaseClient();
    if (!client) return;
    try { if (window.__aptStatusChannel && typeof window.__aptStatusChannel.unsubscribe === 'function') { window.__aptStatusChannel.unsubscribe(); } } catch(_) {}
    const channel = client.channel('client-apartments-status');
    window.__aptStatusChannel = channel;
    channel
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'apartments' }, async (payload) => {
        const row = payload?.new || {};
        if (row && row.status === 'rented') {
          // Re-check rented list; if a new one appears, switch tabs via polling logic
          checkApprovedAndSwitch();
        }
      })
      .subscribe();
  } catch (_) {}
}

// Subscribe to general apartment detail updates so client dashboard reflects
// landlord changes (price, available units, etc.) without page refresh.
function subscribeToApartmentDetailUpdates() {
  try {
    const client = initSupabaseClient();
    if (!client) return;
    try {
      if (window.__aptDetailChannel && typeof window.__aptDetailChannel.unsubscribe === 'function') {
        window.__aptDetailChannel.unsubscribe();
      }
    } catch (_) {}

    const channel = client.channel('client-apartments-detail');
    window.__aptDetailChannel = channel;

    // Simple debounce so rapid bursts of updates don't trigger too many re-renders
    let pendingRender = false;

    channel
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'apartments' },
        (payload) => {
          try {
            const updated = payload?.new;
            if (!updated || !updated.id) return;

            // If we already have listings in memory, patch the single apartment
            // in-place to avoid full-page reflows.
            if (Array.isArray(window.currentListings) && window.currentListings.length) {
              const idStr = String(updated.id);
              let changed = false;
              window.currentListings = window.currentListings.map((ad) => {
                if (!ad || String(ad.id) !== idStr) return ad;
                changed = true;
                return {
                  ...ad,
                  // Only overwrite fields that naturally belong to apartments;
                  // leave derived / client-only props intact.
                  price: updated.price != null ? updated.price : ad.price,
                  location: updated.location != null ? updated.location : ad.location,
                  description: updated.description != null ? updated.description : ad.description,
                  status: updated.status != null ? updated.status : ad.status,
                  total_units: updated.total_units != null ? updated.total_units : (updated.totalUnits != null ? updated.totalUnits : ad.total_units),
                  available_units: updated.available_units != null ? updated.available_units : (updated.availableUnits != null ? updated.availableUnits : ad.available_units)
                };
              });

              if (changed) {
                if (!pendingRender) {
                  pendingRender = true;
                  setTimeout(() => {
                    try {
                      const listings = window.currentListings || [];
                      renderClientListings(listings);
                      renderSavedFromBookmarks(listings);
                      attachClientCardHandlers(listings);
                      // Existing search inputs keep working; no need to re-attach.
                    } finally {
                      pendingRender = false;
                    }
                  }, 150);
                }
              }
            }
          } catch (_) {}
        }
      )
      .subscribe();
  } catch (_) {}
}

// Subscribe to rental_applications updates so client availability reflects
// occupied units rented online (approved/accepted applications).
function subscribeToRentalApplicationOccupancyUpdates() {
  try {
    const client = initSupabaseClient();
    if (!client) return;
    try {
      if (window.__rentalAppsOccChannel && typeof window.__rentalAppsOccChannel.unsubscribe === 'function') {
        window.__rentalAppsOccChannel.unsubscribe();
      }
    } catch (_) {}

    const channel = client.channel('client-rental-applications-occupancy');
    window.__rentalAppsOccChannel = channel;

    const onRow = (payload) => {
      try {
        const row = payload?.new || payload?.record || payload?.data || null;
        if (!row) return;
        const status = String(row.status || '').toLowerCase();
        if (status !== 'approved' && status !== 'accepted') return;
        const aptId = row.apartment_id != null ? String(row.apartment_id) : '';
        if (!aptId) return;
        const unit = row.unit_number != null ? Number(row.unit_number)
          : (row.data && row.data.unit_number != null ? Number(row.data.unit_number) : null);
        if (unit == null || isNaN(unit) || unit < 1) return;

        if (Array.isArray(window.currentListings) && window.currentListings.length) {
          let changed = false;
          window.currentListings = window.currentListings.map(ad => {
            if (!ad || String(ad.id) !== aptId) return ad;
            const occ = Array.isArray(ad.occupiedUnitNumbers) ? ad.occupiedUnitNumbers : [];
            const set = new Set(occ.map(n => Number(n)).filter(n => !isNaN(n) && n >= 1));
            if (!set.has(unit)) {
              set.add(unit);
              changed = true;
            }
            return changed
              ? { ...ad, occupiedUnitNumbers: Array.from(set).sort((a, b) => a - b) }
              : ad;
          });

          if (changed) {
            const listings = window.currentListings || [];
            renderClientListings(listings);
            renderSavedFromBookmarks(listings);
            attachClientCardHandlers(listings);
          }
        }
      } catch (_) {}
    };

    channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rental_applications' }, onRow)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rental_applications' }, onRow)
      .subscribe();
  } catch (_) {}
}

// Subscribe to payment_receipts updates so due red borders clear when a payment is marked as paid.
function subscribeToClientPaymentReceiptUpdates() {
  try {
    const client = initSupabaseClient();
    if (!client) return;

    try {
      if (window.__clientPaymentReceiptsChannel && typeof window.__clientPaymentReceiptsChannel.unsubscribe === 'function') {
        window.__clientPaymentReceiptsChannel.unsubscribe();
      }
    } catch (_) {}

    (async () => {
      const { data } = await client.auth.getSession();
      const userId = data?.session?.user?.id || null;
      if (!userId) return;

      const channel = client.channel('client-payment-receipts-updates');
      window.__clientPaymentReceiptsChannel = channel;

      channel
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'payment_receipts',
            filter: `client_id=eq.${userId}`
          },
          (payload) => {
            const status = String(payload?.new?.status || '').toLowerCase();
            if (status !== 'paid') return;

            // Allow time for derived `rental_payments` view / cache to reflect the new status.
            setTimeout(() => {
              try {
                refreshClientRentedTab();
              } catch (_) {}
            }, 1200);
          }
        )
        .subscribe();
    })().catch(() => {});
  } catch (_) {}
}

// ------- Rental Application: client submit, fetch approved, render Rented tab -------
// Helper function to clear validation errors
function clearValidationErrors() {
  const rentPanel = document.querySelector('#rentClicked, .rentclicked');
  if (!rentPanel) return;
  
  // Remove error styling from all inputs
  rentPanel.querySelectorAll('input, select, textarea').forEach(el => {
    el.style.borderColor = '';
    el.style.borderWidth = '';
  });
  
  // Remove error styling from radio groups
  rentPanel.querySelectorAll('.radio-group').forEach(group => {
    group.style.border = '';
    group.style.borderRadius = '';
    group.style.padding = '';
  });
  
  // Remove error messages
  rentPanel.querySelectorAll('.field-error-message').forEach(msg => msg.remove());
}

// Helper function to show validation error
function showFieldError(fieldId, fieldLabel, isRadioGroup = false) {
  const rentPanel = document.querySelector('#rentClicked, .rentclicked');
  if (!rentPanel) return;
  
  let fieldElement;
  let parentElement;
  
  if (isRadioGroup) {
    // For radio groups, find the container
    const radioInputs = rentPanel.querySelectorAll(`input[name="${fieldId}"]`);
    if (radioInputs.length > 0) {
      fieldElement = radioInputs[0].closest('.radio-group');
      parentElement = fieldElement?.closest('.form-group');
    }
  } else {
    fieldElement = document.getElementById(fieldId);
    parentElement = fieldElement?.parentElement;
  }
  
  // Add error message (without changing border styling)
  if (parentElement) {
    const errorMsg = document.createElement('div');
    errorMsg.className = 'field-error-message';
    errorMsg.style.color = 'var(--error-color, #ef4444)';
    errorMsg.style.fontSize = '0.875rem';
    errorMsg.style.marginTop = '4px';
    errorMsg.style.display = 'flex';
    errorMsg.style.alignItems = 'center';
    errorMsg.style.gap = '6px';
    errorMsg.innerHTML = `<i class="fa-solid fa-exclamation-circle"></i> <span>${fieldLabel} is required</span>`;
    
    parentElement.appendChild(errorMsg);
  }
}

// Helper function to check if file is uploaded
function hasFileUploaded(inputId) {
  const input = document.getElementById(inputId);
  return input && input.files && input.files.length > 0;
}

async function submitRentalApplication() {
  try {
    // Clear previous validation errors
    clearValidationErrors();
    
    const client = initSupabaseClient();
    if (!client) { alert('Not connected. Please try again.'); return; }
    const { data: sess } = await client.auth.getSession();
    const userId = sess?.session?.user?.id || null;
    if (!userId) { window.location.href = 'login.html'; return; }
    const apartmentId = window.currentApartmentId || (window.currentSelectedAd && window.currentSelectedAd.id);
    if (!apartmentId) { alert('No apartment selected.'); return; }

    // Prevent multiple pending applications for the same apartment.
    // Treat "pending-ish" statuses as already submitted/in review.
    try {
      const { data: existingApp, error: existingErr } = await client
        .from('rental_applications')
        .select('id, status')
        .eq('applicant_user_id', userId)
        .eq('apartment_id', apartmentId)
        .in('status', ['pending', 'submitted', 'under_review', 'reviewed'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (existingErr) {
        console.warn('Existing application check failed:', existingErr);
      } else if (existingApp && existingApp.id) {
        showStatusOverlay('You already have a pending application for this apartment. Please wait for the landlord to review it.', 'error');
        hideStatusOverlay(2400);
        return;
      }
    } catch (_) {}

    // Gather form values from the visible rent form (inside the currently open details panel)
    const rentPanel = document.querySelector('#rentClicked, .rentclicked');
    const getVal = (id) => {
      const el = document.getElementById(id);
      return el ? (el.value || '').trim() : '';
    };
    const getRadio = (name) => {
      const el = document.querySelector(`input[name="${name}"]:checked`);
      return el ? el.value : '';
    };

    // Helper: upload a file input to Supabase Storage and return public URL
    const bucket = 'rental-attachments'; // create this bucket in Supabase Storage and make it public
    async function uploadInputPublicUrl(inputId, label) {
      try {
        const input = document.getElementById(inputId);
        const file = input && input.files && input.files[0] ? input.files[0] : null;
        if (!file) return { url: '', name: '' };
        const fileNameSafe = (file.name || `${label||inputId}`).replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `${userId}/${apartmentId}/${Date.now()}_${fileNameSafe}`;
        const { error: upErr } = await client.storage.from(bucket).upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type || 'application/octet-stream' });
        if (upErr) { console.warn('Upload error', inputId, upErr?.message || upErr); return { url: '', name: file.name || '' }; }
        const { data: pub } = client.storage.from(bucket).getPublicUrl(path);
        return { url: pub?.publicUrl || '', name: file.name || '' };
      } catch (e) {
        console.warn('Upload failed', inputId, e?.message || e);
        return { url: '', name: '' };
      }
    }

    const unitNumberRaw = getVal('selectedUnitNumber');
    const unitNumber = unitNumberRaw ? parseInt(unitNumberRaw, 10) : null;

    const application = {
      applicant_user_id: userId,
      apartment_id: apartmentId,
      status: 'pending',
      submitted_at: new Date().toISOString(),
      unit_number: (unitNumber != null && !isNaN(unitNumber) && unitNumber >= 1) ? unitNumber : null,
      // Basic Information
      fullName: getVal('fullName'),
      guardianName: getVal('guardianName'),
      emergencyContact: getVal('emergencyContact'),
      email: getVal('email'),
      phone: getVal('phone'),
      currentAddress: getVal('currentAddress'),
      // Rental Details
      moveInDate: getVal('moveInDate'),
      lengthOfStay: getVal('lengthOfStay'),
      totalOccupants: getVal('totalOccupants'),
      // Employment/Income
      employmentStatus: getVal('employmentStatus'),
      guardianEmploymentStatus: getVal('guardianEmploymentStatus'),
      monthlyIncome: getVal('monthlyIncome'),
      // Lifestyle
      hasPets: getRadio('hasPets'),
      hasVehicle: getRadio('hasVehicle'),
      additionalInfo: getVal('additionalInfo')
      // Note: Payment option will be selected during payment process
    };

    // Comprehensive validation with clear error messages
    const errors = [];
    const requirementList = (window.currentSelectedAd && Array.isArray(window.currentSelectedAd.requirements))
      ? window.currentSelectedAd.requirements.map(r => String(r).toLowerCase())
      : [];
    const hasReq = (label) => requirementList.includes(String(label).toLowerCase());
    
    // Required text/select fields
    const requiredFields = [
      { id: 'fullName', label: 'Full Name' },
      { id: 'emergencyContact', label: 'Emergency Contact Number' },
      { id: 'email', label: 'Email Address' },
      { id: 'phone', label: 'Phone Number' },
      { id: 'currentAddress', label: 'Current Address' },
      { id: 'moveInDate', label: 'Preferred Move-in Date' },
      { id: 'lengthOfStay', label: 'Length of Stay' },
      { id: 'totalOccupants', label: 'Total Occupants' }
    ];

    if (hasReq('Proof of Income')) {
      requiredFields.push(
        { id: 'employmentStatus', label: 'Employment Status' },
        { id: 'monthlyIncome', label: 'Monthly Income Range' }
      );
    }
    
    requiredFields.forEach(field => {
      if (!application[field.id] || (field.id === 'totalOccupants' && parseInt(application[field.id]) < 1)) {
        errors.push(field);
        showFieldError(field.id, field.label);
      }
    });

    // Required radio buttons
    if (hasReq('No pets agreement')) {
      if (!application.hasPets) {
        errors.push({ id: 'hasPets', label: 'Do you have pets?' });
        showFieldError('hasPets', 'Do you have pets?', true);
      }
      
      if (!application.hasVehicle) {
        errors.push({ id: 'hasVehicle', label: 'Do you own a vehicle?' });
        showFieldError('hasVehicle', 'Do you own a vehicle?', true);
      }
    }

    // Unit selection required when building has multiple available units
    const ad = window.currentSelectedAd;
    const totU = ad?.totalUnits != null ? ad.totalUnits : (ad?.total_units != null ? ad.total_units : 1);
    const occArr = Array.isArray(ad?.occupiedUnitNumbers) ? ad.occupiedUnitNumbers : [];
    const occSet = new Set(occArr.map(n => Number(n)).filter(n => !isNaN(n)));
    const availCount = totU - occSet.size;
    if (totU > 1 && availCount > 1 && (!application.unit_number || application.unit_number < 1)) {
      errors.push({ id: 'selectedUnitNumber', label: 'Select Unit' });
      const unitSection = rentPanel.querySelector('.unit-selector-section');
      if (unitSection) {
        const errMsg = unitSection.querySelector('.field-error-message');
        if (!errMsg) {
          const msg = document.createElement('div');
          msg.className = 'field-error-message';
          msg.style.cssText = 'color:var(--error-color,#ef4444);font-size:0.875rem;margin-top:4px;';
          msg.innerHTML = '<i class="fa-solid fa-exclamation-circle"></i> <span>Please select which unit you want to rent.</span>';
          unitSection.appendChild(msg);
        }
      }
    }
    
    // Required file uploads
    const requiredFiles = [];
    if (hasReq('Proof of Income')) requiredFiles.push({ id: 'proofOfIncome', label: 'Proof of Income' });
    if (hasReq('Valid ID')) requiredFiles.push({ id: 'validId', label: 'Valid ID' });
    if (hasReq('Barangay Clearance')) requiredFiles.push({ id: 'barangayClearance', label: 'Barangay Clearance' });
    if (hasReq('Police Clearance')) requiredFiles.push({ id: 'policeClearance', label: 'Police Clearance' });
    
    requiredFiles.forEach(file => {
      if (!hasFileUploaded(file.id)) {
        errors.push(file);
        showFieldError(file.id, file.label);
      }
    });
    
    // If there are errors, show alert and scroll to first error
    if (errors.length > 0) {
      const errorList = errors.map(e => `• ${e.label}`).join('\n');
      alert(`Please complete all required fields before submitting:\n\n${errorList}\n\nPlease fill in the highlighted fields and upload all required documents.`);
      
      // Scroll to first error field
      const firstErrorId = errors[0].id;
      if (errors[0].id === 'hasPets' || errors[0].id === 'hasVehicle') {
        const radioInputs = rentPanel.querySelectorAll(`input[name="${firstErrorId}"]`);
        if (radioInputs.length > 0) {
          radioInputs[0].closest('.form-group')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        const firstErrorEl = document.getElementById(firstErrorId);
        if (firstErrorEl) {
          firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          firstErrorEl.focus();
        }
      }
      return;
    }

    // Upload attachments and augment application data with public URLs
    const [proofIncome, validId, brgyClr, policeClr] = await Promise.all([
      uploadInputPublicUrl('proofOfIncome', 'proofOfIncome'),
      uploadInputPublicUrl('validId', 'validId'),
      uploadInputPublicUrl('barangayClearance', 'barangayClearance'),
      uploadInputPublicUrl('policeClearance', 'policeClearance')
    ]);
    application.proofOfIncomeUrl = proofIncome.url; application.proofOfIncomeName = proofIncome.name;
    application.validIdUrl = validId.url; application.validIdName = validId.name;
    application.barangayClearanceUrl = brgyClr.url; application.barangayClearanceName = brgyClr.name;
    application.policeClearanceUrl = policeClr.url; application.policeClearanceName = policeClr.name;

    const insertRow = {
      apartment_id: application.apartment_id,
      applicant_user_id: application.applicant_user_id,
      status: 'pending',
      data: application,
      created_at: application.submitted_at
    };
    if (application.unit_number != null && application.unit_number >= 1) {
      insertRow.unit_number = application.unit_number;
    }
    const { error } = await client.from('rental_applications').insert([insertRow]);
    if (error) { throw error; }
    showStatusOverlay('Application submitted!', 'success');
    hideStatusOverlay(1400);
    // Show it immediately in the client's "Rented Place" tab as Pending
    try { await refreshClientRentedTab(); } catch (_) { }
    try {
      const navLinks = document.querySelectorAll('.sidemenu .page');
      const contentPages = document.querySelectorAll('.sidelp');
      navLinks.forEach(l => l.classList.remove('active'));
      const rentedLink = document.querySelector('.sidemenu .page[data-target="Rented"]');
      if (rentedLink) rentedLink.classList.add('active');
      contentPages.forEach(p => p.classList.remove('actsidelp'));
      const rentedPage = document.getElementById('Rented');
      if (rentedPage) rentedPage.classList.add('actsidelp');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (_) { }
    // Optionally scroll to chat to allow follow-up
    const chatBox = document.getElementById('chatBox');
    if (chatBox) chatBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (e) {
    console.error('submitRentalApplication error:', e);
    showStatusOverlay('Failed to submit. Please try again.', 'error');
    hideStatusOverlay(1600);
  }
}

async function fetchApprovedRentalsForClient() {
  try {
    const client = initSupabaseClient();
    if (!client) return [];
    const { data: sess } = await client.auth.getSession();
    const userId = sess?.session?.user?.id || null;
  if (!userId) return [];
  // Get applications for this user (with unit_number for unit-badge)
  const { data: apps, error: appErr } = await client
      .from('rental_applications')
      .select('apartment_id, status, unit_number, data')
      .eq('applicant_user_id', userId);
  if (appErr) throw appErr;
  const approvedApps = (apps || []).filter(a => {
      const s = String(a?.status || '').toLowerCase();
      return s === 'approved' || s === 'accepted';
    });
  const ids = approvedApps.map(a => a.apartment_id).filter(Boolean);
  const aptToUnitMap = new Map();
  approvedApps.forEach(a => {
      const aptId = String(a.apartment_id);
      const unit = a.unit_number != null ? Number(a.unit_number) : (a.data?.unit_number != null ? Number(a.data.unit_number) : null);
      if (aptId && (unit == null || !isNaN(unit))) aptToUnitMap.set(aptId, unit);
    });
    if (!ids.length) return [];
    // Fetch apartment details with landlord_id
    const { data: apts, error: aptErr } = await client
      .from('apartments')
      .select('id, price, location, description, unit_size, amenities, contact, email, requirements, status, landlord_id, latitude, longitude')
      .in('id', ids);
    if (aptErr) throw aptErr;
    const list = Array.isArray(apts) ? apts : [];
    
    // Fetch landlord names for rented apartments
    const landlordIds = [...new Set(list.map(apt => apt.landlord_id).filter(Boolean))];
    let landlordNamesMap = new Map();
    
    if (landlordIds.length > 0) {
      try {
        const { data: profiles, error: profileError } = await client
          .from('profiles')
          .select('id, full_name, email')
          .in('id', landlordIds);
        
        if (!profileError && profiles) {
          profiles.forEach(profile => {
            const name = profile.full_name || 
                        profile.email?.split('@')[0] || 
                        'Property Owner';
            landlordNamesMap.set(profile.id, name);
          });
        }
      } catch (e) {
        console.warn('Could not fetch landlord names for rented apartments:', e);
      }
    }
    // Fetch images
    const { data: imgs } = await client
      .from('apartment_images')
      .select('apartment_id, image_url, is_primary, is_floorplan')
      .in('apartment_id', ids);
    const byApt = new Map();
    (imgs || []).forEach(img => {
      const key = String(img.apartment_id);
      if (!byApt.has(key)) byApt.set(key, []);
      byApt.get(key).push(img);
    });
    
    // Fetch payment methods for landlords
    let paymentMethodsMap = new Map();
    if (landlordIds.length > 0) {
      try {
        const { data: paymentMethods, error: pmErr } = await client
          .from('landlord_payment_methods')
          .select('landlord_id, payment_method, account_name, account_number, qr_code_url')
          .in('landlord_id', landlordIds);
        
        if (!pmErr && paymentMethods) {
          paymentMethods.forEach(pm => {
            if (!paymentMethodsMap.has(pm.landlord_id)) {
              paymentMethodsMap.set(pm.landlord_id, []);
            }
            paymentMethodsMap.get(pm.landlord_id).push({
              method: pm.payment_method,
              accountName: pm.account_name,
              accountNumber: pm.account_number,
              qrCodeUrl: pm.qr_code_url
            });
          });
        }
      } catch (e) {
        console.warn('Could not fetch payment methods for rented apartments:', e);
      }
    }
    
    return list.map(row => {
      const images = byApt.get(String(row.id)) || [];
      const primary = images.find(i => i.is_primary) || images[0] || null;
      const regularPhotos = images.filter(i => !(i.is_floorplan === true || i.is_floorplan === 'true' || i.is_floorplan === 1 || i.is_floorplan === '1'));
      const photoUrls = regularPhotos.map(i => i.image_url).filter(Boolean).slice(0, 6);
      const floor = images.find(i => i.is_floorplan);
      const myUnitNumber = aptToUnitMap.get(String(row.id));
      return {
        id: String(row.id),
        price: row.price,
        location: row.location,
        description: row.description,
        unitSize: row.unit_size,
        amenities: row.amenities || '',
        contact: row.contact || '',
        email: row.email || '',
        messenger: row.messenger || '',
        requirements: (() => { try { return Array.isArray(row.requirements ? JSON.parse(row.requirements) : []) ? JSON.parse(row.requirements) : []; } catch(_) { return []; } })(),
        status: row.status,
        latitude: row.latitude != null ? (typeof row.latitude === 'string' ? parseFloat(row.latitude) : row.latitude) : null,
        longitude: row.longitude != null ? (typeof row.longitude === 'string' ? parseFloat(row.longitude) : row.longitude) : null,
        primaryImageDataUrl: primary ? primary.image_url : '',
        primaryImageDataUrls: photoUrls,
        floorPlanDataUrl: floor ? floor.image_url : '',
        imagesUrls: photoUrls,
        landlord_id: row.landlord_id,
        paymentMethods: paymentMethodsMap.get(row.landlord_id) || [],
        landlord_name: landlordNamesMap.get(row.landlord_id) || 'Property Owner',
        myUnitNumber: myUnitNumber != null && !isNaN(myUnitNumber) ? myUnitNumber : null
      };
    });
  } catch (e) {
    console.warn('fetchApprovedRentalsForClient error:', e?.message || e);
    return [];
  }
}

// Client "Rented Place" tab should show:
// - approved/accepted applications as "Rented"
// - pending/submitted/under_review/reviewed applications as "Pending"
// Declined/cancelled should not show in Rented Place.
async function fetchRentedPlaceListingsForClient() {
  try {
    const client = initSupabaseClient();
    if (!client) return [];
    const { data: sess } = await client.auth.getSession();
    const userId = sess?.session?.user?.id || null;
    if (!userId) return [];

    const VISIBLE_STATUSES = ['pending', 'submitted', 'under_review', 'reviewed', 'approved', 'accepted'];

    // Pull this user's visible applications, newest first (so we can pick the latest per apartment if needed)
    const { data: apps, error: appErr } = await client
      .from('rental_applications')
      .select('apartment_id, status, unit_number, data, created_at, approved_at')
      .eq('applicant_user_id', userId)
      .in('status', VISIBLE_STATUSES)
      .order('approved_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });
    if (appErr) throw appErr;

    // Choose one application per apartment (prefer approved/accepted; otherwise newest)
    const byApt = new Map();
    for (const a of (apps || [])) {
      const aptId = a?.apartment_id != null ? String(a.apartment_id) : '';
      if (!aptId) continue;
      if (!byApt.has(aptId)) byApt.set(aptId, a);
      else {
        const cur = byApt.get(aptId);
        const curStatus = String(cur?.status || '').toLowerCase();
        const nextStatus = String(a?.status || '').toLowerCase();
        const curApproved = curStatus === 'approved' || curStatus === 'accepted';
        const nextApproved = nextStatus === 'approved' || nextStatus === 'accepted';
        if (!curApproved && nextApproved) byApt.set(aptId, a);
      }
    }

    const selectedApps = Array.from(byApt.values());
    const ids = selectedApps.map(a => a.apartment_id).filter(Boolean);
    if (!ids.length) return [];

    // Unit + status maps
    const aptToUnitMap = new Map();
    const aptToAppStatusMap = new Map();
    selectedApps.forEach(a => {
      const aptId = String(a.apartment_id);
      const unit = a.unit_number != null ? Number(a.unit_number) : (a.data?.unit_number != null ? Number(a.data.unit_number) : null);
      aptToUnitMap.set(aptId, unit != null && !isNaN(unit) ? unit : null);
      aptToAppStatusMap.set(aptId, String(a.status || '').toLowerCase());
    });

    // Fetch apartment details with landlord_id
    const { data: apts, error: aptErr } = await client
      .from('apartments')
      .select('id, price, location, description, unit_size, amenities, contact, email, requirements, status, landlord_id, latitude, longitude')
      .in('id', ids);
    if (aptErr) throw aptErr;
    const list = Array.isArray(apts) ? apts : [];

    // Fetch landlord names
    const landlordIds = [...new Set(list.map(apt => apt.landlord_id).filter(Boolean))];
    let landlordNamesMap = new Map();
    if (landlordIds.length > 0) {
      try {
        const { data: profiles, error: profileError } = await client
          .from('profiles')
          .select('id, full_name, email')
          .in('id', landlordIds);
        if (!profileError && profiles) {
          profiles.forEach(profile => {
            const name = profile.full_name ||
              profile.email?.split('@')[0] ||
              'Property Owner';
            landlordNamesMap.set(profile.id, name);
          });
        }
      } catch (e) {
        console.warn('Could not fetch landlord names for rented place listings:', e);
      }
    }

    // Fetch images
    const { data: imgs } = await client
      .from('apartment_images')
      .select('apartment_id, image_url, is_primary, is_floorplan')
      .in('apartment_id', ids);
    const imagesByApt = new Map();
    (imgs || []).forEach(img => {
      const key = String(img.apartment_id);
      if (!imagesByApt.has(key)) imagesByApt.set(key, []);
      imagesByApt.get(key).push(img);
    });

    // Fetch payment methods for landlords (used only when approved)
    let paymentMethodsMap = new Map();
    if (landlordIds.length > 0) {
      try {
        const { data: paymentMethods, error: pmErr } = await client
          .from('landlord_payment_methods')
          .select('landlord_id, payment_method, account_name, account_number, qr_code_url')
          .in('landlord_id', landlordIds);
        if (!pmErr && paymentMethods) {
          paymentMethods.forEach(pm => {
            if (!paymentMethodsMap.has(pm.landlord_id)) paymentMethodsMap.set(pm.landlord_id, []);
            paymentMethodsMap.get(pm.landlord_id).push({
              method: pm.payment_method,
              accountName: pm.account_name,
              accountNumber: pm.account_number,
              qrCodeUrl: pm.qr_code_url
            });
          });
        }
      } catch (e) {
        console.warn('Could not fetch payment methods for rented place listings:', e);
      }
    }

    // Map apartment -> view model
    return list.map(row => {
      const aptId = String(row.id);
      const images = imagesByApt.get(aptId) || [];
      const primary = images.find(i => i.is_primary) || images[0] || null;
      const regularPhotos = images.filter(i => !(i.is_floorplan === true || i.is_floorplan === 'true' || i.is_floorplan === 1 || i.is_floorplan === '1'));
      const photoUrls = regularPhotos.map(i => i.image_url).filter(Boolean).slice(0, 6);
      const floor = images.find(i => i.is_floorplan);
      const appStatus = aptToAppStatusMap.get(aptId) || '';
      const isApproved = appStatus === 'approved' || appStatus === 'accepted';
      return {
        id: aptId,
        price: row.price,
        location: row.location,
        description: row.description,
        unitSize: row.unit_size,
        amenities: row.amenities || '',
        contact: row.contact || '',
        email: row.email || '',
        messenger: row.messenger || '',
        requirements: (() => { try { return Array.isArray(row.requirements ? JSON.parse(row.requirements) : []) ? JSON.parse(row.requirements) : []; } catch (_) { return []; } })(),
        status: row.status,
        latitude: row.latitude != null ? (typeof row.latitude === 'string' ? parseFloat(row.latitude) : row.latitude) : null,
        longitude: row.longitude != null ? (typeof row.longitude === 'string' ? parseFloat(row.longitude) : row.longitude) : null,
        primaryImageDataUrl: primary ? primary.image_url : '',
        primaryImageDataUrls: photoUrls,
        floorPlanDataUrl: floor ? floor.image_url : '',
        imagesUrls: photoUrls,
        paymentMethods: isApproved ? (paymentMethodsMap.get(row.landlord_id) || []) : [],
        landlord_name: landlordNamesMap.get(row.landlord_id) || 'Property Owner',
        myUnitNumber: aptToUnitMap.get(aptId),
        applicationStatus: appStatus,
        rentedPlaceLabel: isApproved ? 'rented' : 'pending'
      };
    });
  } catch (e) {
    console.warn('fetchRentedPlaceListingsForClient error:', e?.message || e);
    return [];
  }
}

function monthStamp(d) {
  if (!d || isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function isSuccessfulPaymentStatus(status) {
  const v = String(status || '').toLowerCase();
  return v === 'succeeded' || v === 'completed' || v === 'success';
}

function inferIsMonthlyRentPayment(payment, expectedMonthlyRent) {
  const md = payment?.metadata || {};
  const pt = String(md?.payment_type || md?.paymentType || '').toLowerCase();
  if (pt.includes('monthly')) return true;

  const breakdown = md?.payment_breakdown || md?.paymentBreakdown || {};
  const mr =
    breakdown?.monthlyRent ??
    breakdown?.monthly_rent ??
    breakdown?.monthlyRentPHP ??
    expectedMonthlyRent;

  const amountNum =
    typeof payment?.amount === 'string'
      ? parseFloat(payment.amount)
      : Number(payment?.amount);

  const monthlyNum = typeof mr === 'string' ? parseFloat(mr) : Number(mr);
  if (Number.isFinite(monthlyNum) && Number.isFinite(amountNum) && monthlyNum > 0) {
    // Allow a bit of variance for processing fees / slight rounding.
    return amountNum <= monthlyNum * 1.2 && amountNum >= monthlyNum * 0.2;
  }

  if (Number.isFinite(amountNum) && Number.isFinite(expectedMonthlyRent) && expectedMonthlyRent > 0) {
    return amountNum <= expectedMonthlyRent * 1.2;
  }

  // If we can't tell, don't block clearing. Assume it's monthly.
  return true;
}

async function fetchClientDueApartmentMapForRented(listings) {
  const client = initSupabaseClient();
  if (!client) return new Map();

  const userId = await getCurrentUserId();
  if (!userId) return new Map();

  const apartmentIds = [...new Set((listings || []).map((l) => String(l?.id)).filter(Boolean))];
  if (!apartmentIds.length) return new Map();

  const dueMap = new Map(); // apartmentId -> { dueSt, dueMonth, paid, monthlyRent }

  // 1) Load rentals for due computation (move_in_date -> due date)
  let rentalsQuery = client
    .from('apartment_rentals')
    .select('apartment_id, move_in_date, monthly_rent')
    .eq('user_id', userId)
    .eq('rental_status', 'active')
    .limit(500);

  if (apartmentIds.length === 1) {
    rentalsQuery = rentalsQuery.eq('apartment_id', apartmentIds[0]);
  } else {
    rentalsQuery = rentalsQuery.in('apartment_id', apartmentIds);
  }

  const { data: rentals, error: rentalsErr } = await rentalsQuery;
  if (rentalsErr || !Array.isArray(rentals)) return dueMap;

  for (const r of rentals) {
    const aptIdStr = r?.apartment_id != null ? String(r.apartment_id) : null;
    const moveIn = r?.move_in_date;
    if (!aptIdStr) continue;
    const dueSt = getRentDueStatusFromMoveIn(moveIn);
    if (!dueSt || dueSt.daysUntil > 0) continue;

    const dueMonth = monthStamp(dueSt.dueDate);
    const monthlyRent = r?.monthly_rent != null ? Number(r.monthly_rent) : null;
    if (!dueMonth) continue;
    dueMap.set(aptIdStr, { dueSt, dueMonth, paid: false, monthlyRent });
  }

  if (!dueMap.size) return dueMap;

  // 2) Load successful payments to clear the due border for this due month
  let paymentsQuery = client
    .from('rental_payments')
    .select('apartment_id, created_at, payment_status, amount, metadata')
    .eq('client_id', userId)
    .order('created_at', { ascending: false })
    .limit(500);

  if (apartmentIds.length === 1) {
    paymentsQuery = paymentsQuery.eq('apartment_id', apartmentIds[0]);
  } else {
    paymentsQuery = paymentsQuery.in('apartment_id', apartmentIds);
  }

  try {
    const { data: payments, error: payErr } = await paymentsQuery;
    if (!payErr && Array.isArray(payments)) {
      for (const p of payments) {
        if (!isSuccessfulPaymentStatus(p?.payment_status)) continue;
        const aptIdStr = p?.apartment_id != null ? String(p.apartment_id) : null;
        if (!aptIdStr) continue;
        const dueEntry = dueMap.get(aptIdStr);
        if (!dueEntry || dueEntry.paid) continue;

        const paidMonth = monthStamp(new Date(p?.created_at));
        if (!paidMonth || paidMonth !== dueEntry.dueMonth) continue;

        const expected = dueEntry.monthlyRent != null ? Number(dueEntry.monthlyRent) : null;
        if (inferIsMonthlyRentPayment(p, expected)) {
          dueEntry.paid = true;
          dueMap.set(aptIdStr, dueEntry);
        }
      }
    }
  } catch (_) {
    // If payments query fails, keep due borders visible.
  }

  return dueMap;
}

async function renderClientRentedListings(listings) {
  const container = document.querySelector('#Rented .availistings');
  const emptyStateEl = document.getElementById('noRentedListingsMessage');
  
  console.log('Rendering rented listings:', listings?.length || 0, 'apartments');
  
  if (!container) return;
  
  // Clear container
  container.innerHTML = '';
  
  // If no listings, show the "no rented apartment" message
  if (!listings || listings.length === 0) {
    // Hide any open rented details panel because there is nothing rented anymore
    try {
      const rentedPage = document.getElementById('Rented');
      if (rentedPage) {
        rentedPage.removeAttribute('data-detail-open');
        const rentedSelected = rentedPage.querySelector(
          '#selectedRightSide, .selectedRightSide, .selectedrightside'
        );
        if (rentedSelected) {
          rentedSelected.style.display = 'none';
        }
      }
      if (typeof clearClientModalState === 'function') {
        clearClientModalState();
      }
    } catch (_) {}

    if (emptyStateEl) {
      emptyStateEl.style.display = 'block';
    }
    return;
  }

  // We have listings, hide the empty state
  if (emptyStateEl) {
    emptyStateEl.style.display = 'none';
  }

  let dueMap = new Map();
  try {
    dueMap = await fetchClientDueApartmentMapForRented(listings);
  } catch (_) {}

  (listings || []).forEach(ad => {
    const appStatus = String(ad.applicationStatus || ad.rentedPlaceLabel || '').toLowerCase();
    const isApproved = appStatus === 'approved' || appStatus === 'accepted' || appStatus === 'rented';
    const statusPill = (() => {
      const label = isApproved ? 'Rented' : 'Pending';
      const bg = isApproved ? 'rgba(16,185,129,0.95)' : 'rgba(245,158,11,0.95)'; // green / amber
      return `<div class="app-status-pill" style="position:absolute;top:8px;left:50%;transform:translateX(-50%);background:${bg};color:#fff;padding:5px 10px;border-radius:999px;font-size:0.75rem;font-weight:800;box-shadow:0 2px 10px rgba(0,0,0,0.22);letter-spacing:0.2px;">${label}</div>`;
    })();
    const card = document.createElement('div');
    card.className = 'outer';
    card.dataset.adId = ad.id;
    
    // Red border for due/overdue monthly rent that is not paid yet
    try {
      const dueEntry = dueMap.get(String(ad.id));
      if (isApproved && dueEntry && !dueEntry.paid) {
        card.classList.add('outer-due-unit');
        const dueDateStr = dueEntry.dueSt.dueDate.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
        const extra = dueEntry.dueSt.daysUntil === 0
          ? `Rent due today (${dueDateStr})`
          : `Rent due (${dueDateStr}), overdue by ${Math.abs(dueEntry.dueSt.daysUntil)} day(s)`;
        card.title = extra;
      }
    } catch (_) {}

    // photos: carousel or single
    const photoUrls = ad.primaryImageDataUrls || ad.imagesUrls || [];
    const limited = photoUrls.length > 6 ? photoUrls.slice(0, 6) : photoUrls;
    let photoHtml = '';
    if (limited.length > 1) {
      photoHtml = `
        <div class="photo-carousel" style="position:relative;width:100%;height:100%;display:flex;justify-content:center;align-items:center;">
          <button type="button" class="pc-prev" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);z-index:2;background:rgba(0,0,0,0.4);color:#fff;border:none;border-radius:50%;width:32px;height:32px;cursor:pointer">‹</button>
          <img class="pc-image" src="${limited[0]}" alt="photos" style="width:100%;height:100%;object-fit:cover;border-radius:12px"/>
          <button type="button" class="pc-next" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);z-index:2;background:rgba(0,0,0,0.4);color:#fff;border:none;border-radius:50%;width:32px;height:32px;cursor:pointer">›</button>
          <div class="pc-dots" style="position:absolute;left:0;right:0;bottom:8px;display:flex;gap:6px;justify-content:center;z-index:2"></div>
          <div class="pc-counter" style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,0.6);color:#fff;padding:4px 8px;border-radius:12px;font-size:12px;z-index:2">1/${limited.length}</div>
        </div>`;
    } else if (ad.primaryImageDataUrl) {
      photoHtml = `<img src="${ad.primaryImageDataUrl}" alt="photos" style="width:100%;height:100%;object-fit:cover;border-radius:12px"/>`;
    } else {
      photoHtml = `<img src="final logo.PNG" alt="photos">`;
    }
    const unitBadgeHtml = ad.myUnitNumber != null
      ? `<div class="unit-badge" style="position:absolute;top:8px;left:8px;background:rgba(15,23,42,0.9);color:#fff;padding:5px 10px;border-radius:8px;font-size:0.8rem;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,0.2);">Unit ${ad.myUnitNumber}</div>`
      : '';
    const actionBtnHtml = isApproved
      ? `<button class="status-toggle" data-ad-id="${ad.id}">Leave Apartment</button>`
      : `<button class="status-toggle pending" data-ad-id="${ad.id}" disabled style="opacity:0.65; cursor:not-allowed;" title="Your application is pending approval.">Pending</button>`;
    card.innerHTML = `
      <div class="photo" style="position:relative;">${photoHtml}${unitBadgeHtml}${statusPill}</div>
      <div class="listinfo">
        <div class="listinfoleft">
          <div class="price-location">₱${ad.price} - ${ad.location}</div>
          <div class="landlord-info">
            <i class="fa-solid fa-user"></i>
            <span class="landlord-name">${ad.landlord_name || 'Property Owner'}</span>
          </div>
        </div>
        ${actionBtnHtml}
      </div>`;
    // Handle "Leave Apartment" action similar to landlord remove tenant
    card.addEventListener('click', function (e) {
      const toggleBtn = e.target && e.target.closest('.status-toggle');
      if (!toggleBtn) return;
      e.stopPropagation();
      const adId = toggleBtn.getAttribute('data-ad-id');
      if (!adId) return;
      if (toggleBtn.disabled) return;
      if (!confirm('Are you sure you want to leave this apartment?')) return;
      (async () => {
        try {
          const client = initSupabaseClient();
          if (!client) throw new Error('Not connected');
          const { data: sess } = await client.auth.getSession();
          const userId = sess?.session?.user?.id || null;
          
          // Delete this user's application so they have no conflicts when leaving
          // RLS policy ensures clients can only delete their own applications
          if (userId) {
            // First, delete all payment receipts (transaction history) for this user and apartment
            const { error: deletePaymentErr } = await client
              .from('payment_receipts')
              .delete()
              .eq('client_id', userId)
              .eq('apartment_id', adId);
            if (deletePaymentErr) console.warn('Failed to delete payment receipts:', deletePaymentErr);
            
            // Then delete the rental application
            const { error: deleteErr } = await client
              .from('rental_applications')
              .delete()
              .eq('apartment_id', adId)
              .eq('applicant_user_id', userId);
            if (deleteErr) throw deleteErr;
          }
          // Clear any persisted modal state for rented details so they don't reopen
          if (typeof clearClientModalState === 'function') {
            clearClientModalState();
          }

          // Refresh client's rented tab list
          await refreshClientRentedTab();

          // Ensure rented details/payment views reflect that the client has left
          try {
            // Update the payment container empty state/details
            if (typeof populateRentedApartmentInPaymentContainer === 'function') {
              await populateRentedApartmentInPaymentContainer();
            }

            // Hide any open rented details panel and reset its page flag
            const rentedPage = document.getElementById('Rented');
            if (rentedPage) {
              rentedPage.removeAttribute('data-detail-open');
              const rentedSelected = rentedPage.querySelector(
                '#selectedRightSide, .selectedRightSide, .selectedrightside'
              );
              if (rentedSelected) {
                rentedSelected.style.display = 'none';
              }
            }
          } catch (uiErr) {
            console.warn('Post-leave rented UI cleanup failed:', uiErr);
          }
          // Optionally navigate to main listings/dashboard for the client
          try {
            const navLinks = document.querySelectorAll('.sidemenu .page');
            const contentPages = document.querySelectorAll('.sidelp');
            navLinks.forEach(l => l.classList.remove('active'));
            const dashLink = document.querySelector('.sidemenu .page[data-target="Dashboard"]');
            if (dashLink) dashLink.classList.add('active');
            contentPages.forEach(p => p.classList.remove('actsidelp'));
            const dashPage = document.getElementById('Dashboard');
            if (dashPage) dashPage.classList.add('actsidelp');
          } catch (_) { }

          // Refresh client dashboard listings so the vacated unit shows as available
          try {
            if (typeof fetchListings === 'function' && typeof renderClientListings === 'function') {
              const listings = await fetchListings();
              renderClientListings(listings);
              if (typeof renderSavedFromBookmarks === 'function') {
                renderSavedFromBookmarks(listings);
              }
              if (typeof attachClientCardHandlers === 'function') {
                attachClientCardHandlers(listings);
              }
            } else if (typeof window.forceRefresh === 'function') {
              // Fallback to existing helper if available
              await window.forceRefresh();
            }
          } catch (refreshErr) {
            console.warn('Failed to refresh client dashboard after leaving apartment:', refreshErr);
          }
          alert('You have left the apartment.');
        } catch (err) {
          console.error('Leave Apartment failed:', err);
          alert('Failed to leave apartment. Please try again.');
        }
      })();
    });
    // Wire carousel if any
    if (limited.length > 1) {
      const imgEl = card.querySelector('.pc-image');
      const prevBtn = card.querySelector('.pc-prev');
      const nextBtn = card.querySelector('.pc-next');
      const dotsEl = card.querySelector('.pc-dots');
      const counterEl = card.querySelector('.pc-counter');
      let idx = 0;
      dotsEl.innerHTML = limited.map((_, i) => `<span data-idx="${i}" style="width:8px;height:8px;border-radius:50%;background:${i===0?'#fff':'rgba(255,255,255,0.6)'};display:inline-block;cursor:pointer"></span>`).join('');
      function update(n) {
        if (n < 0) n = limited.length - 1;
        if (n >= limited.length) n = 0;
        idx = n;
        imgEl.src = limited[idx];
        counterEl.textContent = `${idx + 1}/${limited.length}`;
        dotsEl.querySelectorAll('span').forEach((d, i) => {
          d.style.background = i === idx ? '#fff' : 'rgba(255,255,255,0.6)';
        });
      }
      prevBtn.addEventListener('click', (ev) => { ev.stopPropagation(); update(idx - 1); });
      nextBtn.addEventListener('click', (ev) => { ev.stopPropagation(); update(idx + 1); });
      dotsEl.addEventListener('click', (ev) => {
        const dot = ev.target.closest('span[data-idx]');
        if (!dot) return;
        ev.stopPropagation();
        update(parseInt(dot.getAttribute('data-idx'), 10));
      });
    }
    container.appendChild(card);

    // Open rented details view on click and populate info, photos, reviews
    card.addEventListener('click', async function (e) {
      // Don't open details if the Leave Apartment button was clicked
      if (e.target && e.target.closest('.status-toggle')) return;
      
      // remember selection and scope chat to this apartment
      window.currentSelectedAd = ad;
      window.currentApartmentId = ad.id;
      
      // Initialize chat for this rented apartment
      listenForFloatingMessages();
      
      // Update chat header with landlord name if available
      if (ad.owner_name) {
        const chatName = document.getElementById('floatingChatName');
        if (chatName) {
          chatName.textContent = ad.owner_name;
        }
      }

      const rentedPage = document.getElementById('Rented');
      const selected = rentedPage ? rentedPage.querySelector('.selectedrightside, #selectedRightSide') : null;
      if (!rentedPage || !selected) return;

      // Show details panel; hide list area siblings
      rentedPage.querySelectorAll(':scope > div').forEach(el => {
        if (el !== selected) el.style.display = 'none';
      });
      selected.style.display = 'flex';
      rentedPage.setAttribute('data-detail-open', 'true');
      persistClientModalState({
        type: 'rented-details',
        adId: ad.id
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Populate details
      const priceEl = selected.querySelector('.button-bar .price p, .price p');
      if (priceEl) priceEl.textContent = `₱${ad.price}`;
      const locEl = selected.querySelector('.button-bar .location p, .location p');
      if (locEl) locEl.textContent = ad.location || 'Location';

      // Photos in the top details area
      const heroWrap = selected.querySelector('.availphts .photos, .availrentphts .rentphotos, .photos');
      if (heroWrap && typeof renderClientPhotos === 'function') {
        renderClientPhotos(heroWrap, ad);
      }

      // Load client transaction history for this rented apartment only
      if (typeof refreshClientTransactionHistory === 'function') {
        refreshClientTransactionHistory(ad.id).catch(function() {});
      }

      // Long description and attributes (use same structure as dashboard)
      const detsInfo = selected.querySelector('.fuldetails .detsinfo');
      if (detsInfo) {
        let paymentMethodsText = '';
        if (ad.paymentMethods && ad.paymentMethods.length > 0) {
          paymentMethodsText = ad.paymentMethods.map(pm => {
            return pm.method.charAt(0).toUpperCase() + pm.method.slice(1);
          }).join(', ');
        } else {
          paymentMethodsText = 'No payment methods available';
        }

        detsInfo.innerHTML = `
          <p><strong>Description:</strong><br>${ad.description || ''}</p>
          <p><strong>Address:</strong><br>${ad.location || ''}</p>
          <p><strong>Unit type:</strong><br>${ad.unitSize || ''}</p>
          <p><strong>Units:</strong><br>This is the apartment unit you rented${ad.myUnitNumber != null && !isNaN(Number(ad.myUnitNumber)) ? `: Unit ${Number(ad.myUnitNumber)}` : ''}.</p>
          <p><strong>Amenities:</strong><br>${ad.amenities || ''}</p>
          <p><strong>Requirements:</strong><br>${(ad.requirements || []).map(r => `- ${r}`).join('<br>')}</p>
          <p><strong>Floor Plan:</strong><br>${ad.floorPlanDataUrl ? `<a href="#" id="viewFloorPlanLink">View Floor Plan</a>` : 'None'}</p>
          <p><strong>Payment Method:</strong><br>${paymentMethodsText}</p>
        `;
      }

      // View application button (fetch latest application for this apartment)
      const viewAppBtn = selected.querySelector('#viewMyApplicationBtn');
      if (viewAppBtn) {
        viewAppBtn.onclick = async function () {
          try {
            const client = initSupabaseClient();
            if (!client) {
              openClientApplicationModal(null);
              return;
            }
            const { data: sess } = await client.auth.getSession();
            const userId = sess?.session?.user?.id || null;
            if (!userId) {
              openClientApplicationModal(null);
              return;
            }
            const { data: apps, error: appErr } = await client
              .from('rental_applications')
              .select('apartment_id, status, unit_number, data, created_at, approved_at')
              .eq('apartment_id', ad.id)
              .eq('applicant_user_id', userId)
              .order('approved_at', { ascending: false, nullsFirst: false })
              .order('created_at', { ascending: false })
              .limit(1);
            if (appErr) throw appErr;
            ad.myApplication = (apps && apps[0]) ? apps[0] : null;
            openClientApplicationModal(ad.myApplication);
          } catch (e) {
            console.warn('Failed to fetch application for rented unit:', e?.message || e);
            openClientApplicationModal(null);
          }
        };
      }

      // Contact card phone
      const contactPhone = selected.querySelector('.contact-card .contact-option span');
      if (contactPhone && ad.contact) contactPhone.textContent = ad.contact;
      
      // Update landlord email
      const landlordEmail = selected.querySelector('.contact-card .landlord-email');
      if (landlordEmail && ad.email) landlordEmail.textContent = ad.email;

      // Load and render existing reviews for this apartment
      try { await renderApartmentReviews(ad.id, selected); } catch (_) {}
    });
  });

  if (typeof restoreClientModalState === 'function') {
    restoreClientModalState(window.currentListings || listings);
  }
}

async function refreshClientRentedTab() {
  const listings = await fetchRentedPlaceListingsForClient();
  await renderClientRentedListings(listings);
}

function closeClientApplicationModal() {
  try {
    const modal = document.getElementById('clientApplicationModal');
    if (modal) modal.style.display = 'none';
  } catch (_) {}
}

function openClientApplicationModal(app) {
  const modal = document.getElementById('clientApplicationModal');
  const metaEl = document.getElementById('clientApplicationMeta');
  const bodyEl = document.getElementById('clientApplicationBody');
  if (!modal || !metaEl || !bodyEl) return;

  if (!app || !app.data) {
    metaEl.textContent = 'No saved application details for this apartment.';
    bodyEl.innerHTML = '';
    modal.style.display = 'flex';
    return;
  }

  const d = app.data || {};
  const status = String(app.status || '—');
  // Format timestamps in Philippines time (Asia/Manila) for readability.
  const formatPH = (isoLike) => {
    if (!isoLike) return '—';
    const dt = new Date(isoLike);
    if (isNaN(dt.getTime())) return String(isoLike);
    try {
      return new Intl.DateTimeFormat('en-PH', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).format(dt);
    } catch (_) {
      // Fallback if Intl/timeZone isn't available
      return dt.toLocaleString('en-PH');
    }
  };
  const prettyStatus = status
    ? status.charAt(0).toUpperCase() + status.slice(1)
    : '—';
  const submittedAt = formatPH(app.created_at);
  const approvedAt = formatPH(app.approved_at);
  metaEl.textContent = approvedAt !== '—'
    ? `Application: ${prettyStatus} • Approved: ${approvedAt}`
    : `Application: ${prettyStatus} • Submitted: ${submittedAt}`;
  const fields = [];
  if (d.fullName) fields.push(`<div class="client-application-field"><div class="client-application-label">Full name</div><div class="client-application-value">${d.fullName}</div></div>`);
  if (d.guardianName) fields.push(`<div class="client-application-field"><div class="client-application-label">Guardian</div><div class="client-application-value">${d.guardianName}</div></div>`);
  if (d.emergencyContact) fields.push(`<div class="client-application-field"><div class="client-application-label">Emergency contact</div><div class="client-application-value">${d.emergencyContact}</div></div>`);
  if (d.email) fields.push(`<div class="client-application-field"><div class="client-application-label">Email</div><div class="client-application-value">${d.email}</div></div>`);
  if (d.phone) fields.push(`<div class="client-application-field"><div class="client-application-label">Phone</div><div class="client-application-value">${d.phone}</div></div>`);
  if (d.currentAddress) fields.push(`<div class="client-application-field"><div class="client-application-label">Current address</div><div class="client-application-value">${d.currentAddress}</div></div>`);
  if (d.moveInDate) fields.push(`<div class="client-application-field"><div class="client-application-label">Move-in date</div><div class="client-application-value">${d.moveInDate}</div></div>`);
  if (d.lengthOfStay) fields.push(`<div class="client-application-field"><div class="client-application-label">Length of stay</div><div class="client-application-value">${d.lengthOfStay}</div></div>`);
  if (d.totalOccupants != null) fields.push(`<div class="client-application-field"><div class="client-application-label">Total occupants</div><div class="client-application-value">${d.totalOccupants}</div></div>`);
  if (d.hasPets !== undefined && d.hasPets !== null && d.hasPets !== '') {
    fields.push(`<div class="client-application-field"><div class="client-application-label">Has pets</div><div class="client-application-value">${d.hasPets}</div></div>`);
  }
  if (d.hasVehicle !== undefined && d.hasVehicle !== null && d.hasVehicle !== '') {
    fields.push(`<div class="client-application-field"><div class="client-application-label">Has vehicle</div><div class="client-application-value">${d.hasVehicle}</div></div>`);
  }
  if (d.employmentStatus) fields.push(`<div class="client-application-field"><div class="client-application-label">Employment status</div><div class="client-application-value">${d.employmentStatus}</div></div>`);
  if (d.monthlyIncome) fields.push(`<div class="client-application-field"><div class="client-application-label">Monthly income</div><div class="client-application-value">${d.monthlyIncome}</div></div>`);
  if (d.additionalInfo) {
    fields.push(`<div class="client-application-field"><div class="client-application-label">Additional information</div><div class="client-application-value">${(d.additionalInfo || '').replace(/\n/g, '<br>')}</div></div>`);
  }
  // Uploaded requirements
  const attachments = [];
  function buildAttachmentPill(url, name, fallbackLabel) {
    const label = name || fallbackLabel;
    const lower = (url || '').toLowerCase();
    const isImage = lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp') || lower.endsWith('.gif');
    if (!url) return '';
    if (isImage) {
      return `<button type="button" class="attachment-pill" onclick="openRequirementImageViewer('${url.replace(/'/g, '\\\'')}')"><span>${label}</span></button>`;
    }
    return `<a href="${url}" target="_blank" rel="noopener" class="attachment-pill"><span>${label}</span></a>`;
  }
  if (d.proofOfIncomeUrl) {
    attachments.push(buildAttachmentPill(d.proofOfIncomeUrl, d.proofOfIncomeName, 'Proof of Income'));
  }
  if (d.validIdUrl) {
    attachments.push(buildAttachmentPill(d.validIdUrl, d.validIdName, 'Valid ID'));
  }
  if (d.barangayClearanceUrl) {
    attachments.push(buildAttachmentPill(d.barangayClearanceUrl, d.barangayClearanceName, 'Barangay Clearance'));
  }
  if (d.policeClearanceUrl) {
    attachments.push(buildAttachmentPill(d.policeClearanceUrl, d.policeClearanceName, 'Police Clearance'));
  }
  if (attachments.length > 0) {
    fields.push(
      `<div class="client-application-field client-application-attachments"><div class="client-application-label">Uploaded requirements</div><div class="client-application-value">${attachments.join('')}</div></div>`
    );
  }
  bodyEl.innerHTML = fields.join('') || '<div>No additional details.</div>';
  modal.style.display = 'flex';
}

function openRequirementImageViewer(url) {
  try {
    const modal = document.getElementById('requirementImageModal');
    const img = document.getElementById('requirementImage');
    if (!modal || !img || !url) return;
    img.src = url;
    modal.classList.add('show');
  } catch (e) {
    console.warn('Failed to open requirement image viewer:', e);
  }
}

function closeRequirementImageViewer() {
  try {
    const modal = document.getElementById('requirementImageModal');
    const img = document.getElementById('requirementImage');
    if (modal) modal.classList.remove('show');
    if (img) img.src = '';
  } catch (e) {
    console.warn('Failed to close requirement image viewer:', e);
  }
}

// Fallback: poll for approvals and auto-switch to Rented when detected
let __lastApprovedIdsSnapshot = new Set();
async function checkApprovedAndSwitch() {
  try {
    const rented = await fetchApprovedRentalsForClient();
    // Build current set
    const current = new Set((rented || []).map(a => String(a.id)));
    // If newly approved appears, refresh UI and switch tab
    let hasNew = false;
    current.forEach(id => { if (!__lastApprovedIdsSnapshot.has(id)) hasNew = true; });
    __lastApprovedIdsSnapshot = current;
    if (hasNew) {
      renderClientRentedListings(rented);
      // Switch UI to Rented tab
      try {
        const navLinks = document.querySelectorAll('.sidemenu .page');
        const contentPages = document.querySelectorAll('.sidelp');
        navLinks.forEach(l => l.classList.remove('active'));
        const rentedLink = document.querySelector('.sidemenu .page[data-target="Rented"]');
        if (rentedLink) rentedLink.classList.add('active');
        contentPages.forEach(p => p.classList.remove('actsidelp'));
        const rentedPage = document.getElementById('Rented');
        if (rentedPage) rentedPage.classList.add('actsidelp');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (_) {}
    }
  } catch (_) {}
}

// Attach Rent Now submit button handler inside rent form
document.addEventListener('DOMContentLoaded', function () {
  // Any button with text "Rent Now!" inside a .rentclicked should submit
  document.body.addEventListener('click', function (e) {
    const btn = e.target.closest('.rentclicked .savechangesbtns button');
    if (!btn) return;
    const label = (btn.textContent || '').trim().toLowerCase();
    // Treat either "Rent Now!" or "Send" as submit
    if (label.includes('rent now') || label === 'send') {
      e.preventDefault();
      submitRentalApplication();
    }
  });
  
  // Clear validation errors when user interacts with form fields
  function setupValidationClearListeners() {
    const rentPanel = document.querySelector('#rentClicked, .rentclicked');
    if (!rentPanel) return;
    
    // Clear errors on input/change for text, select, textarea, and file inputs
    rentPanel.addEventListener('input', function(e) {
      if (e.target.matches('input[type="text"], input[type="email"], input[type="number"], input[type="date"], input[type="file"], select, textarea')) {
        const fieldId = e.target.id;
        if (fieldId) {
          const field = document.getElementById(fieldId);
          if (field) {
            field.style.borderColor = '';
            field.style.borderWidth = '';
            const errorMsg = field.parentElement?.querySelector('.field-error-message');
            if (errorMsg) errorMsg.remove();
          }
        }
      }
    });
    
    // Clear errors on change for selects
    rentPanel.addEventListener('change', function(e) {
      if (e.target.matches('select, input[type="file"]')) {
        const fieldId = e.target.id;
        if (fieldId) {
          const field = document.getElementById(fieldId);
          if (field) {
            field.style.borderColor = '';
            field.style.borderWidth = '';
            const errorMsg = field.parentElement?.querySelector('.field-error-message');
            if (errorMsg) errorMsg.remove();
          }
        }
      }
    });
    
    // Clear errors when radio buttons are selected
    rentPanel.addEventListener('change', function(e) {
      if (e.target.matches('input[type="radio"]')) {
        const radioName = e.target.name;
        const radioGroup = e.target.closest('.radio-group');
        if (radioGroup) {
          radioGroup.style.border = '';
          radioGroup.style.borderRadius = '';
          radioGroup.style.padding = '';
          const errorMsg = radioGroup.parentElement?.querySelector('.field-error-message');
          if (errorMsg) errorMsg.remove();
        }
      }
    });
  }
  
  // Setup validation clear listeners
  setupValidationClearListeners();
  
  // Re-setup when rent form is shown (in case it's dynamically shown)
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
        const target = mutation.target;
        if (target.classList.contains('rentclicked') || target.id === 'rentClicked') {
          const isVisible = target.style.display !== 'none' && !target.hasAttribute('hidden');
          if (isVisible) {
            setupValidationClearListeners();
          }
        }
      }
    });
  });
  
  // Observe rent clicked containers
  document.querySelectorAll('#rentClicked, .rentclicked').forEach(el => {
    observer.observe(el, { attributes: true, attributeFilter: ['style'] });
  });
  
  // Initial and periodic refresh of Rented tab
  refreshClientRentedTab();
  // Low-frequency safety refresh for rented tab. Most updates come from Realtime.
  setInterval(refreshClientRentedTab, 60000);
});




// ------- Reviews (client side) -------
// Schema expected:
// table public.reviews (
//   id uuid pk default uuid_generate_v4(),
//   apartment_id uuid references public.apartments(id) on delete cascade,
//   user_id uuid references auth.users(id) on delete cascade,
//   rating int check (rating between 1 and 5),
//   comment text,
//   created_at timestamptz default now()
// ) with RLS allowing select all and insert by owner (user_id = auth.uid())

async function renderApartmentReviews(apartmentId, contextEl) {
  try {
    const client = initSupabaseClient();
    if (!client) return;
    const { data: sess } = await client.auth.getSession();
    const currentUserId = sess?.session?.user?.id || null;
  const { data: rows } = await client
      .from('reviews')
      .select('user_id, rating, comment, created_at')
      .eq('apartment_id', apartmentId)
      .eq('visible', true)
      .order('created_at', { ascending: false })
      .limit(50);

    // Only allow reviews from renters who actually rented this apartment (approved/accepted)
    let eligibleUserIds = new Set();
    try {
      const { data: apps } = await client
        .from('rental_applications')
        .select('applicant_user_id, status')
        .eq('apartment_id', apartmentId)
        .in('status', ['approved', 'accepted']);
      (apps || []).forEach(a => { if (a && a.applicant_user_id) eligibleUserIds.add(a.applicant_user_id); });
    } catch(_) {}

    const reviewHost = contextEl.querySelector('.innerreview-card .curratings, .review-card .curratings');
    if (!reviewHost) return;

    // Simple aggregate score
    // Filter to eligible renters only
    const list = (Array.isArray(rows) ? rows : []).filter(r => !eligibleUserIds.size || eligibleUserIds.has(r.user_id));
    const avg = list.length ? (list.reduce((s, r) => s + (parseInt(r.rating, 10) || 0), 0) / list.length) : 0;
    const scoreEl = reviewHost.querySelector('.rightings .score');
    if (scoreEl) scoreEl.textContent = avg ? avg.toFixed(1) : '0.0';

    // Fetch reviewer names from profiles
    const reviewerIds = [...new Set(list.map(r => r.user_id).filter(Boolean))];
    let reviewerNamesMap = new Map();
    
    if (reviewerIds.length > 0) {
      try {
        const { data: profiles, error: profileError } = await client
          .from('profiles')
          .select('id, full_name, email')
          .in('id', reviewerIds);
        
        if (!profileError && profiles) {
          profiles.forEach(profile => {
            const name = profile.full_name || 
                        profile.email?.split('@')[0] || 
                        'Verified Renter';
            reviewerNamesMap.set(profile.id, name);
          });
        }
      } catch (e) {
        console.warn('Could not fetch reviewer names:', e);
      }
    }
    const countEl = reviewHost.querySelector('.sort-section span:last-child');
    if (countEl) countEl.textContent = `${list.length} Review${list.length === 1 ? '' : 's'}`;

    // Visually reflect the average on the star icons inside .curratings
    const starWrap = reviewHost.querySelector('.stars');
    if (starWrap) {
      const starsEls = starWrap.querySelectorAll('.star, .fa-star, .wrstar');
      const filled = Math.round(avg);
      starsEls.forEach((el, i) => {
        // Normalize classes: use 'selected' to indicate filled
        if (i < filled) el.classList.add('selected'); else el.classList.remove('selected');
      });
      // Accessibility label
      starWrap.setAttribute('aria-label', `${avg.toFixed(1)} out of 5 stars based on ${list.length} review${list.length===1?'':'s'}`);
    }

    // Replace the sample review box with structured entries including .review-header
    // .review-box is a sibling of .curratings in our markup, not a child
    const reviewBoxContainer = (reviewHost.parentElement ? reviewHost.parentElement.querySelector('.review-box') : null) || (contextEl ? contextEl.querySelector('.review-box') : null);
    if (reviewBoxContainer) {
      if (!list.length) {
        reviewBoxContainer.innerHTML = '<div class="review-text" style="color:#666;text-align:center;padding:20px;">No reviews yet. Be the first to review this apartment!</div>';
      } else {
        reviewBoxContainer.innerHTML = '';
        // Show all reviews (up to 50 from the query limit)
        list.forEach(r => {
          const dt = r.created_at ? new Date(r.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
          const reviewerName = reviewerNamesMap.get(r.user_id) || 'Verified Renter';
          const item = document.createElement('div');
          item.className = 'review-item';
          const commentText = (r.comment || 'No comment provided.').replace(/</g,'&lt;');
          item.innerHTML = `
            <div class="review-header">
              <span><strong>${reviewerName}</strong><br><small style="color: var(--text-muted);">${dt}</small></span>
              <div class="review-stars">${Array.from({ length: 5 }).map((_, i) => i < (parseInt(r.rating, 10) || 0) ? '<span class="star-filled">★</span>' : '<span class="star-empty">★</span>').join('')}</div>
            </div>
            <div class="review-text">${commentText}</div>
          `;
          reviewBoxContainer.appendChild(item);
        });
      }
    }

    // Wire submit in the visible review form
    const form = contextEl.querySelector('.reviewclicked');
    if (form) {
      const submitBtn = form.querySelector('.reviewsubmitbtn');
      if (submitBtn && !submitBtn.__wired) {
        submitBtn.__wired = true;
        submitBtn.addEventListener('click', async function (e) {
          e.preventDefault();
          const client2 = initSupabaseClient();
          if (!client2) return;
          // rating: count of selected stars
          const stars = form.querySelectorAll('.wrstar.selected');
          const rating = stars ? stars.length : 0;
          const textarea = form.querySelector('textarea');
          const comment = textarea ? (textarea.value || '').trim() : '';
          if (!rating) { alert('Please select a rating.'); return; }
          try {
            const { data: sess2 } = await client2.auth.getSession();
            const uid = sess2?.session?.user?.id || null;
            if (!uid) { window.location.href = 'login.html'; return; }
            // Upsert so the user can edit their review
            const { error } = await client2.from('reviews').upsert({
              apartment_id: apartmentId,
              user_id: uid,
              rating,
              comment,
              visible: true
            }, { onConflict: 'apartment_id,user_id' });
            if (error) throw error;
            if (textarea) textarea.value = '';
            // refresh list
            await renderApartmentReviews(apartmentId, contextEl);
            // switch back to current ratings view if your UI hides/shows
            const curr = contextEl.querySelector('.curratings');
            if (curr) curr.style.display = 'block';
            if (form) form.style.display = 'none';
          } catch (er) {
            alert('Failed to submit review.');
          }
        });
      }

      // Prefill form with existing user review to enable editing
      if (currentUserId) {
        try {
          const own = (Array.isArray(rows) ? rows : []).find(r => r.user_id === currentUserId);
          const textarea = form.querySelector('textarea');
          if (own && textarea) textarea.value = own.comment || '';
          // set stars
          const starEls = form.querySelectorAll('.wrstar');
          if (own && starEls && starEls.length) {
            starEls.forEach((el, i) => {
              if (i < (own.rating || 0)) el.classList.add('selected'); else el.classList.remove('selected');
            });
          }
        } catch (_) {}
      }
    }
  } catch (_) {}
}
// Expose for reuse by other pages (e.g., landlord)
try { window.renderApartmentReviews = renderApartmentReviews; } catch(_) {}
// Chat functionality with Supabase
// Reuse a single Supabase client across the app to avoid multiple instances
function initSupabase() {
  return initSupabaseClient();
}

// Send message to landlord
async function sendMessage() {
  const chatInput = document.getElementById('chatInput');

  if (!chatInput) return;

  const message = chatInput.value.trim().slice(0, 500);
  if (!message) return;

  // Clear input
  chatInput.value = '';

  // Send message using the reusable function
  // simple rate limit: 1 msg/sec
  if (window.__lastClientMsgAt && Date.now() - window.__lastClientMsgAt < 1000) {
    return;
  }
  window.__lastClientMsgAt = Date.now();
  await sendMessageToChat(message);
}

// Listen for messages from landlord
function listenForMessages() {
  const client = initSupabase();
  if (!client) return;
  // Clean up previous channel if any
  try {
    if (window.__chatChannel && typeof window.__chatChannel.unsubscribe === 'function') {
      window.__chatChannel.unsubscribe();
    }
  } catch (_) { }

  const apt = window.currentApartmentId;
  // Only subscribe if we have a valid UUID apartment id to avoid uuid=text errors
  const isUuid = typeof apt === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(apt);
  if (!isUuid) return;
  const channel = client.channel(`messages-${apt}`);
  window.__chatChannel = channel;

  channel
    .on('postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `apartment_id=eq.${apt}`
      },
      (payload) => {
        // Only render messages coming from the landlord to avoid echoing our own
        if (!payload || !payload.new || payload.new.sender_type !== 'landlord') return;
        const messagesContainer = document.getElementById('messages');
        if (messagesContainer) {
          const messageDiv = document.createElement('div');
          messageDiv.className = 'msg landlord';
          messageDiv.textContent = payload.new.message;
          messagesContainer.appendChild(messageDiv);
          messagesContainer.scrollTop = messagesContainer.scrollHeight;

          // Show notification for new message
          showInfoNotification('New message from landlord', payload.new.message);
        }
      }
    )
    .subscribe();
}

// Modern notification system (stacked toasts + browser notification)
const NOTIFICATION_ICONS = {
  success: 'fa-circle-check',
  error: 'fa-circle-xmark',
  warning: 'fa-triangle-exclamation',
  info: 'fa-message'
};

let notificationPermissionRequested = false;

function ensureNotificationContainer() {
  let container = document.getElementById('notificationContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notificationContainer';
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
  }
  return container;
}

function requestBrowserNotificationPermission() {
  if (notificationPermissionRequested || !('Notification' in window)) return;
  notificationPermissionRequested = true;
  if (Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {});
  }
}

function showMessageNotification(title, message, type = 'info', opts = {}) {
  const { category, timeout = 5200 } = opts || {};
  requestBrowserNotificationPermission();

  // Fire native notification when allowed
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body: message,
        icon: 'final logo.PNG',
        badge: 'final logo.PNG',
        tag: 'apartrent-notification'
      });
    } catch (_) { /* ignore */ }
  }

  showVisualNotification(title, message, type, { category, timeout });
  playNotificationSound();
}

function showVisualNotification(title, message, type = 'info', opts = {}) {
  const { category, timeout = 5200 } = opts || {};
  const container = ensureNotificationContainer();
  const icon = NOTIFICATION_ICONS[type] || NOTIFICATION_ICONS.info;

  const notification = document.createElement('div');
  notification.className = `message-notification ${type}`;
  notification.setAttribute('role', 'status');
  notification.innerHTML = `
    <div class="notification-content">
      <div class="notification-icon">
        <i class="fa-solid ${icon}"></i>
      </div>
      <div class="notification-text">
        <div class="notification-meta">
          ${category ? `<span class="notification-category">${escapeHtml(category)}</span>` : ''}
          <span class="notification-time">Just now</span>
        </div>
        <div class="notification-title">${escapeHtml(title)}</div>
        <div class="notification-message">${escapeHtml(message)}</div>
      </div>
      <button class="notification-close" aria-label="Close notification">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
    <div class="notification-progress" style="animation-duration:${timeout}ms"></div>
  `;

  container.appendChild(notification);

  // animate in
  requestAnimationFrame(() => notification.classList.add('show'));

  const hideFn = () => hideNotification(notification);
  const timer = setTimeout(hideFn, timeout);
  notification._autoHideTimer = timer;

  notification.querySelector('.notification-close')?.addEventListener('click', () => {
    clearTimeout(timer);
    hideFn();
  });

  notification.addEventListener('mouseenter', () => {
    clearTimeout(notification._autoHideTimer);
    notification.classList.add('paused');
  });
  notification.addEventListener('mouseleave', () => {
    notification.classList.remove('paused');
    notification._autoHideTimer = setTimeout(hideFn, 1800);
  });
}

function hideNotification(notification) {
  if (!notification || !notification.parentNode) return;
  if (notification._autoHideTimer) clearTimeout(notification._autoHideTimer);
  notification.classList.remove('show');
  notification.classList.add('hide');
  setTimeout(() => {
    if (notification.parentNode) notification.parentNode.removeChild(notification);
  }, 280);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showSuccessNotification(title, message, opts) {
  showMessageNotification(title, message, 'success', opts);
}

function showWarningNotification(title, message, opts) {
  showMessageNotification(title, message, 'warning', opts);
}

function showErrorNotification(title, message, opts) {
  showMessageNotification(title, message, 'error', opts);
}

function showInfoNotification(title, message, opts) {
  showMessageNotification(title, message, 'info', opts);
}

function playNotificationSound() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
  oscillator.frequency.setValueAtTime(660, audioContext.currentTime + 0.12);

  gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.35);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.35);
}

// Allow sending message with Enter key and initialize chat
document.addEventListener('DOMContentLoaded', function () {
  const chatInput = document.getElementById('chatInput');
  if (chatInput) {
    chatInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
  }

  // Initialize chat system
  initSupabase();
  listenForMessages();

  // Load and display names
  loadChatNames();

  // Initialize message-box functionality
  handleMessageBoxSend();
});

// Function to load and display names in chat header
function loadChatNames() {
  // Get current user's name
  const currentUserName = localStorage.getItem('lastUserName') || 'Client';

  // For now, we'll set a default landlord name
  // In a real app, you'd fetch this from your database
  const landlordName = 'Property Manager'; // You can make this dynamic

  // Update the chat header
  const landlordNameElement = document.getElementById('landlordName');
  if (landlordNameElement) {
    landlordNameElement.textContent = landlordName;
  }

  // Store current user name for sending with messages
  window.currentUserName = currentUserName;
}

// Function to handle message-box send button clicks
function handleMessageBoxSend() {
  // Find all message-box send buttons
  const messageBoxSendButtons = document.querySelectorAll('.message-box .send-btn');

  messageBoxSendButtons.forEach(button => {
    button.addEventListener('click', function () {
      // Get the textarea in the same message-box
      const textarea = this.parentElement.querySelector('textarea');
      const message = textarea.value.trim();

      if (message) {
        // Send the message to live chat (same as sendMessage function)
        sendMessageToChat(message);

        // Clear the textarea
        textarea.value = '';

        // Find the chat box in the same page
        const chatBox = document.querySelector('#chatBox');
        if (chatBox) {
          // Scroll to the chat box smoothly
          chatBox.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });

          // Add a slight delay to ensure smooth scrolling
          setTimeout(() => {
            // Focus on the chat input
            const chatInput = document.getElementById('chatInput');
            if (chatInput) {
              chatInput.focus();
            }
          }, 500);
        }
      }
    });
  });
}

// Function to send message to chat (reusable for both message-box and chat input)
async function sendMessageToChat(message) {
  const messagesContainer = document.getElementById('messages');

  if (!messagesContainer) return;

  // Add message to UI immediately
  const messageDiv = document.createElement('div');
  messageDiv.className = 'msg renter';
  messageDiv.textContent = message;
  messagesContainer.appendChild(messageDiv);

  // Scroll to bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  // Send to Supabase
  const client = initSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('messages')
        .insert([
          {
            sender_type: 'client',
            message: message,
            apartment_id: (typeof window.currentApartmentId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(window.currentApartmentId)) ? window.currentApartmentId : null,
            created_at: new Date().toISOString()
          }
        ]);

      if (error) {
        console.error('Error sending message:', error);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }
}

// (logout function defined above)


const stars = document.querySelectorAll(".wrstar");
const ratingValue = document.getElementById("rating-value");
let selectedRating = 0;

if (stars && stars.length) stars.forEach((star, index) => {
  // Hover effect
  star.addEventListener("mouseover", () => {
    resetStars();
    highlightStars(index);
  });

  // Remove hover when leaving
  star.addEventListener("mouseout", () => {
    resetStars();
    if (selectedRating > 0) {
      highlightStars(selectedRating - 1);
    }
  });

  // Click to select
  star.addEventListener("click", () => {
    selectedRating = index + 1;
    resetStars();
    highlightStars(index);
    if (ratingValue) ratingValue.textContent = `You rated this ${selectedRating}/5`;
  });
});

function resetStars() {
  stars.forEach(s => s.classList.remove("hover", "selected"));
}



function highlightStars(endIndex) {
  for (let i = 0; i <= endIndex; i++) {
    stars[i].classList.add("selected");
  }
}

function showReviewForm(el) {
  const reviewCard = el && el.closest ? el.closest('.review-card, .innerreview-card') : null;
  const container = reviewCard || document.querySelector('.review-card, .innerreview-card');
  if (!container) return;
  const current = container.querySelector('.curratings');
  const form = container.querySelector('.reviewclicked');
  if (current) current.style.display = 'none';
  if (form) form.style.display = 'block';
}
function submitReview(el) {
  const reviewCard = el && el.closest ? el.closest('.review-card, .innerreview-card') : null;
  const container = reviewCard || document.querySelector('.review-card, .innerreview-card');
  if (!container) return;
  const current = container.querySelector('.curratings');
  const form = container.querySelector('.reviewclicked');
  if (current) current.style.display = 'block';
  if (form) form.style.display = 'none';
}
// On page load, ensure correct initial state for all review sections
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.review-card, .innerreview-card').forEach(card => {
    const current = card.querySelector('.curratings');
    const form = card.querySelector('.reviewclicked');
    if (current) current.style.display = 'block';
    if (form) form.style.display = 'none';
  });
});


// qr code payment method js - will be populated dynamically based on enabled methods
const qrCodes = {
  // Default QR codes - will be overridden by actual landlord payment methods
  gcash: {
    title: "Gcash Payment",
    img: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=GcashPaymentLink",
    note: "Open your Gcash app and scan this code.",
    number: "09171234567",
    name: "Juan Dela Cruz"
  },
  paypal: {
    title: "Paypal Payment",
    img: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PaypalPaymentLink",
    note: "Open your Paypal app and scan this code.",
    number: "paypaluser@email.com",
    name: "Juan Dela Cruz"
  },
  paymaya: {
    title: "Paymaya Payment",
    img: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PaymayaPaymentLink",
    note: "Open your Paymaya app and scan this code.",
    number: "09179876543",
    name: "Juan Dela Cruz"
  },
  card: {
    title: "Card Payment",
    img: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=CardPaymentLink",
    note: "Scan to pay with your card provider's app.",
    number: "1234 5678 9012 3456",
    name: "Juan Dela Cruz"
  }
};

function showQR(method) {
  const modal = document.getElementById('qrModal');
  const qrImg = document.getElementById('qrImage');
  const qrTitle = document.getElementById('qrTitle');
  const qrNote = document.getElementById('qrNote');
  const qrName = document.getElementById('qrName');
  const qrNumber = document.getElementById('qrNumber');

  // Check if this payment method is enabled for the current apartment
  if (window.landlordPaymentMethods && window.landlordPaymentMethods[method]) {
    const landlordMethod = window.landlordPaymentMethods[method];
    qrImg.src = landlordMethod.qr_code_url || qrCodes[method]?.img || '';
    qrTitle.textContent = `${qrCodes[method]?.title || method.toUpperCase()} Payment`;
    qrNote.textContent = qrCodes[method]?.note || `Open your ${method} app and scan this code.`;
    qrName.textContent = `Name: ${landlordMethod.account_name || qrCodes[method]?.name || ''}`;
    qrNumber.textContent = `Number: ${landlordMethod.account_number || qrCodes[method]?.number || ''}`;
  } else if (qrCodes[method]) {
    // Fallback to default QR codes if landlord method not available
    qrImg.src = qrCodes[method].img;
    qrTitle.textContent = qrCodes[method].title;
    qrNote.textContent = qrCodes[method].note;
    qrName.textContent = `Name: ${qrCodes[method].name}`;
    qrNumber.textContent = `Number: ${qrCodes[method].number}`;
  } else {
    console.warn(`Payment method ${method} is not available for this apartment`);
    qrImg.src = "";
    qrTitle.textContent = "Payment Method Not Available";
    qrNote.textContent = "This payment method is not enabled for this apartment.";
    if (qrName) qrName.textContent = "";
    if (qrNumber) qrNumber.textContent = "";
  }
  modal.style.display = "flex";
}

function closeQR() {
  document.getElementById('qrModal').style.display = "none";
}

/**
 * Open GCash payment modal (Pay now from Rented tab).
 * Fetches the rented apartment from DB to get landlord_id, then the landlord's GCash QR for that unit.
 */
async function openGcashPaymentModal() {
  const localApartment = getCurrentRentedApartmentData();
  if (!localApartment || !localApartment.id) {
    alert('Please select your rented apartment first.');
    return;
  }

  const modal = document.getElementById('gcashPaymentModal');
  const amountEl = document.getElementById('gcashPaymentAmount');
  const qrImg = document.getElementById('gcashPaymentQrImg');
  const qrFallback = document.getElementById('gcashPaymentQrFallback');
  const receiptInput = document.getElementById('gcashReceiptInput');
  const receiptNameEl = document.getElementById('gcashReceiptFileName');
  if (!modal || !amountEl) return;

  let apartment = localApartment;
  let qrUrl = null;
  let landlordId = apartment.landlord_id;

  const client = initSupabaseClient();
  if (client) {
    try {
      const { data: aptRow, error: aptErr } = await client
        .from('apartments')
        .select('id, landlord_id, price')
        .eq('id', apartment.id)
        .maybeSingle();
      if (!aptErr && aptRow) {
        landlordId = aptRow.landlord_id;
        if (aptRow.price != null) apartment = { ...apartment, price: aptRow.price, landlord_id: landlordId };
      }
      if (!landlordId && apartment.landlord_id) landlordId = apartment.landlord_id;
      if (landlordId) {
        const { data: pmRow } = await client
          .from('landlord_payment_methods')
          .select('qr_code_url')
          .eq('landlord_id', landlordId)
          .eq('payment_method', 'gcash')
          .eq('is_active', true)
          .limit(1)
          .maybeSingle();
        if (pmRow && pmRow.qr_code_url) qrUrl = pmRow.qr_code_url;
      }
    } catch (e) { console.warn('Could not fetch apartment/landlord GCash QR:', e); }
  }

  if (!qrUrl && apartment.paymentMethods && apartment.paymentMethods.length > 0) {
    const gcash = apartment.paymentMethods.find(p => (p.method || '').toLowerCase() === 'gcash');
    if (gcash && gcash.qrCodeUrl) qrUrl = gcash.qrCodeUrl;
  }

  const amount = parseFloat(apartment.price) || 0;
  const amountStr = `₱${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  amountEl.textContent = amountStr;

  if (qrImg && qrFallback) {
    if (qrUrl) {
      qrImg.src = qrUrl;
      qrImg.style.display = '';
      qrFallback.style.display = 'none';
    } else {
      qrImg.src = '';
      qrImg.style.display = 'none';
      qrFallback.style.display = 'block';
    }
  }

  if (receiptInput) receiptInput.value = '';
  if (receiptNameEl) receiptNameEl.textContent = '';
  const errEl = document.getElementById('gcashReceiptError');
  if (errEl) { errEl.style.display = 'none'; errEl.textContent = ''; }
  window._ocrReceiptData = null;
  var ocrResEl = document.getElementById('gcashOcrResult');
  if (ocrResEl) { ocrResEl.style.display = 'none'; ocrResEl.textContent = ''; ocrResEl.className = 'gcash-ocr-result'; }
  const paymentTypeSelect = document.getElementById('gcashPaymentType');
  const advanceMonthsWrap = document.getElementById('gcashAdvanceMonthsWrap');
  const advanceMonthsInput = document.getElementById('gcashAdvanceMonths');
  if (paymentTypeSelect) paymentTypeSelect.value = 'full';
  if (advanceMonthsWrap) advanceMonthsWrap.style.display = 'none';
  if (advanceMonthsInput) advanceMonthsInput.value = '1';
  window._gcashPaymentApartment = { ...apartment, landlord_id: landlordId || apartment.landlord_id };
  window._gcashPaymentAmount = amount;
  modal.style.display = 'flex';
}

function closeGcashPaymentModal() {
  const modal = document.getElementById('gcashPaymentModal');
  if (modal) modal.style.display = 'none';
  window._gcashPaymentApartment = null;
  window._gcashPaymentAmount = null;
  window._ocrReceiptData = null;
  var ocrEl = document.getElementById('gcashOcrResult');
  if (ocrEl) { ocrEl.style.display = 'none'; ocrEl.textContent = ''; ocrEl.className = 'gcash-ocr-result'; }
}

/** Get current payment type label from modal dropdowns (for OCR result display) */
function getCurrentPaymentLabelInModal() {
  var sel = document.getElementById('gcashPaymentType');
  var months = document.getElementById('gcashAdvanceMonths');
  var v = sel && sel.value ? sel.value : 'full';
  if (v === 'advance' && months) {
    var m = parseInt(months.value, 10);
    if (!isNaN(m) && m >= 1) return 'Advance payment (' + m + ' month' + (m !== 1 ? 's' : '') + ')';
  }
  return (v === 'full' && 'Full payment') || (v === 'partial' && 'Partial payment') || (v === 'advance' && 'Advance payment') || 'Full payment';
}

/** Format a numeric reference like 1234567891011 as '1234 567 891011' */
function formatReferenceForDisplay(ref) {
  if (!ref) return '—';
  var digitsOnly = String(ref).replace(/\D/g, '');
  if (digitsOnly.length < 5) return String(ref);
  var first4 = digitsOnly.slice(0, 4);
  var next3 = digitsOnly.slice(4, 7);
  var rest = digitsOnly.slice(7);
  return rest ? (first4 + ' ' + next3 + ' ' + rest) : (first4 + ' ' + next3);
}

/** Update the OCR result line to show scanned details + chosen payment */
function updateOcrResultDisplay(parsed) {
  var ocrEl = document.getElementById('gcashOcrResult');
  if (!ocrEl || !parsed) return;
  var amountText = (parsed.amount != null)
    ? '₱' + Number(parsed.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })
    : '—';
  var dateText = parsed.date ? parsed.date : '—';
  var rawRef = parsed.reference ? parsed.reference : '';
  var refText = rawRef ? formatReferenceForDisplay(rawRef) : '—';
  var paymentText = getCurrentPaymentLabelInModal();

  var lines = [
    'Scanned from receipt:',
    'Amount: ' + amountText,
    'Date: ' + dateText,
    'Reference no.: ' + refText,
    'Payment: ' + paymentText
  ];

  ocrEl.innerHTML = lines.join('<br>');
  ocrEl.className = 'gcash-ocr-result';
}

/** Parse OCR text from receipt image to extract amount, date, reference */
function parseReceiptOcrText(text) {
  if (!text || typeof text !== 'string') return { amount: null, date: null, reference: null };
  var t = text.replace(/\s+/g, ' ').trim();
  var amount = null, date = null, reference = null;

  var amountMatch = t.match(/(?:₱|PHP|P\s*)\s*([\d,]+(?:\.\d{2})?)|(?:amount|total|paid)\s*[:\s]*(?:₱|PHP)?\s*([\d,]+(?:\.\d{2})?)/i);
  if (amountMatch) {
    var numStr = (amountMatch[1] || amountMatch[2] || '').replace(/,/g, '');
    if (numStr) amount = parseFloat(numStr);
  }
  if (amount == null) {
    var fallback = t.match(/\b(\d{1,6}(?:,\d{3})*\.\d{2})\b/);
    if (fallback) amount = parseFloat(fallback[1].replace(/,/g, ''));
  }

  var dateMatch = t.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})|(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})|(?:date|time)\s*[:\s]*([\d\/\-\.]+\s*[\d:]*)/i);
  if (dateMatch) {
    if (dateMatch[7]) { date = dateMatch[7].trim(); }
    else if (dateMatch[1]) { date = dateMatch[1] + '/' + dateMatch[2] + '/' + dateMatch[3]; }
    else if (dateMatch[4]) { date = dateMatch[4] + '-' + dateMatch[5] + '-' + dateMatch[6]; }
  }
  // If still no date, handle textual month formats like "Mar 13" or "Mar 13 2026"
  if (!date) {
    var monthDateMatch = text.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\.?\s+(\d{1,2})(?:,\s*(\d{4}))?/i);
    if (monthDateMatch) {
      var mName = monthDateMatch[1];
      var dNum = monthDateMatch[2];
      var yNum = monthDateMatch[3] || '';
      date = (mName + ' ' + dNum + (yNum ? (', ' + yNum) : ''));
    }
  }

  // Special-case: "Ref No." followed by a 13-digit reference (digits may be spaced)
  var refNoMatch = text.match(/Ref\s*No\.?\s*[:\s]*([0-9][0-9\s]{10,30})/i);
  if (refNoMatch && refNoMatch[1]) {
    var digits = refNoMatch[1].replace(/\D/g, '');
    if (digits.length === 13) {
      reference = digits;
    } else if (digits.length >= 8) {
      reference = digits;
    }
  }

  // Fallback: generic single-token reference after common labels
  if (!reference) {
    var refMatch = t.match(/(?:ref(?:erence)?\s*#?\s*|ref\s*no\.?\s*|transaction\s*id\s*|trace\s*no\.?)\s*[:\s]*([A-Za-z0-9\-]+)/i);
    if (refMatch) reference = refMatch[1].trim();
  }

  return { amount: amount, date: date || null, reference: reference || null };
}

/** Run Tesseract OCR on receipt image file and store extracted data */
function runReceiptOcr(file, onProgress, onDone) {
  var ocrEl = document.getElementById('gcashOcrResult');
  if (!file || !file.type || !file.type.startsWith('image/')) {
    if (ocrEl) { ocrEl.style.display = 'none'; ocrEl.textContent = ''; }
    if (onDone) onDone(null);
    return;
  }
  if (ocrEl) {
    ocrEl.style.display = 'block';
    ocrEl.className = 'gcash-ocr-result ocr-scanning';
    ocrEl.textContent = 'Scanning receipt…';
  }
  if (typeof Tesseract === 'undefined') {
    if (ocrEl) { ocrEl.className = 'gcash-ocr-result ocr-failed'; ocrEl.textContent = 'OCR not loaded.'; }
    if (onDone) onDone(null);
    return;
  }
  Tesseract.recognize(file, 'eng', { logger: function(m) { if (onProgress && m.status) onProgress(m.status); } })
    .then(function(result) {
      var text = result && result.data && result.data.text ? result.data.text : '';
      var parsed = parseReceiptOcrText(text);
      window._ocrReceiptData = {
        amount: parsed.amount,
        date: parsed.date,
        reference: parsed.reference,
        rawText: text ? text.slice(0, 2000) : null
      };
      if (ocrEl) {
        if (parsed.amount != null || parsed.date || parsed.reference) {
          updateOcrResultDisplay(parsed);
        } else {
          ocrEl.className = 'gcash-ocr-result ocr-failed';
          ocrEl.textContent = 'Receipt scanned. No details extracted. Payment: ' + getCurrentPaymentLabelInModal();
        }
      }
      if (onDone) onDone(window._ocrReceiptData);
    })
    .catch(function(err) {
      console.warn('Receipt OCR error:', err);
      window._ocrReceiptData = null;
      if (ocrEl) {
        ocrEl.className = 'gcash-ocr-result ocr-failed';
        ocrEl.textContent = 'Could not read receipt. Amount/date/ref will use defaults. Payment: ' + getCurrentPaymentLabelInModal();
      }
      if (onDone) onDone(null);
    });
}

document.addEventListener('DOMContentLoaded', function() {
  const receiptInput = document.getElementById('gcashReceiptInput');
  const receiptNameEl = document.getElementById('gcashReceiptFileName');
  const errEl = document.getElementById('gcashReceiptError');
  if (receiptInput && receiptNameEl) {
    receiptInput.addEventListener('change', function() {
      const file = this.files[0];
      receiptNameEl.textContent = file ? file.name : '';
      if (errEl) { errEl.style.display = 'none'; errEl.textContent = ''; }
      var ocrEl = document.getElementById('gcashOcrResult');
      if (!file) {
        window._ocrReceiptData = null;
        if (ocrEl) { ocrEl.style.display = 'none'; ocrEl.textContent = ''; }
        return;
      }
      if (file.type && file.type.startsWith('image/')) {
        runReceiptOcr(file, null, null);
      } else {
        window._ocrReceiptData = null;
        if (ocrEl) { ocrEl.style.display = 'block'; ocrEl.className = 'gcash-ocr-result ocr-failed'; ocrEl.textContent = 'PDF upload: scan not available. Amount/date from form will be used. Payment: ' + getCurrentPaymentLabelInModal(); }
      }
    });
  }
  var paymentTypeSelect = document.getElementById('gcashPaymentType');
  var advanceMonthsWrap = document.getElementById('gcashAdvanceMonthsWrap');
  var advanceMonthsInput = document.getElementById('gcashAdvanceMonths');
  if (paymentTypeSelect && advanceMonthsWrap) {
    paymentTypeSelect.addEventListener('change', function() {
      advanceMonthsWrap.style.display = (this.value === 'advance') ? 'flex' : 'none';
      if (window._ocrReceiptData && (window._ocrReceiptData.amount != null || window._ocrReceiptData.date || window._ocrReceiptData.reference)) {
        updateOcrResultDisplay(window._ocrReceiptData);
      }
    });
  }
  if (advanceMonthsInput) {
    advanceMonthsInput.addEventListener('change', function() {
      if (window._ocrReceiptData && (window._ocrReceiptData.amount != null || window._ocrReceiptData.date || window._ocrReceiptData.reference)) {
        updateOcrResultDisplay(window._ocrReceiptData);
      }
    });
  }
});

async function sendReceiptToLandlord() {
  const apartment = window._gcashPaymentApartment;
  const amount = window._gcashPaymentAmount;
  const receiptInput = document.getElementById('gcashReceiptInput');
  const file = receiptInput?.files?.[0];
  const errEl = document.getElementById('gcashReceiptError');

  function showReceiptError(msg) {
    if (errEl) {
      errEl.textContent = msg;
      errEl.style.display = 'block';
    } else {
      alert(msg);
    }
  }
  function hideReceiptError() {
    if (errEl) { errEl.style.display = 'none'; errEl.textContent = ''; }
  }

  if (!file) {
    showReceiptError('Please pay the amount first via GCash, then upload your payment receipt before sending.');
    return;
  }
  if (!apartment || !apartment.id || !apartment.landlord_id) {
    showReceiptError('Apartment data not found. Please close and open Pay now again from your rented unit.');
    return;
  }

  try {
    const client = initSupabaseClient();
    if (!client) {
      showReceiptError('Unable to connect. Please try again.');
      return;
    }
    const { data: sess } = await client.auth.getSession();
    const userId = sess?.session?.user?.id;
    if (!userId) {
      showReceiptError('Please log in to send the receipt.');
      return;
    }

    // Prevent multiple pending receipts (submitted but not yet paid/rejected) for this apartment.
    try {
      const { data: pendingReceipt, error: prErr } = await client
        .from('payment_receipts')
        .select('id, status')
        .eq('client_id', userId)
        .eq('apartment_id', apartment.id)
        .eq('status', 'submitted')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (prErr) {
        console.warn('Pending receipt check failed:', prErr);
      } else if (pendingReceipt && pendingReceipt.id) {
        showReceiptError('You already sent a receipt for this apartment and it is still pending. Please wait for the landlord to review it.');
        return;
      }
    } catch (_) {}

    const approved = await client
      .from('rental_applications')
      .select('id, unit_number, data')
      .eq('applicant_user_id', userId)
      .eq('apartment_id', apartment.id)
      .in('status', ['approved', 'accepted'])
      .limit(1)
      .maybeSingle();
    if (!approved?.data && approved?.error) {
      showReceiptError('Could not verify your rental. Please try again.');
      return;
    }
    if (!approved?.data) {
      showReceiptError('This unit is not your rented apartment. Receipts can only be sent for the unit you rented.');
      return;
    }

    hideReceiptError();
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${apartment.landlord_id}/receipts/${apartment.id}/${userId}_${Date.now()}.${ext}`;
    const { error: upErr } = await client.storage.from('payment-receipts').upload(path, file, { upsert: true });
    if (upErr) {
      console.error('Upload error:', upErr);
      showReceiptError('Failed to upload receipt. The storage bucket "payment-receipts" may need to be created in Supabase.');
      return;
    }
    const { data: pub } = client.storage.from('payment-receipts').getPublicUrl(path);
    const receiptUrl = pub?.publicUrl || '';

    const paymentTypeEl = document.getElementById('gcashPaymentType');
    const advanceMonthsEl = document.getElementById('gcashAdvanceMonths');
    const paymentType = paymentTypeEl && paymentTypeEl.value ? paymentTypeEl.value : 'full';
    const advanceMonths = (paymentType === 'advance' && advanceMonthsEl) ? (parseInt(advanceMonthsEl.value, 10) || null) : null;

    var ocr = window._ocrReceiptData || {};
    var ocrAmount = ocr.amount != null && !isNaN(ocr.amount) ? ocr.amount : null;
    var ocrDate = ocr.date && String(ocr.date).trim() ? String(ocr.date).trim() : null;
    var ocrRef = ocr.reference && String(ocr.reference).trim() ? String(ocr.reference).trim() : null;
    var ocrRaw = ocr.rawText && String(ocr.rawText).trim() ? String(ocr.rawText).trim().slice(0, 2000) : null;

    const appRow = approved.data || {};
    const appUnitNumber = appRow.unit_number != null
      ? Number(appRow.unit_number)
      : (appRow.data && appRow.data.unit_number != null ? Number(appRow.data.unit_number) : null);

    const { error: insErr } = await client.from('payment_receipts').insert({
      client_id: userId,
      landlord_id: apartment.landlord_id,
      apartment_id: apartment.id,
      unit_number: appUnitNumber && !isNaN(appUnitNumber) ? appUnitNumber : null,
      amount: amount,
      receipt_url: receiptUrl,
      status: 'submitted',
      payment_type: paymentType,
      advance_months: advanceMonths,
      ocr_amount: ocrAmount,
      ocr_date: ocrDate,
      ocr_reference: ocrRef,
      ocr_raw_text: ocrRaw
    });
    if (insErr) {
      console.warn('Could not save receipt record:', insErr);
      showReceiptError('Receipt uploaded but could not notify landlord. Please try again or contact your landlord.');
      return;
    }

    alert('Receipt sent to your landlord successfully!');
    closeGcashPaymentModal();
    try { await refreshClientTransactionHistory(apartment.id); } catch (_) {}
  } catch (e) {
    console.error('Send receipt error:', e);
    showReceiptError('Failed to send receipt. Please try again.');
  }
}

/** Format payment type for display (client and landlord transaction history) */
function formatPaymentTypeLabel(paymentType, advanceMonths) {
  if (!paymentType) return '—';
  var label = (paymentType === 'full' && 'Full payment') || (paymentType === 'partial' && 'Partial payment') || (paymentType === 'advance' && 'Advance payment') || paymentType;
  if (paymentType === 'advance' && advanceMonths != null && !isNaN(advanceMonths)) {
    label = 'Advance payment (' + advanceMonths + ' month' + (advanceMonths !== 1 ? 's' : '') + ')';
  }
  return label;
}

/** Fetch and render client's transaction history (payment_receipts for current user and optional apartment) */
async function refreshClientTransactionHistory(apartmentId) {
  var listEl = document.getElementById('rentedTransactionList');
  if (!listEl) return;
  var client = initSupabaseClient();
  if (!client) return;
  var sess = (await client.auth.getSession()).data?.session;
  var userId = sess?.user?.id;
  if (!userId) return;
  var ref = function(id) { return id ? 'REF-' + String(id).replace(/-/g, '').slice(0, 8).toUpperCase() : '—'; };
  var query = client.from('payment_receipts')
    .select('id, apartment_id, amount, created_at, payment_type, advance_months, ocr_amount, ocr_date, ocr_reference')
    .eq('client_id', userId)
    .eq('status', 'paid');
  if (apartmentId) {
    query = query.eq('apartment_id', apartmentId);
  }
  var res = await query.order('created_at', { ascending: false });
  var list = (res.data && Array.isArray(res.data)) ? res.data : [];
  var headerRow = '<div class="transaction-item transaction-header"><span class="tx-amount">Amount</span><span class="tx-date">Date</span><span class="tx-ref">Reference No.</span><span class="tx-payment">Payment</span></div>';
  var rows = list.length === 0
    ? '<div class="transaction-empty">No transactions yet.</div>'
    : list.map(function(r) {
        var amountVal = r.ocr_amount != null ? r.ocr_amount : r.amount;
        var amountStr = amountVal != null ? '₱' + Number(amountVal).toLocaleString('en-PH', { minimumFractionDigits: 2 }) : '—';
        var dateStr = r.ocr_date ? r.ocr_date : (r.created_at ? new Date(r.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—');
        var refStr = r.ocr_reference ? r.ocr_reference : ref(r.id);
        var paymentStr = formatPaymentTypeLabel(r.payment_type, r.advance_months);
        var esc = function(s) { return (s == null ? '' : String(s)).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
        return '<div class="transaction-item"><span class="tx-amount">' + amountStr + '</span><span class="tx-date">' + esc(dateStr) + '</span><span class="tx-ref">' + esc(refStr) + '</span><span class="tx-payment">' + paymentStr + '</span></div>';
      }).join('');
  listEl.innerHTML = headerRow + rows;
}

/** @deprecated Use openGcashPaymentModal instead */
async function proceedToPayMongoPayment() {
  openGcashPaymentModal();
}

/**
 * Get current rented apartment data
 * This function extracts apartment data from the current rented apartment view
 */
function getCurrentRentedApartmentData() {
  try {
    // Try to get apartment data from various sources
    let apartmentData = null;
    
    // Method 1: Check if we have stored apartment data
    if (window.currentRentedApartment) {
      apartmentData = window.currentRentedApartment;
    }
    
    // Method 2: Use currentSelectedAd if available (most accurate)
    if (!apartmentData && window.currentSelectedAd) {
      apartmentData = {
        id: window.currentSelectedAd.id,
        name: window.currentSelectedAd.location || 'Rented Apartment',
        location: window.currentSelectedAd.location || 'Location not specified',
        price: parseInt(window.currentSelectedAd.price) || 12000,
        images: window.currentSelectedAd.primaryImageDataUrls || ['final logo.PNG'],
        amenities: window.currentSelectedAd.amenities || 'Garage, Gym, Swimming Pool',
        description: window.currentSelectedAd.description || 'Rented apartment - payment for monthly rent',
        status: 'rented',
        payment_type: 'monthly_rent'
      };
    }
    
    // Method 3: Extract from the current page elements (fallback)
    if (!apartmentData) {
      const apartmentName = document.querySelector('.apartment-info h3')?.textContent || 
                           document.querySelector('.detsinfo h3')?.textContent ||
                           'Rented Apartment';
      
      const apartmentLocation = document.querySelector('.location p')?.textContent ||
                               document.querySelector('.apartment-location')?.textContent ||
                               'Location not specified';
      
      const apartmentPrice = extractPriceFromPage();
      
      // Try to get the actual apartment ID from the current selected ad
      const actualApartmentId = window.currentSelectedAd?.id || window.currentApartmentId;
      
      // Don't proceed with payment if we don't have a valid apartment ID
      if (!actualApartmentId || !isValidUuid(actualApartmentId)) {
        console.error('No valid apartment ID available for payment. Please select a rented apartment first.');
        return null;
      }
      
      apartmentData = {
        id: actualApartmentId,
        name: apartmentName,
        location: apartmentLocation,
        price: apartmentPrice,
        images: ['final logo.PNG'], // Default image
        amenities: ['Garage', 'Gym', 'Swimming Pool'], // Default amenities
        description: 'Rented apartment - payment for monthly rent',
        status: 'rented',
        payment_type: 'monthly_rent'
      };
    }
    
    // Add payment-specific data
    apartmentData.payment_breakdown = {
      monthly_rent: apartmentData.price,
      security_deposit: apartmentData.price, // Typically same as monthly rent
      processing_fee: 50,
      total: apartmentData.price + apartmentData.price + 50
    };
    
    return apartmentData;
    
  } catch (error) {
    console.error('Error getting apartment data:', error);
    return null;
  }
}

/**
 * Populate rented apartment details in the payment container
 * This function displays the client's rented apartment information in the payment section
 */
async function populateRentedApartmentInPaymentContainer() {
  try {
    console.log('🏠 Populating rented apartment details in payment container...');
    
    // Get the client's rented apartments
    const rentedApartments = await fetchApprovedRentalsForClient();
    
    const apartmentDetailsEl = document.getElementById('rentedApartmentDetails');
    const noApartmentMessageEl = document.getElementById('noRentedApartmentMessage');
    
    if (!apartmentDetailsEl || !noApartmentMessageEl) {
      console.warn('Payment container elements not found');
      return;
    }
    
    // Hide both sections initially
    apartmentDetailsEl.style.display = 'none';
    noApartmentMessageEl.style.display = 'none';
    
    if (!rentedApartments || rentedApartments.length === 0) {
      // Show no apartment message
      noApartmentMessageEl.style.display = 'block';
      console.log('No rented apartments found, showing no apartment message');
      return;
    }
    
    // Use the first rented apartment (or the most recent one)
    const apartment = rentedApartments[0];
    
    // Populate apartment details
    const titleEl = document.getElementById('rentedApartmentTitle');
    const locationEl = document.getElementById('rentedApartmentLocation');
    const priceEl = document.getElementById('rentedApartmentPrice');
    const imageEl = document.getElementById('rentedApartmentImage');
    const amenitiesEl = document.getElementById('rentedApartmentAmenities');
    
    if (titleEl) {
      titleEl.textContent = apartment.location || 'Rented Apartment';
    }
    
    if (locationEl) {
      locationEl.textContent = apartment.location || 'Location not specified';
    }
    
    if (priceEl) {
      const price = parseInt(apartment.price) || 0;
      priceEl.textContent = `₱${price.toLocaleString()}/month`;
    }
    
    if (imageEl) {
      // Use the primary image or first available image
      const imageUrl = apartment.primaryImageDataUrl || 
                      (apartment.primaryImageDataUrls && apartment.primaryImageDataUrls[0]) || 
                      'final logo.PNG';
      imageEl.src = imageUrl;
      imageEl.alt = apartment.location || 'Apartment';
    }
    
    if (amenitiesEl) {
      const amenities = apartment.amenities || 'No amenities listed';
      // Format amenities as a nice list
      const amenitiesArray = amenities.split(',').map(a => a.trim()).filter(a => a);
      if (amenitiesArray.length > 0) {
        amenitiesEl.innerHTML = amenitiesArray.map(amenity => 
          `<span class="amenity-tag">${amenity}</span>`
        ).join('');
      } else {
        amenitiesEl.textContent = 'No amenities listed';
      }
    }
    
    // Show the apartment details section
    apartmentDetailsEl.style.display = 'block';
    
    // Store the apartment data for payment processing
    window.currentRentedApartment = apartment;
    
    console.log('✅ Successfully populated rented apartment details:', apartment);
    
  } catch (error) {
    console.error('Error populating rented apartment details:', error);
    
    // Show error state
    const apartmentDetailsEl = document.getElementById('rentedApartmentDetails');
    const noApartmentMessageEl = document.getElementById('noRentedApartmentMessage');
    
    if (apartmentDetailsEl) apartmentDetailsEl.style.display = 'none';
    if (noApartmentMessageEl) {
      noApartmentMessageEl.style.display = 'block';
      noApartmentMessageEl.innerHTML = `
        <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: var(--space-sm); color: var(--error-color);"></i>
        <h4 style="margin: 0 0 var(--space-sm) 0; color: var(--text-secondary);">Error Loading Apartment</h4>
        <p style="margin: 0; font-size: 0.9rem;">Unable to load your rented apartment details. Please try refreshing the page.</p>
      `;
    }
  }
}

/**
 * View apartment details - switch to the Rented tab to see full details
 */
function viewApartmentDetails() {
  try {
    // Switch to the Rented tab
    const navLinks = document.querySelectorAll('.sidemenu .page');
    const contentPages = document.querySelectorAll('.sidelp');
    
    // Remove active class from all nav links
    navLinks.forEach(link => link.classList.remove('active'));
    
    // Add active class to Rented tab
    const rentedLink = document.querySelector('.sidemenu .page[data-target="Rented"]');
    if (rentedLink) {
      rentedLink.classList.add('active');
    }
    
    // Hide all content pages
    contentPages.forEach(page => page.classList.remove('actsidelp'));
    
    // Show Rented page
    const rentedPage = document.getElementById('Rented');
    if (rentedPage) {
      rentedPage.classList.add('actsidelp');
    }
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    console.log('✅ Switched to Rented tab to view apartment details');
  } catch (error) {
    console.error('Error switching to apartment details:', error);
  }
}


/**
 * Browse apartments - switch to Dashboard tab
 */
function browseApartments() {
  try {
    // Switch to the Dashboard tab
    const navLinks = document.querySelectorAll('.sidemenu .page');
    const contentPages = document.querySelectorAll('.sidelp');
    
    // Remove active class from all nav links
    navLinks.forEach(link => link.classList.remove('active'));
    
    // Add active class to Dashboard tab
    const dashboardLink = document.querySelector('.sidemenu .page[data-target="Dashboard"]');
    if (dashboardLink) {
      dashboardLink.classList.add('active');
    }
    
    // Hide all content pages
    contentPages.forEach(page => page.classList.remove('actsidelp'));
    
    // Show Dashboard page
    const dashboardPage = document.getElementById('Dashboard');
    if (dashboardPage) {
      dashboardPage.classList.add('actsidelp');
    }
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    console.log('✅ Switched to Dashboard to browse apartments');
  } catch (error) {
    console.error('Error switching to browse apartments:', error);
  }
}

// ===== APARTMENT IMAGE GALLERY FUNCTIONALITY =====

let currentImageIndex = 0;
let apartmentImages = [];

/**
 * Open image gallery modal
 */
function openImageGallery() {
  try {
    const apartment = window.currentRentedApartment;
    if (!apartment) {
      console.warn('No apartment data available for gallery');
      return;
    }

    // Get all available images
    apartmentImages = [];
    
    // Add primary image if available
    if (apartment.primaryImageDataUrl) {
      apartmentImages.push(apartment.primaryImageDataUrl);
    }
    
    // Add other images if available
    if (apartment.primaryImageDataUrls && Array.isArray(apartment.primaryImageDataUrls)) {
      apartmentImages.push(...apartment.primaryImageDataUrls);
    }
    
    // Add fallback image if no images found
    if (apartmentImages.length === 0) {
      apartmentImages.push('final logo.PNG');
    }

    // Remove duplicates
    apartmentImages = [...new Set(apartmentImages)];

    if (apartmentImages.length === 0) {
      console.warn('No images available for gallery');
      return;
    }

    // Set up gallery
    currentImageIndex = 0;
    updateGalleryDisplay();
    
    // Show modal
    const modal = document.getElementById('apartmentImageModal');
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'flex';
      
      // Update gallery title
      const title = document.getElementById('galleryTitle');
      if (title) {
        title.textContent = `${apartment.location || 'Apartment'} - Images`;
      }
    }

    console.log('✅ Opened image gallery with', apartmentImages.length, 'images');
  } catch (error) {
    console.error('Error opening image gallery:', error);
  }
}

/**
 * Close image gallery modal
 */
function closeImageGallery() {
  try {
    const modal = document.getElementById('apartmentImageModal');
    if (modal) {
      modal.classList.remove('show');
      setTimeout(() => {
        modal.style.display = 'none';
      }, 300);
    }
    console.log('✅ Closed image gallery');
  } catch (error) {
    console.error('Error closing image gallery:', error);
  }
}

/**
 * Show previous image
 */
function previousImage() {
  if (apartmentImages.length <= 1) return;
  
  currentImageIndex = (currentImageIndex - 1 + apartmentImages.length) % apartmentImages.length;
  updateGalleryDisplay();
}

/**
 * Show next image
 */
function nextImage() {
  if (apartmentImages.length <= 1) return;
  
  currentImageIndex = (currentImageIndex + 1) % apartmentImages.length;
  updateGalleryDisplay();
}

/**
 * Update gallery display
 */
function updateGalleryDisplay() {
  try {
    // Update main image
    const mainImage = document.getElementById('galleryMainImage');
    if (mainImage && apartmentImages[currentImageIndex]) {
      mainImage.src = apartmentImages[currentImageIndex];
      mainImage.alt = `Apartment Image ${currentImageIndex + 1}`;
    }

    // Update thumbnails
    const thumbnailsContainer = document.getElementById('galleryThumbnails');
    if (thumbnailsContainer) {
      thumbnailsContainer.innerHTML = '';
      
      apartmentImages.forEach((imageUrl, index) => {
        const thumbnail = document.createElement('div');
        thumbnail.className = `gallery-thumbnail ${index === currentImageIndex ? 'active' : ''}`;
        thumbnail.onclick = () => {
          currentImageIndex = index;
          updateGalleryDisplay();
        };
        
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = `Thumbnail ${index + 1}`;
        
        thumbnail.appendChild(img);
        thumbnailsContainer.appendChild(thumbnail);
      });
    }

    // Update counter
    const currentNumber = document.getElementById('currentImageNumber');
    const totalNumber = document.getElementById('totalImages');
    
    if (currentNumber) currentNumber.textContent = currentImageIndex + 1;
    if (totalNumber) totalNumber.textContent = apartmentImages.length;

    // Update navigation buttons
    const prevBtn = document.querySelector('.gallery-prev');
    const nextBtn = document.querySelector('.gallery-next');
    
    if (prevBtn) prevBtn.disabled = apartmentImages.length <= 1;
    if (nextBtn) nextBtn.disabled = apartmentImages.length <= 1;

  } catch (error) {
    console.error('Error updating gallery display:', error);
  }
}

/**
 * Handle keyboard navigation
 */
function handleGalleryKeyboard(event) {
  if (!document.getElementById('apartmentImageModal').classList.contains('show')) return;
  
  switch(event.key) {
    case 'Escape':
      closeImageGallery();
      break;
    case 'ArrowLeft':
      previousImage();
      break;
    case 'ArrowRight':
      nextImage();
      break;
  }
}

// Add keyboard event listener
document.addEventListener('keydown', handleGalleryKeyboard);

/**
 * Extract price from the current page
 */
function extractPriceFromPage() {
  // Try to find price in various elements (in order of preference)
  const priceElements = [
    document.querySelector('.price p'),           // Main price display
    document.querySelector('.button-bar .price p'), // Button bar price
    document.querySelector('.detail-value'),      // Detail card price
    document.querySelector('.price'),             // Generic price
    document.querySelector('.apartment-price'),
    document.querySelector('.rent-price'),
    document.querySelector('[data-price]')
  ];
  
  for (const element of priceElements) {
    if (element) {
      const priceText = element.textContent || element.dataset.price || '';
      // Match price patterns like ₱12,000, 12000, ₱12,000/month
      const priceMatch = priceText.match(/₱?([\d,]+)(?:\/month)?/);
      if (priceMatch) {
        const price = parseInt(priceMatch[1].replace(/,/g, ''));
        if (price > 0) {
          console.log(`Extracted price: ₱${price} from element:`, element);
          return price;
        }
      }
    }
  }
  
  // Try to get from currentSelectedAd as last resort
  if (window.currentSelectedAd && window.currentSelectedAd.price) {
    const price = parseInt(window.currentSelectedAd.price);
    if (price > 0) {
      console.log(`Using price from currentSelectedAd: ₱${price}`);
      return price;
    }
  }
  
  console.warn('Could not extract price from page, using default: ₱12,000');
  // Default price if not found
  return 12000;
}

/**
 * Check if a string is a valid UUID format
 */
function isValidUuid(str) {
  if (!str || typeof str !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Generate apartment ID if not available
 * Generate a valid UUID v4 format for compatibility with Supabase
 */
function generateApartmentId() {
  // Generate a valid UUID v4 format
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Store apartment data when viewing rented apartment details
 * This should be called when a rented apartment is selected
 */
function storeRentedApartmentData(apartmentData) {
  try {
    window.currentRentedApartment = apartmentData;
    console.log('Stored rented apartment data:', apartmentData);
  } catch (error) {
    console.error('Error storing rented apartment data:', error);
  }
}

/**
 * PayMongo integration removed. No-op.
 */
function testPayMongoIntegration() {
  console.log('PayMongo integration has been removed.');
}

/**
 * Debug function to check current apartment data and price extraction
 */
function debugApartmentPricing() {
  console.log('=== APARTMENT PRICING DEBUG ===');
  
  // Check currentSelectedAd
  if (window.currentSelectedAd) {
    console.log('Current Selected Ad:', {
      id: window.currentSelectedAd.id,
      price: window.currentSelectedAd.price,
      location: window.currentSelectedAd.location
    });
  } else {
    console.log('No currentSelectedAd found');
  }
  
  // Check extracted price
  const extractedPrice = extractPriceFromPage();
  console.log('Extracted price from page:', extractedPrice);
  
  // Check apartment data
  const apartmentData = getCurrentRentedApartmentData();
  console.log('Current apartment data:', apartmentData);
  
  // Check payment breakdown
  if (apartmentData.payment_breakdown) {
    console.log('Payment breakdown:', apartmentData.payment_breakdown);
  }
  
  return apartmentData;
}

// Make debug function available globally
window.debugApartmentPricing = debugApartmentPricing;



// Test function for carousel functionality
function testCarousel() {
  console.log('Testing carousel functionality...');
  
  // Create test data with multiple images
  const testAd = {
    id: 'test-1',
    price: 15000,
    location: 'Test Location',
    description: 'Test apartment',
    imagesUrls: [
      'https://via.placeholder.com/400x300/FF0000/FFFFFF?text=Image+1',
      'https://via.placeholder.com/400x300/00FF00/FFFFFF?text=Image+2',
      'https://via.placeholder.com/400x300/0000FF/FFFFFF?text=Image+3'
    ]
  };
  
  // Test with .photos container
  const photosContainer = document.querySelector('.photos');
  if (photosContainer) {
    console.log('Testing .photos container...');
    renderClientPhotos(photosContainer, testAd);
  }
  
  // Test with .rentphotos container
  const rentPhotosContainer = document.querySelector('.rentphotos');
  if (rentPhotosContainer) {
    console.log('Testing .rentphotos container...');
    renderClientPhotos(rentPhotosContainer, testAd);
  }
  
  console.log('Carousel test completed. Check the page for carousel functionality.');
}

// Make test function available globally
window.testCarousel = testCarousel;

// Debug function to check current listing data
window.debugListings = async function() {
  const listings = await fetchListings();
  console.log('Current listings data:');
  listings.forEach(ad => {
    console.log(`\nApartment ${ad.id}:`);
    console.log(`- Primary Image URLs: ${photoUrls?.length || 0} photos`);
    console.log(`- Images URLs: ${ad.imagesUrls?.length || 0} photos`);
    console.log(`- Floor Plan URL: ${ad.floorPlanDataUrl ? 'Yes' : 'No'}`);
    if (photoUrls?.length > 0) {
      console.log(`- Photo URLs:`, photoUrls);
    }
    if (ad.imagesUrls?.length > 0) {
      console.log(`- Images URLs:`, ad.imagesUrls);
    }
  });
};

// Force refresh function to clear cache and reload
window.forceRefresh = async function() {
  console.log('Force refreshing listings...');
  // Clear any cached data
  localStorage.removeItem('apartrent_listings');
  
  // Reload the page data
  const listings = await fetchListings();
  renderClientListings(listings);
  renderSavedFromBookmarks(listings);
  attachClientCardHandlers(listings);
  
  console.log('Refresh complete. Check the carousel now.');
};

// Simple debug function that works immediately
window.quickDebug = function() {
  console.log('=== QUICK DEBUG ===');
  const listings = window.currentListings || [];
  console.log('Current listings count:', listings.length);
  
  listings.forEach(ad => {
    console.log(`\nApartment ${ad.id}:`);
    console.log('- primaryImageDataUrls:', ad.primaryImageDataUrls?.length || 0);
    console.log('- imagesUrls:', ad.imagesUrls?.length || 0);
    console.log('- floorPlanDataUrl:', ad.floorPlanDataUrl ? 'Yes' : 'No');
  });
  
  // Check what's currently being rendered
  const carousels = document.querySelectorAll('.photo-carousel');
  console.log('Carousels found on page:', carousels.length);
  
  carousels.forEach((carousel, index) => {
    const images = carousel.querySelectorAll('img');
    const dots = carousel.querySelectorAll('.pc-dots span');
    console.log(`Carousel ${index + 1}: ${images.length} images, ${dots.length} dots`);
  });
};

// Debug function to check fetchListings
window.debugFetchListings = async function() {
  console.log('=== DEBUG FETCH LISTINGS ===');
  try {
    const listings = await fetchListings();
    console.log('Fetched listings count:', listings.length);
    console.log('Listings:', listings);
    
    // Check if there are any errors
    if (listings.length === 0) {
      console.log('No listings found. Checking Supabase connection...');
      const client = initSupabaseClient();
      if (client) {
        console.log('Supabase client available');
        const { data, error } = await client.from('apartments').select('*').limit(5);
        console.log('Direct Supabase query result:', { data, error });
      } else {
        console.log('No Supabase client available');
      }
    }
  } catch (error) {
    console.error('Error in fetchListings:', error);
  }
};

// Example payment history data
const paymentHistory = [
  {
    ref: "REF123456",
    type: "Full",
    datetime: "2025-09-09 20:30:45",
    amount: "₱1500.00"
  },
  {
    ref: "REF123457",
    type: "Partial",
    datetime: "2025-09-08 18:15:12",
    amount: "₱750.00"
  }
];

/**
 * CLIENT PAYMENT HISTORY FUNCTIONS
 */

/**
 * Fetch client's payment history
 */
async function fetchClientPaymentHistory() {
    try {
        if (!window.supabaseClient) {
            console.warn('Supabase client not available');
            return [];
        }

        const userId = await getCurrentUserId();
        if (!userId) {
            console.warn('User not authenticated');
            return [];
        }

        // Get client payment history with direct query
        console.log('Getting client payment history with direct query');
        
        const { data: directPayments, error } = await window.supabaseClient
                .from('rental_payments')
                .select('*')
                .eq('client_id', userId)
                .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        // Get unique apartment IDs from payments
        const apartmentIds = [...new Set((directPayments || []).map(p => p.apartment_id).filter(Boolean))];
        
        // Fetch apartment details separately
        let apartmentsMap = new Map();
        if (apartmentIds.length > 0) {
            const { data: apartments, error: aptError } = await window.supabaseClient
                .from('apartments')
                .select('id, title, location, price')
                .in('id', apartmentIds);
                
            if (!aptError && apartments) {
                apartments.forEach(apt => {
                    apartmentsMap.set(apt.id, apt);
                });
            }
        }

        // Transform direct payments to match expected format
        const payments = (directPayments || []).map(payment => ({
            ...payment,
            apartment_title: apartmentsMap.get(payment.apartment_id)?.title || null,
            apartment_location: apartmentsMap.get(payment.apartment_id)?.location || null,
            apartment_price: apartmentsMap.get(payment.apartment_id)?.price || null
        }));

        if (error) {
            console.error('Error fetching client payment history:', error);
            return [];
        }

        // Transform the data for display
        const transformedPayments = (payments || []).map(payment => {
            const metadata = payment.metadata || {};
            const paymentBreakdown = metadata.payment_breakdown || {};
            
            // Determine payment type based on metadata or amount
            let paymentType = 'initial';
            if (metadata.payment_type) {
                paymentType = metadata.payment_type;
            } else if (paymentBreakdown.monthlyRent && payment.amount <= paymentBreakdown.monthlyRent * 1.1) {
                // If amount is close to monthly rent, it's likely a monthly payment
                paymentType = 'monthly_rent';
            }

            return {
                id: payment.id,
                property: payment.apartment_title || 'Unknown Property',
                location: payment.apartment_location || '',
                paymentType: paymentType,
                referenceNumber: payment.reference_number || payment.id || 'N/A',
                paymentMethod: payment.payment_method || 'Unknown',
                datetime: new Date(payment.created_at).toLocaleString('en-PH', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                amount: `₱${parseFloat(payment.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
                rawAmount: parseFloat(payment.amount),
                status: payment.payment_status || 'pending',
                apartmentId: payment.apartment_id,
                createdAt: payment.created_at
            };
        });

        return transformedPayments;
    } catch (error) {
        console.error('Error in fetchClientPaymentHistory:', error);
        return [];
    }
}

/**
 * Render client payment history
 */
async function renderClientPaymentHistory() {
    const tableBody = document.querySelector("#clientHistoryTable tbody");
    const totalPaidEl = document.querySelector("#clientTotalPaid");
    const paymentCountEl = document.querySelector("#clientPaymentCount");
    
    if (!tableBody) {
        console.warn('⚠️ Client payment history table not found - tab may not be active yet');
        return;
    }

    // Show loading state
    tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #666;">Loading payment history...</td></tr>';

    try {
        // Fetch actual payment history
        const paymentHistory = await fetchClientPaymentHistory();

        // Clear loading state
        tableBody.innerHTML = '';

        if (!paymentHistory.length) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #666;">No payment history found.</td></tr>';
            if (totalPaidEl) totalPaidEl.textContent = '₱0.00';
            if (paymentCountEl) paymentCountEl.textContent = '0';
            return;
        }

        // Calculate totals
        const totalPaid = paymentHistory
            .filter(p => p.status === 'succeeded' || p.status === 'completed')
            .reduce((sum, payment) => sum + (payment.rawAmount || 0), 0);
        
        // Update summary displays
        if (totalPaidEl) {
            totalPaidEl.textContent = `₱${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        }
        
        if (paymentCountEl) {
            paymentCountEl.textContent = paymentHistory.filter(p => p.status === 'succeeded' || p.status === 'completed').length;
        }

        // Populate rented apartment details in payment container
        await populateRentedApartmentInPaymentContainer();

        // Insert rows dynamically with proper fields
        paymentHistory.forEach(payment => {
            const row = document.createElement("tr");
            
            // Format payment type
            const paymentTypeDisplay = payment.paymentType === 'initial' ? 'Initial Payment' : 
                                       payment.paymentType === 'monthly_rent' ? 'Monthly Rent' : 
                                       'Other';
            
            // Status badge
            let statusClass = 'status-completed';
            let statusText = 'Completed';
            if (payment.status === 'pending') {
                statusClass = 'status-pending';
                statusText = 'Pending';
            } else if (payment.status === 'failed') {
                statusClass = 'status-failed';
                statusText = 'Failed';
            } else if (payment.status === 'succeeded') {
                statusClass = 'status-completed';
                statusText = 'Completed';
            }

            row.innerHTML = `
                <td>${payment.property}</td>
                <td>${paymentTypeDisplay}</td>
                <td><code style="background:var(--bg-tertiary);padding:4px 8px;border-radius:4px;font-size:0.85rem;">${payment.referenceNumber}</code></td>
                <td>${payment.paymentMethod}</td>
                <td>${payment.datetime}</td>
                <td style="font-weight:700;color:var(--success-color);">${payment.amount}</td>
                <td><span class="payment-status ${statusClass}">${statusText}</span></td>
            `;

            tableBody.appendChild(row);
        });

        // Store payment history globally for filtering
        window.currentClientPaymentHistory = paymentHistory;

        // Check for rent due dates
        await checkRentDueDates();

        // Re-render rented cards so due borders clear after monthly rent payment
        try {
          await refreshClientRentedTab();
        } catch (_) {}

    } catch (error) {
        console.error('Error rendering client payment history:', error);
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #e74c3c;">Error loading payment history. Please try again.</td></tr>';
    }
}

function dateOnlyFromDate(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Monthly rent due on the same calendar day as move-in (short months clamped).
 * daysUntil: 0 = due today, negative = overdue by that many days.
 */
function getRentDueStatusFromMoveIn(moveInRaw, ref = new Date()) {
    if (moveInRaw == null || String(moveInRaw).trim() === '') return null;
    const mi = new Date(moveInRaw);
    if (isNaN(mi.getTime())) return null;
    const refDay = dateOnlyFromDate(ref);
    const dom = mi.getDate();
    const y = refDay.getFullYear();
    const m = refDay.getMonth();
    let dueThisMonth = new Date(y, m, dom);
    if (dueThisMonth.getMonth() !== m) {
        dueThisMonth = new Date(y, m + 1, 0);
    }
    const tRef = refDay.getTime();
    const tDue = dateOnlyFromDate(dueThisMonth).getTime();
    if (tRef === tDue) return { dueDate: dueThisMonth, daysUntil: 0 };
    if (tRef < tDue) {
        return { dueDate: dueThisMonth, daysUntil: Math.round((tDue - tRef) / 86400000) };
    }
    const daysLate = Math.round((tRef - tDue) / 86400000);
    return { dueDate: dueThisMonth, daysUntil: -daysLate };
}

function rentDueNotifyStorageKeyClient(apartmentId) {
    const day = new Date().toISOString().slice(0, 10);
    return `apartrent-due-notify:client:${apartmentId}:${day}`;
}

function prependRentDueFloatingReminder() {
    const el = document.getElementById('floatingChatMessages');
    if (!el) return;
    el.querySelectorAll('[data-rent-due-reminder="1"]').forEach((n) => n.remove());
    const rem = window.__rentDueFloatingReminder;
    const apt = window.currentApartmentId;
    if (!rem || !rem.text || !apt || String(rem.apartmentId) !== String(apt)) return;
    const div = document.createElement('div');
    div.className = 'msg rent-due-reminder';
    div.setAttribute('data-rent-due-reminder', '1');
    div.setAttribute('role', 'status');
    div.textContent = rem.text;
    el.insertBefore(div, el.firstChild);
    // When the rent-due notice is visible in floating chat for the current
    // apartment, ensure the chat bubble shows a basic "1" reminder if the
    // widget is closed.
    try {
        if (typeof setClientChatBubbleReminderToOne === 'function') {
            setClientChatBubbleReminderToOne(false);
        }
        el.scrollTop = el.scrollHeight;
    } catch (_) {}
}

/**
 * Check for rent due dates and show notifications
 */
async function checkRentDueDates() {
    try {
        if (!window.supabaseClient) return;

        const userId = await getCurrentUserId();
        if (!userId) return;

        window.__rentDueFloatingReminder = null;

        // Get user's active rentals with direct query
        
        // Simple direct query - no RPC complexity needed
        console.log('Getting user rentals with direct query for userId:', userId);
        const { data: rentals, error } = await window.supabaseClient
            .from('apartment_rentals')
            .select('*')
            .eq('user_id', userId)
            .eq('rental_status', 'active');

        if (error || !rentals?.length) return;

        // Get apartment details separately
        const apartmentIds = [...new Set(rentals.map(r => r.apartment_id).filter(Boolean))];
        let apartmentsMap = new Map();
        
        if (apartmentIds.length > 0) {
            const { data: apartments, error: aptError } = await window.supabaseClient
                .from('apartments')
                .select('id, title, location, price')
                .in('id', apartmentIds);
                
            if (!aptError && apartments) {
                apartments.forEach(apt => {
                    apartmentsMap.set(apt.id, apt);
                });
            }
        }

        for (const rental of rentals) {
            const dueSt = getRentDueStatusFromMoveIn(rental.move_in_date);
            if (!dueSt || dueSt.daysUntil > 0) continue;
            const apartment = apartmentsMap.get(rental.apartment_id);
            const propName = apartment?.title || 'your rental';
            const dueStr = dueSt.dueDate.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
            const body =
                dueSt.daysUntil === 0
                    ? `Rent for ${propName} is due today (${dueStr}), based on your move-in date.`
                    : `Rent for ${propName} was due on ${dueStr} (${Math.abs(dueSt.daysUntil)} day(s) overdue), based on your move-in date.`;
            const notifyKey = rentDueNotifyStorageKeyClient(rental.apartment_id);
            if (!localStorage.getItem(notifyKey)) {
                showWarningNotification('Rent due reminder', body, { category: 'Billing' });
                localStorage.setItem(notifyKey, '1');
            }
            if (window.currentApartmentId && String(window.currentApartmentId) === String(rental.apartment_id)) {
                window.__rentDueFloatingReminder = { apartmentId: rental.apartment_id, text: body };
            }
        }

        const rentDueSection = document.getElementById('rentDueSection');
        const nextRentDueEl = document.getElementById('nextRentDue');

        // Calculate next rent due date for each rental
        let nextDueRental = null;
        let earliestDueDate = null;

        for (const rental of rentals) {
            const moveInDate = new Date(rental.move_in_date);
            const today = new Date();
            
            // Calculate next due date (monthly rent due on the same day each month)
            const nextDue = new Date(moveInDate);
            nextDue.setMonth(today.getMonth());
            nextDue.setFullYear(today.getFullYear());
            
            // If this month's due date has passed, set to next month
            if (nextDue <= today) {
                nextDue.setMonth(nextDue.getMonth() + 1);
            }

            if (!earliestDueDate || nextDue < earliestDueDate) {
                earliestDueDate = nextDue;
                nextDueRental = rental;
            }
        }

        if (nextDueRental && earliestDueDate) {
            const apartment = apartmentsMap.get(nextDueRental.apartment_id);
            if (!apartment) {
                rentDueSection.style.display = 'none';
                return;
            }
            
            const daysUntilDue = Math.ceil((earliestDueDate - new Date()) / (1000 * 60 * 60 * 24));
            
            // Update next rent due display
            if (nextRentDueEl) {
                // Format the date for display
                const formattedDate = earliestDueDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
                
                if (daysUntilDue < 0) {
                    nextRentDueEl.textContent = `${formattedDate} (${Math.abs(daysUntilDue)} days overdue)`;
                    nextRentDueEl.style.color = 'var(--error-color)';
                } else if (daysUntilDue === 0) {
                    nextRentDueEl.textContent = `${formattedDate} (Due today)`;
                    nextRentDueEl.style.color = 'var(--warning-color)';
                } else {
                    nextRentDueEl.textContent = formattedDate;
                    nextRentDueEl.style.color = 'var(--warning-color)';
                }
            }

            // Show rent due section if due soon or overdue
            if (daysUntilDue <= 7) {
                if (rentDueSection) {
                    rentDueSection.style.display = 'block';
                    
                    // Update rent due details
                    const rentDueAmountEl = document.getElementById('rentDueAmount');
                    const rentDuePropertyEl = document.getElementById('rentDueProperty');
                    const rentDueDateEl = document.getElementById('rentDueDate');
                    const rentOverdueDaysEl = document.getElementById('rentOverdueDays');
                    
                    if (rentDueAmountEl) {
                        rentDueAmountEl.textContent = `₱${parseFloat(nextDueRental.monthly_rent).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
                    }
                    
                    if (rentDuePropertyEl) {
                        rentDuePropertyEl.textContent = apartment?.title || 'Unknown Property';
                    }
                    
                    if (rentDueDateEl) {
                        rentDueDateEl.textContent = earliestDueDate.toLocaleDateString('en-PH');
                    }
                    
                    if (rentOverdueDaysEl) {
                        if (daysUntilDue < 0) {
                            rentOverdueDaysEl.textContent = `${Math.abs(daysUntilDue)} days`;
                            rentDueSection.classList.add('overdue');
                        } else {
                            rentOverdueDaysEl.textContent = 'Not overdue';
                            rentDueSection.classList.remove('overdue');
                        }
                    }

                    // Setup pay rent button
                    const payRentBtn = document.getElementById('payRentBtn');
                    if (payRentBtn) {
                        payRentBtn.onclick = () => {
                            // Create apartment data for payment
                            const apartmentData = {
                                id: apartment.id,
                                name: apartment.title,
                                location: apartment.location,
                                price: nextDueRental.monthly_rent,
                                payment_type: 'monthly_rent'
                            };
                            
                            // Store payment type in session
                            sessionStorage.setItem('payment_type', 'monthly_rent');
                            
                            // Payment modal removed (PayMongo integration removed)
                        };
                    }
                }
            }
        }

        prependRentDueFloatingReminder();
    } catch (error) {
        console.error('Error checking rent due dates:', error);
    }
}

/**
 * Filter client payment history
 */
function filterClientPaymentHistory() {
    const searchTerm = (document.getElementById('clientPaymentSearch')?.value || '').toLowerCase();
    const typeFilter = document.getElementById('clientPaymentTypeFilter')?.value || '';
    
    if (!window.currentClientPaymentHistory) return;

    const tableBody = document.querySelector("#clientHistoryTable tbody");
    if (!tableBody) return;

    // Clear existing rows
    tableBody.innerHTML = '';

    // Filter payments
    const filteredPayments = window.currentClientPaymentHistory.filter(payment => {
        const matchesSearch = !searchTerm || 
            payment.property.toLowerCase().includes(searchTerm) ||
            payment.referenceNumber.toLowerCase().includes(searchTerm) ||
            payment.paymentMethod.toLowerCase().includes(searchTerm);
            
        const matchesType = !typeFilter || payment.paymentType === typeFilter;
        
        return matchesSearch && matchesType;
    });

    if (!filteredPayments.length) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #666;">No payments match your filters.</td></tr>';
        return;
    }

    // Re-render filtered payments
    filteredPayments.forEach(payment => {
        const row = document.createElement("tr");
        row.dataset.apartmentId = payment.apartmentId;
        row.dataset.paymentType = payment.paymentType;

        row.innerHTML = `
            <td title="${payment.property} - ${payment.location}">${payment.property}</td>
            <td>
                <span class="payment-type-badge ${payment.paymentType}">
                    ${payment.paymentType === 'initial' ? 'Initial Payment' : 'Monthly Rent'}
                </span>
            </td>
            <td title="${payment.referenceNumber}">${payment.referenceNumber}</td>
            <td>
                <span class="payment-method-badge" style="background: var(--primary-light); color: var(--primary-color); padding: 2px 8px; border-radius: 12px; font-size: 0.8rem;">
                    ${payment.paymentMethod.replace('_', ' ').toUpperCase()}
                </span>
            </td>
            <td>${payment.datetime}</td>
            <td style="font-weight: 600; color: var(--success-color);">${payment.amount}</td>
            <td>
                <span class="payment-status-badge ${payment.status}">
                    ${payment.status}
                </span>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

/**
 * Refresh client payment history
 */
async function refreshClientPaymentHistory() {
    await renderClientPaymentHistory();
}

// Initialize client payment history when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Setup client payment history functionality
    const clientPaymentSearch = document.getElementById('clientPaymentSearch');
    if (clientPaymentSearch) {
        clientPaymentSearch.addEventListener('input', filterClientPaymentHistory);
    }
    
    const clientPaymentTypeFilter = document.getElementById('clientPaymentTypeFilter');
    if (clientPaymentTypeFilter) {
        clientPaymentTypeFilter.addEventListener('change', filterClientPaymentHistory);
    }
    
    const refreshClientPaymentsBtn = document.getElementById('refreshClientPayments');
    if (refreshClientPaymentsBtn) {
        refreshClientPaymentsBtn.addEventListener('click', async function() {
            this.disabled = true;
            this.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Refreshing...';
            
            try {
                await refreshClientPaymentHistory();
            } finally {
                this.disabled = false;
                this.innerHTML = '<i class="fa-solid fa-refresh"></i> Refresh';
            }
        });
    }
    
    // Load payment history when Payment History tab is clicked (only first time; use Refresh button for manual reload)
    let clientPaymentHistoryInitialized = false;
    const paymentHistoryTab = document.querySelector('[data-target="PaymentHistory"]');
    if (paymentHistoryTab) {
        paymentHistoryTab.addEventListener('click', function() {
            if (clientPaymentHistoryInitialized) return;
            clientPaymentHistoryInitialized = true;
            // Small delay to ensure the tab is visible before loading data
            setTimeout(async () => {
                await renderClientPaymentHistory();
                // Also populate apartment details when tab is clicked
                await populateRentedApartmentInPaymentContainer();
            }, 100);
        });
    }

    // Setup search for Payment History page
    const paymentTab = document.querySelector('[data-target="PaymentHistory"]');
    if (paymentTab) {
        paymentTab.addEventListener('click', () => {
            setTimeout(() => {
                setupClientPaymentSearch();
            }, 100);
        });
    }
});

// Setup search for Saved apartments
function setupSavedSearch() {
    const input = document.getElementById('savedSearch');
    if (!input) return;

    let currentFilter = 'default';
    let savedListings = [];

    // Get saved listings from the DOM
    const getSavedListings = () => {
        const container = document.getElementById('savedlistings');
        if (!container) return [];
        const cards = container.querySelectorAll('.outer');
        return Array.from(cards).map(card => ({
            element: card,
            location: card.dataset.location || '',
            price: card.dataset.price || '',
            description: card.dataset.description || '',
            id: card.dataset.id || ''
        }));
    };

    // Render filtered listings
    const renderFiltered = (filtered) => {
        const container = document.getElementById('savedlistings');
        if (!container) return;
        
        // Remove any existing no results message
        const existingMsg = container.querySelector('.no-results-message');
        if (existingMsg) existingMsg.remove();
        
        const allCards = container.querySelectorAll('.outer');
        allCards.forEach(card => card.style.display = 'none');
        
        if (filtered.length === 0) {
            // Show no results message
            const noResults = document.createElement('div');
            noResults.className = 'no-results-message';
            noResults.style.padding = '40px 16px';
            noResults.style.color = 'var(--text-muted)';
            noResults.style.textAlign = 'center';
            noResults.style.fontSize = '1.1rem';
            noResults.style.fontWeight = '500';
            noResults.textContent = 'No saved apartments match your search';
            container.appendChild(noResults);
        } else {
            filtered.forEach(item => {
                if (item.element) item.element.style.display = '';
            });
        }
    };

    // Search functionality
    input.addEventListener('input', async () => {
        savedListings = getSavedListings();
        const q = input.value.toLowerCase();
        const filtered = savedListings.filter(item => {
            return (
                item.location.toLowerCase().includes(q) ||
                item.price.toLowerCase().includes(q) ||
                item.description.toLowerCase().includes(q)
            );
        });
        const sorted = await applySortFilter(filtered, currentFilter);
        renderFiltered(sorted);
    });

    // Filter dropdown
    const filterIcon = document.getElementById('savedFilterIcon');
    const filterMenu = document.getElementById('savedFilterMenu');
    const filterOptions = document.querySelectorAll('#savedFilterMenu .filter-option');

    if (filterIcon && filterMenu) {
        filterIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            filterMenu.classList.toggle('show');
            filterIcon.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('#savedFilterDropdown')) {
                filterMenu.classList.remove('show');
                filterIcon.classList.remove('active');
            }
        });

        filterOptions.forEach(option => {
            option.addEventListener('click', async (e) => {
                e.stopPropagation();
                const filterType = option.getAttribute('data-filter');
                currentFilter = filterType;

                filterOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');

                filterMenu.classList.remove('show');
                filterIcon.classList.remove('active');

                savedListings = getSavedListings();
                const q = input.value.toLowerCase();
                let filtered = savedListings;
                if (q) {
                    filtered = savedListings.filter(item => {
                        return (
                            item.location.toLowerCase().includes(q) ||
                            item.price.toLowerCase().includes(q) ||
                            item.description.toLowerCase().includes(q)
                        );
                    });
                }
                const sorted = await applySortFilter(filtered, filterType);
                renderFiltered(sorted);
            });
        });
    }
}

// Setup search for Client Payment History
function setupClientPaymentSearch() {
    const input = document.getElementById('clientPaymentSearch');
    if (!input) return;

    let currentFilter = 'default';

    // Search functionality
    input.addEventListener('input', () => {
        const q = input.value.toLowerCase();
        const table = document.getElementById('clientHistoryTable');
        if (!table) return;
        
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(q) ? '' : 'none';
        });
    });

    // Filter dropdown
    const filterIcon = document.getElementById('clientPaymentFilterIcon');
    const filterMenu = document.getElementById('clientPaymentFilterMenu');
    const filterOptions = document.querySelectorAll('#clientPaymentFilterMenu .filter-option');

    if (filterIcon && filterMenu) {
        filterIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            filterMenu.classList.toggle('show');
            filterIcon.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('#clientPaymentFilterDropdown')) {
                filterMenu.classList.remove('show');
                filterIcon.classList.remove('active');
            }
        });

        filterOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const filterType = option.getAttribute('data-filter');
                currentFilter = filterType;

                filterOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');

                filterMenu.classList.remove('show');
                filterIcon.classList.remove('active');

                // Apply sorting to table
                sortPaymentTable(filterType);
            });
        });
    }
}

// Sort payment table
function sortPaymentTable(filterType) {
    const table = document.getElementById('clientHistoryTable');
    if (!table) return;

    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    rows.sort((a, b) => {
        switch (filterType) {
            case 'date':
                const dateA = new Date(a.cells[0]?.textContent || 0);
                const dateB = new Date(b.cells[0]?.textContent || 0);
                return dateB - dateA;
            case 'amount':
                const amountA = parseFloat(a.cells[2]?.textContent.replace(/[₱,]/g, '') || 0);
                const amountB = parseFloat(b.cells[2]?.textContent.replace(/[₱,]/g, '') || 0);
                return amountB - amountA;
            default:
                return 0;
        }
    });

    rows.forEach(row => tbody.appendChild(row));
}

// ============= FLOATING CHAT BUBBLE FUNCTIONALITY =============

// Toggle floating chat visibility
function toggleFloatingChat() {
    const chatContainer = document.getElementById('floatingChatContainer');
    const chatBubble = document.getElementById('chatBubbleTrigger');
    
    if (chatContainer && chatBubble) {
        const isVisible = chatContainer.classList.contains('show');
        
        if (isVisible) {
            chatContainer.classList.remove('show');
        } else {
            chatContainer.classList.add('show');
            loadFloatingChatMessages();
            listenForFloatingMessages();
            // Clear unread badge when opening
            const badge = document.getElementById('unreadBadge');
            if (badge) {
                badge.style.display = 'none';
                badge.textContent = '0';
            }
        }
    }
}

// Load previous messages from database
async function loadFloatingChatMessages() {
    const messagesContainer = document.getElementById('floatingChatMessages');
    if (!messagesContainer) return;

    const client = initSupabaseClient();
    if (!client) return;

    const apartmentId = window.currentApartmentId;
    const isUuid = typeof apartmentId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(apartmentId);
    
    if (!isUuid) {
        messagesContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-muted);">Select an apartment to start chatting</div>';
        return;
    }

    try {
        // Fetch apartment details to get landlord info
        const { data: apartment } = await client
            .from('apartments')
            .select('landlord_id')
            .eq('id', apartmentId)
            .single();
        
        // Fetch landlord name from profiles
        let landlordName = 'Property Owner';
        if (apartment && apartment.landlord_id) {
            const { data: profile } = await client
                .from('profiles')
                .select('full_name, email')
                .eq('id', apartment.landlord_id)
                .single();
            
            if (profile) {
                landlordName = profile.full_name || profile.email?.split('@')[0] || 'Property Owner';
            }
        }
        
        // Update chat header with landlord's name
        const chatName = document.getElementById('floatingChatName');
        if (chatName) {
            chatName.textContent = landlordName;
        }
        
        // Fetch messages for this apartment
        const { data: messages, error } = await client
            .from('messages')
            .select('*')
            .eq('apartment_id', apartmentId)
            .order('created_at', { ascending: true })
            .limit(100);

        if (error) throw error;

        // Clear existing messages
        messagesContainer.innerHTML = '';

        if (!messages || messages.length === 0) {
            messagesContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-muted);">No messages yet. Start the conversation!</div>';
        } else {
            messages.forEach(msg => {
                const messageDiv = document.createElement('div');
                messageDiv.className = `msg ${msg.sender_type === 'client' ? 'renter' : 'landlord'}`;
                messageDiv.textContent = msg.message;
                messagesContainer.appendChild(messageDiv);
            });
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        prependRentDueFloatingReminder();
    } catch (error) {
        console.error('Error loading messages:', error);
        messagesContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-muted);">Error loading messages</div>';
    }
}

// Send message from floating chat
async function sendFloatingMessage() {
    const input = document.getElementById('floatingChatInput');
    const messagesContainer = document.getElementById('floatingChatMessages');
    
    if (!input || !messagesContainer) return;

    const message = input.value.trim().slice(0, 500);
    if (!message) return;

    // Clear input
    input.value = '';

    // Rate limit
    if (window.__lastClientMsgAt && Date.now() - window.__lastClientMsgAt < 1000) {
        return;
    }
    window.__lastClientMsgAt = Date.now();

    // Send to Supabase (real-time listener will add it to UI)
    const client = initSupabaseClient();
    if (client) {
        try {
            const apartmentId = window.currentApartmentId;
            const isUuid = typeof apartmentId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(apartmentId);
            
            // Get current user info
            const { data: { user } } = await client.auth.getUser();
            const senderName = localStorage.getItem('lastUserName') || user?.user_metadata?.full_name || 'Client';
            const senderId = user?.id || null;
            
            const { error } = await client
                .from('messages')
                .insert([{
                    sender_type: 'client',
                    sender_name: senderName,
                    sender_id: senderId,
                    message: message,
                    apartment_id: isUuid ? apartmentId : null,
                    created_at: new Date().toISOString()
                }]);

            if (error) {
                console.error('Error sending message:', error);
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }
}

function incrementClientChatBubbleReminder() {
    const chatContainer = document.getElementById('floatingChatContainer');
    // Only show the reminder when the floating chat is closed
    if (chatContainer && chatContainer.classList.contains('show')) return;

    const badge = document.getElementById('unreadBadge');
    if (!badge) return;

    const currentCount = parseInt(badge.textContent) || 0;
    badge.textContent = String(currentCount + 1);
    badge.style.display = 'flex';
}

function setClientChatBubbleReminderToOne(force = false) {
    const chatContainer = document.getElementById('floatingChatContainer');
    // Only show the reminder when the floating chat is closed (unless forced)
    if (!force && chatContainer && chatContainer.classList.contains('show')) return;

    const badge = document.getElementById('unreadBadge');
    if (!badge) return;

    const cur = parseInt(badge.textContent) || 0;
    if (!force && cur > 0 && badge.style.display !== 'none') return;
    badge.textContent = '1';
    badge.style.display = 'flex';
}

// Listen for new messages in floating chat
function listenForFloatingMessages() {
    const client = initSupabaseClient();
    if (!client) {
        console.log('Client: No Supabase client available');
        return;
    }

    // Clean up previous channel
    try {
        if (window.__floatingChatChannel && typeof window.__floatingChatChannel.unsubscribe === 'function') {
            window.__floatingChatChannel.unsubscribe();
        }
    } catch (_) {}

    const apartmentId = window.currentApartmentId;
    const isUuid = typeof apartmentId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(apartmentId);
    
    if (!isUuid) {
        console.log('Client: Invalid apartment ID:', apartmentId);
        return;
    }
    
    console.log('Client: Setting up listener for apartment:', apartmentId);

    const channel = client.channel(`floating-messages-${apartmentId}`);
    window.__floatingChatChannel = channel;

    channel
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `apartment_id=eq.${apartmentId}`
        }, (payload) => {
            console.log('Client received message:', payload);
            if (!payload || !payload.new) return;
            
            const messagesContainer = document.getElementById('floatingChatMessages');
            const chatContainer = document.getElementById('floatingChatContainer');
            
            if (messagesContainer) {
                const messageDiv = document.createElement('div');
                messageDiv.className = `msg ${payload.new.sender_type === 'landlord' ? 'landlord' : 'renter'}`;
                messageDiv.textContent = payload.new.message;
                messagesContainer.appendChild(messageDiv);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }

            // Show unread badge and notification only for landlord messages when chat is closed
            if (payload.new.sender_type === 'landlord' && chatContainer && !chatContainer.classList.contains('show')) {
                incrementClientChatBubbleReminder();
                
                // Show notification
                showInfoNotification('New message from landlord', payload.new.message);
            }
        })
        .subscribe();
}

// Initialize floating chat on Enter key
document.addEventListener('DOMContentLoaded', function() {
    const floatingInput = document.getElementById('floatingChatInput');
    if (floatingInput) {
        floatingInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendFloatingMessage();
            }
        });
    }

    // Initialize listener
    listenForFloatingMessages();
});

// Update floating chat when apartment changes
if (typeof window.updateFloatingChatContext === 'undefined') {
    window.updateFloatingChatContext = function(apartmentId, landlordName) {
        window.currentApartmentId = apartmentId;
        
        const chatName = document.getElementById('floatingChatName');
        if (chatName && landlordName) {
            chatName.textContent = landlordName;
        }
        
        checkRentDueDates().finally(() => {
            loadFloatingChatMessages();
            listenForFloatingMessages();
        });
    };
}

// Open chat when Send Message button is clicked
function scrollToMapLocation() {
  // Open map viewer modal
  openMapViewerModal();
}

async function openMapViewerModal() {
  const modal = document.getElementById('mapViewerModal');
  if (!modal) return;
  
  // Clear any previous map instance
  const container = document.getElementById('clientMapViewerModal');
  if (container && window.currentClientMap) {
    try {
      window.currentClientMap.remove();
      window.currentClientMap = null;
    } catch (e) {
      console.warn('Error removing previous map:', e);
    }
    container.innerHTML = '';
  }
  
  // Clear route info
  const routeInfo = document.getElementById('routeInfoModal');
  if (routeInfo) {
    routeInfo.style.display = 'none';
    routeInfo.innerHTML = '';
  }
  
  modal.style.display = 'flex';
  modal.classList.add('show');
  
  // Initialize map in modal - ALWAYS use currently selected apartment
  setTimeout(async () => {
    if (!container) return;
    
    // Show loading state
    container.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-secondary, #666);"><div class="spinner" style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid var(--primary-color, #007bff); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px;"></div><p>Loading map for this apartment...</p></div>';
    
    // ALWAYS get location from currently selected apartment (priority order)
    let location = null;
    let apartmentTitle = 'Apartment Location';
    let apartmentId = null;
    
    // Priority 1: Get from currently selected apartment (most reliable)
    if (window.currentSelectedAd) {
      const ad = window.currentSelectedAd;
      apartmentId = ad.id;
      console.log('🔍 Modal: Getting location from currentSelectedAd (ID:', ad.id, ')');
      console.log('🔍 Modal: Raw coordinates - lat:', ad.latitude, 'lng:', ad.longitude);
      
      if (ad.latitude != null && ad.longitude != null && 
          !isNaN(parseFloat(ad.latitude)) && !isNaN(parseFloat(ad.longitude))) {
        location = {
          lat: parseFloat(ad.latitude),
          lng: parseFloat(ad.longitude)
        };
        apartmentTitle = ad.title || ad.location || 'Apartment Location';
        console.log('✅ Modal: Using location from currentSelectedAd:', location, 'Title:', apartmentTitle);
      } else {
        console.warn('⚠️ Modal: currentSelectedAd has no valid coordinates');
      }
    }
    // Priority 2: Use stored location if it matches current apartment
    else if (window.currentApartmentLocation && window.currentApartmentLocation.lat && window.currentApartmentLocation.lng) {
      // Only use stored location if we have apartment ID match
      if (window.currentApartmentId) {
        apartmentId = window.currentApartmentId;
        location = window.currentApartmentLocation;
        apartmentTitle = window.currentApartmentTitle || apartmentTitle;
        console.log('✅ Modal: Using stored location for apartment ID:', apartmentId);
      } else {
        console.warn('⚠️ Modal: Stored location exists but no apartment ID to verify');
      }
    }
    // Priority 3: Fetch from database using apartment ID
    if (!location && window.currentApartmentId) {
      apartmentId = window.currentApartmentId;
      try {
        const client = window.supabaseClient;
        if (client) {
          console.log('🔍 Modal: Fetching location from database for apartment ID:', apartmentId);
          const { data, error } = await client
            .from('apartments')
            .select('latitude, longitude, title, location')
            .eq('id', apartmentId)
            .single();
          
          if (!error && data && data.latitude != null && data.longitude != null) {
            location = {
              lat: parseFloat(data.latitude),
              lng: parseFloat(data.longitude)
            };
            apartmentTitle = data.title || data.location || apartmentTitle;
            console.log('✅ Modal: Fetched location from database:', location, 'Title:', apartmentTitle);
          } else {
            console.warn('⚠️ Modal: No location found in database for apartment ID:', apartmentId);
          }
        }
      } catch (err) {
        console.error('❌ Modal: Error fetching location from database:', err);
      }
    }
    
    // Validate location before initializing map
    if (!location || !location.lat || !location.lng || 
        isNaN(location.lat) || isNaN(location.lng) ||
        location.lat < -90 || location.lat > 90 ||
        location.lng < -180 || location.lng > 180) {
      console.error('❌ Modal: Invalid or missing location for apartment ID:', apartmentId);
      container.innerHTML = `
        <div style="padding: 40px; text-align: center; color: var(--text-secondary, #666);">
          <i class="fa-solid fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 16px; color: #ff6b6b;"></i>
          <p style="font-weight: 600; margin-bottom: 8px;">Location Not Available</p>
          <p style="font-size: 0.9rem;">This apartment (ID: ${apartmentId || 'Unknown'}) does not have a location set by the landlord.</p>
          <p style="font-size: 0.85rem; color: var(--text-muted, #999); margin-top: 8px;">Please contact the landlord to set the location.</p>
        </div>
      `;
      return;
    }
    
    // Store location for this specific apartment
    window.currentApartmentLocation = location;
    window.currentApartmentTitle = apartmentTitle;
    if (apartmentId) {
      window.currentApartmentId = apartmentId;
    }
    
    // Update modal header with apartment title
    const modalHeader = modal.querySelector('.map-viewer-modal-header h3');
    if (modalHeader) {
      modalHeader.innerHTML = `<i class="fa-solid fa-map-location-dot"></i> ${apartmentTitle} - Location & Directions`;
    }
    
    // Initialize map in modal with all features for THIS specific apartment
    console.log('✅ Modal: Initializing map for apartment ID:', apartmentId, 'Title:', apartmentTitle);
    console.log('✅ Modal: Location coordinates:', location.lat.toFixed(6), location.lng.toFixed(6));
    
    if (window.LeafletMapsIntegration && window.LeafletMapsIntegration.initClientMapViewer) {
      try {
        const map = await window.LeafletMapsIntegration.initClientMapViewer(container, location, apartmentTitle);
        if (map) {
          window.currentClientMap = map; // Store map instance
          console.log('✅ Modal: Map initialized successfully for apartment:', apartmentId);
        } else {
          console.error('❌ Modal: Map initialization returned null');
        }
      } catch (err) {
        console.error('❌ Modal: Error initializing map:', err);
        container.innerHTML = `
          <div style="padding: 40px; text-align: center; color: var(--text-secondary, #666);">
            <i class="fa-solid fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 16px; color: #ff6b6b;"></i>
            <p style="font-weight: 600; margin-bottom: 8px;">Map Loading Error</p>
            <p style="font-size: 0.9rem;">${err.message || 'Failed to load map'}</p>
          </div>
        `;
      }
    } else {
      console.error('❌ Modal: LeafletMapsIntegration not available');
      container.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-secondary, #666);">Map integration not available. Please refresh the page.</div>';
    }
  }, 300);
}

function closeMapViewerModal() {
  const modal = document.getElementById('mapViewerModal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('show');
    
    // Clean up map instance and clear container
    const container = document.getElementById('clientMapViewerModal');
    if (container) {
      // Remove map instance if exists
      if (window.currentClientMap) {
        try {
          window.currentClientMap.remove();
          window.currentClientMap = null;
        } catch (e) {
          console.warn('Error removing map:', e);
        }
      }
      // Clear container for fresh initialization next time
      container.innerHTML = '';
    }
    
    // Clear route info
    const routeInfo = document.getElementById('routeInfoModal');
    if (routeInfo) {
      routeInfo.style.display = 'none';
      routeInfo.innerHTML = '';
    }
  }
}

// Make functions globally available
window.openMapViewerModal = openMapViewerModal;
window.closeMapViewerModal = closeMapViewerModal;

// Close modal when clicking outside (but not on the map itself)
document.addEventListener('click', (e) => {
  const modal = document.getElementById('mapViewerModal');
  if (modal && e.target === modal) {
    closeMapViewerModal();
  }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const modal = document.getElementById('mapViewerModal');
    if (modal && modal.style.display === 'flex') {
      closeMapViewerModal();
    }
  }
});

function openChatWithLandlord() {
    const chatContainer = document.getElementById('floatingChatContainer');
    const chatBubble = document.getElementById('chatBubbleTrigger');
    
    if (chatContainer && chatBubble) {
        // Ensure we have apartment context set
        if (!window.currentApartmentId && window.currentSelectedAd) {
            window.currentApartmentId = window.currentSelectedAd.id;
        }
        
        // Update chat header with landlord name if available
        const chatName = document.getElementById('floatingChatName');
        if (chatName && window.currentSelectedAd && window.currentSelectedAd.landlord_name) {
            chatName.textContent = window.currentSelectedAd.landlord_name;
        }
        
        // Open the chat
        chatContainer.classList.add('show');
        loadFloatingChatMessages();
        listenForFloatingMessages();
        
        // Clear unread badge
        const badge = document.getElementById('unreadBadge');
        if (badge) {
            badge.style.display = 'none';
            badge.textContent = '0';
        }
        
        // Focus on input
        setTimeout(() => {
            const input = document.getElementById('floatingChatInput');
            if (input) {
                input.focus();
            }
        }, 300);
    }
}

// ========== TEMP-TEST-RENT-DUE — delete this entire IIFE when verification is done ==========
// (function () {
//     document.addEventListener('DOMContentLoaded', function () {
//         const btn = document.createElement('button');
//         btn.type = 'button';
//         btn.textContent = 'TEST rent-due UI';
//         btn.title = 'Disposable tester. Remove the TEMP-TEST-RENT-DUE block in client.js when finished.';
//         btn.setAttribute('data-temp-test-rent-due', '1');
//         btn.style.cssText =
//             'position:fixed;bottom:14px;left:14px;z-index:2147483000;padding:10px 14px;font-size:12px;font-weight:600;cursor:pointer;background:#f59e0b;color:#111827;border:2px dashed #92400e;border-radius:10px;box-shadow:0 4px 12px rgba(0,0,0,.2);font-family:system-ui,sans-serif;';
//         btn.onclick = function () {
//             const apt = window.currentApartmentId;
//             const msg =
//                 'TEST (disposable): Sample rent-due banner — delete TEMP-TEST-RENT-DUE in client.js when done.';
//             // Always show the badge during testing (even if no apartment is selected yet).
//             if (typeof setClientChatBubbleReminderToOne === 'function') {
//                 setClientChatBubbleReminderToOne(true);
//             }
//             if (apt) {
//                 window.__rentDueFloatingReminder = { apartmentId: apt, text: msg };
//                 prependRentDueFloatingReminder();
//             }

//             // Also highlight the due/overdue rented card (outer) in the Rented tab.
//             if (apt) {
//                 try {
//                     const rentedContainer = document.querySelector('#Rented .availistings');
//                     if (rentedContainer) {
//                         rentedContainer
//                             .querySelectorAll('.outer.outer-due-unit')
//                             .forEach((n) => n.classList.remove('outer-due-unit'));

//                         const card = rentedContainer.querySelector(`.outer[data-ad-id="${apt}"]`);
//                         if (card) {
//                             card.classList.add('outer-due-unit');
//                             card.title = 'TEST: Rent due reminder';
//                         }
//                     }
//                 } catch (_) {}
//             }

//             showWarningNotification(
//                 'TEST: Rent due reminder',
//                 apt
//                     ? 'Open the floating chat: you should see the amber banner at the top.'
//                     : 'Select an apartment (detail view) so chat has context, then click again for the banner.',
//                 { category: 'Test' }
//             );
//         };
//         document.body.appendChild(btn);
//     });
// })();
// ========== END TEMP-TEST-RENT-DUE ==========

