const editButtons = document.querySelectorAll('.editlistbtn');
editButtons.forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent bubbling if inside .outer
    // Find the parent sidelp (Dashboard, Saved, etc.)
    const parentPage = btn.closest('.sidelp');
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

// Reviews sort dropdown behavior (matching client.js implementation)
document.addEventListener('DOMContentLoaded', function(){
  const reviewsSortElements = document.querySelectorAll('#reviewsSort');
  
  reviewsSortElements.forEach(dd => {
    if (!dd) return;
    
    const btn = dd.querySelector('.sd-btn');
    const label = dd.querySelector('.sd-label');
    const menu = dd.querySelector('.sd-menu');
    
    function closeAll(){ 
      dd.classList.remove('open'); 
      if (btn) btn.setAttribute('aria-expanded','false'); 
    }
    
    if (btn) {
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        const isOpen = dd.classList.contains('open');
        if (isOpen) { 
          closeAll(); 
        } else { 
          dd.classList.add('open'); 
          btn.setAttribute('aria-expanded','true'); 
        }
      });
    }
    
    if (menu) {
      menu.addEventListener('click', function(e){
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
    }
    
    document.addEventListener('click', function(){ closeAll(); });
  });
});

function goBack() {
  // Find whichever sidelp currently has a detail open
  const parentPage = document.querySelector('.sidelp[data-detail-open="true"]');
  if (!parentPage) return;

  // If we're returning from the Rented tab, hide the no-rented-message immediately
  // to prevent it from briefly appearing before the refresh completes
  if (parentPage.id === 'Rented') {
    const noRentedMessage = document.getElementById('noRentedApartmentMessageLandlord');
    if (noRentedMessage) {
      noRentedMessage.style.display = 'none';
    }
  }

  // Restore everything except .selectedrightside
  parentPage.querySelectorAll(':scope > div:not(.selectedrightside)')
    .forEach(el => {
      // Clear inline display so CSS controls layout (e.g., grid for .availistings)
      el.style.display = '';
    });

  // Hide the selectedrightside
  const detailPage = parentPage.querySelector('.selectedrightside');
  if (detailPage) {
    detailPage.style.display = 'none';
  }

  // Reset the flag
  parentPage.removeAttribute("data-detail-open");

  clearLandlordModalState();

  // If we're returning from the Rented tab, refresh the rented apartments list
  // to ensure the no-rented-message is properly shown/hidden
  if (parentPage.id === 'Rented') {
    refreshLandlordRentedTab();
  }
}

// Chat functionality for landlord
let supabaseClient = null;
let currentApartmentId = null; // set from selected listing for chat scoping

// Helper: render photos into Dashboard .photos; builds carousel if 2+
function renderDashboardPhotos(urls) {
  try {
    const photosWrap = document.querySelector('#Dashboard .rightside .photos');
    if (!photosWrap) return;
    const list = Array.isArray(urls) ? urls.filter(Boolean) : [];
    console.log('Dashboard photos count:', list.length);
    if (!list.length) {
      photosWrap.innerHTML = `
        <div class="photo-empty" style="position:relative;width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.05);border-radius:12px;cursor:pointer;">
          <div style="display:flex;flex-direction:column;align-items:center;gap:8px;color:rgba(0,0,0,0.55);">
            <div style="width:56px;height:56px;border-radius:16px;background:rgba(34,197,94,0.15);display:flex;align-items:center;justify-content:center;font-size:28px;color:rgba(34,197,94,0.95);">+</div>
            <div style="font-size:13px;">Add photos</div>
          </div>
        </div>
      `;
      photosWrap.querySelector('.photo-empty')?.addEventListener('click', (ev) => {
        ev.stopPropagation();
        document.getElementById('dashPhotoInput')?.click();
      });
      return;
    }
    if (list.length === 1) {
      photosWrap.innerHTML = `
        <div style="position:relative;width:100%;height:100%;">
          <img src="${list[0]}" style="width:100%;height:100%;object-fit:cover;border-radius:12px"/>
          <button type="button" class="pc-edit" style="position:absolute;top:8px;left:8px;z-index:2;background:rgba(0,0,0,0.6);color:#fff;border:none;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:14px;" title="Edit Photo">✎</button>
          <button type="button" class="pc-delete" style="position:absolute;top:8px;left:48px;z-index:2;background:rgba(220,53,69,0.8);color:#fff;border:none;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:14px;" title="Delete Photo">×</button>
          <button type="button" class="pc-add-more" style="position:absolute;top:8px;left:88px;z-index:2;background:rgba(34,197,94,0.8);color:#fff;border:none;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:18px;" title="Add More Photos">+</button>
        </div>
      `;

      // Add edit functionality for single photo
      const editBtn = photosWrap.querySelector('.pc-edit');
      const deleteBtn = photosWrap.querySelector('.pc-delete');
      const addMoreBtn = photosWrap.querySelector('.pc-add-more');
      editBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        editPhotoAtIndex(0, list);
      });
      deleteBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        deletePhotoAtIndex(0, list);
      });
      addMoreBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        document.getElementById('dashPhotoInput')?.click();
      });
      return;
    }
    photosWrap.innerHTML = `
      <div class="photo-carousel" style="position:relative;width:100%;height:100%;display:flex;justify-content:center;align-items:center;">
        <button type="button" class="pc-prev" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);z-index:2;background:rgba(0,0,0,0.4);color:#fff;border:none;border-radius:50%;width:32px;height:32px;cursor:pointer">‹</button>
        <img class="pc-image" src="${list[0]}" style="width:auto;height:100%;object-fit:cover;border-radius:12px; border:none"/>
        <button type="button" class="pc-next" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);z-index:2;background:rgba(0,0,0,0.4);color:#fff;border:none;border-radius:50%;width:32px;height:32px;cursor:pointer">›</button>
        <div class="pc-dots" style="position:absolute;left:0;right:0;bottom:8px;display:flex;gap:6px;justify-content:center;z-index:2"></div>
        <div class="pc-counter" style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,0.6);color:#fff;padding:4px 8px;border-radius:12px;font-size:12px;z-index:2">1/${list.length}</div>
        <button type="button" class="pc-edit" style="position:absolute;top:8px;left:8px;z-index:2;background:rgba(0,0,0,0.6);color:#fff;border:none;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:14px;" title="Edit Photo">✎</button>
        <button type="button" class="pc-delete" style="position:absolute;top:8px;left:48px;z-index:2;background:rgba(220,53,69,0.8);color:#fff;border:none;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:14px;" title="Delete Photo">×</button>
        <button type="button" class="pc-add-more" style="position:absolute;top:8px;left:88px;z-index:2;background:rgba(34,197,94,0.8);color:#fff;border:none;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:18px;" title="Add More Photos">+</button>
      </div>`;
    const imgEl = photosWrap.querySelector('.pc-image');
    const prevBtn = photosWrap.querySelector('.pc-prev');
    const nextBtn = photosWrap.querySelector('.pc-next');
    const dotsEl = photosWrap.querySelector('.pc-dots');
    const counterEl = photosWrap.querySelector('.pc-counter');
    const editBtn = photosWrap.querySelector('.pc-edit');
    const deleteBtn = photosWrap.querySelector('.pc-delete');
    const addMoreBtn = photosWrap.querySelector('.pc-add-more');
    let idx = 0;
    dotsEl.innerHTML = list.map((_, i) => `<span data-idx="${i}" style="width:8px;height:8px;border-radius:50%;background:${i === 0 ? '#fff' : 'rgba(255,255,255,0.6)'};display:inline-block;cursor:pointer"></span>`).join('');
    function update(n) {
      if (n < 0) n = list.length - 1;
      if (n >= list.length) n = 0;
      idx = n;
      imgEl.src = list[idx];
      counterEl.textContent = `${idx + 1}/${list.length}`;
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

    // Edit photo functionality
    editBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      editPhotoAtIndex(idx, list);
    });

    // Delete photo functionality
    deleteBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      deletePhotoAtIndex(idx, list);
    });

    // Add more photos functionality
    addMoreBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      document.getElementById('dashPhotoInput')?.click();
    });
  } catch (e) {
    console.error('renderDashboardPhotos error:', e);
  }
}

function extractSupabaseStoragePathFromPublicUrl(publicUrl, bucketName) {
  try {
    if (!publicUrl || typeof publicUrl !== 'string') return null;
    if (publicUrl.startsWith('data:')) return null;
    const url = new URL(publicUrl);
    const parts = url.pathname.split('/').filter(Boolean);
    const bucketIdx = parts.indexOf(bucketName);
    if (bucketIdx < 0) return null;
    const path = parts.slice(bucketIdx + 1).join('/');
    return path || null;
  } catch (_) {
    return null;
  }
}

// Helper: render photos into Rented .photos; builds carousel if 2+
function renderRentedPhotos(urls) {
  try {
    const photosWrap = document.querySelector('#Rented .rightside .rphotos, #Rented .rightside .photos');
    if (!photosWrap) return;
    const list = Array.isArray(urls) ? urls.filter(Boolean) : [];
    if (!list.length) {
      photosWrap.innerHTML = '';
      return;
    }
    if (list.length === 1) {
      photosWrap.innerHTML = `<img src="${list[0]}" style="width:100%;height:100%;object-fit:cover;border-radius:12px"/>`;
      return;
    }
    photosWrap.innerHTML = `
      <div class="photo-carousel" style="position:relative;width:100%;height:100%;display:flex;justify-content:center;align-items:center;">
        <button type="button" class="pc-prev" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);z-index:2;background:rgba(0,0,0,0.4);color:#fff;border:none;border-radius:50%;width:32px;height:32px;cursor:pointer">‹</button>
        <img class="pc-image" src="${list[0]}" style="width:auto;height:100%;object-fit:cover;border-radius:12px; border:none;"/>
        <button type="button" class="pc-next" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);z-index:2;background:rgba(0,0,0,0.4);color:#fff;border:none;border-radius:50%;width:32px;height:32px;cursor:pointer">›</button>
        <div class="pc-dots" style="position:absolute;left:0;right:0;bottom:8px;display:flex;gap:6px;justify-content:center;z-index:2"></div>
        <div class="pc-counter" style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,0.6);color:#fff;padding:4px 8px;border-radius:12px;font-size:12px;z-index:2">1/${list.length}</div>
      </div>`;
    const imgEl = photosWrap.querySelector('.pc-image');
    const prevBtn = photosWrap.querySelector('.pc-prev');
    const nextBtn = photosWrap.querySelector('.pc-next');
    const dotsEl = photosWrap.querySelector('.pc-dots');
    const counterEl = photosWrap.querySelector('.pc-counter');
    let idx = 0;
    dotsEl.innerHTML = list.map((_, i) => `<span data-idx="${i}" style="width:8px;height:8px;border-radius:50%;background:${i===0?'#fff':'rgba(255,255,255,0.6)'};display:inline-block;cursor:pointer"></span>`).join('');
    function update(n){ if(n<0)n=list.length-1; if(n>=list.length)n=0; idx=n; imgEl.src=list[idx]; counterEl.textContent=`${idx+1}/${list.length}`; dotsEl.querySelectorAll('span').forEach((d,i)=>{ d.style.background=i===idx?'#fff':'rgba(255,255,255,0.6)'; }); }
    prevBtn.addEventListener('click', (ev)=>{ ev.stopPropagation(); update(idx-1); });
    nextBtn.addEventListener('click', (ev)=>{ ev.stopPropagation(); update(idx+1); });
    dotsEl.addEventListener('click', (ev)=>{ const dot=ev.target.closest('span[data-idx]'); if(!dot) return; ev.stopPropagation(); update(parseInt(dot.getAttribute('data-idx'),10)); });
  } catch(e) { console.warn('renderRentedPhotos error:', e); }
}

// Helper function to edit photo at specific index
function editPhotoAtIndex(index, photoList) {
  if (!window.currentEditingAdId) {
    alert('No listing selected for editing.');
    return;
  }

  // Create a hidden file input for photo replacement
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.style.display = 'none';

  fileInput.addEventListener('change', async function (e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }

    try {
      const client = initSupabase();
      if (!client) {
        alert('Unable to connect to database.');
        return;
      }

      // Find the DB row for this index
      const { data: images, error: fetchError } = await client
        .from('apartment_images')
        .select('id, image_url, is_primary, is_floorplan')
        .eq('apartment_id', window.currentEditingAdId)
        .eq('is_floorplan', false)
        .order('is_primary', { ascending: false })
        .order('id', { ascending: true });

      if (fetchError || !images || !images[index]) {
        alert('Failed to locate image record.');
        return;
      }

      const target = images[index];
      const bucketName = 'apartment-images';
      const fileExt = (file.name && file.name.includes('.')) ? file.name.split('.').pop() : 'jpg';
      const { data: sess } = await client.auth.getSession();
      const landlordId = sess?.session?.user?.id;
      if (!landlordId) {
        alert('Please sign in to update photos.');
        return;
      }
      const fileName = `landlords/${landlordId}/${window.currentEditingAdId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;

      const { error: uploadError } = await client.storage
        .from(bucketName)
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        alert('Failed to upload image.');
        return;
      }

      const { data: urlData } = client.storage.from(bucketName).getPublicUrl(fileName);
      const publicUrl = urlData?.publicUrl;
      if (!publicUrl) {
        alert('Failed to get image URL.');
        return;
      }

      // Update DB row to new URL
      const { error: updateError } = await client
        .from('apartment_images')
        .update({ image_url: publicUrl })
        .eq('id', target.id);

      if (updateError) {
        console.error('Error updating image:', updateError);
        alert('Failed to update image in database.');
        return;
      }

      // Best-effort: delete old object from storage if it was in our bucket
      const oldPath = extractSupabaseStoragePathFromPublicUrl(target.image_url, bucketName);
      if (oldPath) {
        try { await client.storage.from(bucketName).remove([oldPath]); } catch (_) { }
      }

      // Refresh from DB for canonical order/urls
      const { data: refreshed } = await client
        .from('apartment_images')
        .select('image_url')
        .eq('apartment_id', window.currentEditingAdId)
        .eq('is_floorplan', false)
        .order('is_primary', { ascending: false })
        .order('id', { ascending: true });

      const urls = (refreshed || []).map(r => r.image_url).filter(Boolean);
      renderDashboardPhotos(urls);
      alert('Photo updated successfully!');
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Failed to update image.');
    }

    // Clean up
    document.body.removeChild(fileInput);
  });

  // Trigger file selection
  document.body.appendChild(fileInput);
  fileInput.click();
}

// Helper function to delete photo at specific index
function deletePhotoAtIndex(index, photoList) {
  if (!window.currentEditingAdId) {
    alert('No listing selected for editing.');
    return;
  }

  if (photoList.length <= 1) {
    alert('Cannot delete the last photo. Please add another photo first.');
    return;
  }

  if (!confirm('Are you sure you want to delete this photo?')) {
    return;
  }

  (async () => {
    try {
      // Update in Supabase if available
      const client = initSupabase();
      if (!client) {
        alert('Unable to connect to database.');
        return;
      }

      // Get current apartment images (and their URLs for storage delete)
      const { data: images, error: fetchError } = await client
        .from('apartment_images')
        .select('id, image_url, is_primary, is_floorplan')
        .eq('apartment_id', window.currentEditingAdId)
        .eq('is_floorplan', false)
        .order('is_primary', { ascending: false })
        .order('id', { ascending: true });

      if (fetchError || !images || !images[index]) {
        alert('Failed to locate image record.');
        return;
      }

      const target = images[index];
      const bucketName = 'apartment-images';

      // Best-effort: delete from storage first (so DB doesn't point to missing file)
      const filePath = extractSupabaseStoragePathFromPublicUrl(target.image_url, bucketName);
      if (filePath) {
        try {
          await client.storage.from(bucketName).remove([filePath]);
        } catch (e) {
          console.warn('Storage delete failed:', e);
        }
      }

      // Delete the DB row
      const { error: deleteError } = await client
        .from('apartment_images')
        .delete()
        .eq('id', target.id);

      if (deleteError) {
        console.error('Error deleting image:', deleteError);
        alert('Failed to delete image from database.');
        return;
      }

      // If we deleted the primary image, make the first remaining image primary
      if (target.is_primary && images.length > 1) {
        const remainingImages = images.filter((_, i) => i !== index);
        if (remainingImages.length > 0) {
          try {
            await client.from('apartment_images').update({ is_primary: true }).eq('id', remainingImages[0].id);
          } catch (_) { }
        }
      }

      // Refresh and re-render from DB (real-time canonical)
      const { data: refreshed } = await client
        .from('apartment_images')
        .select('image_url')
        .eq('apartment_id', window.currentEditingAdId)
        .eq('is_floorplan', false)
        .order('is_primary', { ascending: false })
        .order('id', { ascending: true });

      const urls = (refreshed || []).map(r => r.image_url).filter(Boolean);
      renderDashboardPhotos(urls);
      alert('Photo deleted successfully!');
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Failed to delete photo.');
    }
  })();
}

// Helper function to edit photo at specific index in advertise section
function editAdvertisePhotoAtIndex(index, photoList) {
  // Create a hidden file input for photo replacement
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.style.display = 'none';

  fileInput.addEventListener('change', async function (e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }

    try {
      // Convert file to data URL
      const reader = new FileReader();
      reader.onload = function (e) {
        const newImageUrl = e.target.result;

        // Update the photo list
        photoList[index] = newImageUrl;

        // Update the global variables
        window.__lastNewAdPrimaryImageDataUrls = photoList.slice();
        window.__lastNewAdPrimaryImageDataUrl = photoList[0];

        renderAdvertisePhotoPreview(photoList);

        alert('Photo updated successfully!');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Failed to process image.');
    }

    // Clean up
    document.body.removeChild(fileInput);
  });

  // Trigger file selection
  document.body.appendChild(fileInput);
  fileInput.click();
}

// Helper function to delete photo at specific index in advertise section
function deleteAdvertisePhotoAtIndex(index, photoList) {
  if (photoList.length <= 1) {
    alert('Cannot delete the last photo. Please add another photo first.');
    return;
  }

  if (!confirm('Are you sure you want to delete this photo?')) {
    return;
  }

  try {
    // Remove from photo list
    photoList.splice(index, 1);

    // Update the global variables
    window.__lastNewAdPrimaryImageDataUrls = photoList.slice();
    window.__lastNewAdPrimaryImageDataUrl = photoList[0] || '';

    renderAdvertisePhotoPreview(photoList);

    alert('Photo deleted successfully!');
  } catch (error) {
    console.error('Error deleting photo:', error);
    alert('Failed to delete photo.');
  }
}

// Advertise: unified preview renderer so edit/delete/add-more stay consistent
function renderAdvertisePhotoPreview(photoList) {
  const list = Array.isArray(photoList) ? photoList.filter(Boolean) : [];
  const frame = document.querySelector('#Advertise .photosadd');
  if (!frame) return;

  // If nothing, revert to plus icon
  if (!list.length) {
    frame.innerHTML = '<i class="fa-solid fa-plus"></i>';
    frame.onclick = () => document.getElementById('photoInput')?.click();
    return;
  }

  const wireFrameClickToOpenPicker = () => {
    frame.onclick = function (e) {
      if (e.target === frame) document.getElementById('photoInput')?.click();
    };
  };

  if (list.length === 1) {
    frame.innerHTML = `
      <div style="position:relative;width:100%;height:100%;display:flex;justify-content:center;align-items:center;">
        <img src="${list[0]}" style="width:auto;height:100%;object-fit:cover; border-radius:12px;"/>
        <button type="button" class="pc-edit" style="position:absolute;top:8px;left:8px;z-index:2;background:rgba(0,0,0,0.6);color:#fff;border:none;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:14px;" title="Edit Photo">✎</button>
        <button type="button" class="pc-delete" style="position:absolute;top:8px;left:48px;z-index:2;background:rgba(220,53,69,0.8);color:#fff;border:none;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:14px;" title="Delete Photo">×</button>
        <button type="button" class="pc-add-more" style="position:absolute;top:8px;left:88px;z-index:2;background:rgba(34,197,94,0.8);color:#fff;border:none;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:18px;" title="Add More Photos">+</button>
      </div>
    `;
    frame.querySelector('.pc-edit')?.addEventListener('click', (ev) => { ev.stopPropagation(); editAdvertisePhotoAtIndex(0, photoList); });
    frame.querySelector('.pc-delete')?.addEventListener('click', (ev) => { ev.stopPropagation(); deleteAdvertisePhotoAtIndex(0, photoList); });
    frame.querySelector('.pc-add-more')?.addEventListener('click', (ev) => { ev.stopPropagation(); document.getElementById('photoInput')?.click(); });
    wireFrameClickToOpenPicker();
    return;
  }

  frame.innerHTML = `
    <div class="photo-carousel" style="position:relative;width:100%;height:100%;display:flex;justify-content:center;align-items:center;">
      <button type="button" class="pc-prev" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);z-index:2;background:rgba(0,0,0,0.4);color:#fff;border:none;border-radius:50%;width:32px;height:32px;cursor:pointer">‹</button>
      <img class="pc-image" src="${list[0]}" style="width:auto;height:100%;object-fit:cover;border-radius:6px"/>
      <button type="button" class="pc-next" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);z-index:2;background:rgba(0,0,0,0.4);color:#fff;border:none;border-radius:50%;width:32px;height:32px;cursor:pointer">›</button>
      <div class="pc-dots" style="position:absolute;left:0;right:0;bottom:8px;display:flex;gap:6px;justify-content:center;z-index:2"></div>
      <div class="pc-counter" style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,0.6);color:#fff;padding:4px 8px;border-radius:12px;font-size:12px;z-index:2">1/${list.length}</div>
      <button type="button" class="pc-edit" style="position:absolute;top:8px;left:8px;z-index:2;background:rgba(0,0,0,0.6);color:#fff;border:none;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:14px;" title="Edit Photo">✎</button>
      <button type="button" class="pc-delete" style="position:absolute;top:8px;left:48px;z-index:2;background:rgba(220,53,69,0.8);color:#fff;border:none;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:14px;" title="Delete Photo">×</button>
      <button type="button" class="pc-add-more" style="position:absolute;top:8px;left:88px;z-index:2;background:rgba(34,197,94,0.8);color:#fff;border:none;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:18px;" title="Add More Photos">+</button>
    </div>
  `;

  const imgEl = frame.querySelector('.pc-image');
  const prevBtn = frame.querySelector('.pc-prev');
  const nextBtn = frame.querySelector('.pc-next');
  const dotsEl = frame.querySelector('.pc-dots');
  const counterEl = frame.querySelector('.pc-counter');
  const editBtn = frame.querySelector('.pc-edit');
  const deleteBtn = frame.querySelector('.pc-delete');
  const addMoreBtn = frame.querySelector('.pc-add-more');
  let currentIndex = 0;

  dotsEl.innerHTML = list.map((_, i) => `<span data-idx="${i}" style="width:8px;height:8px;border-radius:50%;background:${i === 0 ? '#fff' : 'rgba(255,255,255,0.6)'};display:inline-block;cursor:pointer"></span>`).join('');

  function updateCarousel(newIndex) {
    if (newIndex < 0) newIndex = list.length - 1;
    if (newIndex >= list.length) newIndex = 0;
    currentIndex = newIndex;
    imgEl.src = list[currentIndex];
    counterEl.textContent = `${currentIndex + 1}/${list.length}`;
    dotsEl.querySelectorAll('span').forEach((d, i) => {
      d.style.background = i === currentIndex ? '#fff' : 'rgba(255,255,255,0.6)';
    });
  }

  prevBtn.addEventListener('click', (ev) => { ev.stopPropagation(); updateCarousel(currentIndex - 1); });
  nextBtn.addEventListener('click', (ev) => { ev.stopPropagation(); updateCarousel(currentIndex + 1); });
  dotsEl.addEventListener('click', (ev) => {
    const dot = ev.target.closest('span[data-idx]');
    if (!dot) return;
    ev.stopPropagation();
    updateCarousel(parseInt(dot.getAttribute('data-idx'), 10));
  });

  editBtn.addEventListener('click', (ev) => { ev.stopPropagation(); editAdvertisePhotoAtIndex(currentIndex, photoList); });
  deleteBtn.addEventListener('click', (ev) => { ev.stopPropagation(); deleteAdvertisePhotoAtIndex(currentIndex, photoList); });
  addMoreBtn.addEventListener('click', (ev) => { ev.stopPropagation(); document.getElementById('photoInput')?.click(); });
  wireFrameClickToOpenPicker();
}

// Initialize Supabase client with better error handling
function initSupabase() {
  try {
    // First check if client already exists
    if (window.supabaseClient) {
      console.log('✅ Using existing Supabase client');
      return window.supabaseClient;
    }
    
    // Check if supabase library is loaded
    if (typeof window.supabase === 'undefined') {
      console.error('❌ Supabase library not loaded. Make sure the script tag is included.');
      return null;
    }
    
    // Create new client if it doesn't exist
    if (!window.supabaseClient) {
      console.log('🔄 Creating new Supabase client...');
      window.supabaseClient = window.supabase.createClient(
      "https://kexgliyjjyurshanpxdt.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtleGdsaXlqanl1cnNoYW5weGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NDk4NjYsImV4cCI6MjA3MzUyNTg2Nn0.ltYJ7VODuilex_gbp3dqhwyAsEmPVbhWnExzTppVmR8"
    );
      console.log('✅ Supabase client created successfully');
    }
    
    return window.supabaseClient;
  } catch (error) {
    console.error('❌ Error initializing Supabase client:', error);
    return null;
  }
}

// Send message to client
async function sendMessage() {
  const chatInput = document.getElementById('chatInput');

  if (!chatInput) return;

  const message = chatInput.value.trim().slice(0, 500);
  if (!message) return;

  // Clear input
  chatInput.value = '';

  // Send message using the reusable function
  // simple rate limit: 1 msg/sec
  if (window.__lastLandlordMsgAt && Date.now() - window.__lastLandlordMsgAt < 1000) {
    return;
  }
  window.__lastLandlordMsgAt = Date.now();
  await sendMessageToChat(message);
}

function incrementChatBubbleReminder() {
  const chatContainer = document.getElementById('floatingChatContainer');
  // Only show the reminder when the floating chat is closed
  if (chatContainer && chatContainer.classList.contains('show')) return;

  const badge = document.getElementById('unreadBadge');
  if (!badge) return;

  const currentCount = parseInt(badge.textContent) || 0;
  badge.textContent = String(currentCount + 1);
  badge.style.display = 'flex';
}

function setChatBubbleReminderToOne(force = false) {
  const chatContainer = document.getElementById('floatingChatContainer');
  // Only show the reminder when the floating chat is closed (unless forced, e.g. test button)
  if (!force && chatContainer && chatContainer.classList.contains('show')) return;

  const badge = document.getElementById('unreadBadge');
  if (!badge) return;

  const cur = parseInt(badge.textContent) || 0;
  if (!force && cur > 0 && badge.style.display !== 'none') return;
  badge.textContent = '1';
  badge.style.display = 'flex';
}

// Listen for messages from client
function listenForMessages() {
  const client = initSupabase();
  if (!client) return;
  // Clean up previous channel if any
  try {
    if (window.__chatChannel && typeof window.__chatChannel.unsubscribe === 'function') {
      window.__chatChannel.unsubscribe();
    }
  } catch (_) { }

  // Only listen for messages for the currently selected apartment AND coming from the client
  const apt = currentApartmentId;
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
        // Only render messages coming from the client to avoid echoing landlord's own messages
        if (!payload || !payload.new || payload.new.sender_type !== 'client') return;
        const messagesContainer = document.getElementById('messages');
        if (messagesContainer) {
          const messageDiv = document.createElement('div');
          messageDiv.className = 'msg renter';
          messageDiv.textContent = payload.new.message;
          messagesContainer.appendChild(messageDiv);
          messagesContainer.scrollTop = messagesContainer.scrollHeight;

          // Show notification for new message
          showMessageNotification('New message from client', payload.new.message);
          incrementChatBubbleReminder();
        }
      }
    )
    .subscribe();
}

// Modern notification system (shared design with client)
const LANDLORD_NOTIFICATION_ICONS = {
  success: 'fa-circle-check',
  error: 'fa-circle-xmark',
  warning: 'fa-triangle-exclamation',
  info: 'fa-message'
};

let landlordNotificationPermissionRequested = false;

function ensureLandlordNotificationContainer() {
  let container = document.getElementById('notificationContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notificationContainer';
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
  }
  return container;
}

function requestLandlordBrowserPermission() {
  if (landlordNotificationPermissionRequested || !('Notification' in window)) return;
  landlordNotificationPermissionRequested = true;
  if (Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {});
  }
}

function showMessageNotification(title, message, type = 'info', opts = {}) {
  const { category, timeout = 5200 } = opts || {};
  requestLandlordBrowserPermission();

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
  const container = ensureLandlordNotificationContainer();
  const icon = LANDLORD_NOTIFICATION_ICONS[type] || LANDLORD_NOTIFICATION_ICONS.info;

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

// Function to load and display names in chat header
function loadChatNames() {
  // Get current user's name
  const currentUserName = 'Landlord';

  // For now, we'll set a default client name
  // In a real app, you'd fetch this from your database or message context
  const clientName = 'Apartment Seeker'; // You can make this dynamic

  // Update the chat header
  const clientNameElement = document.getElementById('clientName');
  if (clientNameElement) {
    clientNameElement.textContent = clientName;
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
  messageDiv.className = 'msg landlord';
  messageDiv.textContent = message;
  messagesContainer.appendChild(messageDiv);

  // Scroll to bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  // ensure chat is visible similar to client
  const chatBox = document.getElementById('chatBox');
  if (chatBox) {
    chatBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  // Send to Supabase
  const client = initSupabase();
  if (client) {
    try {
      const { data, error } = await client
        .from('messages')
        .insert([
          {
            sender_type: 'landlord',
            message: message,
            apartment_id: (typeof currentApartmentId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(currentApartmentId)) ? currentApartmentId : null,
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

document.addEventListener('DOMContentLoaded', () => {
  // On landlord load, clear local postings for deleted users or user switch
  (async () => {
    try {
      const client = initSupabase();
      if (client) {
        const { data } = await client.auth.getSession();
        const currentId = data?.session?.user?.id || null;
        const lastId = localStorage.getItem('lastUserId') || null;
        if (!currentId) {
          localStorage.removeItem('apartrent_listings');
        } else if (lastId && lastId !== currentId) {
          try {
            const raw = localStorage.getItem('apartrent_listings');
            const arr = raw ? JSON.parse(raw) : [];
            const filtered = Array.isArray(arr) ? arr.filter(ad => ad && ad.owner_user_id !== lastId) : [];
            localStorage.setItem('apartrent_listings', JSON.stringify(filtered));
          } catch (_) { }
        }
        if (currentId) localStorage.setItem('lastUserId', currentId); else localStorage.removeItem('lastUserId');
      }
    } catch (_) { }
  })();
  const navLinks = document.querySelectorAll('.sidemenu .page');
  const contentPages = document.querySelectorAll('.sidelp');

  navLinks.forEach(link => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      if (link.textContent.trim() === "Logout") {
        openLogOut();
        return;
      }
      navLinks.forEach(item => item.classList.remove('active'));
      link.classList.add('active');

      contentPages.forEach(page => page.classList.remove('actsidelp'));
      const targetId = link.getAttribute('data-target');
      if (targetId) {
        const targetPage = document.getElementById(targetId);
        if (targetPage) {
          targetPage.classList.add('actsidelp');
          
          // Refresh payment history when Payment History tab is accessed
          if (targetId === 'PaymentHistory') {
            console.log('🎯 Payment History tab accessed, refreshing...');
            setTimeout(async () => {
              await renderPaymentHistory();
            }, 200);
          }
        }
      }
    });
  });
});

function persistLandlordModalState(state) {
  // LocalStorage persistence disabled to avoid stale/mismatched UI
  void state;
}

function clearLandlordModalState() {
  // LocalStorage persistence disabled
}

function restoreLandlordModalState(listings) {
  // LocalStorage persistence disabled to avoid stale/mismatched UI
  void listings;
}


// Image processing: resize to max 1280px and compress to JPEG (~75%)
async function resizeImage(file, maxDim = 1280, quality = 0.75) {
  return new Promise((resolve, reject) => {
    try {
      if (!file || !(file instanceof Blob)) return resolve(null);
      const reader = new FileReader();
      reader.onerror = () => resolve(null);
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          try {
            let { width, height } = img;
            if (width <= 0 || height <= 0) return resolve(null);
            const scale = Math.min(1, maxDim / Math.max(width, height));
            const targetW = Math.round(width * scale);
            const targetH = Math.round(height * scale);
            const canvas = document.createElement('canvas');
            canvas.width = targetW;
            canvas.height = targetH;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, targetW, targetH);
            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(dataUrl);
          } catch (e) { resolve(null); }
        };
        img.onerror = () => resolve(null);
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    } catch (_) { resolve(null); }
  });
}

const outers = document.querySelectorAll('.outerad');
outers.forEach(card => {
  card.addEventListener('click', () => {
    const parentPage = card.closest('.sidelp');
    if (!parentPage) return;
    parentPage.querySelectorAll(':scope > div:not(.selectedrightside)')
      .forEach(el => el.style.display = 'none');
    const detailPage = parentPage.querySelector('.selectedrightside');
    if (detailPage) {
      detailPage.style.display = 'flex';
    }
    parentPage.setAttribute("data-detail-open", "true");
  });
});

function goBack() {
  const parentPage = document.querySelector('.sidelp[data-detail-open="true"]');
  if (!parentPage) return;

  // If we're returning from the Rented tab, hide the no-rented-message immediately
  // to prevent it from briefly appearing before the refresh completes
  if (parentPage.id === 'Rented') {
    const noRentedMessage = document.getElementById('noRentedApartmentMessageLandlord');
    if (noRentedMessage) {
      noRentedMessage.style.display = 'none';
    }
  }

  parentPage.querySelectorAll(':scope > div:not(.selectedrightside)')
    .forEach(el => {
      // Clear inline display so CSS controls layout (e.g., grid for .availistings)
      el.style.display = '';
    });
  const detailPage = parentPage.querySelector('.selectedrightside');
  if (detailPage) {
    detailPage.style.display = 'none';
  }
  parentPage.removeAttribute("data-detail-open");

  // If we're returning from the Rented tab, refresh the rented apartments list
  // to ensure the no-rented-message is properly shown/hidden
  if (parentPage.id === 'Rented') {
    refreshLandlordRentedTab();
  }
}

/**
 * View Dashboard - switch to Dashboard tab for landlord
 */
function viewDashboard() {
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
  } catch (error) {
    console.error('Error switching to Dashboard:', error);
  }
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
  const client = initSupabase();
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

  const savedTab = null;
  if (savedTab) {
    setActiveTab(savedTab);
  } else {
    setActiveTab('Dashboard');
    // localStorage disabled
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
        // localStorage disabled
      }
      // Always keep Advertise tab fresh (doesn't affect posted units)
      if (targetId === 'Advertise' && typeof resetAdvertiseForm === 'function') {
        resetAdvertiseForm();
      }
    });
  });
});

// this display the user name and email in all relevant places
document.addEventListener('DOMContentLoaded', function () {
  if (window.updateUserNameAndEmailFromSession) {
    window.updateUserNameAndEmailFromSession();
  } else if (typeof updateUserNameAndEmailFromSession === 'function') {
    updateUserNameAndEmailFromSession();
  }
});


async function logout() {
  try {
    // Ensure Supabase client is available
    if (window.supabase && !window.supabaseClient) {
      window.supabaseClient = supabase.createClient(
        "https://kexgliyjjyurshanpxdt.supabase.co",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtleGdsaXlqanl1cnNoYW5weGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NDk4NjYsImV4cCI6MjA3MzUyNTg2Nn0.ltYJ7VODuilex_gbp3dqhwyAsEmPVbhWnExzTppVmR8"
      );
    }

    if (window.supabaseClient) {
      // Get current session data before signing out
      const { data } = await window.supabaseClient.auth.getSession();
      const user = data?.session?.user;

      if (user) {
        // Save user info to localStorage
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
        } catch (_) { }
      };
      clearAuthStorage(window.localStorage);
      clearAuthStorage(window.sessionStorage);
    } catch (_) { }
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

// Initialize chat system for landlord
initSupabase();
// listenForMessages will be called after a listing is selected so it scopes to apartment_id

// Add Enter key support for chat input
const chatInput = document.getElementById('chatInput');
if (chatInput) {
  chatInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
}

// Load and display names
loadChatNames();

// Initialize message-box functionality
handleMessageBoxSend();







// ------- Advertisement publish + render on landlord dashboard -------
function getStoredListings() {
  // LocalStorage caching disabled to avoid stale/mismatched UI
  return [];
}

function setStoredListings(listings) {
  // LocalStorage caching disabled to avoid stale/mismatched UI
  void listings;
}

// Build a single landlord dashboard card element from an apartment object.
// This is reused for both cached (localStorage) data and fresh Supabase data
// to keep rendering consistent and avoid duplicating DOM logic.
function buildLandlordListingCard(ad) {
  const card = document.createElement('div');
  card.className = 'outerad';
  card.dataset.adId = ad.id;
  card.dataset.id = ad.id; // For filtering compatibility
  // For filtering
  card.dataset.location = String(ad.location || '').toLowerCase();
  card.dataset.price = String(ad.price || '').toLowerCase();
  card.dataset.description = String(ad.description || '').toLowerCase();

  // Normalize unit counts for display
  const totalUnits = ad.totalUnits != null ? ad.totalUnits : (ad.total_units != null ? ad.total_units : 1);
  // IMPORTANT: availability shown in badges must reflect *actual occupied units*.
  // Do not trust advertised available_units if there are occupied unit numbers.
  const occupiedArr = (() => {
    if (Array.isArray(ad.occupiedUnitNumbers)) return ad.occupiedUnitNumbers;
    if (Array.isArray(ad.occupied_unit_numbers)) return ad.occupied_unit_numbers;
    if (ad.occupied_unit_numbers && typeof ad.occupied_unit_numbers === 'string') {
      try { return JSON.parse(ad.occupied_unit_numbers || '[]'); } catch (_) { return []; }
    }
    return [];
  })();
  const occSet = new Set(occupiedArr.map(n => Number(n)).filter(n => !isNaN(n) && n >= 1));
  // If no explicit occupied units stored yet but landlord initially
  // advertised fewer available units than total, infer occupied purely for UI.
  if (occSet.size === 0 && totalUnits > 1) {
    const storedAvailable = ad.availableUnits != null
      ? ad.availableUnits
      : (ad.available_units != null
        ? ad.available_units
        : (String(ad.status || 'available').toLowerCase() === 'rented' ? 0 : totalUnits));
    const inferredOccupiedCount = Math.max(0, Math.min(totalUnits, totalUnits - Number(storedAvailable)));
    for (let i = 1; i <= inferredOccupiedCount; i++) occSet.add(i);
  }
  const availableUnits = Math.max(0, totalUnits - occSet.size);

  // Create photo display - carousel for multiple photos, single image for one photo
  let photoHtml = '';
  if (ad.primaryImageDataUrls && ad.primaryImageDataUrls.length > 1) {
    // Multiple photos - show carousel
    photoHtml = `
      <div class="photo-carousel" style="position:relative;width:100%;height:100%;display:flex;justify-content:center;align-items:center;">
        <button type="button" class="pc-prev" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);z-index:2;background:rgba(0,0,0,0.4);color:#fff;border:none;border-radius:50%;width:32px;height:32px;cursor:pointer">‹</button>
        <img class="pc-image" src="${ad.primaryImageDataUrls[0]}" loading="lazy" style="width:100%;height:100%;object-fit:cover;border-radius:12px"/>
        <button type="button" class="pc-next" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);z-index:2;background:rgba(0,0,0,0.4);color:#fff;border:none;border-radius:50%;width:32px;height:32px;cursor:pointer">›</button>
        <div class="pc-dots" style="position:absolute;left:0;right:0;bottom:8px;display:flex;gap:6px;justify-content:center;z-index:2"></div>
        <div class="pc-counter" style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,0.6);color:#fff;padding:4px 8px;border-radius:12px;font-size:12px;z-index:2">1/${ad.primaryImageDataUrls.length}</div>
      </div>
    `;
  } else if (ad.primaryImageDataUrl) {
    // Single photo
    photoHtml = `<img src="${ad.primaryImageDataUrl}" loading="lazy" style="width:100%;height:100%;object-fit:cover; border-radius: 12px;"/>`;
  } else {
    // No photo - show icon
    photoHtml = `<i class="fa-solid fa-building"></i>`;
  }

  const isFullyRented = availableUnits <= 0;

  // Styling is handled via CSS hover states; keep JS free of inline borders.
  if (isFullyRented) {
    card.classList.add('fully-rented');
  }

  card.innerHTML = `
    <div class="photoad" style="position:relative;">
      ${photoHtml}
      <div class="unit-badge" style="position:absolute;top:8px;left:8px;background:rgba(15,23,42,0.9);color:#fff;padding:5px 10px;border-radius:8px;font-size:0.8rem;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,0.2);">
        ${availableUnits > 0
          ? `${availableUnits}/${totalUnits} unit${totalUnits > 1 ? 's' : ''} available`
          : `All the units are rented`}
      </div>
    </div>
    <div class="listinfo">
      <div class="listinfoleft">
        <div class="price-location">₱${ad.price} - ${ad.location}</div>
      </div>
    </div>
    <div class="card-rating card-rating-below" data-apartment-id="${ad.id}">
      <span class="stars-inline" aria-hidden="true"></span>
      <span class="rating-text" aria-label="rating"></span>
    </div>
    <div class="status-row" style="margin-top:6px;display:flex;justify-content:space-between;align-items:center; gap:16px;">
      <span class="status-badge" style="padding:3px 8px;border-radius:999px;font-size:.8rem;${(ad.status || 'available') === 'available' ? 'background:#e6f7ec;color:#1e7e34;' : 'background:#fdecea;color:#b02a37;'}">${(ad.status || 'available') === 'available' ? 'Available' : 'Rented'}</span>
      <span style="font-size:.8rem;color:${isFullyRented ? '#b91c1c' : '#6b7280'};">
        ${availableUnits > 0
          ? `${availableUnits} of ${totalUnits} unit${totalUnits > 1 ? 's' : ''} available`
          : 'All the units are rented'}
      </span>
      <div style="display:flex;gap:8px;align-items:center;">
        <button class="delete-listing" data-ad-id="${ad.id}" style="padding:4px 8px;font-size:.8rem; border: 1px solid #e5534b; background:#fff; color:#e5534b; border-radius: 8px;cursor:pointer;">Delete</button>
      </div>
    </div>
  `;

  // Add carousel functionality if multiple photos
  if (ad.primaryImageDataUrls && ad.primaryImageDataUrls.length > 1) {
    const imgEl = card.querySelector('.pc-image');
    const prevBtn = card.querySelector('.pc-prev');
    const nextBtn = card.querySelector('.pc-next');
    const dotsEl = card.querySelector('.pc-dots');
    const counterEl = card.querySelector('.pc-counter');
    let idx = 0;

    dotsEl.innerHTML = ad.primaryImageDataUrls
      .map((_, i) => `<span data-idx="${i}" style="width:8px;height:8px;border-radius:50%;background:${i === 0 ? '#fff' : 'rgba(255,255,255,0.6)'};display:inline-block;cursor:pointer"></span>`)
      .join('');

    function update(n) {
      if (n < 0) n = ad.primaryImageDataUrls.length - 1;
      if (n >= ad.primaryImageDataUrls.length) n = 0;
      idx = n;
      imgEl.src = ad.primaryImageDataUrls[idx];
      counterEl.textContent = `${idx + 1}/${ad.primaryImageDataUrls.length}`;
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

  return card;
}

function collectNewAdForm() {
  const price = (document.getElementById('newAdPrice')?.value || '').trim();
  const location = (document.getElementById('newAdLocation')?.value || '').trim();
  const description = (document.getElementById('newAdDescription')?.value || '').trim();
  const unitSize = (document.getElementById('newAdUnitSize')?.value || '').trim();
  const totalUnitsRaw = (document.getElementById('newAdTotalUnits')?.value || '').trim();
  const availableUnitsRaw = (document.getElementById('newAdAvailableUnits')?.value || '').trim();
  const amenities = (document.getElementById('newAdAmenities')?.value || '').trim();
  const contact = (document.getElementById('adContact')?.value || '').trim();
  const email = (document.getElementById('adEmail')?.value || '').trim();
  const statusSelect = (document.getElementById('newAdStatus')?.value || 'available');

  // requirements
  const reqEls = document.querySelectorAll('#Advertise [name="requirements"]:checked');
  const requirements = Array.from(reqEls).map(el => el.value);
  const otherReq = (document.getElementById('adOtherReq')?.value || '').trim();
  if (otherReq) requirements.push(otherReq);

  // payment methods - store the checked methods directly
  const payEls = document.querySelectorAll('#Advertise [name="payment-methods"]:checked');
  const paymentMethods = Array.from(payEls).map(el => el.value.toLowerCase());
  
  // Build payment_config object (security deposit removed)
  const payment_config = {
    // Default payment options available to all clients
    initial_payment_options: ['partial', 'full', 'advance'],
    partial_payment_percentage: 50,
    advance_payment_months: 2
  };

  // Get coordinates from map picker
  const latitude = document.getElementById('newApartmentLatitude')?.value || null;
  const longitude = document.getElementById('newApartmentLongitude')?.value || null;

  // Normalize unit counts
  let totalUnits = parseInt(totalUnitsRaw, 10);
  if (!Number.isFinite(totalUnits) || totalUnits <= 0) totalUnits = 1;
  let availableUnits = parseInt(availableUnitsRaw, 10);
  if (!Number.isFinite(availableUnits) || availableUnits < 0) availableUnits = totalUnits;
  if (availableUnits > totalUnits) availableUnits = totalUnits;

  // Derive overall status from availability (building stays listed while any unit is available)
  const status = availableUnits > 0 ? 'available' : 'rented';

  // Auto-generate initially occupied unit numbers based on the landlord's
  // total vs available inputs. These represent already-occupied units at the
  // time of advertising (not necessarily tenants in Apartrent).
  const occupiedCount = Math.max(0, totalUnits - availableUnits);
  const occupiedUnitNumbers = Array.from({ length: occupiedCount }, (_, i) => i + 1);

  return {
    id: 'ad_' + Date.now(),
    price,
    location,
    description,
    unitSize,
    totalUnits,
    availableUnits,
    occupiedUnitNumbers,
    amenities,
    contact,
    email,
    requirements,
    paymentMethods,
    status,
    // Note: payment_config is used client-side only unless the column exists in Supabase
    latitude: latitude ? parseFloat(latitude) : null,
    longitude: longitude ? parseFloat(longitude) : null,
    // floor plan (file) - store as data URL for simplicity (optional)
    floorPlanDataUrl: window.__lastNewAdFloorPlanDataUrl || '',
    // primary listing image (first uploaded photo)
    primaryImageDataUrl: window.__lastNewAdPrimaryImageDataUrl || '',
    // all uploaded photos (if multiple)
    primaryImageDataUrls: Array.isArray(window.__lastNewAdPrimaryImageDataUrls) ? window.__lastNewAdPrimaryImageDataUrls : [],
    // owner for privacy/security filtering
    owner_user_id: window.currentUserId || null,
    createdAt: new Date().toISOString()
  };
}

async function publishAd() {
  const data = collectNewAdForm();
  const missingFields = [];
  if (!data.price) missingFields.push('Price');
  if (!data.location) missingFields.push('Location');
  if (!data.description) missingFields.push('Description');
  if (!data.unitSize) missingFields.push('Unit type');
  if (!data.amenities) missingFields.push('Amenities');
  if (!data.requirements || data.requirements.length === 0) missingFields.push('Requirements');
  if (!data.contact) missingFields.push('Contact number');
  if (!data.email) missingFields.push('Gmail');
  if (!data.paymentMethods || data.paymentMethods.length === 0) missingFields.push('Online payment methods');
  if (!data.primaryImageDataUrls || data.primaryImageDataUrls.length === 0) missingFields.push('Photos');

  if (missingFields.length > 0) {
    alert(`Please fill in the required fields: ${missingFields.join(', ')}.`);
    return;
  }

  showStatusOverlay('Publishing listing…', 'loading');

  // Require authenticated user for online publish
  try {
    const client = initSupabase();
    if (!client) { alert('Supabase client not initialized.'); return; }
    const { data: sess } = await client.auth.getSession();
    const ownerId = sess?.session?.user?.id || null;
    if (!ownerId) {
      alert('Please sign in to publish online. You are not authenticated.');
      window.location.href = 'login.html';
      return;
    }
    // Some schemas require a non-null title. Derive a reasonable default.
    const derivedTitle = (data.title && String(data.title).trim())
      || (data.location ? `Apartment in ${data.location}` : 'Apartment');
    const { data: aptRows, error: aptErr } = await client.from('apartments').insert([{
      title: derivedTitle,
      price: data.price,
      location: data.location,
      description: data.description,
      unit_size: data.unitSize || null,
      total_units: data.totalUnits || 1,
      available_units: data.availableUnits ?? data.totalUnits ?? 1,
      occupied_unit_numbers: Array.isArray(data.occupiedUnitNumbers) ? data.occupiedUnitNumbers : [],
      amenities: data.amenities || null,
      contact: data.contact || null,
      email: data.email || null,
      requirements: (Array.isArray(data.requirements) && data.requirements.length) ? JSON.stringify(data.requirements) : null,
      payment_methods: (Array.isArray(data.paymentMethods) && data.paymentMethods.length) ? data.paymentMethods : null,
      status: data.status || 'available',
      landlord_id: ownerId,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      // security deposit removed
    }]).select('id').single();
    if (aptErr) {
      showStatusOverlay('Publish failed. Please try again.', 'error');
      hideStatusOverlay(1600);
      return;
    }
    const apartmentId = aptRows?.id;
    // Save all photos (excluding floor plans)
    if (apartmentId && data.primaryImageDataUrls && data.primaryImageDataUrls.length > 0) {
      const photoInserts = data.primaryImageDataUrls.map((url, index) => ({
        apartment_id: apartmentId,
        image_url: url,
        is_primary: index === 0, // First image is primary
        is_floorplan: false
      }));

      const { error: photosError } = await client.from('apartment_images').insert(photoInserts);
      if (photosError) {
        console.warn('Photos upload failed:', photosError);
        // Fallback to single primary image
        if (data.primaryImageDataUrl) {
          const { error } = await client.from('apartment_images').insert([{
            apartment_id: apartmentId,
            image_url: data.primaryImageDataUrl,
            is_primary: true,
            is_floorplan: false
          }]);
          if (error) { alert('Primary image failed: ' + error.message); }
        }
      }
    } else if (apartmentId && data.primaryImageDataUrl) {
      // Fallback for single image
      const { error } = await client.from('apartment_images').insert([{
        apartment_id: apartmentId,
        image_url: data.primaryImageDataUrl,
        is_primary: true,
        is_floorplan: false
      }]);
      if (error) { alert('Primary image failed: ' + error.message); }
    }

    // Save floor plan separately
    if (apartmentId && data.floorPlanDataUrl) {
      const { error } = await client.from('apartment_images').insert([{
        apartment_id: apartmentId,
        image_url: data.floorPlanDataUrl,
        is_primary: false,
        is_floorplan: true
      }]);
      if (error) { alert('Floor plan upload failed: ' + error.message); }
    }
    
    // Upload panorama images if any
    if (apartmentId && window.__panoramaImages && window.__panoramaImages.length > 0) {
      await window.uploadPanoramaImages(apartmentId, ownerId);
    }
    
    showStatusOverlay('Advertisement published!', 'success');
    hideStatusOverlay(1400);
    debouncedRenderLandlordListings();
  } catch (e) {
    showStatusOverlay('Publish failed. Please try again.', 'error');
    hideStatusOverlay(1600);
  }
}

// Prevent multiple simultaneous calls to renderLandlordListings
let isRendering = false;
let renderTimeout = null;

// Debounced version for rapid successive calls
function debouncedRenderLandlordListings() {
  if (renderTimeout) {
    clearTimeout(renderTimeout);
  }
  renderTimeout = setTimeout(() => {
    renderLandlordListings();
  }, 100); // 100ms debounce
}

function renderLandlordListings() {
  const container = document.getElementById('landlordListings');
  if (!container) return;

  showStatusOverlay('Loading', 'loading');

  // Clear any pending render calls
  if (renderTimeout) {
    clearTimeout(renderTimeout);
  }

  // Prevent multiple simultaneous calls
  if (isRendering) {
    console.log('renderLandlordListings already in progress, skipping...');
    return;
  }
  isRendering = true;

  // IMPORTANT UX: do NOT clear immediately.
  // Keep existing cards visible while we fetch/compute the refreshed list,
  // then swap content at the end to avoid the "everything disappears" flash.

  const currentUserId = window.currentUserId || null;

  // Fast path: if we have cached listings, render them immediately for
  // better perceived performance on slow or flaky connections.
  try {
    const cachedAll = getStoredListings();
    let cachedListings = Array.isArray(cachedAll) ? cachedAll : [];
    if (currentUserId) {
      cachedListings = cachedListings.filter(
        (ad) => ad && ad.landlord_id && ad.landlord_id === currentUserId
      );
    }
    // Only paint cached listings if the UI is currently empty
    // (avoid wiping the list and causing a confusing flash).
    if (cachedListings.length && container.childElementCount === 0) {
      const cachedFragment = document.createDocumentFragment();
      cachedListings.forEach((ad) => {
        const card = buildLandlordListingCard(ad);
        cachedFragment.appendChild(card);
      });
      container.appendChild(cachedFragment);
      // Populate rating widgets on cached cards
      try {
        container.querySelectorAll('.outerad').forEach(cardEl => {
          const aptId = cardEl?.dataset?.adId || cardEl?.dataset?.id;
          if (aptId) renderCardRatingSummaryLandlord(aptId, cardEl);
        });
      } catch (_) {}
    }
  } catch (_) {
    // If anything goes wrong with cached data, ignore and continue with Supabase fetch
  }

  (async () => {
    let listings = [];
    try {
      const client = initSupabase();
      if (client && currentUserId) {
      const { data, error } = await client
        .from('apartments')
        .select('id, price, location, description, unit_size, total_units, available_units, occupied_unit_numbers, amenities, contact, email, requirements, payment_methods, status, created_at, latitude, longitude, apartment_images ( image_url, is_primary, is_floorplan )')
        .eq('landlord_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(100);
        if (error) throw error;
        const rows = (data || []);

        // Pull approved/accepted applications to lock units (online occupants)
        const lockedUnitsByApt = new Map();
        try {
          const aptIds = rows.map(r => r?.id).filter(Boolean);
          if (aptIds.length) {
            const { data: apps, error: appErr } = await client
              .from('rental_applications')
              .select('apartment_id, status, unit_number, data')
              .in('apartment_id', aptIds)
              .in('status', ['approved', 'accepted'])
              .limit(1000);
            if (!appErr && Array.isArray(apps)) {
              (apps || []).forEach(app => {
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
          }
        } catch (_) {}

        listings = rows.map(r => {
          // Separate floor plans from regular photos
          const apartmentImages = Array.isArray(r.apartment_images) ? r.apartment_images : [];
          const photoImages = apartmentImages.filter(img => !img.is_floorplan);
          const floorPlanImages = apartmentImages.filter(img => img.is_floorplan);
          const baseOcc = Array.isArray(r.occupied_unit_numbers)
            ? r.occupied_unit_numbers
            : (r.occupied_unit_numbers ? JSON.parse(r.occupied_unit_numbers || '[]') : []);
          const locked = lockedUnitsByApt.get(String(r.id));
          const mergedOcc = (() => {
            if (!locked || locked.size === 0) return baseOcc;
            const set = new Set((baseOcc || []).map(n => Number(n)).filter(n => !isNaN(n) && n >= 1));
            locked.forEach(u => set.add(u));
            return Array.from(set).sort((a, b) => a - b);
          })();

          return {
            id: String(r.id),
            price: r.price,
            location: r.location,
            description: r.description,
            unitSize: r.unit_size,
            totalUnits: r.total_units != null ? r.total_units : 1,
            availableUnits: r.available_units != null ? r.available_units : (String(r.status || 'available').toLowerCase() === 'rented' ? 0 : 1),
            occupiedUnitNumbers: mergedOcc,
            amenities: r.amenities,
            contact: r.contact,
            email: r.email,
            requirements: (() => {
              try {
                return r.requirements ? JSON.parse(r.requirements) : [];
              } catch (_) {
                return [];
              }
            })(),
            paymentMethods: (() => {
              if (!r.payment_methods) return [];
              if (Array.isArray(r.payment_methods)) return r.payment_methods;
              try {
                const parsed = JSON.parse(r.payment_methods);
                return Array.isArray(parsed) ? parsed : [];
              } catch (_) {
                return [];
              }
            })(),
            status: r.status,
            createdAt: r.created_at,
            latitude: r.latitude,
            longitude: r.longitude,
            // Primary image for backward compatibility
            primaryImageDataUrl: photoImages.length > 0 ? (photoImages.find(i => i.is_primary) || photoImages[0])?.image_url || '' : '',
            // All photo URLs (excluding floor plans) for carousel
            primaryImageDataUrls: photoImages.map(img => img.image_url).filter(Boolean),
            // Floor plan URL
            floorPlanDataUrl: floorPlanImages.length > 0 ? floorPlanImages[0].image_url : ''
          };
        });
      }
    } catch (e) {
      console.warn('Supabase renderLandlordListings fallback to local:', e?.message || e);
    } finally {
      // Ensure flag is reset even if there's an error
      isRendering = false;
    }
    if (!listings.length) {
      const allListings = getStoredListings();
      listings = Array.isArray(allListings) ? allListings.filter(ad => ad.landlord_id && currentUserId && ad.landlord_id === currentUserId) : [];
    }
    // Show both available and fully-rented listings on the Dashboard
    // Use DocumentFragment for better performance - reduces reflows
    const fragment = document.createDocumentFragment();
    
    // Keep default (most recent) order
    listings.forEach((ad) => {
      const card = buildLandlordListingCard(ad);
      fragment.appendChild(card);
    });
    
    // Swap content in one shot (prevents temporary empty state)
    container.replaceChildren(fragment);
    // Populate rating widgets on freshly rendered cards
    try {
      container.querySelectorAll('.outerad').forEach(cardEl => {
        const aptId = cardEl?.dataset?.adId || cardEl?.dataset?.id;
        if (aptId) renderCardRatingSummaryLandlord(aptId, cardEl);
      });
    } catch (_) {}
    hideStatusOverlay(300);
  })();
}

async function refreshLandlordListingCard(adId) {
  try {
    const container = document.getElementById('landlordListings');
    if (!container || !adId) return;

    const client = initSupabase();
    const currentUserId = window.currentUserId || null;
    if (!client || !currentUserId) {
      // If we can't fetch, fall back to full refresh
      debouncedRenderLandlordListings();
      return;
    }

    const { data: row, error } = await client
      .from('apartments')
      .select('id, price, location, description, unit_size, total_units, available_units, occupied_unit_numbers, amenities, contact, email, requirements, payment_methods, status, created_at, latitude, longitude, apartment_images ( image_url, is_primary, is_floorplan )')
      .eq('id', adId)
      .eq('landlord_id', currentUserId)
      .single();

    if (error || !row) throw (error || new Error('Listing not found'));

    const apartmentImages = Array.isArray(row.apartment_images) ? row.apartment_images : [];
    const photoImages = apartmentImages.filter(img => !img.is_floorplan);
    const floorPlanImages = apartmentImages.filter(img => img.is_floorplan);

    const ad = {
      id: String(row.id),
      price: row.price,
      location: row.location,
      description: row.description,
      unitSize: row.unit_size,
      totalUnits: row.total_units != null ? row.total_units : 1,
      availableUnits: row.available_units != null ? row.available_units : (String(row.status || 'available').toLowerCase() === 'rented' ? 0 : 1),
      occupiedUnitNumbers: Array.isArray(row.occupied_unit_numbers)
        ? row.occupied_unit_numbers
        : (row.occupied_unit_numbers ? JSON.parse(row.occupied_unit_numbers || '[]') : []),
      amenities: row.amenities,
      contact: row.contact,
      email: row.email,
      requirements: (() => { try { return row.requirements ? JSON.parse(row.requirements) : []; } catch (_) { return []; } })(),
      paymentMethods: (() => {
        if (!row.payment_methods) return [];
        if (Array.isArray(row.payment_methods)) return row.payment_methods;
        try { const parsed = JSON.parse(row.payment_methods); return Array.isArray(parsed) ? parsed : []; } catch (_) { return []; }
      })(),
      status: row.status,
      createdAt: row.created_at,
      latitude: row.latitude,
      longitude: row.longitude,
      primaryImageDataUrl: photoImages.length > 0 ? (photoImages.find(i => i.is_primary) || photoImages[0])?.image_url || '' : '',
      primaryImageDataUrls: photoImages.map(img => img.image_url).filter(Boolean),
      floorPlanDataUrl: floorPlanImages.length > 0 ? floorPlanImages[0].image_url : ''
    };

    // Best-effort: merge locked units for this apartment into occupiedUnitNumbers
    try {
      const { data: apps, error: appErr } = await client
        .from('rental_applications')
        .select('unit_number, data, status')
        .eq('apartment_id', adId)
        .in('status', ['approved', 'accepted'])
        .limit(200);
      if (!appErr && Array.isArray(apps) && apps.length) {
        const set = new Set((ad.occupiedUnitNumbers || []).map(n => Number(n)).filter(n => !isNaN(n) && n >= 1));
        (apps || []).forEach(app => {
          const unit = app?.unit_number != null ? Number(app.unit_number)
            : (app?.data && app.data.unit_number != null ? Number(app.data.unit_number) : null);
          if (unit != null && !isNaN(unit) && unit >= 1) set.add(unit);
        });
        ad.occupiedUnitNumbers = Array.from(set).sort((a, b) => a - b);
      }
    } catch (_) {}

    // Update local cache too (lightweight, images stripped by setStoredListings)
    try {
      const all = getStoredListings();
      const list = Array.isArray(all) ? all.slice() : [];
      const idx = list.findIndex(x => String(x.id) === String(adId));
      if (idx >= 0) list[idx] = { ...list[idx], ...ad };
      else list.push({ ...ad, landlord_id: currentUserId, owner_user_id: currentUserId });
      setStoredListings(list);
    } catch (_) { }

    const existingCard = container.querySelector(`.outerad[data-ad-id="${adId}"]`);
    const newCard = buildLandlordListingCard(ad);
    if (existingCard && existingCard.parentNode) {
      existingCard.parentNode.replaceChild(newCard, existingCard);
    } else {
      // If the card isn't visible (filtered out, etc.), do a full refresh
      debouncedRenderLandlordListings();
    }
  } catch (e) {
    console.warn('refreshLandlordListingCard failed:', e?.message || e);
    debouncedRenderLandlordListings();
  }
}

// Fetch and render rating summary inside a landlord card
async function renderCardRatingSummaryLandlord(apartmentId, cardEl) {
  try {
    const client = initSupabase();
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
          return `<span class="star-empty">★</span>`;
        }
      }).join('');
      starsEl.innerHTML = starsHTML;
      starsEl.setAttribute('aria-label', `${avg.toFixed(1)} out of 5`);
    }
    if (textEl) textEl.textContent = `${avg.toFixed(1)} • ${count} review${count===1?'':'s'}`;
  } catch(_) {}
}

document.addEventListener('DOMContentLoaded', () => {
  const publishBtn = document.getElementById('adPublishBtn');
  if (publishBtn) {
    publishBtn.addEventListener('click', publishAd);
  }

  // No dashboard sort controls

  // Open attachment links in modal (image/pdf) with close button
  document.addEventListener('click', function (e) {
    const link = e.target && e.target.closest && e.target.closest('a.openattachbtn');
    if (!link) return;
    e.preventDefault();
    const url = link.getAttribute('href');
    // Try to infer a friendly name from nearby label/header
    let name = link.textContent && link.textContent.trim();
    const header = link.closest('.attach-box');
    if (header) {
      const h = header.querySelector('div[style*="font-weight:600"]');
      if (h && h.textContent) name = h.textContent.trim();
    }
    openAttachmentModal(url, name || 'Attachment');
  });

  // capture Advertise floor plan file to data URL
  const newFloorInput = document.getElementById('adFloorPlan');
  if (newFloorInput) {
    newFloorInput.addEventListener('change', function () {
      const file = this.files && this.files[0];
      if (!file) { window.__lastNewAdFloorPlanDataUrl = ''; return; }
      if (!file.type || !file.type.startsWith('image/')) {
        alert('Please upload an image file.');
        this.value = '';
        window.__lastNewAdFloorPlanDataUrl = '';
        return;
      }
      (async () => {
        const dataUrl = await resizeImage(file);
        window.__lastNewAdFloorPlanDataUrl = dataUrl || '';
      })();
    });
  }
  // capture uploaded photos (multiple) and build a simple carousel preview
  const newPhotoInput = document.getElementById('photoInput');
  if (newPhotoInput) {
    newPhotoInput.addEventListener('change', function () {
      const files = Array.from(this.files || []);
      const imageFiles = files.filter(f => f && f.type && f.type.startsWith('image/'));
      if (!imageFiles.length) {
        // Don't reset if we already have photos
        if (!window.__lastNewAdPrimaryImageDataUrls || window.__lastNewAdPrimaryImageDataUrls.length === 0) {
          window.__lastNewAdPrimaryImageDataUrl = '';
          window.__lastNewAdPrimaryImageDataUrls = [];
          const frame = document.querySelector('#Advertise .photosadd');
          if (frame) {
            frame.innerHTML = '<i class="fa-solid fa-plus"></i>';
          }
        }
        return;
      }
      (async () => {
        const dataUrls = [];
        for (const f of imageFiles) {
          const dataUrl = await resizeImage(f);
          if (dataUrl) dataUrls.push(dataUrl);
        }
        if (!dataUrls.length) { return; }

        // Merge with existing photos instead of replacing
        const existingPhotos = window.__lastNewAdPrimaryImageDataUrls || [];
        const allPhotos = [...existingPhotos, ...dataUrls];
        
        window.__lastNewAdPrimaryImageDataUrls = allPhotos;
        window.__lastNewAdPrimaryImageDataUrl = allPhotos[0];

        const frame = document.querySelector('#Advertise .photosadd');
        if (!frame) return;

        if (allPhotos.length === 1) {
          frame.innerHTML = `
            <div style="position:relative;width:100%;height:100%;display:flex;justify-content:center;align-items:center;">
              <img src="${allPhotos[0]}" style="width:auto;height:100%;object-fit:cover; border-radius:12px;"/>
              <button type="button" class="pc-edit" style="position:absolute;top:8px;left:8px;z-index:2;background:rgba(0,0,0,0.6);color:#fff;border:none;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:14px;" title="Edit Photo">✎</button>
              <button type="button" class="pc-delete" style="position:absolute;top:8px;left:48px;z-index:2;background:rgba(220,53,69,0.8);color:#fff;border:none;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:14px;" title="Delete Photo">×</button>
              <button type="button" class="pc-add-more" style="position:absolute;top:8px;left:88px;z-index:2;background:rgba(34,197,94,0.8);color:#fff;border:none;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:18px;" title="Add More Photos">+</button>
            </div>
          `;

          const editBtn = frame.querySelector('.pc-edit');
          const deleteBtn = frame.querySelector('.pc-delete');
          const addMoreBtn = frame.querySelector('.pc-add-more');
          editBtn.addEventListener('click', (ev) => { ev.stopPropagation(); editAdvertisePhotoAtIndex(0, allPhotos); });
          deleteBtn.addEventListener('click', (ev) => { ev.stopPropagation(); deleteAdvertisePhotoAtIndex(0, allPhotos); });
          addMoreBtn.addEventListener('click', (ev) => { ev.stopPropagation(); document.getElementById('photoInput').click(); });
        } else {
          frame.innerHTML = `
            <div class="photo-carousel" style="position:relative;width:100%;height:100%;display:flex;justify-content:center;align-items:center;">
              <button type="button" class="pc-prev" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);z-index:2;background:rgba(0,0,0,0.4);color:#fff;border:none;border-radius:50%;width:32px;height:32px;cursor:pointer">‹</button>
              <img class="pc-image" src="${allPhotos[0]}" style="width:auto;height:100%;object-fit:cover;border-radius:6px"/>
              <button type="button" class="pc-next" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);z-index:2;background:rgba(0,0,0,0.4);color:#fff;border:none;border-radius:50%;width:32px;height:32px;cursor:pointer">›</button>
              <div class="pc-dots" style="position:absolute;left:0;right:0;bottom:8px;display:flex;gap:6px;justify-content:center;z-index:2"></div>
              <div class="pc-counter" style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,0.6);color:#fff;padding:4px 8px;border-radius:12px;font-size:12px;z-index:2">1/${allPhotos.length}</div>
              <button type="button" class="pc-edit" style="position:absolute;top:8px;left:8px;z-index:2;background:rgba(0,0,0,0.6);color:#fff;border:none;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:14px;" title="Edit Photo">✎</button>
              <button type="button" class="pc-delete" style="position:absolute;top:8px;left:48px;z-index:2;background:rgba(220,53,69,0.8);color:#fff;border:none;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:14px;" title="Delete Photo">×</button>
              <button type="button" class="pc-add-more" style="position:absolute;top:8px;left:88px;z-index:2;background:rgba(34,197,94,0.8);color:#fff;border:none;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:18px;" title="Add More Photos">+</button>
            </div>
          `;
          const imgEl = frame.querySelector('.pc-image');
          const prevBtn = frame.querySelector('.pc-prev');
          const nextBtn = frame.querySelector('.pc-next');
          const dotsEl = frame.querySelector('.pc-dots');
          const counterEl = frame.querySelector('.pc-counter');
          const editBtn = frame.querySelector('.pc-edit');
          const deleteBtn = frame.querySelector('.pc-delete');
          const addMoreBtn = frame.querySelector('.pc-add-more');
          let currentIndex = 0;
          dotsEl.innerHTML = allPhotos.map((_, i) => `<span data-idx="${i}" style="width:8px;height:8px;border-radius:50%;background:${i === 0 ? '#fff' : 'rgba(255,255,255,0.6)'};display:inline-block;cursor:pointer"></span>`).join('');
          function updateCarousel(newIndex) {
            if (newIndex < 0) newIndex = allPhotos.length - 1;
            if (newIndex >= allPhotos.length) newIndex = 0;
            currentIndex = newIndex;
            imgEl.src = allPhotos[currentIndex];
            counterEl.textContent = `${currentIndex + 1}/${allPhotos.length}`;
            const dots = dotsEl.querySelectorAll('span');
            dots.forEach((d, i) => { d.style.background = i === currentIndex ? '#fff' : 'rgba(255,255,255,0.6)'; });
          }
          prevBtn.addEventListener('click', (ev) => { ev.stopPropagation(); updateCarousel(currentIndex - 1); });
          nextBtn.addEventListener('click', (ev) => { ev.stopPropagation(); updateCarousel(currentIndex + 1); });
          dotsEl.addEventListener('click', (ev) => {
            const dot = ev.target.closest('span[data-idx]');
            if (!dot) return;
            ev.stopPropagation();
            updateCarousel(parseInt(dot.getAttribute('data-idx'), 10));
          });
          editBtn.addEventListener('click', (ev) => { ev.stopPropagation(); editAdvertisePhotoAtIndex(currentIndex, allPhotos); });
          deleteBtn.addEventListener('click', (ev) => { ev.stopPropagation(); deleteAdvertisePhotoAtIndex(currentIndex, allPhotos); });
          addMoreBtn.addEventListener('click', (ev) => { ev.stopPropagation(); document.getElementById('photoInput').click(); });
        }

        // click-to-change when clicking empty area of frame
        frame.onclick = function (e) {
          if (e.target === frame) document.getElementById('photoInput').click();
        };
      })();
    });
  }

  // ========== PANORAMA 360 VIEW FUNCTIONALITY ==========
  
  // Global storage for panorama images
  window.__panoramaImages = [];
  
  // Handle panorama image upload - works during ad creation and editing
  const panoramaInput = document.getElementById('panoramaInput');
  if (panoramaInput) {
    panoramaInput.addEventListener('change', async function() {
      const MAX_PANORAMAS = 6;
      const currentCount = window.__panoramaImages.length;
      
      if (currentCount >= MAX_PANORAMAS) {
        alert(`Maximum of ${MAX_PANORAMAS} panorama images allowed. Please delete some to add more.`);
        this.value = '';
        return;
      }
      
      const files = Array.from(this.files || []);
      const imageFiles = files.filter(f => f && f.type && f.type.startsWith('image/'));
      
      if (!imageFiles.length) return;
      
      const remainingSlots = MAX_PANORAMAS - currentCount;
      const filesToProcess = imageFiles.slice(0, remainingSlots);
      
      if (imageFiles.length > remainingSlots) {
        alert(`Only ${remainingSlots} more panorama(s) can be added (maximum ${MAX_PANORAMAS} total).`);
      }
      
      // Store files temporarily - will be uploaded when ad is saved
      for (const file of filesToProcess) {
        const dataUrl = await readFileAsDataURL(file);
        if (dataUrl) {
          const panoramaItem = {
            id: Date.now() + Math.random(),
            file: file, // Store actual file for later upload
            dataUrl: dataUrl, // For preview
            image_url: dataUrl, // Use dataUrl for preview
            label: 'Untitled Room',
            fileName: file.name,
            isNew: true // Flag to indicate this needs to be uploaded
          };
          window.__panoramaImages.push(panoramaItem);
        }
      }
      
      window.renderPanoramaList();
      window.updatePanoramaUploadButton();
      this.value = ''; // Reset input
    });
  }
  
  // Helper function to read file as data URL
  function readFileAsDataURL(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }
  
  // Upload panorama images to Supabase Storage and database - make it global
  window.uploadPanoramaImages = async function(apartmentId, landlordId) {
    const client = initSupabase();
    if (!client) return;
    
    try {
      const newPanoramas = window.__panoramaImages.filter(p => p.isNew);
      
      for (const panorama of newPanoramas) {
        try {
          // Generate unique filename
          const fileExt = panorama.fileName.split('.').pop();
          const fileName = `${apartmentId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          
          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await client.storage
            .from('panorama-images')
            .upload(fileName, panorama.file, {
              cacheControl: '3600',
              upsert: false
            });
          
          if (uploadError) {
            console.error('Upload error:', uploadError);
            continue;
          }
          
          // Get public URL
          const { data: { publicUrl } } = client.storage
            .from('panorama-images')
            .getPublicUrl(fileName);
          
          // Save to database
          await client
            .from('panorama_images')
            .insert({
              apartment_id: apartmentId,
              landlord_id: landlordId,
              image_url: publicUrl,
              label: panorama.label
            });
          
        } catch (error) {
          console.error('Error uploading panorama:', error);
        }
      }
      
      // Clear the temporary panoramas after upload
      window.__panoramaImages = [];
      window.renderPanoramaList();
      window.updatePanoramaUploadButton();
      
    } catch (error) {
      console.error('Error in uploadPanoramaImages:', error);
    }
  };
  
  // Load existing panoramas for current apartment
  async function loadPanoramasForApartment() {
    if (!currentApartmentId) return;
    
    const client = initSupabase();
    if (!client) return;
    
    try {
      const { data, error } = await client
        .from('panorama_images')
        .select('*')
        .eq('apartment_id', currentApartmentId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error loading panoramas:', error);
        return;
      }
      
      window.__panoramaImages = data || [];
      window.renderPanoramaList();
      window.updatePanoramaUploadButton();
    } catch (error) {
      console.error('Error loading panoramas:', error);
    }
  }
  
  // Render panorama list - make it global
  window.renderPanoramaList = function() {
    const panoramaList = document.getElementById('panoramaList');
    if (!panoramaList) return;
    
    if (window.__panoramaImages.length === 0) {
      panoramaList.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: var(--space-lg);">No panorama images uploaded yet.</p>';
      return;
    }
    
    panoramaList.innerHTML = window.__panoramaImages.map(item => `
      <div class="panorama-item" data-id="${item.id}">
        <div class="panorama-thumbnail" data-action="view">
          <img src="${item.image_url}" alt="${item.label}" />
        </div>
        <div class="panorama-item-header">
          <div class="panorama-item-label">
            <i class="fa-solid fa-tag"></i>
            <input type="text" value="${item.label}" placeholder="Enter room label (e.g., Bedroom)" 
                   data-action="update-label">
          </div>
          <div class="panorama-item-actions">
            <button class="panorama-view-btn" data-action="view">
              <i class="fa-solid fa-eye"></i> View 360°
            </button>
            <button class="panorama-delete-btn" data-action="delete">
              <i class="fa-solid fa-trash"></i> Delete
            </button>
          </div>
        </div>
      </div>
    `).join('');
  };
  
  // Update panorama label in database
  window.updatePanoramaLabel = async function(id, newLabel) {
    console.log('updatePanoramaLabel called with ID:', id, 'Label:', newLabel);
    
    // Convert id to string for comparison
    const item = window.__panoramaImages.find(p => String(p.id) === String(id));
    if (!item) {
      console.error('Panorama item not found for ID:', id);
      return;
    }
    
    const label = newLabel || 'Untitled Room';
    item.label = label;
    
    // Update viewer label instantly if this panorama is currently being viewed
    if (window.__currentViewingPanoramaId && String(window.__currentViewingPanoramaId) === String(id)) {
      const labelEl = document.getElementById('panoramaViewerLabel');
      if (labelEl) {
        labelEl.textContent = `360° View - ${label}`;
      }
    }
    
    // Only update in database if it's not a new panorama
    if (!item.isNew) {
      const client = initSupabase();
      if (client) {
        try {
          await client
            .from('panorama_images')
            .update({ label: label })
            .eq('id', id);
          console.log('Label updated in database');
        } catch (error) {
          console.error('Error updating label:', error);
        }
      }
    } else {
      console.log('Label updated in memory (new panorama)');
    }
  };
  
  // Update upload button state - make it global
  window.updatePanoramaUploadButton = function() {
    const MAX_PANORAMAS = 6;
    const uploadBtn = document.querySelector('.panorama-upload-btn');
    const uploadArea = document.querySelector('.panorama-upload-area');
    const panoramaInput = document.getElementById('panoramaInput');
    
    if (!uploadBtn || !uploadArea) return;
    
    const currentCount = window.__panoramaImages.length;
    const remaining = MAX_PANORAMAS - currentCount;
    
    if (currentCount >= MAX_PANORAMAS) {
      uploadBtn.disabled = true;
      uploadBtn.innerHTML = `<i class="fa-solid fa-ban"></i> Maximum Reached (6/6)`;
      uploadBtn.style.opacity = '0.5';
      uploadBtn.style.cursor = 'not-allowed';
      uploadArea.style.borderColor = 'var(--text-muted)';
      if (panoramaInput) panoramaInput.disabled = true;
    } else {
      uploadBtn.disabled = false;
      uploadBtn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> Upload Panorama Images (${currentCount}/6)`;
      uploadBtn.style.opacity = '1';
      uploadBtn.style.cursor = 'pointer';
      uploadArea.style.borderColor = '';
      if (panoramaInput) panoramaInput.disabled = false;
    }
  };
  
  // Delete panorama image - handles both new and existing panoramas
  window.deletePanoramaImage = async function(id) {
    console.log('deletePanoramaImage called with ID:', id);
    
    if (!confirm('Are you sure you want to delete this panorama image?')) return;
    
    try {
      // Find the item - convert to string for comparison
      const item = window.__panoramaImages.find(p => String(p.id) === String(id));
      if (!item) {
        console.error('Panorama item not found for ID:', id);
        return;
      }
      
      // If it's a new panorama (not yet uploaded), just remove from array
      if (item.isNew) {
        window.__panoramaImages = window.__panoramaImages.filter(p => String(p.id) !== String(id));
        window.renderPanoramaList();
        window.updatePanoramaUploadButton();
        console.log('New panorama deleted from memory');
        return;
      }
      
      // If it's an existing panorama, delete from database and storage
      const client = initSupabase();
      if (!client) {
        alert('Unable to connect to database.');
        return;
      }
      
      // Extract file path from URL
      try {
        const url = new URL(item.image_url);
        const pathParts = url.pathname.split('/');
        const filePath = pathParts.slice(pathParts.indexOf('panorama-images') + 1).join('/');
        
        // Delete from storage
        if (filePath) {
          await client.storage
            .from('panorama-images')
            .remove([filePath]);
        }
      } catch (urlError) {
        console.error('Error parsing URL:', urlError);
      }
      
      // Delete from database
      const { error } = await client
        .from('panorama_images')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting panorama:', error);
        alert('Failed to delete panorama image.');
        return;
      }
      
      // Remove from local array
      window.__panoramaImages = window.__panoramaImages.filter(p => String(p.id) !== String(id));
      window.renderPanoramaList();
      window.updatePanoramaUploadButton();
      console.log('Existing panorama deleted from database and storage');
      
    } catch (error) {
      console.error('Error deleting panorama:', error);
      alert('An error occurred while deleting the panorama.');
    }
  };
  
  // 360 Viewer functionality
  let panoramaViewer = null;
  
  window.openPanoramaViewer = async function(id) {
    console.log('openPanoramaViewer called with ID:', id, 'Type:', typeof id);
    
    let item = null;
    
    // First try to find in temporary panoramas (advertise section)
    if (window.__panoramaImages && window.__panoramaImages.length > 0) {
      console.log('Available panoramas:', window.__panoramaImages.map(p => ({ id: p.id, type: typeof p.id })));
      item = window.__panoramaImages.find(p => String(p.id) === String(id));
    }
    
    // If not found, try to fetch from database (dashboard section)
    if (!item) {
      const client = initSupabase();
      if (client) {
        try {
          const { data, error } = await client
            .from('panorama_images')
            .select('*')
            .eq('id', id)
            .single();
          
          if (!error && data) {
            item = data;
          }
        } catch (error) {
          console.error('Error fetching panorama:', error);
        }
      }
    }
    
    if (!item) {
      console.error('Panorama item not found for ID:', id);
      return;
    }
    
    const modal = document.getElementById('panoramaViewerModal');
    const canvas = document.getElementById('panoramaCanvas');
    const labelEl = document.getElementById('panoramaViewerLabel');
    
    if (!modal || !canvas) {
      console.error('Modal or canvas not found');
      return;
    }
    
    // Store current panorama ID for real-time label updates
    window.__currentViewingPanoramaId = item.id;
    
    // Update title with label
    labelEl.textContent = `360° View - ${item.label}`;
    
    modal.classList.add('active');
    
    console.log('Opening panorama viewer with image:', item.image_url);
    
    // Initialize 360 viewer
    initPanoramaViewer(canvas, item.image_url);
  };
  
  window.closePanoramaViewer = function() {
    // Exit fullscreen if active
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => {
        console.error('Error exiting fullscreen:', err);
      });
    }
    
    const modal = document.getElementById('panoramaViewerModal');
    if (modal) {
      modal.classList.remove('active');
    }
    if (panoramaViewer) {
      panoramaViewer.destroy();
      panoramaViewer = null;
    }
    // Clear current viewing panorama ID
    window.__currentViewingPanoramaId = null;
  };
  
  // WebGL-based 360 panorama viewer for hardware-accelerated rendering
  function initPanoramaViewer(canvas, imageUrl) {
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) {
      console.error('WebGL not supported, falling back to 2D');
      initFallback2DViewer(canvas, imageUrl);
      return;
    }
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = function() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      
      let yaw = 0;
      let pitch = 0;
      let fov = 90;
      let isDragging = false;
      let lastX = 0, lastY = 0;
      
      // Vertex shader
      const vertexShaderSource = `
        attribute vec2 a_position;
        varying vec2 v_texCoord;
        void main() {
          gl_Position = vec4(a_position, 0.0, 1.0);
          v_texCoord = a_position * 0.5 + 0.5;
        }
      `;
      
      // Fragment shader for 360 spherical projection
      const fragmentShaderSource = `
        precision highp float;
        uniform sampler2D u_texture;
        uniform float u_yaw;
        uniform float u_pitch;
        uniform float u_fov;
        uniform vec2 u_resolution;
        varying vec2 v_texCoord;
        
        const float PI = 3.14159265359;
        
        void main() {
          vec2 screenPos = v_texCoord * 2.0 - 1.0;
          float aspect = u_resolution.x / u_resolution.y;
          screenPos.x *= aspect;
          
          float fovRad = radians(u_fov);
          float f = 1.0 / tan(fovRad * 0.5);
          
          vec3 rayDir = normalize(vec3(screenPos.x / f, -screenPos.y / f, 1.0));
          
          float cp = cos(-u_pitch);
          float sp = sin(-u_pitch);
          rayDir = vec3(
            rayDir.x,
            rayDir.y * cp - rayDir.z * sp,
            rayDir.y * sp + rayDir.z * cp
          );
          
          float cy = cos(-u_yaw);
          float sy = sin(-u_yaw);
          rayDir = vec3(
            rayDir.x * cy + rayDir.z * sy,
            rayDir.y,
            -rayDir.x * sy + rayDir.z * cy
          );
          
          float theta = atan(rayDir.x, rayDir.z);
          float phi = asin(clamp(rayDir.y, -1.0, 1.0));
          
          vec2 texCoord = vec2(
            0.5 + theta / (2.0 * PI),
            0.5 + phi / PI
          );
          
          gl_FragColor = texture2D(u_texture, texCoord);
        }
      `;
      
      function createShader(type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          console.error('Shader compile error:', gl.getShaderInfoLog(shader));
          gl.deleteShader(shader);
          return null;
        }
        return shader;
      }
      
      const vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSource);
      const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
      
      const program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(program));
        return;
      }
      
      const positionLocation = gl.getAttribLocation(program, 'a_position');
      const yawLocation = gl.getUniformLocation(program, 'u_yaw');
      const pitchLocation = gl.getUniformLocation(program, 'u_pitch');
      const fovLocation = gl.getUniformLocation(program, 'u_fov');
      const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
      
      const positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
      
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      
      function render() {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        gl.useProgram(program);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
        
        gl.uniform1f(yawLocation, yaw);
        gl.uniform1f(pitchLocation, pitch);
        gl.uniform1f(fovLocation, fov);
        gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
        
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
      
      // Mouse drag controls
      canvas.addEventListener('mousedown', function(e) {
        isDragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        canvas.style.cursor = 'grabbing';
      });
      
      canvas.addEventListener('mousemove', function(e) {
        if (isDragging) {
          const deltaX = e.clientX - lastX;
          const deltaY = e.clientY - lastY;
          
          yaw -= deltaX * 0.005;
          pitch -= deltaY * 0.005;
          
          // Clamp pitch
          pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
          
          lastX = e.clientX;
          lastY = e.clientY;
          
          render();
        }
      });
      
      canvas.addEventListener('mouseup', function() {
        isDragging = false;
        canvas.style.cursor = 'grab';
      });
      
      canvas.addEventListener('mouseleave', function() {
        isDragging = false;
        canvas.style.cursor = 'grab';
      });
      
      // Scroll to zoom
      canvas.addEventListener('wheel', function(e) {
        e.preventDefault();
        fov += e.deltaY * 0.05;
        fov = Math.max(30, Math.min(120, fov));
        render();
      });
      
      // Touch controls for mobile
      let touchStartX = 0;
      let touchStartY = 0;
      
      canvas.addEventListener('touchstart', function(e) {
        if (e.touches.length === 1) {
          isDragging = true;
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
        }
      });
      
      canvas.addEventListener('touchmove', function(e) {
        if (!isDragging || e.touches.length !== 1) return;
        e.preventDefault();
        
        const deltaX = e.touches[0].clientX - touchStartX;
        const deltaY = e.touches[0].clientY - touchStartY;
        
        yaw -= deltaX * 0.005;
        pitch -= deltaY * 0.005;
        
        // Clamp pitch
        pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
        
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        
        render();
      }, { passive: false });
      
      canvas.addEventListener('touchend', function() {
        isDragging = false;
      });
      
      // Initial render
      render();
      
      // Store viewer for cleanup
      panoramaViewer = {
        destroy: function() {
          // Cleanup WebGL resources
          gl.deleteTexture(texture);
          gl.deleteBuffer(positionBuffer);
          gl.deleteShader(vertexShader);
          gl.deleteShader(fragmentShader);
          gl.deleteProgram(program);
        },
        reset: function() {
          yaw = 0;
          pitch = 0;
          fov = 90;
          render();
        }
      };
      
      // Handle window resize
      const modal = document.getElementById('panoramaViewerModal');
      let resizeTimeout;
      window.addEventListener('resize', () => {
        if (modal && modal.classList.contains('active')) {
          clearTimeout(resizeTimeout);
          resizeTimeout = setTimeout(() => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            render();
          }, 150);
        }
      });
    };
    
    img.onerror = function() {
      console.error('Failed to load panorama image');
      alert('Failed to load 360° panorama image.');
    };
    
    img.src = imageUrl;
  }
  
  // Fallback 2D viewer for browsers without WebGL
  function initFallback2DViewer(canvas, imageUrl) {
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = function() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      
      let yaw = 0, pitch = 0, fov = 90;
      let isDragging = false, lastX = 0, lastY = 0;
      
      function render() {
        const w = canvas.width, h = canvas.height;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);
        
        const fovScale = fov / 90;
        const sw = img.width * fovScale;
        const sh = img.height * fovScale;
        const sx = ((yaw / (Math.PI * 2)) % 1) * img.width - sw / 2;
        const sy = ((0.5 - pitch / Math.PI) * img.height) - sh / 2;
        const csy = Math.max(0, Math.min(img.height - sh, sy));
        
        if (sx < 0) {
          const rw = -sx, lw = sw + sx;
          ctx.drawImage(img, img.width + sx, csy, rw, sh, 0, 0, (rw/sw)*w, h);
          ctx.drawImage(img, 0, csy, lw, sh, (rw/sw)*w, 0, (lw/sw)*w, h);
        } else if (sx + sw > img.width) {
          const lw = img.width - sx, rw = sw - lw;
          ctx.drawImage(img, sx, csy, lw, sh, 0, 0, (lw/sw)*w, h);
          ctx.drawImage(img, 0, csy, rw, sh, (lw/sw)*w, 0, (rw/sw)*w, h);
        } else {
          ctx.drawImage(img, sx, csy, sw, sh, 0, 0, w, h);
        }
      }
      
      canvas.addEventListener('mousedown', e => { isDragging = true; lastX = e.clientX; lastY = e.clientY; canvas.style.cursor = 'grabbing'; });
      canvas.addEventListener('mousemove', e => { if (isDragging) { yaw -= (e.clientX - lastX) * 0.005; pitch -= (e.clientY - lastY) * 0.005; pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, pitch)); lastX = e.clientX; lastY = e.clientY; render(); } });
      canvas.addEventListener('mouseup', () => { isDragging = false; canvas.style.cursor = 'grab'; });
      canvas.addEventListener('mouseleave', () => { isDragging = false; canvas.style.cursor = 'grab'; });
      canvas.addEventListener('wheel', e => { e.preventDefault(); fov += e.deltaY * 0.05; fov = Math.max(30, Math.min(120, fov)); render(); });
      
      // Touch controls
      let touchStartX = 0, touchStartY = 0;
      canvas.addEventListener('touchstart', e => { if (e.touches.length === 1) { isDragging = true; touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY; } });
      canvas.addEventListener('touchmove', e => { if (isDragging && e.touches.length === 1) { e.preventDefault(); yaw -= (e.touches[0].clientX - touchStartX) * 0.005; pitch -= (e.touches[0].clientY - touchStartY) * 0.005; pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, pitch)); touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY; render(); } }, { passive: false });
      canvas.addEventListener('touchend', () => { isDragging = false; });
      
      render();
      panoramaViewer = { destroy: () => {}, reset: () => { yaw = 0; pitch = 0; fov = 90; render(); } };
    };
    
    img.onerror = () => { console.error('Failed to load panorama'); alert('Failed to load 360° panorama image.'); };
    img.src = imageUrl;
  }
  
  // Reset panorama view
  window.resetPanoramaView = function() {
    if (panoramaViewer && panoramaViewer.reset) {
      panoramaViewer.reset();
    }
  };
  
  // Toggle fullscreen
  window.toggleFullscreen = function() {
    const container = document.querySelector('.panorama-viewer-container');
    if (!container) return;
    
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(err => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };
  
  // Event delegation for panorama list actions
  const panoramaList = document.getElementById('panoramaList');
  if (panoramaList) {
    panoramaList.addEventListener('click', function(e) {
      const target = e.target;
      const action = target.getAttribute('data-action') || target.closest('[data-action]')?.getAttribute('data-action');
      
      if (!action) return;
      
      // Find the panorama item
      const panoramaItem = target.closest('.panorama-item');
      if (!panoramaItem) return;
      
      const id = panoramaItem.getAttribute('data-id');
      if (!id) return;
      
      console.log('Panorama action:', action, 'ID:', id); // Debug log
      
      // Handle different actions
      if (action === 'view') {
        window.openPanoramaViewer(id);
      } else if (action === 'delete') {
        window.deletePanoramaImage(id);
      }
    });
    
    // Handle label input changes
    panoramaList.addEventListener('change', function(e) {
      if (e.target.getAttribute('data-action') === 'update-label') {
        const panoramaItem = e.target.closest('.panorama-item');
        if (!panoramaItem) return;
        
        const id = panoramaItem.getAttribute('data-id');
        if (!id) return;
        
        console.log('Update label for ID:', id); // Debug log
        window.updatePanoramaLabel(id, e.target.value);
      }
    });
    
    // Handle Enter key press on label input
    panoramaList.addEventListener('keypress', function(e) {
      if (e.key === 'Enter' && e.target.getAttribute('data-action') === 'update-label') {
        e.preventDefault(); // Prevent form submission
        const panoramaItem = e.target.closest('.panorama-item');
        if (!panoramaItem) return;
        
        const id = panoramaItem.getAttribute('data-id');
        if (!id) return;
        
        console.log('Update label (Enter key) for ID:', id);
        window.updatePanoramaLabel(id, e.target.value);
        e.target.blur(); // Remove focus from input to show the change
      }
    });
  }

  
  // Initialize panorama list on page load
  if (document.getElementById('panoramaList')) {
    window.renderPanoramaList();
    window.updatePanoramaUploadButton();
  }
  
  // ========== END PANORAMA 360 VIEW FUNCTIONALITY ==========

  // Load current user id before rendering listings
  (async () => {
    try {
      const client = initSupabase();
      if (client) {
        const { data } = await client.auth.getSession();
        window.currentUserId = data?.session?.user?.id || null;
      }
    } catch (_) {
      window.currentUserId = null;
    } finally {
      renderLandlordListings();
      // Start realtime subscription for applications after we know the user
      subscribeToRentalApplications();
      // Start realtime subscription for receipts after we know the user
      subscribeToPaymentReceipts();
    }
  })();

  // Event delegation so newly added cards open the detail panel
  const landlordList = document.getElementById('landlordListings');
  if (landlordList) {
    landlordList.addEventListener('click', function (e) {
      // delete listing button
      const delBtn = e.target.closest('.delete-listing');
      if (delBtn) {
        const adId = delBtn.getAttribute('data-ad-id');
        if (!adId) return;
        if (!confirm('Delete this listing? This cannot be undone.')) { e.stopPropagation(); return; }
        (async () => {
          try {
            const client = initSupabase();
            if (client) {
              const { error } = await client.from('apartments').delete().eq('id', adId);
              if (error) throw error;
            } else {
              let listings = getStoredListings();
              listings = listings.filter(l => String(l.id) !== String(adId));
              setStoredListings(listings);
            }
            debouncedRenderLandlordListings();
            alert('Listing deleted.');
          } catch (err) {
            console.error('Delete error:', err);
            alert('Failed to delete listing.');
          }
        })();
        e.stopPropagation();
        return;
      }
      // Status is now automatically managed by rental applications
      const card = e.target.closest('.outerad');
      if (!card) return;
      const adId = card.dataset.adId;

      // Clear "new application" highlight when the landlord opens this apartment
      try {
        card.classList.remove('has-new-application');
        const appBadge = card.querySelector('.new-app-badge');
        if (appBadge && appBadge.parentNode) {
          appBadge.parentNode.removeChild(appBadge);
        }
      } catch (_) {}

      // Fetch listing details from Supabase
      (async () => {
        try {
          const client = initSupabase();
          let ad = null;

          if (client) {
            // Fetch from Supabase
            const { data, error } = await client
              .from('apartments')
              .select('*')
              .eq('id', adId)
              .single();

            if (error) throw error;

            if (data) {
              // Convert Supabase data to expected format (including saved coordinates)
              ad = {
                id: String(data.id),
                price: data.price,
                location: data.location,
                description: data.description,
                unitSize: data.unit_size,
                totalUnits: data.total_units != null ? data.total_units : 1,
                availableUnits: data.available_units != null
                  ? data.available_units
                  : (String(data.status || 'available').toLowerCase() === 'rented' ? 0 : 1),
                occupiedUnitNumbers: (() => {
                  const o = data.occupied_unit_numbers;
                  if (Array.isArray(o)) return o;
                  if (o && typeof o === 'string') try { return JSON.parse(o); } catch (_) {}
                  return [];
                })(),
                amenities: data.amenities,
                contact: data.contact,
                email: data.email,
                requirements: (() => {
                  try {
                    return data.requirements ? JSON.parse(data.requirements) : [];
                  } catch (_) {
                    return [];
                  }
                })(),
                status: data.status,
                payment_config: data.payment_config || {},
                floorPlanDataUrl: '', // Will be fetched separately if needed
                primaryImageDataUrl: '', // Will be fetched separately if needed
                owner_user_id: data.landlord_id,
                latitude: data.latitude,
                longitude: data.longitude
              };
            }
          }

          // Fallback to localStorage if Supabase fails
          if (!ad) {
            const listings = getStoredListings();
            ad = listings.find(l => l.id === adId);
          }

          if (ad) {
            // Ownership check: prevent editing someone else's listing
            if (!ad.owner_user_id || !window.currentUserId || ad.owner_user_id !== window.currentUserId) {
              alert('You cannot edit this listing.');
              return;
            }

            // populate the dashboard edit form with this ad's data for quick editing
            persistLandlordModalState({
              type: 'edit-details',
              adId: ad.id
            });
            const setVal = (sel, val) => { const el = document.querySelector(sel); if (el) el.value = val || ''; };
            setVal('#adPrice', ad.price);
            setVal('#adLocation', ad.location);
            const desc = document.querySelector('#adDescription'); if (desc) desc.value = ad.description || '';
            setVal('#adUnitSize', ad.unitSize);
            setVal('#adTotalUnits', ad.totalUnits != null ? ad.totalUnits : (ad.total_units != null ? ad.total_units : ''));
            setVal('#adAvailableUnits', ad.availableUnits != null ? ad.availableUnits : (ad.available_units != null ? ad.available_units : ''));
            // Ensure unit type label text matches total units (complex vs single)
            try { document.getElementById('adTotalUnits')?.dispatchEvent(new Event('input')); } catch (_) {}
            // Unit status display: clickable toggle between occupied and available
            const totalU = ad.totalUnits != null ? ad.totalUnits : (ad.total_units != null ? ad.total_units : 1);
            const occupiedArr = Array.isArray(ad.occupiedUnitNumbers) ? ad.occupiedUnitNumbers : (ad.occupied_unit_numbers ? (typeof ad.occupied_unit_numbers === 'string' ? (() => { try { return JSON.parse(ad.occupied_unit_numbers); } catch(_) { return []; } })() : ad.occupied_unit_numbers) : []);
            const occSet = new Set(occupiedArr.map(n => Number(n)).filter(n => !isNaN(n)));
            // If no explicit occupied units are stored yet but the landlord
            // originally advertised with fewer available units than total,
            // infer the initially occupied units purely for the dashboard UI.
            // This does NOT write anything back to the database until the
            // landlord toggles a pill, so these initial occupants do not show
            // up in the Rented list.
            if (occSet.size === 0 && totalU > 1) {
              const storedAvailable = ad.availableUnits != null
                ? ad.availableUnits
                : (ad.available_units != null ? ad.available_units : totalU);
              const inferredOccupiedCount = Math.max(0, Math.min(totalU, totalU - Number(storedAvailable)));
              for (let i = 1; i <= inferredOccupiedCount; i++) {
                occSet.add(i);
              }
            }
            const rowEl = document.getElementById('adUnitStatusDisplayRow');
            const gridEl = document.getElementById('adUnitStatusDisplay');
            if (rowEl && gridEl) {
              rowEl.style.display = totalU > 1 ? '' : 'none';
              gridEl.innerHTML = '';
              const adId = ad.id;
              const lockedUnits = new Set(); // units rented online via approved/accepted applications
              const dueUnits = new Set(); // unit_number due/overdue based on move_in_date

              const loadLockedUnits = async () => {
                try {
                  const client = initSupabase();
                  if (!client || !adId) return;
                  const { data: apps, error } = await client
                    .from('rental_applications')
                    .select('unit_number, data')
                    .eq('apartment_id', adId)
                    .in('status', ['approved', 'accepted'])
                    .limit(200);
                  if (error) throw error;
                  (apps || []).forEach(app => {
                    const u = app?.unit_number != null ? Number(app.unit_number) : (app?.data?.unit_number != null ? Number(app.data.unit_number) : null);
                    if (u != null && !isNaN(u)) lockedUnits.add(u);
                  });
                } catch (e) {
                  console.warn('Failed to load locked units:', e);
                }
              };

              const loadDueUnits = async () => {
                try {
                  const client = initSupabase();
                  if (!client || !adId) return;
                  const { data: rentals, error } = await client
                    .from('apartment_rentals')
                    .select('unit_number, move_in_date')
                    .eq('apartment_id', adId)
                    .eq('rental_status', 'active')
                    .limit(500);
                  if (error || !rentals) return;

                  (rentals || []).forEach((r) => {
                    const u = r?.unit_number != null ? Number(r.unit_number) : null;
                    if (u == null || isNaN(u)) return;
                    const st = getRentDueStatusFromMoveIn(r.move_in_date);
                    if (st && st.daysUntil <= 0) dueUnits.add(u);
                  });
                } catch (e) {
                  console.warn('Failed to load due unit pills:', e);
                }
              };
              const renderPills = () => {
                gridEl.innerHTML = '';
                for (let i = 1; i <= totalU; i++) {
                  const isLocked = lockedUnits.has(i);
                  const isOcc = occSet.has(i) || isLocked;
                  const pill = document.createElement('button');
                  pill.type = 'button';
                  const isDue = dueUnits.has(i);
                  pill.className =
                    'unit-pill unit-pill-toggle ' +
                    (isOcc ? 'unit-pill-occupied' : 'unit-pill-available') +
                    (isDue ? ' unit-pill-due' : '');
                  pill.textContent = 'Unit ' + i + ': ' + (isOcc ? 'Occupied' : 'Available');
                  if (isLocked) {
                    pill.title = 'Rented online (cannot toggle)';
                  } else {
                    pill.title = isDue
                      ? 'Due/overdue rent for this unit. Click to toggle walk-in occupancy.'
                      : 'Click to toggle';
                  }
                  pill.dataset.unit = String(i);
                  if (isLocked) {
                    pill.disabled = true;
                    pill.style.opacity = '0.7';
                    pill.style.cursor = 'not-allowed';
                  }
                  pill.addEventListener('click', async function () {
                    const u = parseInt(this.dataset.unit, 10);
                    if (isNaN(u)) return;
                    if (lockedUnits.has(u)) {
                      alert(`Unit ${u} is rented online (approved application) and cannot be toggled.`);
                      return;
                    }

                    const wasOccupied = occSet.has(u);
                    if (wasOccupied) {
                      // toggling to Available: clear any walk-in tenant info for this unit
                      occSet.delete(u);
                      const ok = await clearWalkInTenant(adId, u);
                      if (!ok) {
                        // Don't free the unit locally if we failed to clear walk-in data in DB.
                        occSet.add(u);
                        renderPills();
                        return;
                      }
                    } else {
                      // toggling to Occupied: this is a walk-in tenant, prompt for details
                      const saved = await promptWalkInTenantDetails(adId, u);
                      if (!saved) {
                        // user cancelled -> don't occupy
                        return;
                      }
                      occSet.add(u);
                    }

                    const newOccupied = Array.from(new Set([...occSet, ...lockedUnits])).sort((a, b) => a - b);
                    const newAvailable = totalU - newOccupied.length;
                    setVal('#adAvailableUnits', String(newAvailable));
                    renderPills();
                    try {
                      const client = initSupabase();
                      if (client && adId) {
                        await client.from('apartments').update({
                          occupied_unit_numbers: newOccupied,
                          available_units: Math.max(0, newAvailable),
                          status: newAvailable > 0 ? 'available' : 'rented'
                        }).eq('id', adId);
                      }
                    } catch (e) {
                      console.warn('Failed to update unit status:', e);
                    }
                  });
                  gridEl.appendChild(pill);
                }
              };
              (async () => {
                await loadLockedUnits();
                await loadDueUnits();
                const unionOccupied = Array.from(new Set([...occSet, ...lockedUnits])).sort((a, b) => a - b);
                const newAvailable = totalU - unionOccupied.length;
                setVal('#adAvailableUnits', String(newAvailable));
                renderPills();
              })();
            }
            setVal('#adAmenities', ad.amenities);
            setVal('#adContactDash', ad.contact);
            setVal('#adEmailDash', ad.email);

            // set dashboard floor plan input preview state (no native preview UI; we keep data URL in memory)
            window.__currentDashFloorPlanDataUrl = ad.floorPlanDataUrl || '';

            // requirements checkboxes
            document.querySelectorAll('.leftside [name="requirements"]').forEach(cb => {
              cb.checked = Array.isArray(ad.requirements) && ad.requirements.includes(cb.value);
            });

            // payment methods - use richer config (same as Payment History tab)
            const refreshDashboardPaymentMethods = () => loadPaymentMethodsConfigForApartmentEdit(
              'dashboardPaymentMethodsContainer',
              ad.paymentMethods,
              'payment-methods',
              refreshDashboardPaymentMethods
            );
            refreshDashboardPaymentMethods();

            // status select in dashboard if present
            const dashStatus = document.getElementById('adStatus');
            if (dashStatus) dashStatus.value = ad.status || 'available';
            
            // Load coordinates (map picker is now in modal, so just set the values)
            const latitude = ad.latitude || null;
            const longitude = ad.longitude || null;
            if (latitude && longitude) {
              setVal('#apartmentLatitude', latitude);
              setVal('#apartmentLongitude', longitude);
            }
            
            // keep the selected ad id for updates/deletes
            window.currentEditingAdId = adId;
            // refresh applications list to show only those for this listing
            try { refreshLandlordApplications(); } catch (_) { }
            // set current apartment id for chat scoping
            currentApartmentId = adId;
            try {
              await hydrateLandlordRentDueReminderForDashboardApartment(adId);
              prependLandlordRentDueReminders();
            } catch (_) {}

            // Load panorama images for this apartment
            if (typeof loadPanoramasForApartment === 'function') {
              loadPanoramasForApartment();
            }
            
            // Load dashboard panoramas
            if (typeof window.loadDashboardPanoramas === 'function') {
              window.loadDashboardPanoramas(adId);
            }

            // Fetch and display images
            if (client) {
              try {
                const { data: images, error: imgError } = await client
                  .from('apartment_images')
                  .select('image_url, is_primary, is_floorplan')
                  .eq('apartment_id', adId)
                  .order('is_primary', { ascending: false })
                  .order('id', { ascending: true });

                if (!imgError && images) {
                  // Separate floor plans from regular photos
                  const floorPlanImg = images.find(img => img.is_floorplan);
                  const photoImages = images.filter(img => !img.is_floorplan);

                  if (photoImages.length > 0) {
                    // Get all photo URLs (excluding floor plans)
                    const photoUrls = photoImages.map(img => img.image_url).filter(Boolean);

                    // Set primary image for backward compatibility
                    const primaryImg = photoImages.find(img => img.is_primary) || photoImages[0];
                    if (primaryImg) {
                      ad.primaryImageDataUrl = primaryImg.image_url;
                    }

                    // Update the dashboard photo display with all photos (excluding floor plans)
                    renderDashboardPhotos(photoUrls);
                  }

                  if (floorPlanImg) {
                    ad.floorPlanDataUrl = floorPlanImg.image_url;
                    window.__currentDashFloorPlanDataUrl = floorPlanImg.image_url;
                  }
                }
              } catch (imgErr) {
                console.warn('Error fetching images:', imgErr);
              }
            }

            // Unified reviews in landlord Dashboard detail (use client renderer if present)
            try {
              if (typeof window.renderApartmentReviews === 'function') {
                const dashPage = document.getElementById('Dashboard');
                const selected = dashPage ? dashPage.querySelector('.selectedrightside, #selectedRightSide') : null;
                if (selected) { await window.renderApartmentReviews(adId, selected); }
              } else {
                await renderLandlordReviewSummary(adId);
              }
            } catch (_) { }
            try { await refreshLandlordReceiptLists(); } catch (_) { }
          } else {
            alert('Listing not found.');
            return;
          }
        } catch (err) {
          console.error('Error fetching listing details:', err);
          alert('Error loading listing details.');
          return;
        }
      })();

      const parentPage = card.closest('.sidelp');
      if (!parentPage) return;
      parentPage.querySelectorAll(':scope > div:not(.selectedrightside)')
        .forEach(el => el.style.display = 'none');
      const detailPage = parentPage.querySelector('.selectedrightside');
      if (detailPage) {
        detailPage.style.display = 'flex';
      }
      parentPage.setAttribute('data-detail-open', 'true');
      // start/restart chat listener for this apartment id
      listenForMessages();
      // ensure chat scroll behaves like client: scroll to bottom and into view
      const messagesContainer = document.getElementById('messages');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
      const chatBox = document.getElementById('chatBox');
      if (chatBox) {
        chatBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }
  // Dashboard add-more photos handler (button is rendered inside the photo frame)
  const dashPhotoInput = document.getElementById('dashPhotoInput');
  if (dashPhotoInput) {
    dashPhotoInput.addEventListener('change', async function () {
      const files = Array.from(this.files || []);
      const imageFiles = files.filter(f => f && f.type && f.type.startsWith('image/'));
      this.value = '';
      if (!imageFiles.length) return;
      if (!window.currentEditingAdId) { alert('Please select an apartment first.'); return; }

      const client = initSupabase();
      if (!client) {
        alert('Unable to connect to database.');
        return;
      }

      try {
        // Determine if we already have photos (first upload becomes primary)
        const { data: existing, error: fetchErr } = await client
          .from('apartment_images')
          .select('id, is_primary, is_floorplan')
          .eq('apartment_id', window.currentEditingAdId)
          .eq('is_floorplan', false)
          .order('is_primary', { ascending: false })
          .order('id', { ascending: true });

        if (fetchErr) throw fetchErr;
        const existingPhotos = Array.isArray(existing) ? existing : [];
        const shouldSetPrimary = existingPhotos.length === 0;

        const bucketName = 'apartment-images';
        const newUrls = [];

        const { data: sess } = await client.auth.getSession();
        const landlordId = sess?.session?.user?.id;
        if (!landlordId) {
          alert('Please sign in to add photos.');
          return;
        }

        for (const f of imageFiles) {
          const fileExt = (f.name && f.name.includes('.')) ? f.name.split('.').pop() : 'jpg';
          const fileName = `landlords/${landlordId}/${window.currentEditingAdId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;

          const { error: uploadError } = await client.storage
            .from(bucketName)
            .upload(fileName, f, { cacheControl: '3600', upsert: false });

          if (uploadError) {
            console.warn('Upload error:', uploadError);
            continue;
          }

          const { data: urlData } = client.storage.from(bucketName).getPublicUrl(fileName);
          const publicUrl = urlData?.publicUrl;
          if (publicUrl) newUrls.push(publicUrl);
        }

        if (!newUrls.length) {
          alert('Failed to upload image(s).');
          return;
        }

        const inserts = newUrls.map((url, i) => ({
          apartment_id: window.currentEditingAdId,
          image_url: url,
          is_primary: shouldSetPrimary && i === 0,
          is_floorplan: false
        }));

        const { error: insErr } = await client.from('apartment_images').insert(inserts);
        if (insErr) throw insErr;

        const { data: updated, error: updatedErr } = await client
          .from('apartment_images')
          .select('image_url')
          .eq('apartment_id', window.currentEditingAdId)
          .eq('is_floorplan', false)
          .order('is_primary', { ascending: false })
          .order('id', { ascending: true });

        if (updatedErr) throw updatedErr;
        const urls = (updated || []).map(x => x.image_url).filter(Boolean);
        renderDashboardPhotos(urls);
        alert('Photo(s) added successfully!');
      } catch (e) {
        console.error('Dashboard add photos failed:', e);
        alert('Failed to add photo(s).');
      }
    });
  }
  
  // Dashboard panorama upload handler
  const dashPanoramaInput = document.getElementById('dashPanoramaInput');
  if (dashPanoramaInput) {
    dashPanoramaInput.addEventListener('change', async function() {
      const MAX_PANORAMAS = 6;
      const files = Array.from(this.files || []);
      const imageFiles = files.filter(f => f && f.type && f.type.startsWith('image/'));
      
      if (!imageFiles.length) return;
      if (!window.currentEditingAdId) {
        alert('Please select an apartment first.');
        return;
      }
      
      const client = initSupabase();
      if (!client) {
        alert('Unable to connect to database.');
        return;
      }
      
      // Check current panorama count
      const { data: existing, error: countError } = await client
        .from('panorama_images')
        .select('id')
        .eq('apartment_id', window.currentEditingAdId);
      
      const currentCount = existing ? existing.length : 0;
      const remainingSlots = MAX_PANORAMAS - currentCount;
      
      if (remainingSlots <= 0) {
        alert(`Maximum of ${MAX_PANORAMAS} panorama images allowed. Please delete some to add more.`);
        this.value = '';
        return;
      }
      
      const filesToProcess = imageFiles.slice(0, remainingSlots);
      
      if (imageFiles.length > remainingSlots) {
        alert(`Only ${remainingSlots} more panorama(s) can be added (maximum ${MAX_PANORAMAS} total).`);
      }
      
      // Get landlord ID
      const { data: sess } = await client.auth.getSession();
      const landlordId = sess?.session?.user?.id;
      
      if (!landlordId) {
        alert('Please sign in to upload panoramas.');
        return;
      }
      
      // Upload each panorama
      for (const file of filesToProcess) {
        try {
          // Generate unique filename
          const fileExt = file.name.split('.').pop();
          const fileName = `${window.currentEditingAdId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          
          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await client.storage
            .from('panorama-images')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false
            });
          
          if (uploadError) {
            console.error('Upload error:', uploadError);
            continue;
          }
          
          // Get public URL
          const { data: { publicUrl } } = client.storage
            .from('panorama-images')
            .getPublicUrl(fileName);
          
          // Save to database
          await client
            .from('panorama_images')
            .insert({
              apartment_id: window.currentEditingAdId,
              landlord_id: landlordId,
              image_url: publicUrl,
              label: 'Untitled Room'
            });
          
        } catch (error) {
          console.error('Error uploading panorama:', error);
        }
      }
      
      // Reload panoramas
      await loadDashboardPanoramas(window.currentEditingAdId);
      this.value = '';
      alert('Panorama images uploaded successfully!');
    });
  }
  
  // Function to load dashboard panoramas
  window.loadDashboardPanoramas = async function(apartmentId) {
    const dashPanoramaList = document.getElementById('dashboardPanoramaList');
    if (!dashPanoramaList || !apartmentId) return;
    
    const client = initSupabase();
    if (!client) return;
    
    try {
      const { data, error } = await client
        .from('panorama_images')
        .select('*')
        .eq('apartment_id', apartmentId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error loading panoramas:', error);
        return;
      }
      
      const panoramas = data || [];
      
      if (panoramas.length === 0) {
        dashPanoramaList.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 16px;">No panorama images uploaded yet.</p>';
        return;
      }
      
      dashPanoramaList.innerHTML = panoramas.map(item => `
        <div class="dashboard-panorama-item" data-id="${item.id}" style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 12px; padding: 12px; margin-bottom: 12px; display: flex; gap: 12px; align-items: center;">
          <div class="dashboard-panorama-thumbnail" data-action="view" style="width: 120px; height: 80px; border-radius: 8px; overflow: hidden; cursor: pointer; flex-shrink: 0;">
            <img src="${item.image_url}" alt="${item.label}" style="width: 100%; height: 100%; object-fit: cover;"/>
          </div>
          <div style="flex: 1; min-width: 0;">
            <input type="text" value="${item.label}" placeholder="Enter room label" 
                   data-action="update-label" 
                   style="width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-secondary); color: var(--text-primary); margin-bottom: 8px;">
            <div style="display: flex; gap: 8px;">
              <button data-action="view" style="flex: 1; padding: 8px 12px; background: var(--primary-color); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85rem;">
                <i class="fa-solid fa-eye"></i> View 360°
              </button>
              <button data-action="delete" style="flex: 1; padding: 8px 12px; background: #dc2626; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85rem;">
                <i class="fa-solid fa-trash"></i> Delete
              </button>
            </div>
          </div>
        </div>
      `).join('');
      
      // Bind dashboard panorama listeners once (prevents RAM growth from duplicate listeners)
      if (!dashPanoramaList.dataset.bound) {
        dashPanoramaList.dataset.bound = 'true';

        // Add event delegation for dashboard panoramas
        dashPanoramaList.addEventListener('click', function(e) {
          const target = e.target;
          const action = target.getAttribute('data-action') || target.closest('[data-action]')?.getAttribute('data-action');
          if (!action) return;

          const panoramaItem = target.closest('.dashboard-panorama-item');
          if (!panoramaItem) return;

          const id = panoramaItem.getAttribute('data-id');
          if (!id) return;

          if (action === 'view') {
            window.openPanoramaViewer(id);
          } else if (action === 'delete') {
            window.deleteDashboardPanorama(id, window.currentEditingAdId);
          }
        });

        // Handle label updates
        dashPanoramaList.addEventListener('change', async function(e) {
          if (e.target.getAttribute('data-action') !== 'update-label') return;
          const panoramaItem = e.target.closest('.dashboard-panorama-item');
          if (!panoramaItem) return;

          const id = panoramaItem.getAttribute('data-id');
          const newLabel = e.target.value || 'Untitled Room';
          const client = initSupabase();
          if (!client) return;
          try {
            await client.from('panorama_images').update({ label: newLabel }).eq('id', id);
          } catch (error) {
            console.error('Error updating label:', error);
          }
        });

        // Handle Enter key press on dashboard label input
        dashPanoramaList.addEventListener('keypress', async function(e) {
          if (e.key !== 'Enter' || e.target.getAttribute('data-action') !== 'update-label') return;
          e.preventDefault();
          const panoramaItem = e.target.closest('.dashboard-panorama-item');
          if (!panoramaItem) return;

          const id = panoramaItem.getAttribute('data-id');
          const newLabel = e.target.value || 'Untitled Room';
          const client = initSupabase();
          if (!client) return;
          try {
            await client.from('panorama_images').update({ label: newLabel }).eq('id', id);
            e.target.blur();
          } catch (error) {
            console.error('Error updating label:', error);
          }
        });
      }
      
    } catch (error) {
      console.error('Error loading dashboard panoramas:', error);
    }
  };
  
  // Function to delete dashboard panorama
  window.deleteDashboardPanorama = async function(id, apartmentId) {
    if (!confirm('Are you sure you want to delete this panorama image?')) return;
    
    const client = initSupabase();
    if (!client) {
      alert('Unable to connect to database.');
      return;
    }
    
    try {
      // Get the panorama to find the image URL
      const { data: panorama, error: fetchError } = await client
        .from('panorama_images')
        .select('image_url')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Extract file path from URL
      try {
        const url = new URL(panorama.image_url);
        const pathParts = url.pathname.split('/');
        const filePath = pathParts.slice(pathParts.indexOf('panorama-images') + 1).join('/');
        
        // Delete from storage
        if (filePath) {
          await client.storage
            .from('panorama-images')
            .remove([filePath]);
        }
      } catch (urlError) {
        console.error('Error parsing URL:', urlError);
      }
      
      // Delete from database
      const { error } = await client
        .from('panorama_images')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting panorama:', error);
        alert('Failed to delete panorama image.');
        return;
      }
      
      // Reload panoramas
      await window.loadDashboardPanoramas(apartmentId);
      alert('Panorama deleted successfully!');
      
    } catch (error) {
      console.error('Error deleting panorama:', error);
      alert('An error occurred while deleting the panorama.');
    }
  };
  
});

// ------- Landlord: pending applications list + approve/decline -------
async function fetchPendingApplicationsForLandlord() {
  try {
    const client = initSupabase();
    if (!client) return [];
    const { data: sess } = await client.auth.getSession();
    const landlordId = sess?.session?.user?.id || null;
    if (!landlordId) return [];
    // Ensure session is fresh and apartments are scoped to landlord
    const { data: apts, error: aErr } = await client
      .from('apartments')
      .select('id')
      .eq('landlord_id', landlordId)
      .limit(200);
    if (aErr) throw aErr;
    // Normalize to strings to match rental_applications.apartment_id type (UUID/text)
    const ids = (apts || []).map(a => String(a.id));
    if (!ids.length) return [];
    // Fetch pending applications for these apartments
    const { data: apps, error: appErr } = await client
      .from('rental_applications')
      .select('id, apartment_id, applicant_user_id, status, unit_number, data, created_at, landlord_review_notes, priority, review_updated_at')
      .in('apartment_id', ids)
      .in('status', ['pending','submitted','under_review','reviewed'])
      .order('created_at', { ascending: false });
    if (appErr) throw appErr;
    return apps || [];
  } catch (e) {
    console.warn('fetchPendingApplicationsForLandlord error:', e?.message || e);
    return [];
  }
}

function renderLandlordPendingApplications(apps) {
  // Keep a reference so inline handlers can resolve by id
  try { window.__lastLandlordPendingApps = Array.isArray(apps) ? apps.slice() : []; } catch (_) { }
  // Dashboard renters box (compact) and Applications page (full list)
  const box = document.querySelector('#Dashboard .renters-box');
  if (box) {
    // Clear previous content to avoid accumulating duplicate empty messages or renters
    box.innerHTML = '';
    const currentAdId = (window.currentEditingAdId ? String(window.currentEditingAdId) : null);
    if (!currentAdId) {
      const empty = document.createElement('div');
      empty.style.color = '#666';
      empty.style.fontSize = '.9rem';
      empty.style.marginTop = '8px';
      // empty.textContent = 'No recent applications.';
      box.appendChild(empty);
      return;
    }
    const filtered = Array.isArray(apps)
      ? apps.filter(a => String(a.apartment_id) === currentAdId)
      : [];
    const list = filtered.slice(0, 10);
    if (!list.length) {
      const empty = document.createElement('div');
      empty.style.color = '#666';
      empty.style.fontSize = '.9rem';
      empty.style.marginTop = '8px';
      empty.textContent = 'No recent applications.';
      box.appendChild(empty);
      return;
    }
    list.forEach(app => {
      const renter = document.createElement('div');
      renter.className = 'renter';
      const name = app?.data?.fullName || 'Applicant';
      const when = app.created_at ? new Date(app.created_at).toLocaleString() : '';
      const unitNum = app?.unit_number != null ? Number(app.unit_number)
        : (app?.data && app.data.unit_number != null ? Number(app.data.unit_number) : null);
      const unitLabel = (unitNum != null && !isNaN(unitNum)) ? `Unit ${unitNum}` : 'Unit —';
      renter.innerHTML = `
        <span>${name}</span>
        <div class="clientmessage" data-app-id="${app.id}" style="cursor:pointer">Applied on ${when} • ${unitLabel}</div>
        <div style="display:flex; gap:8px; margin-top:6px;">
          <button class="approve-app" data-app-id="${app.id}" data-apt-id="${app.apartment_id}">Approve</button>
          <button class="decline-app" data-app-id="${app.id}">Decline</button>
        </div>
      `;
      box.appendChild(renter);
      // Open application details when the message is clicked
      try {
        const msg = renter.querySelector('.clientmessage');
        if (msg) {
          msg.addEventListener('click', function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
            try { showApplicationDetails(app); } catch (_) { }
            this.classList.toggle('revealed');
          });
        }
      } catch (_) { }
    });
  }
  // Applications page was removed; skip rendering there safely
}

async function approveApplication(appId, apartmentId) {
  const client = initSupabase();
  if (!client) return false;
  try {
    // Fetch application to get unit_number (client's selected unit)
    const { data: appRow, error: appFetchErr } = await client
      .from('rental_applications')
      .select('id, unit_number, data')
      .eq('id', appId)
      .single();
    const unitNumber = appRow?.unit_number != null ? Number(appRow.unit_number)
      : (appRow?.data && appRow.data.unit_number != null ? Number(appRow.data.unit_number) : null);

    // Mark application approved
    const { error: updErr } = await client
      .from('rental_applications')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('id', appId);
    if (updErr) throw updErr;
    // Update apartment unit availability: add selected unit to occupied_unit_numbers
    try {
      const { data: aptRow, error: aptErr } = await client
        .from('apartments')
        .select('id, total_units, available_units, occupied_unit_numbers, status')
        .eq('id', apartmentId)
        .single();
      if (aptErr) throw aptErr;
      const totalUnits = aptRow?.total_units != null ? aptRow.total_units : 1;
      let occupiedArr = [];
      const raw = aptRow?.occupied_unit_numbers;
      if (Array.isArray(raw)) occupiedArr = [...raw];
      else if (raw && typeof raw === 'string') try { occupiedArr = JSON.parse(raw); } catch (_) {}
      const occSet = new Set(occupiedArr.map(n => Number(n)).filter(n => !isNaN(n)));

      if (unitNumber != null && !isNaN(unitNumber) && unitNumber >= 1 && unitNumber <= totalUnits && !occSet.has(unitNumber)) {
        occSet.add(unitNumber);
      } else if (unitNumber == null || isNaN(unitNumber)) {
        // Fallback: assign first available unit
        for (let i = 1; i <= totalUnits; i++) {
          if (!occSet.has(i)) {
            occSet.add(i);
            break;
          }
        }
      }
      const newOccupied = Array.from(occSet).sort((a, b) => a - b);
      const newAvailable = totalUnits - newOccupied.length;
      const newStatus = newAvailable > 0 ? 'available' : 'rented';
      await client
        .from('apartments')
        .update({
          total_units: totalUnits,
          available_units: Math.max(0, newAvailable),
          occupied_unit_numbers: newOccupied,
          status: newStatus
        })
        .eq('id', apartmentId);
    } catch (unitErr) {
      console.warn('Failed to update apartment unit counts on approval:', unitErr);
    }
    // Immediately remove from Applications list UI and close details modal if open
    try {
      const approveBtn = document.querySelector(`.approve-app[data-app-id="${appId}"]`);
      const card = approveBtn ? approveBtn.closest('.outerad') : null;
      if (card && card.parentNode) {
        card.parentNode.removeChild(card);
      }
      const appModal = document.getElementById('applicationDetailsModal');
      if (appModal && appModal.style.display !== 'none') {
        appModal.style.display = 'none';
      }
      // Also refresh list to keep search/filter counts accurate
      refreshLandlordApplications();
    } catch (_) { }
    // Navigate landlord UI to Rented tab and refresh rented list
    try {
      const navLinks = document.querySelectorAll('.sidemenu .page');
      const contentPages = document.querySelectorAll('.sidelp');
      navLinks.forEach(l => l.classList.remove('active'));
      const rentedLink = document.querySelector('.sidemenu .page[data-target="Rented"]');
      if (rentedLink) rentedLink.classList.add('active');
      contentPages.forEach(p => p.classList.remove('actsidelp'));
      const rentedPage = document.getElementById('Rented');
      if (rentedPage) rentedPage.classList.add('actsidelp');
      await refreshLandlordRentedTab();
      // Refresh dashboard listings so approved/rented item disappears
      debouncedRenderLandlordListings();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (_) { }
    return true;
  } catch (e) {
    console.error('approveApplication error:', e);
    return false;
  }
}

async function declineApplication(appId) {
  const client = initSupabase();
  if (!client) return false;
  try {
    const { error } = await client
      .from('rental_applications')
      .update({ status: 'declined', declined_at: new Date().toISOString() })
      .eq('id', appId);
    if (error) throw error;
    return true;
  } catch (e) {
    console.error('declineApplication error:', e);
    return false;
  }
}

async function refreshLandlordApplications() {
  const apps = await fetchPendingApplicationsForLandlord();
  renderLandlordPendingApplications(apps);
  // Reapply current search filter if present
  applyApplicationsSearchFilterCurrent();
}

document.addEventListener('DOMContentLoaded', function () {
  refreshLandlordApplications();
  // Lower-frequency fallback; primary updates come from Realtime subscriptions.
  setInterval(refreshLandlordApplications, 60000);
  // Initial rented tab load and setup search
  refreshLandlordRentedTab();
  setupRentedSearch();
  // No rented review sort listener needed
  // Global safe fallback for inline HTML onclick="revealMessage(this)"
  try {
    window.revealMessage = function (el) {
      try {
        if (el && el.classList) el.classList.toggle('revealed');
        // Try to resolve application by closest data-app-id or text
        const appId = el?.getAttribute && el.getAttribute('data-app-id');
        if (appId && Array.isArray(window.__lastLandlordPendingApps)) {
          const app = window.__lastLandlordPendingApps.find(a => String(a.id) === String(appId));
          if (app) { try { showApplicationDetails(app); } catch (_) { } }
        }
      } catch (_) { }
    };
  } catch (_) { }
  // Approve / Decline handlers
  document.body.addEventListener('click', async function (e) {
    const approveBtn = e.target.closest('.approve-app');
    const declineBtn = e.target.closest('.decline-app');
    if (approveBtn) {
      e.preventDefault();
      const appId = approveBtn.getAttribute('data-app-id');
      const aptId = approveBtn.getAttribute('data-apt-id');
      const ok = await approveApplication(appId, aptId);
      if (ok) {
        alert('Application approved.');
        refreshLandlordApplications();
        debouncedRenderLandlordListings();
      } else {
        alert('Failed to approve application.');
      }
    }
    if (declineBtn) {
      e.preventDefault();
      const appId = declineBtn.getAttribute('data-app-id');
      const ok = await declineApplication(appId);
      if (ok) {
        alert('Application declined.');
        refreshLandlordApplications();
      } else {
        alert('Failed to decline application.');
      }
    }
  });
  // Applications page removed: guard search wiring
  (function () {
    const search = document.getElementById('applicationsSearch');
    if (search) {
      search.addEventListener('input', function () {
        const q = (search.value || '').toLowerCase();
        const list = document.getElementById('applicationsList');
        if (!list) return;
        list.querySelectorAll('.outerad').forEach(card => {
          const hay = [card.dataset.name, card.dataset.email, card.dataset.phone, card.dataset.movein, card.dataset.stay, card.dataset.when]
            .filter(Boolean).join(' ');
          card.style.display = hay.includes(q) ? '' : 'none';
        });
      });
    }
  })();
});

function applyApplicationsSearchFilterCurrent() {
  const search = document.getElementById('applicationsSearch');
  if (!search) return;
  const evt = new Event('input');
  search.dispatchEvent(evt);
}

// ------- Landlord Rented tab: fetch and render rented apartments -------
// Shows apartments that have at least one approved tenant (not just status='rented')
async function fetchLandlordRented() {
  try {
    const client = initSupabase();
    if (!client) return [];
    const { data: sess } = await client.auth.getSession();
    const landlordId = sess?.session?.user?.id || null;
    if (!landlordId) return [];
    let apts = [];
    // First: load apartments for this landlord, then map to rented units coming from:
    // - online rentals: rental_applications (approved/accepted) with unit_number
    // - walk-in rentals: walkin_rentals with unit_number
    try {
      const { data: approvedApts, error: approvedErr } = await client
        .from('apartments')
        .select('id, price, location, description, unit_size, total_units, occupied_unit_numbers, amenities, contact, status, created_at')
        .eq('landlord_id', landlordId)
        .limit(200);
      if (!approvedErr && approvedApts && approvedApts.length > 0) {
        const aptIds = approvedApts.map(a => a.id);
        const { data: apps } = await client
          .from('rental_applications')
          .select('apartment_id, unit_number, data')
          .in('apartment_id', aptIds)
          .in('status', ['approved', 'accepted']);
        const { data: walkins } = await client
          .from('walkin_rentals')
          .select('apartment_id, unit_number')
          .in('apartment_id', aptIds)
          .limit(500);

        const rentedUnitsByApt = new Map();
        (apps || []).forEach(a => {
          const aptId = String(a.apartment_id);
          const u = a?.unit_number != null ? Number(a.unit_number) : (a?.data?.unit_number != null ? Number(a.data.unit_number) : null);
          if (u == null || Number.isNaN(u)) return;
          if (!rentedUnitsByApt.has(aptId)) rentedUnitsByApt.set(aptId, new Set());
          rentedUnitsByApt.get(aptId).add(u);
        });
        (walkins || []).forEach(w => {
          const aptId = String(w.apartment_id);
          const u = w?.unit_number != null ? Number(w.unit_number) : null;
          if (u == null || Number.isNaN(u)) return;
          if (!rentedUnitsByApt.has(aptId)) rentedUnitsByApt.set(aptId, new Set());
          rentedUnitsByApt.get(aptId).add(u);
        });

        apts = approvedApts
          .filter(row => {
            const idStr = String(row.id);
            if (rentedUnitsByApt.has(idStr)) return true;
            const status = String(row.status || '').toLowerCase();
            return status === 'rented';
          })
          .map(row => {
            const idStr = String(row.id);
            const set = rentedUnitsByApt.get(idStr);
            const rentedUnitNumbers = set ? Array.from(set).sort((a, b) => a - b) : [];
            return { ...row, __rentedUnitNumbers: rentedUnitNumbers };
          });
      }
    } catch (_) {}
    // Fallback: status='rented' (fully occupied)
    if (apts.length === 0) {
      const { data: statusApts, error } = await client
        .from('apartments')
        .select('id, price, location, description, unit_size, total_units, occupied_unit_numbers, amenities, contact, status, created_at')
        .eq('landlord_id', landlordId)
        .eq('status', 'rented')
        .order('created_at', { ascending: false })
        .limit(200);
      if (!error && statusApts) apts = statusApts;
    } else {
      apts.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }
    const ids = (apts || []).map(a => a.id);
    let photosMap = new Map();
    if (ids.length) {
      const { data: imgs } = await client
        .from('apartment_images')
        .select('apartment_id, image_url, is_floorplan, is_primary')
        .in('apartment_id', ids);
      (imgs || []).forEach(img => {
        const key = String(img.apartment_id);
        if (!photosMap.has(key)) photosMap.set(key, []);
        photosMap.get(key).push(img);
      });
    }
    const baseList = (apts || []).map(row => {
      const images = photosMap.get(String(row.id)) || [];
      const regular = images.filter(i => !i.is_floorplan);
      const urls = regular.map(i => i.image_url).filter(Boolean).slice(0, 6);
      let occupiedUnits = [];
      const raw = row.occupied_unit_numbers;
      if (Array.isArray(raw)) occupiedUnits = raw.map(n => Number(n)).filter(n => !isNaN(n));
      else if (raw && typeof raw === 'string') try { occupiedUnits = JSON.parse(raw).map(n => Number(n)).filter(n => !isNaN(n)); } catch (_) {}
      return {
        id: String(row.id),
        price: row.price,
        location: row.location,
        description: row.description,
        unitSize: row.unit_size,
        amenities: row.amenities || '',
        landmark: row.landmark || '',
        contact: row.contact || '',
        createdAt: row.created_at,
        primaryImageDataUrls: urls,
        primaryImageDataUrl: urls[0] || '',
        occupiedUnitNumbers: occupiedUnits,
        rentedUnitNumbers: Array.isArray(row.__rentedUnitNumbers) ? row.__rentedUnitNumbers : []
      };
    });
    // Expand to one card per rented unit (individual card per unit)
    const list = [];
    baseList.forEach(ad => {
      const rented = Array.isArray(ad.rentedUnitNumbers) ? ad.rentedUnitNumbers : [];
      if (rented.length > 0) {
        rented.forEach(unitNum => list.push({ ...ad, unitNumber: unitNum }));
        return;
      }
      // If fully rented but unit numbers aren't available, show a single generic card.
      list.push({ ...ad, unitNumber: null });
    });
    list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return list;
  } catch (_) { return []; }
}

function renderLandlordRented(list) {
  const container = document.getElementById('landlordRentedListings');
  const noRentedMessage = document.getElementById('noRentedApartmentMessageLandlord');
  
  if (!container) return;
  container.innerHTML = '';
  
  // Show/hide no-rented message based on listings
  if (!list || !list.length) {
    if (noRentedMessage) noRentedMessage.style.display = 'block';
    return;
  } else {
    // Completely remove the no-rented-message element when there are rented apartments
    if (noRentedMessage) {
      noRentedMessage.remove();
    }
  }
  (list || []).forEach(ad => {
    const card = document.createElement('div');
    card.className = 'outerad';
    card.dataset.adId = ad.id;
    card.dataset.id = ad.id; // For filtering compatibility
    // For remove button
    if (ad.unitNumber != null && !isNaN(ad.unitNumber)) {
      card.dataset.unitNumber = String(Number(ad.unitNumber));
    }
    // For filtering
    card.dataset.location = String(ad.location || '').toLowerCase();
    card.dataset.price = String(ad.price || '').toLowerCase();
    card.dataset.description = String(ad.description || '').toLowerCase();
    const photoUrls = ad.primaryImageDataUrls || [];
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
      photoHtml = `<img src="${ad.primaryImageDataUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:12px"/>`;
    } else {
      photoHtml = `<img src="final logo.PNG" alt="photos">`;
    }
    const unitNum = ad.unitNumber;
    const unitBadgeText = unitNum != null && !isNaN(unitNum) ? `Unit ${unitNum}` : '';
    const unitBadgeHtml = unitBadgeText
      ? `<div class="unit-badge" style="position:absolute;top:8px;left:8px;background:rgba(15,23,42,0.9);color:#fff;padding:5px 10px;border-radius:8px;font-size:0.8rem;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,0.2);">${unitBadgeText}</div>`
      : '';

    const removeBtnHtml = `<button type="button" class="remove-tenant-btn" data-apt-id="${ad.id}" data-unit-number="${(unitNum != null && !isNaN(unitNum)) ? Number(unitNum) : ''}"
            style="margin-left:auto;background:var(--error-color,#ef4444);color:#fff;border:none;padding:6px 10px;border-radius:999px;cursor:pointer;font-weight:700;font-size:.8rem;">
            Remove tenant
          </button>`;
    card.innerHTML = `
      <div class="photo" style="position:relative;">${photoHtml}${unitBadgeHtml}</div>
      <div class="listinfo">
        <div class="listinfoleft">₱${ad.price} - ${ad.location}</div>
      </div>
      <div class="card-rating card-rating-below" data-apartment-id="${ad.id}">
        <span class="stars-inline" aria-hidden="true"></span>
        <span class="rating-text" aria-label="rating"></span>
      </div>
      <div class="status-row1">
        <div class="listinforight1" title="Rented" style="display:flex;align-items:center;gap:8px;width:100%;">
          <span class="status-badge" style="padding:3px 8px;border-radius:999px;font-size:.8rem;background:#fdecea;color:#b02a37;display:inline-block;">Rented</span>
          ${removeBtnHtml}
        </div>
      </div>`;
    if (limited.length > 1) {
      const imgEl = card.querySelector('.pc-image');
      const prevBtn = card.querySelector('.pc-prev');
      const nextBtn = card.querySelector('.pc-next');
      const dotsEl = card.querySelector('.pc-dots');
      const counterEl = card.querySelector('.pc-counter');
      let idx = 0;
      dotsEl.innerHTML = limited.map((_, i) => `<span data-idx="${i}" style="width:8px;height:8px;border-radius:50%;background:${i === 0 ? '#fff' : 'rgba(255,255,255,0.6)'};display:inline-block;cursor:pointer"></span>`).join('');
      function update(n) {
        if (n < 0) n = limited.length - 1;
        if (n >= limited.length) n = 0;
        idx = n;
        imgEl.src = limited[idx];
        counterEl.textContent = `${idx + 1}/${limited.length}`;
        dotsEl.querySelectorAll('span').forEach((d, i) => { d.style.background = i === idx ? '#fff' : 'rgba(255,255,255,0.6)'; });
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

    // Rating summary (same as dashboard cards)
    try { renderCardRatingSummaryLandlord(ad.id, card); } catch (_) {}

    // Remove tenant directly from card without opening details panel
    const removeBtn = card.querySelector('.remove-tenant-btn');
    if (removeBtn && !removeBtn.__wired) {
      removeBtn.__wired = true;
      removeBtn.addEventListener('click', async (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        const aptId = removeBtn.getAttribute('data-apt-id');
        const unitStr = removeBtn.getAttribute('data-unit-number');
        let unitNumber = (unitStr != null && unitStr !== '') ? Number(unitStr) : null;
        if (unitNumber == null || isNaN(unitNumber)) {
          // Fallback for rentals without explicit unit number (treat as Unit 1)
          unitNumber = 1;
        }
        if (!aptId) {
          alert('Cannot remove tenant: missing apartment id.');
          return;
        }
        await removeTenantFromRentedUnit(aptId, unitNumber);
      });
    }

    // Open renter details on click
    card.addEventListener('click', function (e) {
      // Status is now automatically managed by rental applications
      showRenterDetailsByApartment(ad.id, ad.unitNumber);
      // Additionally load/manage reviews for this apartment (moderation)
      try { showApartmentReviewsModeration(ad.id); } catch (_) { }
      // Render photos into Rented right panel similar to Dashboard
      try {
        const photoUrls = Array.isArray(ad.primaryImageDataUrls) && ad.primaryImageDataUrls.length
          ? ad.primaryImageDataUrls
          : (ad.primaryImageDataUrl ? [ad.primaryImageDataUrl] : []);
        renderRentedPhotos(photoUrls);
      } catch(_) { }
      // Unified reviews in landlord Rented detail (use client renderer if present)
      try {
        if (typeof window.renderApartmentReviews === 'function') {
          const rentedPage = document.getElementById('Rented');
          const selected = rentedPage ? rentedPage.querySelector('.selectedrightside, #selectedRightSide') : null;
          if (selected) { window.renderApartmentReviews(ad.id, selected); }
        }
      } catch(_) { }
      // Show the detail panel (selectedrightside) for this page
      const parentPage = card.closest('.sidelp');
      if (parentPage) {
        parentPage.querySelectorAll(':scope > div:not(.selectedrightside)')
          .forEach(el => { el.style.display = 'none'; });
        const detailPage = parentPage.querySelector('.selectedrightside');
        if (detailPage) { detailPage.style.display = 'flex'; }
        parentPage.setAttribute('data-detail-open', 'true');
      }
      // Render unified ratings/reviews in the Rented panel
      try {
        if (typeof window.renderApartmentReviews === 'function') {
          const rentedPage = document.getElementById('Rented');
          const selected = rentedPage ? rentedPage.querySelector('.selectedrightside, #selectedRightSide') : null;
          if (selected) { window.renderApartmentReviews(ad.id, selected); }
        } else if (typeof renderLandlordRentedReviewSummary === 'function') {
          renderLandlordRentedReviewSummary(ad.id);
        }
      } catch(_) { }
      // Track selected rented listing id for actions like Remove Tenant and receipts
      try {
        window.__selectedRentedApartmentId = ad.id;
        window.__selectedRentedUnitNumber = (ad.unitNumber != null && !isNaN(ad.unitNumber)) ? Number(ad.unitNumber) : null;
      } catch(_) {}
      refreshLandlordReceiptLists().catch(function() {});
    });
  });
}

async function removeTenantFromRentedUnit(apartmentId, unitNumber) {
  if (!apartmentId) return;
  const u = unitNumber != null && !isNaN(unitNumber) ? Number(unitNumber) : null;
  if (u == null) return;
  if (!confirm(`Remove tenant from Unit ${u}? This will free the unit.`)) return;
  try {
    const client = initSupabase();
    if (!client) throw new Error('Supabase client not available');

    // If this unit was a walk-in tenant, also delete the walk-in row.
    // Do this before we free the unit so DB state stays consistent.
    const { error: delWalkErr } = await client
      .from('walkin_rentals')
      .delete()
      .eq('apartment_id', apartmentId)
      .eq('unit_number', u);
    if (delWalkErr) throw delWalkErr;

    const { data: appRows } = await client
      .from('rental_applications')
      .select('id, unit_number, data, applicant_user_id')
      .eq('apartment_id', apartmentId)
      .in('status', ['approved', 'accepted'])
      .order('approved_at', { ascending: false })
      .limit(25);

    const app = (appRows || []).find(r => {
      const unitFromCol = r?.unit_number != null ? Number(r.unit_number) : null;
      const unitFromData = r?.data?.unit_number != null ? Number(r.data.unit_number) : null;
      const unit = (unitFromCol != null && !isNaN(unitFromCol)) ? unitFromCol
        : ((unitFromData != null && !isNaN(unitFromData)) ? unitFromData : null);
      return unit === u;
    }) || null;

    const { data: aptRow, error: fetchErr } = await client
      .from('apartments')
      .select('id, total_units, available_units, occupied_unit_numbers')
      .eq('id', apartmentId)
      .single();
    if (fetchErr) throw fetchErr;

    const totalUnits = aptRow?.total_units != null ? aptRow.total_units : 1;
    let occupiedArr = [];
    const raw = aptRow?.occupied_unit_numbers;
    if (Array.isArray(raw)) occupiedArr = [...raw];
    else if (raw && typeof raw === 'string') try { occupiedArr = JSON.parse(raw); } catch (_) {}
    const occSet = new Set(occupiedArr.map(n => Number(n)).filter(n => !isNaN(n)));
    if (occSet.has(u)) occSet.delete(u);
    const newOccupied = Array.from(occSet).sort((a, b) => a - b);
    const newAvailable = totalUnits - newOccupied.length;

    const { error: updErr } = await client
      .from('apartments')
      .update({
        status: newAvailable > 0 ? 'available' : 'rented',
        total_units: totalUnits,
        available_units: Math.max(0, newAvailable),
        occupied_unit_numbers: newOccupied
      })
      .eq('id', apartmentId);
    if (updErr) throw updErr;

    // Cancel application(s) so this apartment/unit no longer counts as rented.
    // Also delete associated payment receipts (transaction history)
    if (app && app.id) {
      // We matched a specific application for this unit – cancel just that one.
      const tenantUserId = app.applicant_user_id;
      
      // Delete payment receipts for this tenant
      if (tenantUserId) {
        const { error: delPaymentErr } = await client
          .from('payment_receipts')
          .delete()
          .eq('client_id', tenantUserId)
          .eq('apartment_id', apartmentId);
        if (delPaymentErr) console.warn('Failed to delete payment receipts:', delPaymentErr);
      }
      
      await client
        .from('rental_applications')
        .update({ status: 'cancelled' })
        .eq('id', app.id);
    } else if (Array.isArray(appRows) && appRows.length) {
      // No exact unit match (e.g. data inconsistent) – cancel all approved/accepted apps
      // for this apartment so it fully resets to available.
      // Also delete all associated payment receipts
      const idsToCancel = appRows.map(r => r.id).filter(Boolean);
      const userIdsToDelete = appRows
        .filter(r => r.applicant_user_id)
        .map(r => r.applicant_user_id);
      
      // Delete payment receipts for all affected tenants
      if (userIdsToDelete.length) {
        const { error: delPaymentErr } = await client
          .from('payment_receipts')
          .delete()
          .in('client_id', userIdsToDelete)
          .eq('apartment_id', apartmentId);
        if (delPaymentErr) console.warn('Failed to delete payment receipts:', delPaymentErr);
      }
      
      if (idsToCancel.length) {
        await client
          .from('rental_applications')
          .update({ status: 'cancelled' })
          .in('id', idsToCancel);
      }
    }

    await refreshLandlordRentedTab();
    debouncedRenderLandlordListings();
    alert(`Tenant removed. Unit ${u} is now available.`);
  } catch (e) {
    console.error('removeTenantFromRentedUnit failed:', e);
    alert('Failed to remove tenant.');
  }
}

async function refreshLandlordRentedTab() {
  let list = await fetchLandlordRented();
  try {
    // Auto-heal: if any apartment in the rented list has neither
    // (a) an approved/accepted application nor
    // (b) any occupied units (covers walk-in tenants),
    // flip it back to available so it moves to Dashboard.
    const client = initSupabase();
    if (client && Array.isArray(list) && list.length) {
      const ids = list.map(a => a.id);
      const { data: apps } = await client
        .from('rental_applications')
        .select('apartment_id, status')
        .in('apartment_id', ids);
      const hasApproved = new Set((apps || [])
        .filter(a => {
          const s = String(a?.status || '').toLowerCase();
          return s === 'approved' || s === 'accepted';
        })
        .map(a => String(a.apartment_id)));
      // Also consider apartments with occupied units (including walk-in tenants) as non-orphans
      const { data: aptRows } = await client
        .from('apartments')
        .select('id, occupied_unit_numbers, status')
        .in('id', ids);
      const hasOccupied = new Set(
        (aptRows || []).filter(row => {
          const status = String(row.status || '').toLowerCase();
          if (status === 'rented') return true;
          const rawOcc = row.occupied_unit_numbers;
          if (Array.isArray(rawOcc)) {
            return rawOcc.some(n => {
              const v = Number(n);
              return !Number.isNaN(v);
            });
          }
          if (rawOcc && typeof rawOcc === 'string') {
            try {
              const parsed = JSON.parse(rawOcc);
              if (Array.isArray(parsed)) {
                return parsed.some(n => {
                  const v = Number(n);
                  return !Number.isNaN(v);
                });
              }
            } catch (_) {}
          }
          return false;
        }).map(row => String(row.id))
      );
      const orphans = ids.filter(id => {
        const key = String(id);
        return !hasApproved.has(key) && !hasOccupied.has(key);
      });
      if (orphans.length) {
        // For apartments that no longer have approved tenants, reset availability to full
        await client
          .from('apartments')
          .update({ 
            status: 'available',
            available_units: null,
            occupied_unit_numbers: []
          })
          .in('id', orphans);
        // Re-fetch after healing
        list = await fetchLandlordRented();
      }
    }
  } catch (_) { }
  // Compute due/overdue apartments so each rented unit card can be highlighted.
  // Note: we intentionally avoid selecting `apartment_rentals.unit_number` here because
  // it can cause Supabase/PostgREST 400 errors depending on schema.
  let dueUnitsByApt = null; // Map(apartmentId -> dueInfo)
  let paidDueMonthsByApt = null; // Map(apartmentId -> Set(monthStamp))
  try {
    const client = initSupabase();
    if (client && Array.isArray(list) && list.length) {
      const apartmentIds = [...new Set((list || []).map(a => String(a.id)).filter(Boolean))]
        .filter(id => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id));
      if (apartmentIds.length) {
        const monthStamp = (d) => {
          if (!d || isNaN(d.getTime())) return null;
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          return `${y}-${m}`;
        };

        let rentalsQuery = client
          .from('apartment_rentals')
          .select('apartment_id, move_in_date')
          .eq('rental_status', 'active')
          .limit(500);

        // Avoid PostgREST bad-request edge cases from `in.(uuid)` encoding
        // when the list has exactly one UUID.
        if (apartmentIds.length === 1) {
          rentalsQuery = rentalsQuery.eq('apartment_id', apartmentIds[0]);
        } else {
          rentalsQuery = rentalsQuery.in('apartment_id', apartmentIds);
        }

        const { data: rentals, error } = await rentalsQuery;

        if (!error && Array.isArray(rentals)) {
          dueUnitsByApt = new Map();
          (rentals || []).forEach((r) => {
            const aptIdStr = r?.apartment_id != null ? String(r.apartment_id) : null;
            if (!aptIdStr) return;
            const st = getRentDueStatusFromMoveIn(r.move_in_date);
            if (!st || st.daysUntil > 0) return;
            // If there are multiple active rentals for the same apartment, keep the earliest due date.
            const cur = dueUnitsByApt.get(aptIdStr);
            if (!cur || (st.dueDate && cur.dueDate && st.dueDate.getTime() < cur.dueDate.getTime())) {
              dueUnitsByApt.set(aptIdStr, st);
            }
          });
        }

        // Compute what due-months are already paid so we can clear the red border.
        paidDueMonthsByApt = new Map();
        try {
          let paymentsQuery = client
            .from('rental_payments')
            .select('apartment_id, created_at, payment_status')
            .order('created_at', { ascending: false })
            .limit(1000);

          if (apartmentIds.length === 1) {
            paymentsQuery = paymentsQuery.eq('apartment_id', apartmentIds[0]);
          } else {
            paymentsQuery = paymentsQuery.in('apartment_id', apartmentIds);
          }

          const { data: payments, error: payErr } = await paymentsQuery;
          if (!payErr && Array.isArray(payments)) {
            for (const p of payments) {
              const aptIdStr = p?.apartment_id != null ? String(p.apartment_id) : null;
              if (!aptIdStr) continue;
              if (!paidDueMonthsByApt.has(aptIdStr)) paidDueMonthsByApt.set(aptIdStr, new Set());

              const status = String(p?.payment_status || '').toLowerCase();
              if (!(status === 'succeeded' || status === 'completed' || status === 'success')) continue;

              const paidMonth = monthStamp(new Date(p?.created_at));
              if (!paidMonth) continue;
              paidDueMonthsByApt.get(aptIdStr).add(paidMonth);
            }
          }
        } catch (_) {
          // If payments can't be queried, keep due borders visible.
        }
      }
    }
  } catch (_) {}

  renderLandlordRented(list);

  // Apply red border to outerad cards for due/overdue units (or test override).
  try {
    const container = document.getElementById('landlordRentedListings');
    if (container) {
      container.querySelectorAll('.outerad-due-unit').forEach((c) => c.classList.remove('outerad-due-unit'));

      const testOverride = window.__testRentDueOuterAdOverride || null;
      if (testOverride && testOverride.apartmentId != null && testOverride.unitNumber != null) {
        const apt = String(testOverride.apartmentId);
        const u = Number(testOverride.unitNumber);
        if (Number.isFinite(u)) {
          container.querySelectorAll('.outerad').forEach((card) => {
            const aptIdStr = card.dataset.adId != null ? String(card.dataset.adId) : null;
            const unitStr = card.dataset.unitNumber;
            const uCard = unitStr != null && unitStr !== '' ? Number(unitStr) : NaN;
            if (aptIdStr === apt && Number.isFinite(uCard) && uCard === u) {
              card.classList.add('outerad-due-unit');
              card.title = `TEST: Rent due reminder (Unit ${u})`;
            }
          });
        }
      } else if (dueUnitsByApt) {
        container.querySelectorAll('.outerad').forEach((card) => {
          const aptIdStr = card.dataset.adId != null ? String(card.dataset.adId) : null;
          const unitStr = card.dataset.unitNumber;
          if (!aptIdStr || unitStr == null || unitStr === '') return;
          const dueForApt = dueUnitsByApt.get(aptIdStr);
          if (dueForApt) {
            const dueMonth = (() => {
              const d = dueForApt?.dueDate;
              if (!d || isNaN(d.getTime())) return null;
              const y = d.getFullYear();
              const m = String(d.getMonth() + 1).padStart(2, '0');
              return `${y}-${m}`;
            })();
            const paidMonths = paidDueMonthsByApt?.get(aptIdStr);
            const isPaidForDueMonth = dueMonth && paidMonths && paidMonths.has(dueMonth);
            if (isPaidForDueMonth) return;

            card.classList.add('outerad-due-unit');
            const dueDateStr = dueForApt.dueDate?.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
            const u = Number(unitStr);
            card.title = `Rent due: Unit ${Number.isFinite(u) ? u : ''} ${dueForApt.daysUntil === 0 ? 'due today' : (Math.abs(dueForApt.daysUntil) + ' day(s) overdue')} (${dueDateStr})`;
          }
        });
      }
    }
  } catch (_) {}
  applyRentedSearchFilterCurrent();
}

// Search filter for Rented tab
function setupRentedSearch() {
  const input = document.getElementById('rentedSearch');
  const container = document.getElementById('landlordRentedListings');
  if (!input || !container) return;
  input.addEventListener('input', function () {
    const q = (input.value || '').toLowerCase();
    container.querySelectorAll('.outerad').forEach(card => {
      const hay = [card.dataset.location, card.dataset.price, card.dataset.description]
        .filter(Boolean).join(' ');
      card.style.display = hay.includes(q) ? '' : 'none';
    });
  });
  // Wire sort dropdown
  const sortSel = document.getElementById('rentedSort');
  if (sortSel && !sortSel.__wired) {
    sortSel.__wired = true;
    sortSel.addEventListener('change', function () {
      refreshLandlordRentedTab();
    });
  }
}

function applyRentedSearchFilterCurrent() {
  const input = document.getElementById('rentedSearch');
  if (!input) return;
  const evt = new Event('input');
  input.dispatchEvent(evt);
}

// ------- Renter Details (for rented apartments) -------
async function showRenterDetailsByApartment(apartmentId, unitNumber) {
  try {
    const client = initSupabase();
    if (!client) { alert('Cannot load renter details.'); return; }
    // 1) Check walk-in rentals table first (for landlord-created tenants)
    const desiredUnit = (unitNumber != null && !isNaN(unitNumber)) ? Number(unitNumber) : null;
    if (desiredUnit != null) {
      const { data: sess } = await client.auth.getSession();
      const landlordId = sess?.session?.user?.id || null;
      if (landlordId) {
        const { data: walkinRows, error: walkinErr } = await client
          .from('walkin_rentals')
          .select('id, full_name, email, phone, move_in_date, additional_info')
          .eq('apartment_id', apartmentId)
          .eq('unit_number', desiredUnit)
          .eq('landlord_id', landlordId)
          .order('created_at', { ascending: false })
          .limit(1);
        if (!walkinErr && Array.isArray(walkinRows) && walkinRows.length) {
          const row = walkinRows[0];
          const details = {
            status: 'walk-in',
            approvedAt: '—',
            submittedAt: '—',
            source: 'walkin',
            unitNumber: desiredUnit != null && !isNaN(desiredUnit) ? Number(desiredUnit) : '',
            fullName: row.full_name || '',
            guardianName: '',
            emergencyContact: '',
            email: row.email || '',
            phone: row.phone || '',
            currentAddress: '',
            moveInDate: row.move_in_date || '',
            lengthOfStay: '',
            totalOccupants: '',
            employmentStatus: '',
            guardianEmploymentStatus: '',
            monthlyIncome: '',
            hasPets: '',
            hasVehicle: '',
            additionalInfo: row.additional_info || '',
            proofOfIncomeUrl: '',
            proofOfIncomeName: '',
            validIdUrl: '',
            validIdName: '',
            barangayClearanceUrl: '',
            barangayClearanceName: '',
            policeClearanceUrl: '',
            policeClearanceName: ''
          };
          showRenterDetailsModal(details);
          return;
        }
      }
    }

    // 2) Otherwise, fetch online applications for this apartment and pick the correct tenant for the selected unit (if provided).
    // Prefer approved/accepted applications by approved_at/created_at, but gracefully fall back to the latest submission.
    const { data: rows, error } = await client
      .from('rental_applications')
      .select('id, applicant_user_id, status, approved_at, created_at, unit_number, data')
      .eq('apartment_id', apartmentId)
      .order('approved_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(25);
    if (error) throw error;
    const list = Array.isArray(rows) ? rows : [];

    // No online application found
    if (!list.length) {
      alert('No renter application found for this apartment/unit.');
      return;
    }

  // Pick best matching application
    let picked = null;
    if (desiredUnit != null) {
    // Compute unit + walk-in flag + active-status flag for each row
      const withMeta = list.map(r => {
        const d = r?.data || {};
        const unitFromCol = r?.unit_number != null ? Number(r.unit_number) : null;
        const unitFromDataSnake = d?.unit_number != null ? Number(d.unit_number) : null;
        const unitFromDataCamel = d?.unitNumber != null ? Number(d.unitNumber) : null;
        const unit = unitFromCol != null && !isNaN(unitFromCol) ? unitFromCol
          : (unitFromDataSnake != null && !isNaN(unitFromDataSnake) ? unitFromDataSnake
            : (unitFromDataCamel != null && !isNaN(unitFromDataCamel) ? unitFromDataCamel : null));
        const isWalkIn = String(d?.source || '').toLowerCase() === 'walkin' ||
          String(d?.status || '').toLowerCase() === 'walk-in';
      const statusLower = String(r?.status || '').toLowerCase();
      const isActive = statusLower === 'approved' || statusLower === 'accepted' || isWalkIn;
      return { row: r, unit, isWalkIn, isActive };
      });
    const unitMatches = withMeta.filter(x => x.unit === desiredUnit && x.isActive);
    if (unitMatches.length) {
      // Prefer walk-in record for this unit if present, otherwise first by existing sort (approved_at/created_at)
      const walkInMatch = unitMatches.find(x => x.isWalkIn);
      picked = (walkInMatch || unitMatches[0]).row;
    } else {
      // No active renter for this unit – quietly do nothing
      return;
    }
    }

    // If we can't match by unit, fall back to best candidate (approved/accepted first, otherwise latest)
    if (!picked) {
      picked = list.find(r => {
        const s = String(r?.status || '').toLowerCase();
        return s === 'approved' || s === 'accepted';
      }) || list[0];
    }

    const d = picked.data || {};
    const unitFromCol = picked?.unit_number != null ? Number(picked.unit_number) : null;
    const unitFromDataSnake = d?.unit_number != null ? Number(d.unit_number) : null;
    const unitFromDataCamel = d?.unitNumber != null ? Number(d.unitNumber) : null;
    const derivedUnitNumber = unitFromCol != null && !isNaN(unitFromCol) ? unitFromCol
      : (unitFromDataSnake != null && !isNaN(unitFromDataSnake) ? unitFromDataSnake
        : (unitFromDataCamel != null && !isNaN(unitFromDataCamel) ? unitFromDataCamel : ''));
    const details = {
      // Meta
      status: picked.status || '—',
      approvedAt: picked.approved_at ? new Date(picked.approved_at).toLocaleString() : '—',
      submittedAt: picked.created_at ? new Date(picked.created_at).toLocaleString() : '—',
      source: d.source || '',
      unitNumber: derivedUnitNumber,
      // Basic Information
      fullName: d.fullName || d.name || '',
      guardianName: d.guardianName || '',
      emergencyContact: d.emergencyContact || '',
      email: d.email || '',
      phone: d.phone || '',
      currentAddress: d.currentAddress || '',
      // Rental Details
      moveInDate: d.moveInDate || '',
      lengthOfStay: d.lengthOfStay || '',
      totalOccupants: d.totalOccupants || d.adultOccupants || '',
      // Employment/Income
      employmentStatus: d.employmentStatus || '',
      guardianEmploymentStatus: d.guardianEmploymentStatus || '',
      monthlyIncome: d.monthlyIncome || '',
      // Lifestyle
      hasPets: d.hasPets || '',
      hasVehicle: d.hasVehicle || '',
      additionalInfo: d.additionalInfo || '',
      // Attachments
      proofOfIncomeUrl: d.proofOfIncomeUrl || '',
      proofOfIncomeName: d.proofOfIncomeName || '',
      validIdUrl: d.validIdUrl || '',
      validIdName: d.validIdName || '',
      barangayClearanceUrl: d.barangayClearanceUrl || '',
      barangayClearanceName: d.barangayClearanceName || '',
      policeClearanceUrl: d.policeClearanceUrl || '',
      policeClearanceName: d.policeClearanceName || ''
    };
    showRenterDetailsModal(details);
  } catch (e) {
    console.warn('showRenterDetailsByApartment error:', e?.message || e);
    alert('Failed to load renter details.');
  }
}

function showRenterDetailsModal(details) {
  const safeText = (v) => (v == null || v === '') ? '—' : String(v);
  const byId = (id) => document.getElementById(id);
  const isWalkIn = String(details?.source || '').toLowerCase() === 'walkin' || String(details?.status || '').toLowerCase() === 'walk-in';

  const renterRoot = document.querySelector('.detailcard.renter-details');
  const allH4 = renterRoot ? Array.from(renterRoot.querySelectorAll('h4')) : [];
  const employmentHeader = allH4.find(h => /employment/i.test(h.textContent || ''));
  const attachmentsHeader = allH4.find(h => /attachments/i.test(h.textContent || ''));

  // Meta
  const metaRow = document.querySelector('.renter-details .rd-grid'); // first grid is meta block
  const rdStatus = byId('rdStatus');
  const rdApprovedAt = byId('rdApprovedAt');
  const rdSubmittedAt = byId('rdSubmittedAt');
  const walkInLabel = document.getElementById('rdWalkInLabel');

  if (isWalkIn) {
    if (metaRow) metaRow.style.display = 'none';
    if (walkInLabel) walkInLabel.style.display = '';
  } else {
    if (metaRow) metaRow.style.display = '';
    if (walkInLabel) walkInLabel.style.display = 'none';
    if (rdStatus) rdStatus.textContent = safeText(details.status);
    if (rdApprovedAt) rdApprovedAt.textContent = safeText(details.approvedAt);
    if (rdSubmittedAt) rdSubmittedAt.textContent = safeText(details.submittedAt);
  }

  // Helper: set value and hide row if empty
  const setField = (spanId, rawValue, { hideRowWhenEmpty = true } = {}) => {
    const span = byId(spanId);
    if (!span) return;
    const row = span.closest('div');
    const hasValue = rawValue != null && String(rawValue).trim() !== '';
    span.textContent = hasValue ? String(rawValue) : '—';
    if (row && hideRowWhenEmpty) {
      row.style.display = hasValue ? '' : 'none';
    }
  };

  // Basic
  setField('rdFullName', details.fullName, { hideRowWhenEmpty: false }); // always show name row
  setField('rdGuardianName', details.guardianName);
  setField('rdEmergencyContact', details.emergencyContact);
  setField('rdEmail', details.email);
  setField('rdPhone', details.phone);
  setField('rdCurrentAddress', details.currentAddress);
  // Rental
  setField('rdMoveInDate', details.moveInDate);
  setField('rdLengthOfStay', details.lengthOfStay);
  setField('rdTotalOccupants', details.totalOccupants);
  setField('rdHasPets', details.hasPets);
  setField('rdHasVehicle', details.hasVehicle);

  // Toggle receipts / transaction history visibility based on walk-in vs online
  const pendingReceiptsBox = document.getElementById('rentedPendingReceiptsBox');
  const transactionHistoryBox = document.getElementById('rentedTransactionHistoryBox');
  if (isWalkIn) {
    if (pendingReceiptsBox) pendingReceiptsBox.style.display = 'none';
    if (transactionHistoryBox) transactionHistoryBox.style.display = 'none';
  } else {
    if (pendingReceiptsBox) pendingReceiptsBox.style.display = '';
    if (transactionHistoryBox) transactionHistoryBox.style.display = '';
  }

  // For walk-in, always hide these non-applicable fields (even if present).
  // For online rentals, do not force-show rows: `setField()` decides visibility
  // based on whether the client actually filled them.
  const forceHideRow = (spanId) => {
    const span = byId(spanId);
    const row = span ? span.closest('div') : null;
    if (row) row.style.display = 'none';
  };
  if (isWalkIn) {
    forceHideRow('rdGuardianName');
    forceHideRow('rdEmergencyContact');
    forceHideRow('rdCurrentAddress');
    forceHideRow('rdLengthOfStay');
    forceHideRow('rdTotalOccupants');
    forceHideRow('rdHasPets');
    forceHideRow('rdHasVehicle');
  }
  // Employment
  const employmentGrid = employmentHeader ? employmentHeader.nextElementSibling : null;
  const rdEmploymentStatus = byId('rdEmploymentStatus');
  const rdGuardianEmploymentStatus = byId('rdGuardianEmploymentStatus');
  const rdMonthlyIncome = byId('rdMonthlyIncome');

  if (isWalkIn) {
    if (employmentHeader) employmentHeader.style.display = 'none';
    if (employmentGrid) employmentGrid.style.display = 'none';
  } else {
    if (employmentHeader) employmentHeader.style.display = '';
    if (employmentGrid) employmentGrid.style.display = '';
    setField('rdEmploymentStatus', details.employmentStatus);
    setField('rdGuardianEmploymentStatus', details.guardianEmploymentStatus);
    setField('rdMonthlyIncome', details.monthlyIncome);
    // If all employment rows are hidden (nothing filled), hide the whole section.
    try {
      if (employmentGrid) {
        const visible = Array.from(employmentGrid.querySelectorAll('div')).some(d => d.style.display !== 'none');
        if (!visible) {
          if (employmentHeader) employmentHeader.style.display = 'none';
          employmentGrid.style.display = 'none';
        }
      }
    } catch (_) {}
  }

  // Notes
  setField('rdAdditionalInfo', details.additionalInfo);
  // Attachments
  const attHost = byId('rdAttachments');
  if (attHost) {
    attHost.innerHTML = '';
    if (isWalkIn) {
      if (attachmentsHeader) attachmentsHeader.style.display = 'none';
      attHost.style.display = 'none';
      return;
    } else {
      if (attachmentsHeader) attachmentsHeader.style.display = '';
      attHost.style.display = '';
    }
    const addItem = (label, url, name) => {
      if (!url) return;
      const isPdf = typeof url === 'string' && (url.includes('.pdf') || url.startsWith('data:application/pdf'));
      const item = document.createElement('div');
      item.className = 'attach-box';
      if (isPdf) {
        item.innerHTML = `<div style="display:flex;align-items:center;gap:8px;"><b>${label}:</b> <a class="openattachbtn1" href="${url}" target="_blank" rel="noopener">${name || 'View PDF'}</a></div>`;
      } else {
        item.innerHTML = `
          <div style="display:flex;flex-direction:column;gap:6px;">
            <b style="display:flex;justify-content:center;">${label}:</b>
            <a class="openattachbtn1" href="${url}" target="_blank" rel="noopener" style="max-width:100%;">
              <img src="${url}" alt="${label}" style="max-width:100%;height:auto;border:1px solid #eee;border-radius:8px;" />
            </a>
          </div>`;
      }
      // Wire modal open on click
      try {
        const link = item.querySelector('.openattachbtn1');
        if (link && !link.__wired) {
          link.__wired = true;
          link.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            openAttachmentModal(url, name || label);
          });
        }
      } catch(_) { }

      // sa taas neto
      attHost.appendChild(item);
    };
    addItem('Proof of Income', details.proofOfIncomeUrl, details.proofOfIncomeName);
    addItem('Valid ID', details.validIdUrl, details.validIdName);
    addItem('Barangay Clearance', details.barangayClearanceUrl, details.barangayClearanceName);
    addItem('Police Clearance', details.policeClearanceUrl, details.policeClearanceName);
  }
}

// Simple modal to preview/download attachments
function openAttachmentModal(url, name) {
  try {
    const isPdf = typeof url === 'string' && (url.includes('.pdf') || url.startsWith('data:application/pdf'));
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(0,0,0,0.6)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '9999';

    const modal = document.createElement('div');
    modal.style.background = 'var(--bg-primary)';
    modal.style.borderRadius = '12px';
    modal.style.maxWidth = '90vw';
    modal.style.maxHeight = '90vh';
    modal.style.width = 'min(800px, 95vw)';
    modal.style.display = 'flex';
    modal.style.flexDirection = 'column';
    modal.style.overflow = 'hidden';
    modal.style.boxShadow = 'var(--shadow-xl)';

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.justifyContent = 'space-between';
    header.style.padding = '10px 14px';
    header.style.borderBottom = '1px solid var(--border-color)';
    header.style.background = 'var(--bg-primary)';
    header.innerHTML = `<div style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--text-primary);">${(name || 'Attachment')}</div>`;

    const headerBtns = document.createElement('div');
    headerBtns.className = 'attach-modal-actions';
    headerBtns.style.display = 'flex';
    headerBtns.style.gap = '8px';

    const download = document.createElement('a');
    download.href = url;
    // Ensure browser prompts to download with a reasonable filename
    (function(){
      try {
        const isPdfFile = isPdf;
        let base = (name || 'attachment').trim();
        if (!/\.[a-z0-9]{2,4}$/i.test(base)) {
          base = base + (isPdfFile ? '.pdf' : '.jpg');
        }
        download.setAttribute('download', base);
        // Intercept click to force download even for cross-origin/public URLs
        download.addEventListener('click', async function(ev){
          try {
            ev.preventDefault(); ev.stopPropagation();
            // Handle data URLs directly
            if (typeof url === 'string' && url.startsWith('data:')) {
              const a = document.createElement('a');
              a.href = url; a.download = base; a.style.display = 'none';
              document.body.appendChild(a); a.click(); document.body.removeChild(a);
              return;
            }
            const response = await fetch(url, { credentials: 'omit', mode: 'cors' });
            if (!response.ok) throw new Error('Network response was not ok');
            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = objectUrl; a.download = base; a.style.display = 'none';
            document.body.appendChild(a); a.click();
            setTimeout(() => { try { URL.revokeObjectURL(objectUrl); document.body.removeChild(a); } catch(_){} }, 0);
          } catch (_) {
            // Fallback: let the browser try using the anchor's native download
            try { download.click(); } catch(__) {}
          }
        }, { passive: false });
      } catch(_) { download.setAttribute('download', name || 'attachment'); }
    })();
    download.textContent = 'Download';
    download.className = 'attach-dl-btn';

    const close = document.createElement('button');
    close.type = 'button';
    close.textContent = 'Close';
    close.className = 'attach-close-btn';
    

    headerBtns.appendChild(download);
    headerBtns.appendChild(close);
    header.appendChild(headerBtns);

    const body = document.createElement('div');
    body.style.flex = '1';
    body.style.display = 'flex';
    body.style.alignItems = 'center';
    body.style.justifyContent = 'center';
    body.style.background = 'var(--bg-secondary)';

    if (isPdf) {
      const frame = document.createElement('iframe');
      frame.src = url;
      frame.style.width = '100%';
      frame.style.height = '100%';
      frame.style.border = 'none';
      body.appendChild(frame);
    } else {
      const img = document.createElement('img');
      img.src = url;
      img.alt = name || 'Attachment';
      img.style.maxWidth = '100%';
      img.style.maxHeight = '100%';
      img.style.objectFit = 'contain';
      body.appendChild(img);
    }

    modal.appendChild(header);
    modal.appendChild(body);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    function closeModal() {
      try { document.body.removeChild(overlay); } catch(_) {}
    }
    close.addEventListener('click', closeModal);
    overlay.addEventListener('click', function(e){ if (e.target === overlay) closeModal(); });
    window.addEventListener('keydown', function esc(e){ if (e.key === 'Escape') { closeModal(); window.removeEventListener('keydown', esc); } });
  } catch(_) { }
}

async function showApartmentReviewsModeration(apartmentId) {
  try {
    const client = initSupabase();
    if (!client) return;
    const host = document.getElementById('landlordReviewsModeration');
    if (!host) return;
    host.innerHTML = '<div style="color:#666">Loading reviews…</div>';

    const { data: rows, error } = await client
      .from('reviews')
      .select('id, rating, comment, created_at, visible')
      .eq('apartment_id', apartmentId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    const list = Array.isArray(rows) ? rows : [];
    if (!list.length) { host.innerHTML = '<div style="color:#666">No reviews yet.</div>'; return; }

    host.innerHTML = '';
    list.forEach(r => {
      const row = document.createElement('div');
      row.style.border = '1px solid #eee';
      row.style.borderRadius = '8px';
      row.style.padding = '10px';
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.justifyContent = 'space-between';
      const dt = r.created_at ? new Date(r.created_at).toLocaleString() : '';
      row.innerHTML = `
        <div>
          <div style="font-weight:600">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)} <span style="color:#888;font-weight:400">${dt}</span></div>
          <div style="white-space:pre-wrap;">${(r.comment || '').replace(/</g, '&lt;')}</div>
          <div style="margin-top:6px;font-size:.85rem;color:${r.visible ? '#1e7e34' : '#b02a37'};">${r.visible ? 'Visible' : 'Hidden'}</div>
        </div>
        <div>
          <button data-id="${r.id}" data-vis="${r.visible ? '1' : '0'}" style="padding:6px 10px;border:1px solid #ddd;border-radius:6px;background:#f8f9fa;cursor:pointer;">${r.visible ? 'Hide' : 'Unhide'}</button>
        </div>
      `;
      host.appendChild(row);
    });

    host.addEventListener('click', async function onClick(ev) {
      const btn = ev.target.closest('button[data-id]');
      if (!btn) return;
      const id = btn.getAttribute('data-id');
      const vis = btn.getAttribute('data-vis') === '1';
      try {
        const { error: updErr } = await client
          .from('reviews')
          .update({ visible: !vis })
          .eq('id', id);
        if (updErr) throw updErr;
        // reload
        showApartmentReviewsModeration(apartmentId);
      } catch (_) {
        alert('Failed to update review visibility.');
      }
    }, { once: true });
  } catch (_) { }
}

// Render current ratings/counter and recent reviews in the Dashboard .review-card for selected listing
async function renderLandlordReviewSummary(apartmentId) {
  try {
    const client = initSupabase();
    if (!client) return;
    const host = document.querySelector('#Dashboard .review-card .curratings');
    if (!host) return;
    const scoreEl = host.querySelector('.rightings .score');
    const countEl = host.querySelector('.sort-section span:last-child');
    const starsWrap = host.querySelector('.stars');
    const box = host.parentElement?.querySelector('.review-box');
    if (box) box.innerHTML = '';

    const { data: rows } = await client
      .from('reviews')
      .select('id, rating, comment, created_at, visible')
      .eq('apartment_id', apartmentId)
      .limit(10);
    let list = Array.isArray(rows) ? rows : [];
    // Default: keep most recent
    const visible = list.filter(r => r.visible);
    const avg = visible.length ? (visible.reduce((s, r) => s + (parseInt(r.rating, 10) || 0), 0) / visible.length) : 0;
    if (scoreEl) scoreEl.textContent = avg ? avg.toFixed(1) : '0.0';
    if (countEl) countEl.textContent = `${visible.length} Review${visible.length === 1 ? '' : 's'}`;
    if (starsWrap) {
      const starsEls = starsWrap.querySelectorAll('.star, .fa-star');
      const filled = Math.round(avg);
      starsEls.forEach((el, i) => { if (i < filled) el.classList.add('selected'); else el.classList.remove('selected'); });
      starsWrap.setAttribute('aria-label', `${avg.toFixed(1)} out of 5 based on ${visible.length} review${visible.length === 1 ? '' : 's'}`);
    }
    if (box) {
      if (!list.length) {
        box.innerHTML = '<div class="review-text" style="color:#666">No reviews yet.</div>';
      } else {
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
            console.warn('Could not fetch reviewer names for landlord view:', e);
          }
        }

        // No landlord dropdown wiring (reverted)
        list.slice(0, 10).forEach(r => {
          const dt = r.created_at ? new Date(r.created_at).toLocaleDateString() : '';
          const reviewerName = reviewerNamesMap.get(r.user_id) || 'Verified Renter';
          const item = document.createElement('div');
          item.className = 'review-item';
          item.innerHTML = `
            <div class="review-header">
              <span>${reviewerName} <br> ${dt}</span>
              <div class="review-stars">${Array.from({ length: 5 }).map((_, i) => i < (parseInt(r.rating, 10) || 0) ? '<span class="star-filled">★</span>' : '<span class="star-empty">★</span>').join('')}</div>
              <button class="toggle-review-vis" data-id="${r.id}" data-vis="${r.visible ? '1' : '0'}" style="margin-left:auto;border:1px solid #ddd;background:#fafafa;border-radius:6px;padding:4px 8px;cursor:pointer;">${r.visible ? 'Hide' : 'Unhide'}</button>
            </div>
            <div class="review-text">${(r.comment || '').replace(/</g, '&lt;')}</div>
          `;
          box.appendChild(item);
        });
        box.addEventListener('click', async function onClick(ev) {
          const btn = ev.target.closest('.toggle-review-vis');
          if (!btn) return;
          const id = btn.getAttribute('data-id');
          const vis = btn.getAttribute('data-vis') === '1';
          try {
            const { error } = await client.from('reviews').update({ visible: !vis }).eq('id', id);
            if (error) throw error;
            await renderLandlordReviewSummary(apartmentId);
          } catch (_) { alert('Failed to update review.'); }
        }, { once: true });
      }
    }
  } catch (_) { }
}

// ----- Pending receipts & transaction history (payment_receipts) -----
let _receiptReviewId = null;

async function fetchPendingReceiptsForLandlord(apartmentId) {
  const client = initSupabase();
  if (!client) return [];
  const { data: sess } = await client.auth.getSession();
  const landlordId = sess?.session?.user?.id;
  if (!landlordId) return [];
  let query = client
    .from('payment_receipts')
    .select('id, client_id, landlord_id, apartment_id, unit_number, amount, receipt_url, status, created_at, payment_type, advance_months, ocr_amount, ocr_date, ocr_reference')
    .eq('landlord_id', landlordId)
    .eq('status', 'submitted');
  if (apartmentId) {
    query = query.eq('apartment_id', apartmentId);
  }
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) { console.warn('Pending receipts fetch error:', error); return []; }
  return Array.isArray(data) ? data : [];
}

async function fetchTransactionHistoryForLandlord(apartmentId) {
  const client = initSupabase();
  if (!client) return [];
  const { data: sess } = await client.auth.getSession();
  const landlordId = sess?.session?.user?.id;
  if (!landlordId) return [];
  let query = client
    .from('payment_receipts')
    .select('id, client_id, landlord_id, apartment_id, unit_number, amount, receipt_url, status, created_at, payment_type, advance_months, ocr_amount, ocr_date, ocr_reference')
    .eq('landlord_id', landlordId)
    .eq('status', 'paid');
  if (apartmentId) {
    query = query.eq('apartment_id', apartmentId);
  }
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) { console.warn('Transaction history fetch error:', error); return []; }
  return Array.isArray(data) ? data : [];
}

function formatPaymentLabel(paymentType, advanceMonths) {
  if (!paymentType) return '—';
  let label = (paymentType === 'full' && 'Full payment') || (paymentType === 'partial' && 'Partial payment') || (paymentType === 'advance' && 'Advance payment') || paymentType;
  if (paymentType === 'advance' && advanceMonths != null && !isNaN(advanceMonths)) {
    label = 'Advance payment (' + advanceMonths + ' month' + (advanceMonths !== 1 ? 's' : '') + ')';
  }
  return label;
}

function formatReceiptRef(id) {
  if (!id) return '—';
  return 'REF-' + String(id).replace(/-/g, '').slice(0, 8).toUpperCase();
}

function renderPendingReceiptsLists(pending, targetId, apartmentId, unitNumber) {
  let list = Array.isArray(pending) ? pending : [];
  if (apartmentId) {
    list = list.filter(r => String(r.apartment_id) === String(apartmentId));
  }
  if (unitNumber != null && !isNaN(unitNumber)) {
    const uNum = Number(unitNumber);
    list = list.filter(r => {
      const u = r && r.unit_number != null ? Number(r.unit_number) : NaN;
      return !Number.isNaN(u) && u === uNum;
    });
  }
  const esc = s => (s == null ? '' : String(s)).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const html = list.length === 0
    ? '<div class="pending-receipts-empty">No pending receipts.</div>'
    : list.map(r => {
        const amountVal = r.ocr_amount != null ? r.ocr_amount : r.amount;
        const amountStr = amountVal != null ? '₱' + Number(amountVal).toLocaleString('en-PH', { minimumFractionDigits: 2 }) : '—';
        const dateStr = r.ocr_date ? r.ocr_date : (r.created_at ? new Date(r.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—');
        const refStr = r.ocr_reference ? r.ocr_reference : formatReceiptRef(r.id);
        const paymentStr = formatPaymentLabel(r.payment_type, r.advance_months);
        return `
          <div class="pending-receipt-item" data-receipt-id="${r.id}">
            <div class="pending-receipt-info">
              <span class="pending-receipt-ref">${esc(refStr)}</span>
              <span class="pending-receipt-date">${esc(dateStr)}</span>
              <span class="pending-receipt-amount">${amountStr}</span>
              <span class="pending-receipt-status">${(r.status || 'submitted')}</span>
              <span class="pending-receipt-payment">${paymentStr}</span>
            </div>
            <div class="pending-receipt-actions">
              <button type="button" class="pending-receipt-review-btn" onclick="openReceiptReviewModal('${r.id}')">
                <i class="fa-solid fa-eye"></i> Review
              </button>
              <button type="button" class="pending-receipt-reject-btn" onclick="rejectReceipt('${r.id}')">
                <i class="fa-solid fa-times"></i> Reject
              </button>
            </div>
          </div>`;
      }).join('');
  const listEl = document.getElementById(targetId);
  if (listEl) listEl.innerHTML = html;
}

function renderTransactionHistoryLists(history, targetId, apartmentId, unitNumber) {
  let list = Array.isArray(history) ? history : [];
  if (apartmentId) {
    list = list.filter(r => String(r.apartment_id) === String(apartmentId));
  }
  if (unitNumber != null && !isNaN(unitNumber)) {
    const uNum = Number(unitNumber);
    list = list.filter(r => {
      const u = r && r.unit_number != null ? Number(r.unit_number) : NaN;
      return !Number.isNaN(u) && u === uNum;
    });
  }
  const headerRow = `
    <div class="transaction-item transaction-header">
      <span class="tx-amount">Amount</span>
      <span class="tx-date">Date</span>
      <span class="tx-ref">Reference No.</span>
      <span class="tx-payment">Payment</span>
      <span class="tx-view"></span>
    </div>`;
  const emptyRow = '<div class="transaction-empty">No transactions yet.</div>';
  const esc = s => (s == null ? '' : String(s)).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const itemRows = list.length === 0
    ? emptyRow
    : list.map(r => {
        const amountVal = r.ocr_amount != null ? r.ocr_amount : r.amount;
        const amountStr = amountVal != null ? '₱' + Number(amountVal).toLocaleString('en-PH', { minimumFractionDigits: 2 }) : '—';
        const dateStr = r.ocr_date ? r.ocr_date : (r.created_at ? new Date(r.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—');
        const refStr = r.ocr_reference ? r.ocr_reference : formatReceiptRef(r.id);
        const paymentStr = formatPaymentLabel(r.payment_type, r.advance_months);
        const viewBtn = `<button type="button" class="tx-view-btn" title="View receipt" onclick="openReceiptReviewModal('${r.id}')" style="background:transparent;border:none;cursor:pointer;color:var(--primary-color,#007bff);padding:0 6px;display:inline-flex;align-items:center;justify-content:center;">
            <i class="fa-solid fa-eye"></i>
          </button>`;
        return `<div class="transaction-item"><span class="tx-amount">${amountStr}</span><span class="tx-date">${esc(dateStr)}</span><span class="tx-ref">${esc(refStr)}</span><span class="tx-payment">${paymentStr}</span><span class="tx-view">${viewBtn}</span></div>`;
      }).join('');
  const html = headerRow + itemRows;
  const dashList = document.getElementById('dashboardTransactionHistoryList');
  const rentedList = document.getElementById('rentedTransactionHistoryList');
  if (dashList) dashList.innerHTML = html;
  if (rentedList) rentedList.innerHTML = html;
}

async function refreshLandlordReceiptLists() {
  const dashAptId = window.currentEditingAdId || null;
  const rentedAptId = window.__selectedRentedApartmentId || null;
  const rentedUnitNumber = window.__selectedRentedUnitNumber != null && !isNaN(window.__selectedRentedUnitNumber)
    ? Number(window.__selectedRentedUnitNumber)
    : null;

  // Dashboard receipts box removed; only Rented context shows pending receipts / history

  // Rented context (selected rented apartment)
  if (rentedAptId) {
    const [pendingRented, historyRented] = await Promise.all([
      fetchPendingReceiptsForLandlord(rentedAptId),
      fetchTransactionHistoryForLandlord(rentedAptId)
    ]);
    renderPendingReceiptsLists(pendingRented, 'rentedPendingReceiptsList', rentedAptId, rentedUnitNumber);
    renderTransactionHistoryLists(historyRented, 'rentedTransactionHistoryList', rentedAptId, rentedUnitNumber);
  } else {
    const rentedPending = document.getElementById('rentedPendingReceiptsList');
    const rentedHistory = document.getElementById('rentedTransactionHistoryList');
    if (rentedPending) rentedPending.innerHTML = '<div class="pending-receipts-empty">No pending receipts.</div>';
    if (rentedHistory) rentedHistory.innerHTML = '<div class="transaction-empty">No transactions yet.</div>';
  }
}

function closeReceiptReviewModal() {
  const modal = document.getElementById('receiptReviewModal');
  if (modal) modal.style.display = 'none';
  _receiptReviewId = null;
}

async function openReceiptReviewModal(receiptId) {
  const client = initSupabase();
  if (!client || !receiptId) return;
  const { data: sess } = await client.auth.getSession();
  const landlordId = sess?.session?.user?.id;
  if (!landlordId) return;
  const { data: row, error } = await client
    .from('payment_receipts')
    .select('id, client_id, landlord_id, apartment_id, amount, receipt_url, status, created_at, payment_type, advance_months, ocr_amount, ocr_date, ocr_reference')
    .eq('id', receiptId)
    .eq('landlord_id', landlordId)
    .maybeSingle();
  if (error || !row) {
    alert('Receipt not found.');
    return;
  }
  _receiptReviewId = row.id;
  const amountVal = row.ocr_amount != null ? row.ocr_amount : row.amount;
  const amountText = amountVal != null
    ? '₱' + Number(amountVal).toLocaleString('en-PH', { minimumFractionDigits: 2 })
    : '₱0.00';
  const dateText = row.ocr_date
    ? row.ocr_date
    : (row.created_at
        ? new Date(row.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
        : '—');
  const refText = row.ocr_reference || formatReceiptRef(row.id);
  const paymentLabel = formatPaymentLabel(row.payment_type, row.advance_months);

  document.getElementById('receiptReviewRef').textContent = refText;
  document.getElementById('receiptReviewDate').textContent = dateText;
  document.getElementById('receiptReviewAmount').textContent = amountText;
  document.getElementById('receiptReviewStatus').textContent =
    (paymentLabel !== '—' ? paymentLabel + ' • ' : '') + (row.status || 'submitted');
  const imgEl = document.getElementById('receiptReviewImage');
  const fallbackEl = document.getElementById('receiptReviewImageFallback');
  if (row.receipt_url) {
    imgEl.src = row.receipt_url;
    imgEl.style.display = '';
    if (fallbackEl) fallbackEl.style.display = 'none';
  } else {
    imgEl.src = '';
    imgEl.style.display = 'none';
    if (fallbackEl) fallbackEl.style.display = 'block';
  }
  // Toggle Download button visibility
  try {
    const dlBtn = document.getElementById('receiptReviewDownloadBtn');
    if (dlBtn) dlBtn.style.display = row.receipt_url ? 'inline-flex' : 'none';
  } catch (_) {}
  const paidBtn = document.getElementById('receiptReviewPaidBtn');
  if (paidBtn) paidBtn.style.display = (row.status === 'paid') ? 'none' : 'inline-flex';
  const modal = document.getElementById('receiptReviewModal');
  if (modal) modal.style.display = 'flex';
}

function downloadReceiptFromModal() {
  try {
    const imgEl = document.getElementById('receiptReviewImage');
    const url = imgEl?.getAttribute('src') || '';
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = 'receipt';
    a.rel = 'noopener';
    a.target = '_blank';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (_) { }
}

async function markReceiptPaidFromModal() {
  const id = _receiptReviewId;
  if (!id) return;
  const client = initSupabase();
  if (!client) return;
  const { data: sess } = await client.auth.getSession();
  const landlordId = sess?.session?.user?.id;
  if (!landlordId) return;
  const { error } = await client
    .from('payment_receipts')
    .update({ status: 'paid' })
    .eq('id', id)
    .eq('landlord_id', landlordId);
  if (error) {
    console.warn('Mark paid error:', error);
    alert('Could not mark as paid. You may need an UPDATE policy on payment_receipts for landlords.');
    return;
  }
  closeReceiptReviewModal();
  await refreshLandlordReceiptLists();
}

async function rejectReceipt(receiptId) {
  if (!receiptId || !confirm('Reject this payment receipt? The client may need to submit a new one.')) return;
  const client = initSupabase();
  if (!client) return;
  const { data: sess } = await client.auth.getSession();
  const landlordId = sess?.session?.user?.id;
  if (!landlordId) return;
  const { error } = await client
    .from('payment_receipts')
    .update({ status: 'rejected' })
    .eq('id', receiptId)
    .eq('landlord_id', landlordId);
  if (error) {
    console.warn('Reject receipt error:', error);
    alert('Could not reject receipt. Please try again.');
    return;
  }
  await refreshLandlordReceiptLists();
}

// Provide a unified reviews renderer on landlord page if not already available
try {
  if (!window.renderApartmentReviews) {
    window.renderApartmentReviews = async function (apartmentId, contextEl) {
      try {
        const client = initSupabase();
        if (!client || !apartmentId) return;
        const { data: sess } = await client.auth.getSession();
        const currentUserId = sess?.session?.user?.id || null;
        const { data: rows } = await client
          .from('reviews')
          .select('id, user_id, rating, comment, created_at, visible')
          .eq('apartment_id', apartmentId)
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

        const host = contextEl || document;
        const reviewHost = host.querySelector('.innerreview-card .curratings, .review-card .curratings');
        if (!reviewHost) return;

        // Split into sets: landlord sees all reviews; metrics use visible only.
        const listAll = Array.isArray(rows) ? rows : [];
        const visibleList = listAll.filter(r => r.visible !== false);
        const avg = visibleList.length ? (visibleList.reduce((s, r) => s + (parseInt(r.rating, 10) || 0), 0) / visibleList.length) : 0;
        const scoreEl = reviewHost.querySelector('.rightings .score');
        if (scoreEl) scoreEl.textContent = avg ? avg.toFixed(1) : '0.0';
        const countEl = reviewHost.querySelector('.sort-section span:last-child');
        if (countEl) countEl.textContent = `${visibleList.length} Review${visibleList.length === 1 ? '' : 's'}`;

        const starWrap = reviewHost.querySelector('.stars');
        if (starWrap) {
          const starsEls = starWrap.querySelectorAll('.star, .fa-star, .wrstar');
          const filled = Math.round(avg);
          starsEls.forEach((el, i) => { if (i < filled) el.classList.add('selected'); else el.classList.remove('selected'); });
          starWrap.setAttribute('aria-label', `${avg.toFixed(1)} out of 5 based on ${visibleList.length} review${visibleList.length === 1 ? '' : 's'}`);
        }

        // Remove any previously injected sort UI
        try {
          const sortSection = reviewHost.querySelector('.sort-section');
          if (sortSection) {
            const old = sortSection.querySelector('.lr-sort');
            if (old && old.parentNode) old.parentNode.removeChild(old);
          }
        } catch(_) {}

        const reviewBoxContainer = (reviewHost.parentElement ? reviewHost.parentElement.querySelector('.review-box') : null) || (host ? host.querySelector('.review-box') : null);
        if (reviewBoxContainer) {
          if (!listAll.length) {
            reviewBoxContainer.innerHTML = '<div class="review-text" style="color:#666">No reviews yet.</div>';
          } else {
            // Fetch reviewer names from profiles
            const reviewerIds = [...new Set(listAll.map(r => r.user_id).filter(Boolean))];
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
                console.warn('Could not fetch reviewer names for landlord unified view:', e);
              }
            }

            // Helper function to render reviews with a specific sort
            function renderReviewsWithSort(sortMode = 'recent') {
              reviewBoxContainer.innerHTML = '';
              let sortedList = [...listAll];
              
              if (sortMode === 'recent') {
                sortedList.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
              } else if (sortMode === 'highest') {
                sortedList.sort((a, b) => (parseInt(b.rating, 10) || 0) - (parseInt(a.rating, 10) || 0));
              } else if (sortMode === 'lowest') {
                sortedList.sort((a, b) => (parseInt(a.rating, 10) || 0) - (parseInt(b.rating, 10) || 0));
              } else if (sortMode === 'oldest') {
                sortedList.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
              }
              
              sortedList.slice(0, 10).forEach(r => {
                const dt = r.created_at ? new Date(r.created_at).toLocaleDateString() : '';
                const reviewerName = reviewerNamesMap.get(r.user_id) || 'Verified Renter';
                const item = document.createElement('div');
                item.className = 'review-item';
                item.innerHTML = `
                  <div class="review-header">
                    <span>${reviewerName} <br> ${dt}</span>
                    <div class="review-stars">${Array.from({ length: 5 }).map((_, i) => i < (parseInt(r.rating, 10) || 0) ? '<span class="star-filled">★</span>' : '<span class="star-empty">★</span>').join('')}</div>
                    <span class="lr-state" style="margin-left:8px;color:${r.visible !== false ? '#1e7e34' : '#b02a37'};font-size:.85rem;">${r.visible !== false ? 'Visible' : 'Hidden'}</span>
                    <button class="toggle-review-vis" data-id="${r.id}" data-vis="${r.visible ? '1' : '0'}" style="margin-left:auto;border:1px solid #ddd;background:#fafafa;border-radius:6px;padding:4px 8px;cursor:pointer;">${r.visible !== false ? 'Hide' : 'Unhide'}</button>
                  </div>
                  <div class="review-text">${(r.comment || '').replace(/</g,'&lt;')}</div>
                `;
                reviewBoxContainer.appendChild(item);
              });
            }
            
            // Store the renderReviewsWithSort function for event listener
            reviewBoxContainer.__renderReviewsWithSort = renderReviewsWithSort;
            reviewBoxContainer.__apartmentId = apartmentId;
            reviewBoxContainer.__allReviews = listAll;
            reviewBoxContainer.__reviewerNamesMap = reviewerNamesMap;
            reviewBoxContainer.__client = client;

            // Initial render with "recent" sort
            renderReviewsWithSort('recent');
            
            // Event delegation for per-review hide/unhide
            if (!reviewBoxContainer.__lrItemToggleWired) {
              reviewBoxContainer.__lrItemToggleWired = true;
              reviewBoxContainer.addEventListener('click', async function (ev) {
                const btn = ev.target && ev.target.closest('.toggle-review-vis');
                if (!btn) return;
                ev.preventDefault();
                const id = btn.getAttribute('data-id');
                const vis = btn.getAttribute('data-vis') === '1';
                try {
                  const { error } = await client.from('reviews').update({ visible: !vis }).eq('id', id);
                  if (error) throw error;
                  await window.renderApartmentReviews(apartmentId, host);
                } catch (_) { alert('Failed to update review visibility.'); }
              });
            }
          }
        }
        
        // Listen for sort changes and trigger re-render
        const sortChangeHandler = (ev) => {
          const sortMode = ev.detail?.sort || 'recent';
          if (reviewBoxContainer && reviewBoxContainer.__renderReviewsWithSort) {
            reviewBoxContainer.__renderReviewsWithSort(sortMode);
          }
        };
        
        // Remove old listener if exists
        if (reviewBoxContainer && reviewBoxContainer.__sortChangeHandler) {
          document.removeEventListener('reviews-sort-change', reviewBoxContainer.__sortChangeHandler);
        }
        
        // Add new listener
        if (reviewBoxContainer) {
          reviewBoxContainer.__sortChangeHandler = sortChangeHandler;
          document.addEventListener('reviews-sort-change', sortChangeHandler);
        }
      } catch (_) {}
    };

    // Removed ensureReviewSortInContext after revert
  }
} catch (_) {}

// ---------- Application Details Modal ----------
function showApplicationDetails(app) {
  if (!app) return;
  let modal = document.getElementById('applicationDetailsModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'applicationDetailsModal';
    modal.style.position = 'fixed';
    modal.style.inset = '0';
    modal.style.background = 'rgba(0,0,0,0.5)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '99';
    modal.innerHTML = `
      <div style="background: var(--bg-primary); width:min(920px, 96vw); max-height:90vh; overflow:auto; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,0.25);">
        <div style="display:flex; align-items:center; justify-content:space-between; padding:16px 20px; border-bottom:1px solid var(--border-color); position:sticky; top:0; background: var(--bg-primary); z-index:1;">
          <h3 style="margin:0; font-size:1.1rem; color: var(--text-primary);">Rental Application Details</h3>
          <button id="closeAppDetBtn" class="closeAppDetBtn" style="background: var(--primary-color); color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.2s ease;">Close</button>
        </div>
        <div id="appDetBody" style="padding:16px 20px; display:grid; grid-template-columns: 1fr; gap:16px; background: var(--bg-primary);"></div>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', function (ev) { if (ev.target === modal) modal.style.display = 'none'; });
    modal.querySelector('#closeAppDetBtn').addEventListener('click', function () { modal.style.display = 'none'; });
  }
  const body = modal.querySelector('#appDetBody');
  if (!body) return;

  const d = app?.data || {};
  const safe = (v) => (v == null || v === '') ? '<span style="color:#999">—</span>' : String(v);
  const unitNum = app?.unit_number != null ? Number(app.unit_number)
    : (d?.unit_number != null ? Number(d.unit_number) : (d?.unitNumber != null ? Number(d.unitNumber) : null));
  const unitLabel = (unitNum != null && !isNaN(unitNum)) ? `Unit ${unitNum}` : 'Unit —';

  body.innerHTML = `
    <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:12px;">
      <div class="whobox">
        <div style="font-weight:600; margin-bottom:8px; color: var(--text-primary);">Applicant</div>
        <div style="color: var(--text-secondary);"><b>Name:</b> ${safe(d.fullName)}</div>
        <div style="color: var(--text-secondary);"><b>Email:</b> ${safe(d.email)}</div>
        <div style="color: var(--text-secondary);"><b>Phone:</b> ${safe(d.phone)}</div>
        <div style="color: var(--text-secondary);"><b>Emergency Contact:</b> ${safe(d.emergencyContact)}</div>
        <div style="color: var(--text-secondary);"><b>Guardian:</b> ${safe(d.guardianName)}</div>
      </div>
      <div class="whobox">
        <div style="font-weight:600; margin-bottom:8px; color: var(--text-primary);">Rental Details</div>
        <div style="color: var(--text-secondary);"><b>Move-in Date:</b> ${safe(d.moveInDate)}</div>
        <div style="color: var(--text-secondary);"><b>Length of Stay:</b> ${safe(d.lengthOfStay)}</div>
        <div style="color: var(--text-secondary);"><b>Total Occupants:</b> ${safe(d.totalOccupants)}</div>
        <div style="color: var(--text-secondary);"><b>Has Pets:</b> ${safe(d.hasPets)}</div>
        <div style="color: var(--text-secondary);"><b>Has Vehicle:</b> ${safe(d.hasVehicle)}</div>
      </div>
      <div class="whobox">
        <div style="font-weight:600; margin-bottom:8px; color: var(--text-primary);">Employment & Income</div>
        <div style="color: var(--text-secondary);"><b>Status:</b> ${safe(d.employmentStatus)}</div>
        <div style="color: var(--text-secondary);"><b>Guardian Status:</b> ${safe(d.guardianEmploymentStatus)}</div>
        <div style="color: var(--text-secondary);"><b>Monthly Income:</b> ${safe(d.monthlyIncome)}</div>
      </div>
      <div class="addbox">
        <div style="font-weight:600; margin-bottom:8px; color: var(--text-primary);">Address & Notes</div>
        <div style="color: var(--text-secondary);"><b>Current Address:</b><br>${safe(d.currentAddress)}</div>
        <div style="margin-top:8px; color: var(--text-secondary);"><b>Additional Info:</b><br>${safe(d.additionalInfo)}</div>
      </div>
    </div>
    <div style="color: var(--text-muted); font-size:.9rem;">Submitted: ${app.created_at ? new Date(app.created_at).toLocaleString() : '—'} • ${unitLabel}</div>
    
    <!-- Application Actions -->
    <div style="margin-top: 20px; padding: 20px; background: var(--bg-secondary); border-radius: 8px; border: 1px solid var(--border-color);">
      <div style="display: flex; gap: 12px; flex-wrap: wrap; justify-content: center;">
        <button id="approveFromReviewBtn" style="background: #007bff; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 8px; transition: all 0.2s ease;">
          <i class="fas fa-check"></i>
          Approve Application
        </button>
        
        <button id="declineFromReviewBtn" style="background: #dc3545; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 8px; transition: all 0.2s ease;">
          <i class="fas fa-times"></i>
          Decline Application
        </button>
      </div>
    </div>
  `;

  // Attachments preview (use human-readable labels)
  const attachments = [];
  const labelMap = {
    proofOfIncomeUrl: 'Proof of Income',
    validIdUrl: 'Valid ID',
    barangayClearanceUrl: 'Barangay Clearance',
    policeClearanceUrl: 'Police Clearance',
    leaseAgreementUrl: 'Lease Agreement'
  };
  ['proofOfIncomeUrl', 'validIdUrl', 'barangayClearanceUrl', 'policeClearanceUrl', 'leaseAgreementUrl']
    .forEach(k => { if (d[k]) attachments.push({ label: (labelMap[k] || k), url: d[k] }); });
  if (attachments.length) {
    const sec = document.createElement('div');
    sec.style.marginTop = '10px';
    sec.innerHTML = `<div style="font-weight:600; color: var(--text-primary);">Attachments</div>`;
    const wrap = document.createElement('div');
    wrap.style.display = 'grid';
    wrap.style.gridTemplateColumns = 'repeat(auto-fit,minmax(160px,1fr))';
    wrap.style.gap = '10px';
    attachments.forEach(att => {
      const item = document.createElement('div');
      item.className = 'attach-box';
      item.innerHTML = `
        <div style="font-weight:600; justify-content:center; display:flex; padding:8px; font-size:.85rem; background: var(--bg-secondary); border-bottom:1px solid var(--border-color); color: var(--text-primary);">${att.label}</div>
        <div style="padding:8px; background: var(--bg-primary);">
          <a class="openattachbtn" href="${att.url}" style="text-decoration: none; font-weight: 600;">Open</a>
        </div>`;
      wrap.appendChild(item);
    });
    body.appendChild(sec);
    body.appendChild(wrap);
  }

  modal.style.display = 'flex';
  
  // Add event handlers for the review functionality
  setupApplicationReviewHandlers(modal, app);
}

// Setup event handlers for application review functionality
function setupApplicationReviewHandlers(modal, app) {
  const approveFromReviewBtn = modal.querySelector('#approveFromReviewBtn');
  const declineFromReviewBtn = modal.querySelector('#declineFromReviewBtn');
  
  // Approve from review button
  if (approveFromReviewBtn) {
    approveFromReviewBtn.addEventListener('click', async () => {
      if (!confirm('Are you sure you want to approve this application?')) {
        return;
      }
      
      // Approve the application
      const success = await approveApplication(app.id, app.apartment_id);
      if (success) {
        modal.style.display = 'none';
        alert('Application approved successfully.');
      }
    });
  }
  
  // Decline from review button
  if (declineFromReviewBtn) {
    declineFromReviewBtn.addEventListener('click', async () => {
      if (!confirm('Are you sure you want to decline this application?')) {
        return;
      }
      
      // Decline the application
      const success = await declineApplication(app.id);
      if (success) {
        modal.style.display = 'none';
        alert('Application declined successfully.');
      }
    });
  }
}

// Save application review to database
async function saveApplicationReview(appId, reviewData) {
  try {
    const client = initSupabase();
    if (!client) {
      alert('Database connection error. Please try again.');
      return false;
    }
    
    const { error } = await client
      .from('rental_applications')
      .update({
        landlord_review_notes: reviewData.notes,
        status: reviewData.status,
        priority: reviewData.priority,
        review_updated_at: new Date().toISOString()
      })
      .eq('id', appId);
    
    if (error) throw error;
    
    // Show success message
    const saveBtn = document.querySelector('#saveReviewBtn');
    if (saveBtn) {
      const originalText = saveBtn.innerHTML;
      saveBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';
      saveBtn.style.background = '#28a745';
      setTimeout(() => {
        saveBtn.innerHTML = originalText;
        saveBtn.style.background = '#28a745';
      }, 2000);
    }
    
    return true;
  } catch (error) {
    console.error('Error saving application review:', error);
    alert('Failed to save review. Please try again.');
    return false;
  }
}

// ------- Realtime notifications for new rental applications -------
let __appsChannel = null;
let __landlordApartmentIds = new Set();

async function refreshLandlordApartmentIds() {
  try {
    const client = initSupabase();
    const landlordId = window.currentUserId || null;
    if (!client || !landlordId) { __landlordApartmentIds = new Set(); return; }
    const { data, error } = await client
      .from('apartments')
      .select('id')
      .eq('landlord_id', landlordId)
      .limit(500);
    if (error) throw error;
    __landlordApartmentIds = new Set((data || []).map(r => String(r.id)));
  } catch (_) {
    __landlordApartmentIds = new Set();
  }
}

function highlightApartmentForNewApplication(apartmentId, unitNumber, kind = 'application') {
  try {
    if (!apartmentId) return;
    const aptIdStr = String(apartmentId);

    // Highlight the dashboard listing card for this apartment
    const card = document.querySelector(`.outerad[data-ad-id="${aptIdStr}"]`);
    if (card) {
      card.classList.add('has-new-application');

      // Add or update a small badge on the photo area
      const photo = card.querySelector('.photoad') || card;
      let badge = card.querySelector('.new-app-badge');
      if (!badge) {
        badge = document.createElement('div');
        badge.className = 'new-app-badge';
        // Position just below the unit-availability badge on the photo
        badge.style.position = 'absolute';
        badge.style.left = '8px';
        badge.style.top = '40px';
        badge.style.background = kind === 'receipt'
          ? 'rgba(16, 185, 129, 0.95)'   // green for receipts
          : 'rgba(220, 38, 38, 0.95)';   // red for applications
        badge.style.color = '#fff';
        badge.style.padding = '4px 10px';
        badge.style.borderRadius = '999px';
        badge.style.fontSize = '0.75rem';
        badge.style.fontWeight = '700';
        badge.style.boxShadow = '0 2px 6px rgba(0,0,0,0.25)';
        photo.appendChild(badge);
      }

      if (unitNumber != null && !isNaN(unitNumber)) {
        badge.textContent = kind === 'receipt'
          ? `New receipt • Unit ${unitNumber}`
          : `New application • Unit ${unitNumber}`;
      } else {
        badge.textContent = kind === 'receipt' ? 'New receipt' : 'New application';
      }
    }

    // If the landlord is currently editing this apartment, highlight the specific unit pill
    if (window.currentEditingAdId && String(window.currentEditingAdId) === aptIdStr && unitNumber != null && !isNaN(unitNumber)) {
      const pill = document.querySelector(`#adUnitStatusDisplay .unit-pill[data-unit="${unitNumber}"]`);
      if (pill) {
        pill.classList.add('unit-pill-has-application');
        // Inline emphasis so it works without CSS changes
        pill.style.outline = '2px solid var(--primary-color, #2563eb)';
        pill.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.3)';
      }
    }
  } catch (e) {
    console.warn('highlightApartmentForNewApplication error:', e?.message || e);
  }
}

async function subscribeToRentalApplications() {
  try {
    const client = initSupabase();
    if (!client) return;
    // Keep apartment ids updated
    await refreshLandlordApartmentIds();
    // Cleanup old channel
    try { if (__appsChannel && typeof __appsChannel.unsubscribe === 'function') { __appsChannel.unsubscribe(); } } catch (_) { }
    const channel = client.channel('realtime-rental-applications');
    __appsChannel = channel;
    channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rental_applications' }, async (payload) => {
        const row = payload?.new || {};
        const aptId = String(row.apartment_id || '');
        // Ensure our apartment set is fresh enough
        if (!__landlordApartmentIds.size) { await refreshLandlordApartmentIds(); }
        if (!__landlordApartmentIds.has(aptId)) return;

        // Derive unit number (stored either in column or JSON data)
        const unitNumber = row?.unit_number != null
          ? Number(row.unit_number)
          : (row?.data && row.data.unit_number != null ? Number(row.data.unit_number) : null);

        // Notify and refresh Applications list immediately
        const applicant = (row.data && (row.data.fullName || row.data.email || row.data.phone)) || 'New applicant';
        const moveIn = row.data && row.data.moveInDate ? ` • Move-in ${row.data.moveInDate}` : '';
        showMessageNotification('New rental application', applicant + moveIn);

        // Visually highlight the apartment card and, if possible, the specific unit
        highlightApartmentForNewApplication(aptId, unitNumber);

        refreshLandlordApplications();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rental_applications' }, async (payload) => {
        const row = payload?.new || {};
        const aptId = String(row.apartment_id || '');
        if (!__landlordApartmentIds.size) { await refreshLandlordApartmentIds(); }
        if (!__landlordApartmentIds.has(aptId)) return;
        const status = String(row.status || '').toLowerCase();
        if (status === 'approved' || status === 'accepted') {
          // Remove from Applications list and refresh rented sections
          try {
            const cardBtn = document.querySelector(`.approve-app[data-app-id="${row.id}"]`);
            const card = cardBtn ? cardBtn.closest('.outerad') : null;
            if (card && card.parentNode) card.parentNode.removeChild(card);
            const appModal = document.getElementById('applicationDetailsModal');
            if (appModal && appModal.style.display !== 'none') appModal.style.display = 'none';
          } catch (_) { }
          refreshLandlordApplications();
          debouncedRenderLandlordListings();
          refreshLandlordRentedTab();
        }
      })
      .subscribe();
    // Periodically refresh landlord apt ids (in case new listings are added)
    setInterval(refreshLandlordApartmentIds, 60000);
  } catch (e) {
    console.warn('subscribeToRentalApplications error:', e?.message || e);
  }
}

// ------- Realtime notifications for new payment receipts (GCash) -------
let __receiptsChannel = null;
async function subscribeToPaymentReceipts() {
  try {
    const client = initSupabase();
    if (!client) return;
    const landlordId = window.currentUserId || null;
    if (!landlordId) return;

    try { if (__receiptsChannel && typeof __receiptsChannel.unsubscribe === 'function') { __receiptsChannel.unsubscribe(); } } catch (_) { }
    const channel = client.channel('realtime-payment-receipts');
    __receiptsChannel = channel;

    channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'payment_receipts', filter: `landlord_id=eq.${landlordId}` }, async (payload) => {
        try {
          const row = payload?.new || {};
          const status = String(row.status || '').toLowerCase();
          if (status !== 'submitted') return;
          const aptId = String(row.apartment_id || '');
          if (!aptId) return;
          const unitNumber = row.unit_number != null ? Number(row.unit_number) : null;
          const amountVal = row.ocr_amount != null ? row.ocr_amount : row.amount;
          const amountStr = amountVal != null && !isNaN(amountVal)
            ? '₱' + Number(amountVal).toLocaleString('en-PH', { minimumFractionDigits: 2 })
            : '₱0.00';

          showMessageNotification(
            'New receipt submitted',
            (unitNumber != null && !isNaN(unitNumber)) ? `Unit ${unitNumber} • ${amountStr}` : amountStr
          );

          // Highlight only the specific unit related to this receipt.
          highlightApartmentForNewApplication(aptId, unitNumber, 'receipt');

          // Refresh pending receipts list if landlord is viewing a rented unit.
          try { await refreshLandlordReceiptLists(); } catch (_) { }
        } catch (_) { }
      })
      .subscribe();
  } catch (e) {
    console.warn('subscribeToPaymentReceipts error:', e?.message || e);
  }
}

function updateListing() {
  const adId = window.currentEditingAdId;
  if (!adId) { alert('Select a listing to update first.'); return; }
  const price = (document.getElementById('adPrice')?.value || '').trim();
  const location = (document.getElementById('adLocation')?.value || '').trim();
  const description = (document.getElementById('adDescription')?.value || '').trim();
  const unitSize = (document.getElementById('adUnitSize')?.value || '').trim();
  const totalUnitsRaw = (document.getElementById('adTotalUnits')?.value || '').trim();
  const availableUnitsRaw = (document.getElementById('adAvailableUnits')?.value || '').trim();
  const amenities = (document.getElementById('adAmenities')?.value || '').trim();
  const contact = (document.getElementById('adContactDash')?.value || '').trim();
  const email = (document.getElementById('adEmailDash')?.value || '').trim();
  // collect requirements from Dashboard edit form too, if checked
  const dashReqChecked = Array.from(document.querySelectorAll('#Dashboard [name="requirements"]:checked')).map(el => el.value);
  // collect payment methods from Dashboard edit form too, if checked
  const dashPaymentChecked = Array.from(document.querySelectorAll('#Dashboard [name="payment-methods"]:checked')).map(el => el.value.toLowerCase());

  // Normalize unit counts from edit form
  let totalUnits = parseInt(totalUnitsRaw, 10);
  if (!Number.isFinite(totalUnits) || totalUnits <= 0) totalUnits = 1;
  let availableUnits = parseInt(availableUnitsRaw, 10);
  if (!Number.isFinite(availableUnits) || availableUnits < 0) {
    // If not specified, assume all units are available when status is not rented
    availableUnits = totalUnits;
  }
  if (availableUnits > totalUnits) availableUnits = totalUnits;
  // IMPORTANT: Do not allow the landlord's "available units" edit to override
  // real occupied units. We'll clamp availability based on the stored
  // occupied_unit_numbers to keep dashboards consistent.
  
  // Note: payment configuration (e.g., partial vs full payments) is currently
  // handled on the client side. If you later add a payment_config column on
  // the Supabase apartments table, you can persist a similar object there.

  showStatusOverlay('Updating listing…', 'loading');
  (async () => {
    const client = initSupabase();
    try {
      if (client) {
        // Ensure the user is authenticated (RLS will block otherwise)
        const { data: sess } = await client.auth.getSession();
        const landlordId = sess?.session?.user?.id || null;
        if (!landlordId) {
          showStatusOverlay('Please sign in to update this listing.', 'error');
          hideStatusOverlay(2200);
          return;
        }

        // Fetch current occupied units so we don't accidentally "free" them by editing availability.
        let existingOccupied = [];
        try {
          const { data: aptRow, error: aptErr } = await client
            .from('apartments')
            .select('id, occupied_unit_numbers')
            .eq('id', adId)
            .maybeSingle();
          if (aptErr) throw aptErr;
          const raw = aptRow?.occupied_unit_numbers;
          if (Array.isArray(raw)) existingOccupied = raw;
          else if (raw && typeof raw === 'string') {
            try { existingOccupied = JSON.parse(raw || '[]'); } catch (_) { existingOccupied = []; }
          }
        } catch (_) {
          // If we can't fetch, fall back to previous behavior (no occupied preservation).
          existingOccupied = [];
        }

        // Sanitize occupied unit numbers, keep within range after totalUnits edits.
        const occSet = new Set(
          (existingOccupied || [])
            .map(n => Number(n))
            .filter(n => Number.isFinite(n) && n >= 1)
        );

        // If landlord reduced totalUnits below occupied count, keep totalUnits >= occupied count.
        // This avoids silently dropping occupied units.
        if (occSet.size > totalUnits) {
          totalUnits = occSet.size;
        }

        const occFiltered = Array.from(occSet).filter(n => n <= totalUnits).sort((a, b) => a - b);
        const occupiedCount = occFiltered.length;

        // Clamp advertised availability so occupied units always reduce the "total available".
        const maxAvailableGivenOccupied = Math.max(0, totalUnits - occupiedCount);
        const effectiveAvailableUnits = Math.min(availableUnits, maxAvailableGivenOccupied);

        // Derive overall status from *effective* availability
        const status = effectiveAvailableUnits > 0 ? 'available' : 'rented';

        // Get coordinates from map picker (exact pinpointed location)
        const latitudeInput = document.getElementById('apartmentLatitude');
        const longitudeInput = document.getElementById('apartmentLongitude');
        const latitude = latitudeInput?.value?.trim() || null;
        const longitude = longitudeInput?.value?.trim() || null;
        
        // Validate coordinates if provided
        let finalLatitude = null;
        let finalLongitude = null;
        if (latitude && longitude) {
          const lat = parseFloat(latitude);
          const lng = parseFloat(longitude);
          if (!isNaN(lat) && !isNaN(lng) && 
              lat >= -90 && lat <= 90 && 
              lng >= -180 && lng <= 180) {
            finalLatitude = lat;
            finalLongitude = lng;
            console.log('✅ Saving coordinates to database:', finalLatitude, finalLongitude);
          } else {
            console.warn('Invalid coordinates, skipping:', lat, lng);
          }
        }

        // Preserve actual occupied units when present; otherwise infer based on total vs available.
        const occupiedUnitNumbers = (occupiedCount > 0)
          ? occFiltered
          : Array.from({ length: Math.max(0, totalUnits - effectiveAvailableUnits) }, (_, i) => i + 1);

        const { error: updErr } = await client
          .from('apartments')
          .update({ 
            price, 
            location, 
            description, 
            unit_size: unitSize, 
            total_units: totalUnits,
            available_units: effectiveAvailableUnits,
            occupied_unit_numbers: occupiedUnitNumbers,
            amenities,
            contact, 
            email, 
            requirements: (dashReqChecked.length ? JSON.stringify(dashReqChecked) : null), 
            payment_methods: dashPaymentChecked,
            status,
            latitude: finalLatitude,
            longitude: finalLongitude
          })
          .eq('id', adId);
        if (updErr) throw updErr;

        const dashFloorInput = document.getElementById('adDashFloorPlan');
        if (dashFloorInput && dashFloorInput.files && dashFloorInput.files[0]) {
          const df = dashFloorInput.files[0];
          if (!df.type || !df.type.startsWith('image/')) {
            alert('Please upload an image file for the floor plan.');
            throw new Error('Invalid floor plan file type');
          }
          
          // Upload floor plan to storage (avoid base64 in DB / high RAM)
          const bucketName = 'apartment-images';
          const fileExt = (df.name && df.name.includes('.')) ? df.name.split('.').pop() : 'jpg';
          const fileName = `landlords/${landlordId}/${adId}/floorplan_${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;

          const { error: uploadError } = await client.storage
            .from(bucketName)
            .upload(fileName, df, { cacheControl: '3600', upsert: false });

          if (uploadError) {
            console.warn('Floor plan upload failed:', uploadError);
            throw uploadError;
          }

          const { data: urlData } = client.storage.from(bucketName).getPublicUrl(fileName);
          const publicUrl = urlData?.publicUrl;
          if (!publicUrl) throw new Error('Failed to get floor plan URL.');

          // Mark previous floor plans (if any) and insert new one
          await client
            .from('apartment_images')
            .update({ is_floorplan: false })
            .eq('apartment_id', adId)
            .eq('is_floorplan', true);

          await client
            .from('apartment_images')
            .insert([{ apartment_id: adId, image_url: publicUrl, is_primary: false, is_floorplan: true }]);
        }
        // Fast refresh: update only this listing card (avoids long full reload)
        // Keep the loading overlay until this completes.
        try { await refreshLandlordListingCard(adId); } catch (_) { }

        showStatusOverlay('Property updated successfully', 'success');
        hideStatusOverlay(1600);
        return;
      }
    } catch (e) {
      // Surface the real error (RLS / validation / network) instead of hiding it
      const msg = e?.message || e?.error_description || 'Update failed.';
      console.warn('Supabase update failed:', msg, e);
      showStatusOverlay(msg, 'error');
      hideStatusOverlay(2600);
      return;
    }
    showStatusOverlay('Update failed: database not available.', 'error');
    hideStatusOverlay(2000);
  })();
}

async function deleteListing() {
  const adId = window.currentEditingAdId;
  if (!adId) { alert('Select a listing card to delete first.'); return; }
  if (!confirm('Delete this listing? This cannot be undone.')) return;
  try {
    const client = initSupabase();
    if (client) {
      const { error } = await client.from('apartments').delete().eq('id', adId);
      if (error) throw error;
      alert('Listing deleted.');
      window.currentEditingAdId = null;
      renderLandlordListings();
      return;
    }
  } catch (e) {
    console.warn('Supabase delete failed, fallback to local:', e?.message || e);
  }
  let listings = getStoredListings();
  listings = listings.filter(l => l.id !== adId);
  setStoredListings(listings);
  window.currentEditingAdId = null;
  alert('Listing deleted locally.');
  renderLandlordListings();
}

document.addEventListener('DOMContentLoaded', () => {
  const updateBtn = document.getElementById('adUpdateBtn');
  if (updateBtn) updateBtn.addEventListener('click', updateListing);
  const deleteBtn = document.getElementById('adDeleteBtn');
  if (deleteBtn) deleteBtn.addEventListener('click', deleteListing);
  
  // Unit type label text: changes based on whether listing is a building complex or single unit
  const updateUnitTypeLabel = (scope) => {
    const isNew = scope === 'new';
    const totalEl = document.getElementById(isNew ? 'newAdTotalUnits' : 'adTotalUnits');
    const labelEl = document.getElementById(isNew ? 'newAdUnitSizeLabel' : 'adUnitSizeLabel');
    const inputEl = document.getElementById(isNew ? 'newAdUnitSize' : 'adUnitSize');
    if (!totalEl || !labelEl || !inputEl) return;

    const total = parseInt(totalEl.value || '1', 10);
    const isComplex = Number.isFinite(total) && total > 1;
    const requiredStar = isNew ? ' <span style="color: var(--error-color, #ef4444);">*</span>' : '';

    if (isComplex) {
      labelEl.innerHTML = `Unit type (building complex)${requiredStar}`;
      inputEl.placeholder = 'e.g., Studio, 1BR, 2BR';
    } else {
      labelEl.innerHTML = `Unit type (single unit)${requiredStar}`;
      inputEl.placeholder = 'e.g., Studio, Bedspace, Single room';
    }
  };
  
  const newTotal = document.getElementById('newAdTotalUnits');
  if (newTotal) newTotal.addEventListener('input', () => updateUnitTypeLabel('new'));
  const dashTotal = document.getElementById('adTotalUnits');
  if (dashTotal) dashTotal.addEventListener('input', () => updateUnitTypeLabel('dash'));
  
  // Initial run
  updateUnitTypeLabel('new');
  updateUnitTypeLabel('dash');

  // Keep unit counts consistent on Advertise (fresh + avoids manual toggling later)
  const newTotalUnitsEl = document.getElementById('newAdTotalUnits');
  const newAvailableUnitsEl = document.getElementById('newAdAvailableUnits');
  const clampNewAvailable = (mode) => {
    if (!newTotalUnitsEl || !newAvailableUnitsEl) return;
    const totalRaw = String(newTotalUnitsEl.value || '').trim();
    const availRaw = String(newAvailableUnitsEl.value || '').trim();

    // While typing, allow temporary empty input so numbers can be edited naturally.
    if (mode !== 'final' && (totalRaw === '' || availRaw === '')) return;

    let total = parseInt(totalRaw || '1', 10);
    if (!Number.isFinite(total) || total <= 0) total = 1;

    let available = parseInt(availRaw || String(total), 10);
    if (!Number.isFinite(available) || available < 0) available = 0;
    if (available > total) available = total;

    if (mode === 'final') {
      newTotalUnitsEl.value = String(total);
      newAvailableUnitsEl.value = String(available);
    } else {
      // If both numbers are present, prevent available from exceeding total.
      if (Number.isFinite(total) && Number.isFinite(available) && available > total) {
        newAvailableUnitsEl.value = String(total);
      }
    }
  };
  if (newTotalUnitsEl) {
    newTotalUnitsEl.addEventListener('input', () => { clampNewAvailable('input'); updateUnitTypeLabel('new'); });
    newTotalUnitsEl.addEventListener('blur', () => clampNewAvailable('final'));
    newTotalUnitsEl.addEventListener('change', () => clampNewAvailable('final'));
  }
  if (newAvailableUnitsEl) {
    newAvailableUnitsEl.addEventListener('input', () => clampNewAvailable('input'));
    newAvailableUnitsEl.addEventListener('blur', () => clampNewAvailable('final'));
    newAvailableUnitsEl.addEventListener('change', () => clampNewAvailable('final'));
  }

  // Keep unit counts consistent on Dashboard Edit too (adTotalUnits / adAvailableUnits)
  const dashTotalUnitsEl = document.getElementById('adTotalUnits');
  const dashAvailableUnitsEl = document.getElementById('adAvailableUnits');
  const clampDashAvailable = (mode) => {
    if (!dashTotalUnitsEl || !dashAvailableUnitsEl) return;
    const totalRaw = String(dashTotalUnitsEl.value || '').trim();
    const availRaw = String(dashAvailableUnitsEl.value || '').trim();

    // While typing, allow temporary empty input so numbers can be edited naturally.
    if (mode !== 'final' && (totalRaw === '' || availRaw === '')) return;

    let total = parseInt(totalRaw || '1', 10);
    if (!Number.isFinite(total) || total <= 0) total = 1;

    let available = parseInt(availRaw || String(total), 10);
    if (!Number.isFinite(available) || available < 0) available = 0;
    if (available > total) available = total;

    if (mode === 'final') {
      dashTotalUnitsEl.value = String(total);
      dashAvailableUnitsEl.value = String(available);
    } else {
      if (Number.isFinite(total) && Number.isFinite(available) && available > total) {
        dashAvailableUnitsEl.value = String(total);
      }
    }
  };
  if (dashTotalUnitsEl) {
    dashTotalUnitsEl.addEventListener('input', () => { clampDashAvailable('input'); updateUnitTypeLabel('dash'); });
    dashTotalUnitsEl.addEventListener('blur', () => clampDashAvailable('final'));
    dashTotalUnitsEl.addEventListener('change', () => clampDashAvailable('final'));
  }
  if (dashAvailableUnitsEl) {
    dashAvailableUnitsEl.addEventListener('input', () => clampDashAvailable('input'));
    dashAvailableUnitsEl.addEventListener('blur', () => clampDashAvailable('final'));
    dashAvailableUnitsEl.addEventListener('change', () => clampDashAvailable('final'));
  }

  // Load Advertise payment methods config (same richer UI as Payment History - configure once, applies when clients rent)
  const loadAdvertisePaymentMethods = () => loadPaymentMethodsConfigForApartmentEdit(
    'advertisePaymentMethodsContainer',
    null, // New listing: default-enable all configured methods
    'payment-methods',
    loadAdvertisePaymentMethods
  );
  loadAdvertisePaymentMethods();

  // "No" buttons: cancel and go back
  const dashboardNoBtn = document.querySelector('#Dashboard .selectedrightside .savechanges .savechangesbtns button:first-child');
  if (dashboardNoBtn) {
    dashboardNoBtn.addEventListener('click', function () {
      // discard editing session and return to list
      window.currentEditingAdId = null;
      if (typeof goBack === 'function') goBack();
    });
  }
  const advertiseNoBtn = document.querySelector('#Advertise .saveadchanges .savechangesbtns button:first-child');
  if (advertiseNoBtn) {
    advertiseNoBtn.addEventListener('click', function () {
      // reset advertise form and return to advertise grid
      resetAdvertiseForm();
      if (typeof goBack === 'function') goBack();
    });
  }

  // Realtime: reflect apartment status changes across tabs
  try {
    const client = initSupabase();
    if (client && !window.__aptStatusChannel) {
      const channel = client.channel('realtime-apartments-status');
      window.__aptStatusChannel = channel;
      channel
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'apartments' }, async (payload) => {
          try {
            const row = payload?.new || {};
            if (row && typeof row === 'object' && 'status' in row) {
              debouncedRenderLandlordListings();
              await refreshLandlordRentedTab();
            }
          } catch (_) { }
        })
        .subscribe();
    }
  } catch (_) { }

  // Prevent accidental value changes on number inputs when scrolling
  try {
    const numberInputs = document.querySelectorAll('input[type="number"].detail-input');
    numberInputs.forEach((input) => {
      input.addEventListener(
        'wheel',
        (e) => {
          if (document.activeElement === input) {
            e.preventDefault();
          }
        },
        { passive: false }
      );
    });
  } catch (_) { }

  // Remove-tenant action is now on each rented card (status row).
});


function resetAdvertiseForm() {
  const setVal = (id) => { const el = document.getElementById(id); if (el) el.value = ''; };
  setVal('newAdPrice');
  setVal('newAdLocation');
  setVal('newApartmentLatitude');
  setVal('newApartmentLongitude');
  const desc = document.getElementById('newAdDescription'); if (desc) desc.value = '';
  setVal('newAdUnitSize');
  const totalUnitsEl = document.getElementById('newAdTotalUnits'); if (totalUnitsEl) totalUnitsEl.value = '1';
  const availableUnitsEl = document.getElementById('newAdAvailableUnits'); if (availableUnitsEl) availableUnitsEl.value = '1';
  setVal('newAdAmenities');
  setVal('adContact');
  setVal('adEmail');
  const statusSel = document.getElementById('newAdStatus'); if (statusSel) statusSel.value = 'available';
  const otherReq = document.getElementById('adOtherReq'); if (otherReq) otherReq.value = '';
  document.querySelectorAll('#Advertise [name="requirements"], #Advertise [name="payment-methods"]').forEach(cb => { cb.checked = false; });

  // Re-load payment methods config with empty selection (resets rich config)
  if (typeof loadPaymentMethodsConfigForApartmentEdit === 'function') {
    loadPaymentMethodsConfigForApartmentEdit('advertisePaymentMethodsContainer', [], 'payment-methods', null);
  }

  // Reset file inputs
  const photoInput = document.getElementById('photoInput');
  if (photoInput) {
    photoInput.value = '';
    photoInput.files = null; // Clear file list
  }
  const floorInput = document.getElementById('adFloorPlan');
  if (floorInput) {
    floorInput.value = '';
    floorInput.files = null; // Clear file list
  }
  const panoramaInput = document.getElementById('panoramaInput');
  if (panoramaInput) {
    panoramaInput.value = '';
    panoramaInput.files = null; // Clear file list
  }
  
  // Clear panorama images
  window.__panoramaImages = [];
  if (typeof window.renderPanoramaList === 'function') {
    window.renderPanoramaList();
  }
  if (typeof window.updatePanoramaUploadButton === 'function') {
    window.updatePanoramaUploadButton();
  }

  // Reset photo preview and related variables
  const photoFrame = document.querySelector('#Advertise .photosadd');
  if (photoFrame) {
    photoFrame.innerHTML = '<i class="fa-solid fa-plus"></i>'; // Restore original plus icon
  }
  // Reset global photo variables
  window.__lastNewAdPrimaryImageDataUrl = '';
  window.__lastNewAdPrimaryImageDataUrls = [];
  window.__lastNewAdFloorPlanDataUrl = '';
  
  // Reset map coordinates
  setVal('newApartmentLatitude');
  setVal('newApartmentLongitude');
  const mapSearch = document.getElementById('mapLocationSearchModal');
  if (mapSearch) mapSearch.value = '';
  
  // Clear temporary map location
  window.tempMapLocation = null;
  window.tempMapAddress = null;
  
  // Ensure unit type label/placeholder reflect defaults
  try { document.getElementById('newAdTotalUnits')?.dispatchEvent(new Event('input')); } catch (_) {}
}

// Targeted test function for income-summary and payment-history sections
window.testIncomeSummaryAndPaymentHistory = async function() {
  console.log('🎯 Testing Income Summary and Payment History Sections...');
  
  // Test income-summary section elements
  console.log('1️⃣ Testing Income Summary DOM elements...');
  const incomeSummarySection = document.querySelector('.income-summary');
  const totalIncomeEl = document.querySelector('#totalIncome');
  const paymentCountEl = document.querySelector('#paymentCount');
  const monthlyRentIncomeEl = document.querySelector('#monthlyRentIncome');
  const initialIncomeEl = document.querySelector('#initialIncome');
  
  console.log('Income Summary Elements:', {
    incomeSummarySection: !!incomeSummarySection,
    totalIncomeEl: !!totalIncomeEl,
    paymentCountEl: !!paymentCountEl,
    monthlyRentIncomeEl: !!monthlyRentIncomeEl,
    initialIncomeEl: !!initialIncomeEl
  });
  
  // Test payment-history section elements
  console.log('2️⃣ Testing Payment History DOM elements...');
  const paymentHistorySection = document.querySelector('.payment-history');
  const historyTable = document.querySelector('#historyTable');
  const tableBody = document.querySelector('#historyTable tbody');
  
  console.log('Payment History Elements:', {
    paymentHistorySection: !!paymentHistorySection,
    historyTable: !!historyTable,
    tableBody: !!tableBody
  });
  
  if (!incomeSummarySection) {
    console.error('❌ Income Summary section not found!');
    return;
  }
  
  if (!paymentHistorySection) {
    console.error('❌ Payment History section not found!');
    return;
  }
  
  if (!tableBody) {
    console.error('❌ Table body not found! Payment History tab might not be active.');
    return;
  }
  
  // Test data fetching and rendering
  console.log('3️⃣ Testing data fetching and rendering...');
  try {
    const paymentHistory = await fetchPaymentHistory();
    console.log('✅ Fetched payment history:', paymentHistory);
    console.log('📊 Payment count:', paymentHistory?.length || 0);
    
    // Force update income summary
    console.log('4️⃣ Updating Income Summary...');
    if (paymentHistory && paymentHistory.length > 0) {
      const totalIncome = paymentHistory.reduce((sum, p) => sum + p.rawAmount, 0);
      const initialPayments = paymentHistory.filter(p => p.paymentType === 'initial');
      const monthlyRentPayments = paymentHistory.filter(p => p.paymentType === 'monthly_rent');
      const initialIncome = initialPayments.reduce((sum, p) => sum + p.rawAmount, 0);
      const monthlyRentIncome = monthlyRentPayments.reduce((sum, p) => sum + p.rawAmount, 0);
      
      // Update all income summary elements
      if (totalIncomeEl) {
        totalIncomeEl.textContent = `₱${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        totalIncomeEl.style.color = 'var(--success-color)';
      }
      if (paymentCountEl) {
        paymentCountEl.textContent = `${paymentHistory.length} payment${paymentHistory.length === 1 ? '' : 's'}`;
      }
      if (monthlyRentIncomeEl) {
        monthlyRentIncomeEl.textContent = `₱${monthlyRentIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      }
      if (initialIncomeEl) {
        initialIncomeEl.textContent = `₱${initialIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      }
      
      console.log('💰 Income Summary Updated:', {
        totalIncome: totalIncome,
        initialIncome: initialIncome,
        monthlyRentIncome: monthlyRentIncome,
        paymentCount: paymentHistory.length
      });
      
      // Force update payment history table
      console.log('5️⃣ Updating Payment History Table...');
      tableBody.innerHTML = '';
      
      paymentHistory.forEach(payment => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td title="${payment.property}">${payment.property}</td>
          <td>${payment.tenant}</td>
          <td title="${payment.ref}">${payment.ref}</td>
          <td>
            <span style="background: var(--primary-light); color: var(--primary-color); padding: 2px 8px; border-radius: 12px; font-size: 0.8rem;">
              ${payment.paymentMethod.replace('_', ' ').toUpperCase()}
            </span>
          </td>
          <td>${payment.datetime}</td>
          <td style="font-weight: 600; color: var(--success-color);">${payment.amount}</td>
        `;
        tableBody.appendChild(row);
      });
      
      console.log('✅ Payment History Table Updated with', paymentHistory.length, 'rows');
    } else {
      console.log('❌ No payment history found');
      
      // Reset income summary to zero
      if (totalIncomeEl) totalIncomeEl.textContent = '₱0.00';
      if (paymentCountEl) paymentCountEl.textContent = '0 payments';
      if (monthlyRentIncomeEl) monthlyRentIncomeEl.textContent = '₱0.00';
      if (initialIncomeEl) initialIncomeEl.textContent = '₱0.00';
      
      // Show empty state in table
      tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #666;">No payment history found.</td></tr>';
    }
    
    console.log('✅ Income Summary and Payment History test completed!');
  } catch (error) {
    console.error('❌ Error in test:', error);
  }
};

// Simple test function for landlord payment history (kept for backward compatibility)
window.testLandlordPaymentHistory = window.testIncomeSummaryAndPaymentHistory;

// Enhanced debug function that can be called from browser console
window.debugPaymentHistory = async function() {
  console.log('🔧 Enhanced Payment History Debug Started...');
  try {
    const client = initSupabase();
    if (!client) {
      console.error('❌ Supabase client not available');
      return;
    }

    const { data: sess } = await client.auth.getSession();
    const landlordId = sess?.session?.user?.id || null;
    console.log('👤 Current Landlord ID:', landlordId);

    if (!landlordId) {
      console.error('❌ No landlord ID found - user not logged in');
      return;
    }

    // Check all payments in database
    const { data: allPayments } = await client
      .from('rental_payments')
      .select('*')
      .limit(10);
    
    console.log('💾 Sample payments from database:', allPayments);
    console.log('📊 Total sample payments:', allPayments?.length || 0);

    // Check landlord's apartments
    const { data: apartments } = await client
      .from('apartments')
      .select('id, title, location, landlord_id')
      .eq('landlord_id', landlordId);
    
    console.log('🏠 Landlord apartments:', apartments);
    console.log('📊 Total apartments:', apartments?.length || 0);

    if (apartments && apartments.length > 0) {
      const apartmentIds = apartments.map(apt => apt.id);
      console.log('🔑 Apartment IDs to search for:', apartmentIds);

      // Check payments for these apartments (any status)
      const { data: apartmentPayments } = await client
        .from('rental_payments')
        .select('*')
        .in('apartment_id', apartmentIds);
      
      console.log('💰 All payments for landlord apartments:', apartmentPayments);
      console.log('📊 Total payments for landlord:', apartmentPayments?.length || 0);

      // Check succeeded payments specifically
      const { data: succeededPayments } = await client
        .from('rental_payments')
        .select('*')
        .in('apartment_id', apartmentIds);
      
      console.log('✅ Succeeded payments for landlord:', succeededPayments);
      console.log('📊 Total succeeded payments:', succeededPayments?.length || 0);

      // Skip RPC function test due to known 400 errors
      console.log('⚠️ RPC function skipped (known to return 400 errors)');
    }

    console.log('🔧 Enhanced debug completed. Check the logs above for details.');
  } catch (error) {
    console.error('❌ Debug function error:', error);
  }
};

// Fetch real payment history from database
// rental_payments table was removed; return empty so no 404 when Payment History tab is shown
async function fetchPaymentHistory() {
  try {
    return [];
  } catch (_) {
    return [];
  }
}

// Simplified function to render payment history table
async function renderPaymentHistory() {
  console.log('💰 Rendering payment history and income summary...');
  
  const tableBody = document.querySelector("#historyTable tbody");
  const totalIncomeEl = document.querySelector('#totalIncome');
  const paymentCountEl = document.querySelector('#paymentCount');
  const monthlyRentIncomeEl = document.querySelector('#monthlyRentIncome');
  const initialIncomeEl = document.querySelector('#initialIncome');
  
  // If the payment history UI has been removed, quietly exit
  if (!tableBody) {
    return;
  }

  try {
    // If we already have cached payment history, render it immediately
    let cachedHistory = Array.isArray(window.landlordPaymentHistory)
      ? window.landlordPaymentHistory
      : null;

    if (cachedHistory && cachedHistory.length > 0) {
      console.log('📊 Using cached payment history for fast render:', cachedHistory.length);
      tableBody.innerHTML = '';
      cachedHistory.forEach(payment => {
        const row = document.createElement('tr');
        const paymentMethodDisplay = payment.paymentMethod ? 
          payment.paymentMethod.replace('_', ' ').toUpperCase() : 'CARD';
        row.dataset.paymentMethod = (payment.paymentMethod || 'card').toLowerCase();
        row.dataset.apartmentId = payment.apartmentId;
        row.dataset.tenant = payment.tenant;
        const unitDisplay = payment.unitNumber != null ? `Unit ${payment.unitNumber}` : '—';
        row.innerHTML = `
          <td title="${payment.property}">${payment.property}</td>
          <td>${unitDisplay}</td>
          <td title="${payment.tenant}">${payment.tenant}</td>
          <td title="${payment.ref}">${payment.ref}</td>
          <td><span class="badge ${payment.paymentMethod?.toLowerCase() || 'card'}">${paymentMethodDisplay}</span></td>
          <td title="${payment.datetime}">${payment.datetime}</td>
          <td style="font-weight: 600; color: var(--success-color);" title="${payment.amount}">${payment.amount}</td>
        `;
        tableBody.appendChild(row);
      });
    } else {
      // Show loading only if we don't have anything cached
      tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">Loading...</td></tr>';
    }

    if (totalIncomeEl) totalIncomeEl.textContent = 'Loading...';
    if (paymentCountEl) paymentCountEl.textContent = 'Loading...';
    
    // Fetch fresh payment history (slow network-safe)
    const paymentHistory = await fetchPaymentHistory();
    console.log('📊 Fetched payment history:', paymentHistory.length, 'payments');

    if (paymentHistory && paymentHistory.length > 0) {
      // Update payment history table
    tableBody.innerHTML = '';
      paymentHistory.forEach(payment => {
        const row = document.createElement('tr');
        const paymentMethodDisplay = payment.paymentMethod ? 
          payment.paymentMethod.replace('_', ' ').toUpperCase() : 'CARD';
        
        row.dataset.paymentMethod = (payment.paymentMethod || 'card').toLowerCase();
        row.dataset.apartmentId = payment.apartmentId;
        row.dataset.tenant = payment.tenant;
        const unitDisplay = payment.unitNumber != null ? `Unit ${payment.unitNumber}` : '—';
        row.innerHTML = `
          <td title="${payment.property}">${payment.property}</td>
          <td>${unitDisplay}</td>
          <td title="${payment.tenant}">${payment.tenant}</td>
          <td title="${payment.ref}">${payment.ref}</td>
          <td><span class="badge ${payment.paymentMethod?.toLowerCase() || 'card'}">${paymentMethodDisplay}</span></td>
          <td title="${payment.datetime}">${payment.datetime}</td>
          <td style="font-weight: 600; color: var(--success-color);" title="${payment.amount}">${payment.amount}</td>
        `;
        tableBody.appendChild(row);
      });
      
      // Calculate income totals
      let totalIncome = 0;
      let initialIncome = 0;
      let monthlyRentIncome = 0;
      
      paymentHistory.forEach(payment => {
        const amount = payment.rawAmount || 0;
        totalIncome += amount;
        
        if (payment.paymentType === 'initial') {
          initialIncome += amount;
        } else if (payment.paymentType === 'monthly' || payment.paymentType === 'monthly_rent') {
          monthlyRentIncome += amount;
        }
      });
      
      // Update income summary elements
    if (totalIncomeEl) {
      totalIncomeEl.textContent = `₱${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        totalIncomeEl.style.color = 'var(--success-color)';
        console.log('✅ Updated total income:', totalIncomeEl.textContent);
      }
      if (paymentCountEl) {
        paymentCountEl.textContent = `${paymentHistory.length} payment${paymentHistory.length === 1 ? '' : 's'}`;
        console.log('✅ Updated payment count:', paymentCountEl.textContent);
      }
    if (monthlyRentIncomeEl) {
      monthlyRentIncomeEl.textContent = `₱${monthlyRentIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        console.log('✅ Updated monthly rent income:', monthlyRentIncomeEl.textContent);
    }
    if (initialIncomeEl) {
      initialIncomeEl.textContent = `₱${initialIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        console.log('✅ Updated initial income:', initialIncomeEl.textContent);
      }
      
      console.log('✅ Payment history table and income summary updated with', paymentHistory.length, 'payments');
      
      // Store payment history globally for filtering
      window.landlordPaymentHistory = paymentHistory;
      
      // Update payment method filter with only used methods
      updatePaymentMethodFilter(paymentHistory);
      
    } else {
      // No payments found - reset everything
      tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No payments found</td></tr>';
      
      if (totalIncomeEl) totalIncomeEl.textContent = '₱0.00';
      if (paymentCountEl) paymentCountEl.textContent = '0 payments';
      if (monthlyRentIncomeEl) monthlyRentIncomeEl.textContent = '₱0.00';
      if (initialIncomeEl) initialIncomeEl.textContent = '₱0.00';
      
      console.log('ℹ️ No payment history to display - reset to zero');
    }

  } catch (error) {
    console.error('❌ Error rendering payment history:', error);
    tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: red;">Error loading payments</td></tr>';
    
    // Reset income summary on error
    if (totalIncomeEl) totalIncomeEl.textContent = 'Error';
    if (paymentCountEl) paymentCountEl.textContent = 'Error';
    if (monthlyRentIncomeEl) monthlyRentIncomeEl.textContent = 'Error';
    if (initialIncomeEl) initialIncomeEl.textContent = 'Error';
  }
}

// Update payment method filter with only used methods
function updatePaymentMethodFilter(paymentHistory) {
  const filterSelect = document.getElementById('paymentMethodFilter');
  if (!filterSelect) return;
  
  // Get unique payment methods from payment history
  const usedMethods = new Set();
  paymentHistory.forEach(payment => {
    if (payment.paymentMethod) {
      usedMethods.add(payment.paymentMethod.toLowerCase());
    }
  });
  
  // Store current selection
  const currentValue = filterSelect.value;
  
  // Clear existing options except "All"
  filterSelect.innerHTML = '<option value="">All Payment Methods</option>';
  
  // Add only used payment methods
  const methodLabels = {
    'gcash': 'GCash',
    'paymaya': 'PayMaya',
    'card': 'Card',
    'grab_pay': 'GrabPay',
    'bank_transfer': 'Bank Transfer',
    'cash': 'Cash'
  };
  
  usedMethods.forEach(method => {
    const option = document.createElement('option');
    option.value = method;
    option.textContent = methodLabels[method] || method.replace('_', ' ').toUpperCase();
    filterSelect.appendChild(option);
  });
  
  // Restore selection if it still exists
  if (currentValue && usedMethods.has(currentValue)) {
    filterSelect.value = currentValue;
  }
  
  console.log('✅ Payment method filter updated with:', Array.from(usedMethods));
}

// Filter payment history based on search and filters
function filterPaymentHistory() {
  const searchTerm = (document.getElementById('paymentSearch')?.value || '').toLowerCase();
  const methodFilter = document.getElementById('paymentMethodFilter')?.value || '';
  const tableBody = document.querySelector("#historyTable tbody");
  
  if (!tableBody) return;
  
  const rows = tableBody.querySelectorAll('tr');
  let visibleCount = 0;
  let visibleTotal = 0;
  
  rows.forEach(row => {
    // Skip loading/empty state rows
    if (row.children.length !== 6) {
      return;
    }
    
    const cells = row.querySelectorAll('td');
    const rowText = Array.from(cells).map(cell => cell.textContent.toLowerCase()).join(' ');
    const paymentMethod = row.dataset.paymentMethod || '';
    
    const matchesSearch = !searchTerm || rowText.includes(searchTerm);
    const matchesMethod = !methodFilter || paymentMethod === methodFilter;
    
    if (matchesSearch && matchesMethod) {
      row.style.display = '';
      visibleCount++;
      
      // Extract amount for visible total calculation
      const amountText = cells[5]?.textContent || '₱0';
      const amount = parseFloat(amountText.replace(/[^\d.]/g, '')) || 0;
      visibleTotal += amount;
    } else {
      row.style.display = 'none';
    }
  });
  
  // Update filtered totals if elements exist
  const filteredIncomeEl = document.getElementById('filteredIncome');
  const filteredCountEl = document.getElementById('filteredCount');
  
  if (filteredIncomeEl) {
    filteredIncomeEl.textContent = `₱${visibleTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  }
  
  if (filteredCountEl) {
    filteredCountEl.textContent = `${visibleCount} payment${visibleCount === 1 ? '' : 's'} shown`;
  }
}



// Refresh payment history data
async function refreshPaymentHistory() {
  // Skip if payment history UI is not present
  const tableBody = document.querySelector("#historyTable tbody");
  if (!tableBody) {
    return;
  }
  await renderPaymentHistory();
}

// Setup real-time payment updates
async function setupPaymentRealtime() {
  try {
    const client = initSupabase();
    if (!client) return;

    const { data: sess } = await client.auth.getSession();
    const landlordId = sess?.session?.user?.id || null;
    if (!landlordId) return;

    // Get landlord's apartment IDs for filtering
    const { data: apartments } = await client
      .from('apartments')
      .select('id')
      .eq('landlord_id', landlordId);

    const apartmentIds = (apartments || []).map(apt => apt.id);
    if (!apartmentIds.length) return;

    // Subscribe to payment changes
    const paymentChannel = client
      .channel('payment-updates')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'payments',
          filter: `apartment_id=in.(${apartmentIds.join(',')})`
        }, 
        (payload) => {
          console.log('New payment received:', payload);
          // Show notification
          showMessageNotification('New Payment Received', 
            `Payment of ₱${parseFloat(payload.new.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} received`);
          // Refresh payment history
          setTimeout(refreshPaymentHistory, 1000);
          // If payment is already confirmed/succeeded, refresh due borders too.
          if (payload?.new?.status === 'succeeded') {
            setTimeout(refreshLandlordRentedTab, 1000);
          }
        }
      )
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'payments',
          filter: `apartment_id=in.(${apartmentIds.join(',')})`
        }, 
        (payload) => {
          console.log('Payment updated:', payload);
          // Refresh payment history if status changed to succeeded
          if (payload.new.status === 'succeeded' && payload.old.status !== 'succeeded') {
            showMessageNotification('Payment Confirmed', 
              `Payment of ₱${parseFloat(payload.new.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} confirmed`);
            setTimeout(refreshPaymentHistory, 1000);
            // Clear any active test override so due borders can disappear after payment.
            try { window.__testRentDueOuterAdOverride = null; } catch (_) {}
            setTimeout(refreshLandlordRentedTab, 1000);
          }
        }
      )
      .subscribe();

    // Store channel reference for cleanup
    window.__paymentChannel = paymentChannel;

  } catch (error) {
    console.error('Error setting up payment realtime:', error);
  }
}

// Load landlord's existing payment methods
async function loadLandlordPaymentMethods() {
  try {
    const client = initSupabase();
    if (!client) return;

    const { data: sess } = await client.auth.getSession();
    const landlordId = sess?.session?.user?.id || null;
    if (!landlordId) return;

    const { data: paymentMethods, error } = await client
      .from('landlord_payment_methods')
      .select('*')
      .eq('landlord_id', landlordId)
      .eq('is_active', true);

    if (error) {
      // Handle case where table doesn't exist
      if (error.code === 'PGRST205' || error.message.includes('Could not find the table')) {
        console.error('❌ CRITICAL: landlord_payment_methods table does not exist in Supabase database!');
        console.error('📋 Please create the table with this SQL in your Supabase SQL editor:');
        console.error(`
CREATE TABLE landlord_payment_methods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    landlord_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    payment_method TEXT NOT NULL,
    account_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    qr_code_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(landlord_id, payment_method)
);

-- Enable RLS
ALTER TABLE landlord_payment_methods ENABLE ROW LEVEL SECURITY;

-- Create policy for landlords to manage their own payment methods
CREATE POLICY "Landlords can manage their own payment methods" ON landlord_payment_methods
    FOR ALL USING (auth.uid() = landlord_id);
        `);
        window.landlordPaymentMethods = {};
        return;
      }
      throw error;
    }

    // Store payment methods globally (normalize keys to lowercase)
    window.landlordPaymentMethods = {};
    (paymentMethods || []).forEach(method => {
      const key = String(method.payment_method || '').toLowerCase();
      if (!key) return;
      window.landlordPaymentMethods[key] = {
        id: method.id,
        account_name: method.account_name,
        account_number: method.account_number,
        qr_code_url: method.qr_code_url
      };
    });

    // Update checkboxes to reflect saved payment methods
    updatePaymentMethodCheckboxes();

  } catch (error) {
    console.error('Error loading payment methods:', error);
    window.landlordPaymentMethods = {};
  }
}

// Update payment method checkboxes based on saved methods
function updatePaymentMethodCheckboxes() {
  const checkboxes = document.querySelectorAll('[name="payment-methods"]');
  checkboxes.forEach(checkbox => {
    const method = checkbox.value.toLowerCase();
    if (window.landlordPaymentMethods && window.landlordPaymentMethods[method]) {
      // Add visual indicator that this method is configured
      const label = checkbox.closest('label');
      if (label && !label.querySelector('.configured-indicator')) {
        const indicator = document.createElement('span');
        indicator.className = 'configured-indicator';
        indicator.innerHTML = ' ✓';
        indicator.style.color = 'var(--success-color)';
        indicator.style.fontWeight = 'bold';
        indicator.title = 'Payment method configured';
        label.appendChild(indicator);
      }
    }
  });
}

// Force refresh payment history function
window.forceRefreshPaymentHistory = async function() {
  console.log('🔄 Force refreshing payment history...');
  
  // Ensure we're on the Payment History tab
  const paymentHistoryTab = document.getElementById('PaymentHistory');
  if (paymentHistoryTab) {
    paymentHistoryTab.classList.add('actsidelp');
  }
  
  // Wait a bit for DOM to be ready
  setTimeout(async () => {
    await renderPaymentHistory();
    console.log('✅ Force refresh completed');
  }, 100);
};

// Quick test function that bypasses RPC and uses direct queries only
window.testDirectPaymentQuery = async function() {
  console.log('🧪 Testing Direct Payment Query (No RPC)...');
  
  try {
    const client = initSupabase();
    if (!client) {
      console.error('❌ Supabase client not available');
      return;
    }

    const { data: sess } = await client.auth.getSession();
    const landlordId = sess?.session?.user?.id || null;
    console.log('👤 Landlord ID:', landlordId);

    if (!landlordId) {
      console.error('❌ No landlord ID found');
      return;
    }

    // Get apartments
    const { data: apartments, error: aptError } = await client
      .from('apartments')
      .select('id, title, location, price')
      .eq('landlord_id', landlordId);

    if (aptError) {
      console.error('❌ Error fetching apartments:', aptError);
      return;
    }

    console.log('🏠 Found apartments:', apartments?.length || 0);
    
    if (!apartments || apartments.length === 0) {
      console.log('❌ No apartments found for this landlord');
      return;
    }

    const apartmentIds = apartments.map(apt => apt.id);
    console.log('🔑 Apartment IDs:', apartmentIds);

    // Get payments with enhanced error handling
    const { data: payments, error: payError } = await client
      .from('rental_payments')
      .select('*')
      .in('apartment_id', apartmentIds)
      .order('created_at', { ascending: false })
      .limit(10);

    if (payError) {
      console.error('❌ Error fetching payments:', payError);
      return;
    }

    console.log('💰 Found payments:', payments?.length || 0);
    console.log('📊 Sample payment data:', payments?.[0]);

    if (payments && payments.length > 0) {
      // Test manual rendering
      const tableBody = document.querySelector('#historyTable tbody');
      const totalIncomeEl = document.querySelector('#totalIncome');
      
      if (tableBody && totalIncomeEl) {
        console.log('✅ DOM elements found, updating display...');
        
        // Calculate totals
        const totalIncome = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
        
        // Update income display
        totalIncomeEl.textContent = `₱${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        totalIncomeEl.style.color = 'var(--success-color)';
        
        // Update table
        tableBody.innerHTML = '';
        payments.forEach(payment => {
          const apartment = apartments.find(apt => apt.id === payment.apartment_id);
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${apartment?.title || apartment?.location || 'Unknown Property'}</td>
            <td>Tenant</td>
            <td>${payment.transaction_id || payment.id}</td>
            <td>${payment.payment_method || 'Unknown'}</td>
            <td>${new Date(payment.created_at).toLocaleString()}</td>
            <td style="font-weight: 600; color: var(--success-color);">₱${parseFloat(payment.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
          `;
          tableBody.appendChild(row);
        });
        
        console.log('✅ Successfully updated income summary and payment table!');
      } else {
        console.error('❌ DOM elements not found - make sure Payment History tab is active');
      }
    } else {
      console.log('❌ No payments found');
    }
  } catch (error) {
    console.error('❌ Test error:', error);
  }
};

// Specific function to fix income-summary and payment-history sections
window.fixIncomeSummaryAndPaymentHistory = async function() {
  console.log('🔧 Fixing Income Summary and Payment History sections...');
  
  // Navigate to Payment History tab first
  const paymentHistoryTab = document.getElementById('PaymentHistory');
  const navLink = document.querySelector('.sidemenu .page[data-target="PaymentHistory"]');
  
  if (navLink && paymentHistoryTab) {
    // Activate the tab
    document.querySelectorAll('.sidemenu .page').forEach(link => link.classList.remove('active'));
    navLink.classList.add('active');
    
    document.querySelectorAll('.sidelp').forEach(page => page.classList.remove('actsidelp'));
    paymentHistoryTab.classList.add('actsidelp');
    
    console.log('✅ Payment History tab activated');
  }
  
  // Wait for DOM to be ready
  setTimeout(async () => {
    // Check if sections exist
    const incomeSummary = document.querySelector('.income-summary');
    const paymentHistory = document.querySelector('.payment-history');
    
    if (!incomeSummary) {
      console.error('❌ Income Summary section not found in DOM');
      return;
    }
    
    if (!paymentHistory) {
      console.error('❌ Payment History section not found in DOM');
      return;
    }
    
    console.log('✅ Both sections found, rendering payment history...');
    
    // Force render
    await renderPaymentHistory();
    
    console.log('✅ Income Summary and Payment History sections fixed!');
  }, 300);
};

// Ultimate fix function that handles all edge cases
window.ultimatePaymentHistoryFix = async function() {
  console.log('🚀 Running Ultimate Payment History Fix...');
  
  try {
    // Step 1: Ensure we're authenticated
    const client = initSupabase();
    if (!client) {
      console.error('❌ Supabase client not available');
      return false;
    }
    
    const { data: sess } = await client.auth.getSession();
    const landlordId = sess?.session?.user?.id || null;
    if (!landlordId) {
      console.error('❌ User not authenticated');
      return false;
    }
    
    console.log('✅ User authenticated:', landlordId);
    
    // Step 2: Navigate to Payment History tab
    const paymentHistoryTab = document.getElementById('PaymentHistory');
    const navLink = document.querySelector('.sidemenu .page[data-target="PaymentHistory"]');
    
    if (navLink && paymentHistoryTab) {
      // Clear all active states
      document.querySelectorAll('.sidemenu .page').forEach(link => link.classList.remove('active'));
      document.querySelectorAll('.sidelp').forEach(page => page.classList.remove('actsidelp'));
      
      // Activate Payment History tab
      navLink.classList.add('active');
      paymentHistoryTab.classList.add('actsidelp');
      
      console.log('✅ Payment History tab activated');
    } else {
      console.error('❌ Payment History tab elements not found');
      return false;
    }
    
    // Step 3: Wait for DOM to be ready and check elements
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const requiredElements = {
      incomeSummary: document.querySelector('.income-summary'),
      paymentHistory: document.querySelector('.payment-history'),
      historyTable: document.querySelector('#historyTable'),
      tableBody: document.querySelector('#historyTable tbody'),
      totalIncome: document.querySelector('#totalIncome'),
      paymentCount: document.querySelector('#paymentCount'),
      monthlyRentIncome: document.querySelector('#monthlyRentIncome'),
      initialIncome: document.querySelector('#initialIncome')
    };
    
    console.log('🔍 DOM Elements Check:', Object.fromEntries(
      Object.entries(requiredElements).map(([key, el]) => [key, !!el])
    ));
    
    // Step 4: Check for missing critical elements
    const missingElements = Object.entries(requiredElements)
      .filter(([key, el]) => !el && ['historyTable', 'tableBody'].includes(key))
      .map(([key]) => key);
    
    if (missingElements.length > 0) {
      console.error('❌ Critical DOM elements missing:', missingElements);
      console.error('💡 Make sure you are on the Payment History tab and the HTML contains the required elements');
      return false;
    }
    
    // Step 5: Fetch and render payment data
    console.log('📊 Fetching payment data...');
    const paymentHistory = await fetchPaymentHistory();
    console.log('💰 Payment history fetched:', paymentHistory?.length || 0, 'payments');
    
    // Step 6: Force update all elements
    if (requiredElements.tableBody) {
      // Show loading state
      requiredElements.tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #666;">Loading payment history...</td></tr>';
      
      if (paymentHistory && paymentHistory.length > 0) {
        // Calculate totals
        const totalIncome = paymentHistory.reduce((sum, p) => sum + p.rawAmount, 0);
        const initialPayments = paymentHistory.filter(p => p.paymentType === 'initial');
        const monthlyRentPayments = paymentHistory.filter(p => p.paymentType === 'monthly_rent');
        const initialIncome = initialPayments.reduce((sum, p) => sum + p.rawAmount, 0);
        const monthlyRentIncome = monthlyRentPayments.reduce((sum, p) => sum + p.rawAmount, 0);
        
        // Update income elements
        if (requiredElements.totalIncome) {
          requiredElements.totalIncome.textContent = `₱${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
          requiredElements.totalIncome.style.color = 'var(--success-color)';
          console.log('✅ Updated totalIncome:', requiredElements.totalIncome.textContent);
        }
        
        if (requiredElements.paymentCount) {
          requiredElements.paymentCount.textContent = `${paymentHistory.length} payment${paymentHistory.length === 1 ? '' : 's'}`;
          console.log('✅ Updated paymentCount:', requiredElements.paymentCount.textContent);
        }
        
        if (requiredElements.monthlyRentIncome) {
          requiredElements.monthlyRentIncome.textContent = `₱${monthlyRentIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
          console.log('✅ Updated monthlyRentIncome:', requiredElements.monthlyRentIncome.textContent);
        }
        
        if (requiredElements.initialIncome) {
          requiredElements.initialIncome.textContent = `₱${initialIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
          console.log('✅ Updated initialIncome:', requiredElements.initialIncome.textContent);
        }
        
        // Clear and populate table
        requiredElements.tableBody.innerHTML = '';
        paymentHistory.forEach((payment, index) => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td title="${payment.property}">${payment.property}</td>
            <td>${payment.tenant}</td>
            <td title="${payment.ref}">${payment.ref}</td>
            <td>
              <span style="background: var(--primary-light); color: var(--primary-color); padding: 2px 8px; border-radius: 12px; font-size: 0.8rem;">
                ${payment.paymentMethod.replace('_', ' ').toUpperCase()}
              </span>
            </td>
            <td>${payment.datetime}</td>
            <td style="font-weight: 600; color: var(--success-color);">${payment.amount}</td>
          `;
          requiredElements.tableBody.appendChild(row);
        });
        
        console.log('✅ Payment history table populated with', paymentHistory.length, 'rows');
        
      } else {
        // No payments found
        if (requiredElements.totalIncome) requiredElements.totalIncome.textContent = '₱0.00';
        if (requiredElements.paymentCount) requiredElements.paymentCount.textContent = '0 payments';
        if (requiredElements.monthlyRentIncome) requiredElements.monthlyRentIncome.textContent = '₱0.00';
        if (requiredElements.initialIncome) requiredElements.initialIncome.textContent = '₱0.00';
        
        requiredElements.tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #666;">No payment history found.</td></tr>';
        console.log('ℹ️ No payment history found - displaying empty state');
      }
    }
    
    console.log('🚀 Ultimate Payment History Fix completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Ultimate fix failed:', error);
    return false;
  }
};

// Simple function to fetch and display payment history and income summary
window.loadPaymentHistoryAndIncome = async function() {
  console.log('💰 Loading payment history and income summary...');
  
  try {
    // Fetch payment history
    const paymentHistory = await fetchPaymentHistory();
    console.log('📊 Fetched payments:', paymentHistory?.length || 0);
    
    // Update income summary
    const totalIncome = paymentHistory.reduce((sum, p) => sum + (p.rawAmount || 0), 0);
    const initialPayments = paymentHistory.filter(p => p.paymentType === 'initial');
    const monthlyRentPayments = paymentHistory.filter(p => p.paymentType === 'monthly_rent');
    const initialIncome = initialPayments.reduce((sum, p) => sum + (p.rawAmount || 0), 0);
    const monthlyRentIncome = monthlyRentPayments.reduce((sum, p) => sum + (p.rawAmount || 0), 0);
    
    // Update DOM elements
    const totalIncomeEl = document.querySelector('#totalIncome');
    const paymentCountEl = document.querySelector('#paymentCount');
    const monthlyRentIncomeEl = document.querySelector('#monthlyRentIncome');
    const initialIncomeEl = document.querySelector('#initialIncome');
    const tableBody = document.querySelector('#historyTable tbody');
    
    if (totalIncomeEl) {
      totalIncomeEl.textContent = `₱${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    }
    if (paymentCountEl) {
      paymentCountEl.textContent = `${paymentHistory.length} payment${paymentHistory.length === 1 ? '' : 's'}`;
    }
    if (monthlyRentIncomeEl) {
      monthlyRentIncomeEl.textContent = `₱${monthlyRentIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    }
    if (initialIncomeEl) {
      initialIncomeEl.textContent = `₱${initialIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    }
    
    // Update payment history table
    if (tableBody) {
      if (paymentHistory.length > 0) {
        tableBody.innerHTML = '';
        paymentHistory.forEach(payment => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${payment.property}</td>
            <td>${payment.tenant}</td>
            <td>${payment.ref}</td>
            <td>${payment.paymentMethod.replace('_', ' ').toUpperCase()}</td>
            <td>${payment.datetime}</td>
            <td style="font-weight: 600; color: var(--success-color);">${payment.amount}</td>
          `;
          tableBody.appendChild(row);
        });
      } else {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #666;">No payment history found.</td></tr>';
      }
    }
    
    console.log('✅ Payment history and income summary loaded successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Error loading payment history:', error);
    return false;
  }
};

// Initialize payment history when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Load payment history when page loads
  setTimeout(() => {
    loadPaymentHistoryAndIncome();
  }, 1000);
  
  // Also load when Payment History tab is clicked
  const paymentHistoryNavLink = document.querySelector('.sidemenu .page[data-target="PaymentHistory"]');
  if (paymentHistoryNavLink) {
    paymentHistoryNavLink.addEventListener('click', function() {
      console.log('🎯 Payment History tab clicked');
      setTimeout(() => {
        loadPaymentHistoryAndIncome();
      }, 300);
    });
  }
  
  // Setup payment search functionality
  const paymentSearch = document.getElementById('paymentSearch');
  if (paymentSearch) {
    paymentSearch.addEventListener('input', filterPaymentHistory);
  }
  
  // Setup payment method filter
  const paymentMethodFilter = document.getElementById('paymentMethodFilter');
  if (paymentMethodFilter) {
    paymentMethodFilter.addEventListener('change', filterPaymentHistory);
  }
  
  // Setup export button
  const exportButton = document.getElementById('exportPayments');
  if (exportButton) {
    exportButton.addEventListener('click', exportPaymentHistory);
  }
  
  // Setup refresh button
  const refreshButton = document.getElementById('refreshPayments');
  if (refreshButton) {
    refreshButton.addEventListener('click', async function() {
      this.disabled = true;
      this.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Refreshing...';
      
      try {
        await refreshPaymentHistory();
      } finally {
        this.disabled = false;
        this.innerHTML = '<i class="fa-solid fa-refresh"></i> Refresh';
      }
    });
  }
  
  // Auto-refresh payment history every 30 seconds
  setInterval(refreshPaymentHistory, 30000);
  
  // Setup real-time payment updates
  setupPaymentRealtime();
});


// Keep track of the checkbox that triggered the popup
let currentPaymentCheckbox = null;
let isPaymentPopupOpen = false;
let lastClickTime = 0;

function openPaymentPopup(checkbox, method) {
  // Prevent multiple rapid opens
  if (isPaymentPopupOpen) {
    return;
  }

  // Only open popup if checkbox is being checked (not unchecked)
  if (checkbox.checked) {
    isPaymentPopupOpen = true;
    currentPaymentCheckbox = checkbox;

    // Use setTimeout to ensure the checkbox state is fully processed
    setTimeout(() => {
      const modal = document.getElementById('paymentPopupModal');
      const title = document.getElementById('paymentPopupTitle');
      const hiddenInput = document.getElementById('paymentMethodHidden');
      const form = document.getElementById('paymentPopupForm');

      // Check if this payment method already exists
      const existingMethod = window.landlordPaymentMethods?.[method.toLowerCase()];
      
      if (existingMethod) {
        // Set content for editing existing method
        title.innerText = 'Edit ' + method + ' Info';
        
        // Pre-fill form with existing data
        form.querySelector('[name="payeeName"]').value = existingMethod.account_name || '';
        form.querySelector('[name="payeeNumber"]').value = existingMethod.account_number || '';
        
        // Note about existing QR code
        const qrLabel = form.querySelector('.payModalqr label');
        if (existingMethod.qr_code_url) {
          qrLabel.innerHTML = 'QR Code Image (Current QR code will be replaced if new one is uploaded):';
        }
      } else {
        // Set content for new method
        title.innerText = 'Add ' + method + ' Info';
        form.reset();
      }
      
      hiddenInput.value = method;

      // Show modal with smooth transition
      modal.style.display = 'flex';
      // Trigger the opacity transition
      requestAnimationFrame(() => {
        modal.classList.add('show');
      });
    }, 50);
  }
}

function closePaymentPopup() {
  const modal = document.getElementById('paymentPopupModal');

  // Remove the show class first to trigger fade out
  modal.classList.remove('show');

  // Hide the modal after transition completes
  setTimeout(() => {
    modal.style.display = 'none';
    isPaymentPopupOpen = false; // Reset the flag
  }, 200); // Match the CSS transition duration

  // Uncheck the checkbox if popup is closed without saving
  if (currentPaymentCheckbox) {
    currentPaymentCheckbox.checked = false;
    currentPaymentCheckbox = null;
  }
}

async function submitPaymentPopup() {
  // Validate form (HTML5 validation will handle required fields)
  const form = document.getElementById('paymentPopupForm');
  const formData = new FormData(form);

  // Check if required fields are filled
  const name = formData.get('payeeName');
  const number = formData.get('payeeNumber');
  const qrFile = formData.get('payeeQR');
  const paymentMethod = formData.get('paymentMethod');

  if (!name || !number || !paymentMethod) {
    alert('Please fill in the account name, number, and select a payment method.');
    return;
  }

  // Validate input lengths and formats
  if (name.length > 100) {
    alert('Account name is too long (max 100 characters).');
    return;
  }

  if (number.length > 20) {
    alert('Account number is too long (max 20 characters).');
    return;
  }

  // Validate QR file if provided
  if (qrFile && qrFile.size > 0) {
    if (qrFile.size > 5 * 1024 * 1024) { // 5MB limit
      alert('QR code image is too large (max 5MB).');
      return;
    }

    if (!qrFile.type.startsWith('image/')) {
      alert('Please upload a valid image file for the QR code.');
      return;
    }
  }

  try {
    // Convert QR code image to data URL (if provided)
    let qrDataUrl = null;
    if (qrFile && qrFile.size > 0) {
      qrDataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(qrFile);
      });
    }

    // Get current user ID
    const client = initSupabase();
    if (!client) {
      alert('Database connection not available.');
      return;
    }

    const { data: sess } = await client.auth.getSession();
    const landlordId = sess?.session?.user?.id || null;
    if (!landlordId) {
      alert('Please log in to save payment information.');
      return;
    }

    // Prepare payment method data
    const paymentMethodData = {
      landlord_id: landlordId,
      payment_method: paymentMethod.toLowerCase(),
      account_name: name,
      account_number: number,
      qr_code_url: qrDataUrl,
      is_active: true,
      created_at: new Date().toISOString()
    };

    // Check if payment method already exists for this landlord
    const { data: existing, error: checkError } = await client
      .from('landlord_payment_methods')
      .select('id')
      .eq('landlord_id', landlordId)
      .eq('payment_method', paymentMethod.toLowerCase())
      .single();

    // Handle case where table doesn't exist
    if (checkError && (checkError.code === 'PGRST205' || checkError.message.includes('Could not find the table'))) {
      console.error('❌ CRITICAL: landlord_payment_methods table does not exist in Supabase database!');
      console.error('📋 Please create the table with this SQL in your Supabase SQL editor:');
      console.error(`
CREATE TABLE landlord_payment_methods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    landlord_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    payment_method TEXT NOT NULL,
    account_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    qr_code_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(landlord_id, payment_method)
);

-- Enable RLS
ALTER TABLE landlord_payment_methods ENABLE ROW LEVEL SECURITY;

-- Create policy for landlords to manage their own payment methods
CREATE POLICY "Landlords can manage their own payment methods" ON landlord_payment_methods
    FOR ALL USING (auth.uid() = landlord_id);
      `);
      alert('❌ Database table missing! Check browser console for SQL to create the required table in Supabase.');
      return;
    }

    if (existing) {
      // Update existing payment method
      const { error: updateError } = await client
        .from('landlord_payment_methods')
        .update({
          account_name: name,
          account_number: number,
          qr_code_url: qrDataUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (updateError) throw updateError;
    } else {
      // Insert new payment method
      const { error: insertError } = await client
        .from('landlord_payment_methods')
        .insert([paymentMethodData]);

      if (insertError) throw insertError;
    }

    // Store payment method data globally for this session
    if (!window.landlordPaymentMethods) {
      window.landlordPaymentMethods = {};
    }
    window.landlordPaymentMethods[paymentMethod.toLowerCase()] = {
      account_name: name,
      account_number: number,
      qr_code_url: qrDataUrl
    };

    // If valid, keep the checkbox checked and close the popup
    if (currentPaymentCheckbox) {
      currentPaymentCheckbox.checked = true;
      
      // Add success animation to the label
      const label = currentPaymentCheckbox.closest('label');
      if (label) {
        label.classList.add('payment-method-success');
        setTimeout(() => {
          label.classList.remove('payment-method-success');
        }, 600);
      }
      
      currentPaymentCheckbox = null;
    }

    // Close with smooth transition
    closePaymentPopup();
    
    // Invalidate cached landlord methods so new config is reflected everywhere
    landlordMethodsCache = null;
    landlordMethodsCacheLandlordId = null;

    // If we're in the rental payment methods context, refresh that display
    if (currentRentedApartmentId) {
      await loadRentalPaymentMethods(currentRentedApartmentId);
    }

    // Also refresh embedded payment method configs in Dashboard and Advertise forms
    if (typeof loadPaymentMethodsConfigForApartmentEdit === 'function') {
      const dashContainer = document.getElementById('dashboardPaymentMethodsContainer');
      if (dashContainer) {
        loadPaymentMethodsConfigForApartmentEdit('dashboardPaymentMethodsContainer', null, 'payment-methods', null);
      }
      const advContainer = document.getElementById('advertisePaymentMethodsContainer');
      if (advContainer) {
        loadPaymentMethodsConfigForApartmentEdit('advertisePaymentMethodsContainer', null, 'payment-methods', null);
      }
    }
    
    // Show success message with better styling
    const successMsg = document.createElement('div');
    successMsg.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--success-color);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10001;
      font-weight: 600;
      animation: slideIn 0.3s ease;
    `;
    successMsg.textContent = 'Payment information saved successfully!';
    
    // Add slide-in animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(successMsg);
    
    // Remove after 3 seconds
    setTimeout(() => {
      successMsg.style.animation = 'slideIn 0.3s ease reverse';
      setTimeout(() => {
        if (successMsg.parentNode) {
          successMsg.parentNode.removeChild(successMsg);
        }
        if (style.parentNode) {
          style.parentNode.removeChild(style);
        }
      }, 300);
    }, 3000);

  } catch (error) {
    console.error('Error saving payment method:', error);
    alert('Failed to save payment information. Please try again.');
  }
}

// Optional: If user clicks outside the modal, close it
const paymentPopupModal = document.getElementById('paymentPopupModal');
if (paymentPopupModal) {
  paymentPopupModal.addEventListener('click', function (e) {
    if (e.target === this) closePaymentPopup();
  });
}

// Add event delegation for payment method checkboxes - use click instead of change
// Skip checkboxes inside embed config (Dashboard/Advertise) - they use Configure button, not popup
document.addEventListener('click', function (e) {
  if (e.target.type === 'checkbox' && e.target.name === 'payment-methods') {
    if (e.target.closest('#dashboardPaymentMethodsContainer, #advertisePaymentMethodsContainer')) return;
    const method = e.target.getAttribute('data-payment-method');
    if (method) {
      const currentTime = Date.now();

      // Prevent rapid successive clicks (debounce)
      if (currentTime - lastClickTime < 300) {
        return;
      }
      lastClickTime = currentTime;

      // Use a small delay to ensure the checkbox state is properly updated
      setTimeout(() => {
        if (e.target.checked && !isPaymentPopupOpen) {
          openPaymentPopup(e.target, method);
        }
      }, 10);
    }
  }
});

// ===== RENTAL PAYMENT METHODS MANAGEMENT =====

// Global variable to track current selected apartment
let currentRentedApartmentId = null;

// Load rented apartments for the selector
async function loadRentedApartments() {
  try {
    const client = initSupabase();
    if (!client) return;

    const { data: sess } = await client.auth.getSession();
    const landlordId = sess?.session?.user?.id || null;
    if (!landlordId) return;

    console.log('🏠 Loading rented apartments for selector...');

    // First try: Get apartments with approved rental applications
    let rentedApartments = [];
    try {
      const { data: approvedApartments, error: approvedError } = await client
      .from('apartments')
      .select(`
        id, 
        title, 
        location, 
        payment_methods,
        rental_applications!inner(status)
      `)
      .eq('landlord_id', landlordId)
      .eq('rental_applications.status', 'approved');

      if (!approvedError && approvedApartments) {
        rentedApartments = approvedApartments;
        console.log('✅ Found apartments with approved applications:', rentedApartments.length);
      }
    } catch (approvedErr) {
      console.log('⚠️ Error with approved applications query:', approvedErr);
    }

    // Fallback: Get apartments with status 'rented' if no approved applications found
    if (rentedApartments.length === 0) {
      console.log('🔄 Trying fallback: apartments with status "rented"...');
      const { data: statusRentedApartments, error: statusError } = await client
        .from('apartments')
        .select('id, title, location, payment_methods')
        .eq('landlord_id', landlordId)
        .eq('status', 'rented');

      if (!statusError && statusRentedApartments) {
        rentedApartments = statusRentedApartments;
        console.log('✅ Found apartments with rented status:', rentedApartments.length);
      }
    }

    // Populate apartment selector
    const selector = document.getElementById('apartmentSelector');
    if (selector) {
      selector.innerHTML = '<option value="">Select an apartment...</option>';
      
      if (rentedApartments.length > 0) {
      rentedApartments.forEach(apartment => {
        const option = document.createElement('option');
        option.value = apartment.id;
          option.textContent = `${apartment.title || apartment.location} - ${apartment.location}`;
        option.dataset.title = apartment.title;
        option.dataset.location = apartment.location;
        selector.appendChild(option);
      });
        console.log('✅ Populated apartment selector with', rentedApartments.length, 'apartments');
      } else {
        // Add a message if no rented apartments found
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No rented apartments found';
        option.disabled = true;
        selector.appendChild(option);
        console.log('ℹ️ No rented apartments found for landlord');
      }
    }

  } catch (error) {
    console.error('❌ Error loading rented apartments:', error);
  }
}

// Simple in-memory cache for landlord payment methods (per landlord, per page load)
let landlordMethodsCache = null;
let landlordMethodsCacheLandlordId = null;

async function getLandlordPaymentMethodsCached(client, landlordId) {
  // Reuse cached methods when landlord stays the same
  if (landlordMethodsCache && landlordMethodsCacheLandlordId === landlordId) {
    return landlordMethodsCache;
  }

  const { data, error } = await client
    .from('landlord_payment_methods')
    .select('*')
    .eq('landlord_id', landlordId)
    .eq('is_active', true);

  if (!error && data) {
    landlordMethodsCache = (data || []).map((row) => ({
      ...row,
      payment_method: String(row?.payment_method || '').toLowerCase()
    }));
    landlordMethodsCacheLandlordId = landlordId;
    return landlordMethodsCache;
  }

  // On error, don't cache so future calls can retry
  return data || [];
}

// Load and render payment methods config for apartment edit (Dashboard/Advertise forms)
// Uses same UI as Payment History tab so landlords configure once, applies when clients rent
async function loadPaymentMethodsConfigForApartmentEdit(containerId, selectedMethods, checkboxName, onConfigComplete) {
  const container = document.getElementById(containerId);
  if (!container) return;

  try {
    const client = initSupabase();
    if (!client) {
      container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">Sign in to configure payment methods.</p>';
      return;
    }

    const { data: sess } = await client.auth.getSession();
    const landlordId = sess?.session?.user?.id || null;
    if (!landlordId) {
      container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">Sign in to configure payment methods.</p>';
      return;
    }

    const paymentMethods = await getLandlordPaymentMethodsCached(client, landlordId);

    // Selection rules:
    // - Dashboard edit: use apartment's own payment_methods array (may be empty)
    // - Advertise (new listing): if selectedMethods === null, default-enable all configured methods
    // - Otherwise: use provided array or default to []
    let selected = [];
    if (selectedMethods === null && paymentMethods && paymentMethods.length > 0) {
      // New listing: default all active methods ON
      selected = paymentMethods.map(pm => String(pm.payment_method || '').toLowerCase()).filter(Boolean);
    } else if (Array.isArray(selectedMethods)) {
      selected = selectedMethods.map(m => String(m || '').toLowerCase()).filter(Boolean);
    }
    const opts = {
      container,
      checkboxName: checkboxName || 'payment-methods',
      onConfigComplete: onConfigComplete || null
    };
    updateRentalPaymentMethodsUI(paymentMethods || [], selected, opts);
  } catch (err) {
    console.error('Error loading payment methods config:', err);
    container.innerHTML = '<p style="color: var(--error-color, #ef4444); font-size: 0.9rem;">Failed to load payment methods. Please try again.</p>';
  }
}

// Load and display payment methods for selected apartment
async function loadRentalPaymentMethods(apartmentId) {
  try {
    currentRentedApartmentId = apartmentId;
    
    const client = initSupabase();
    if (!client) return;

    const { data: sess } = await client.auth.getSession();
    const landlordId = sess?.session?.user?.id || null;
    if (!landlordId) return;

    // Load landlord's payment methods
    const { data: paymentMethods, error } = await client
      .from('landlord_payment_methods')
      .select('*')
      .eq('landlord_id', landlordId)
      .eq('is_active', true);

    if (error) {
      console.error('Error loading payment methods:', error);
      return;
    }

    // Get apartment's current payment methods
    const { data: apartment, error: aptError } = await client
      .from('apartments')
      .select('title, location, payment_methods')
      .eq('id', apartmentId)
      .single();

    if (aptError) {
      console.error('Error loading apartment payment methods:', aptError);
      return;
    }

    console.log('🔧 DEBUG: Loaded apartment data:', apartment);
    console.log('🔧 DEBUG: Apartment payment_methods field:', apartment?.payment_methods);
    console.log('🔧 DEBUG: Type of payment_methods:', typeof apartment?.payment_methods);
    console.log('🔧 DEBUG: Is payment_methods array?', Array.isArray(apartment?.payment_methods));

    const apartmentPaymentMethods = (() => {
      if (!apartment?.payment_methods) return [];
      if (Array.isArray(apartment.payment_methods)) return apartment.payment_methods;
      try {
        const parsed = JSON.parse(apartment.payment_methods);
        return Array.isArray(parsed) ? parsed : [];
      } catch (_) {
        return [];
      }
    })();
    console.log('🔧 DEBUG: Normalized apartment payment methods:', apartmentPaymentMethods);
    
    // Update apartment info display
    const nameEl = document.getElementById('selectedApartmentName');
    const locationEl = document.getElementById('selectedApartmentLocation');
    if (nameEl) nameEl.textContent = apartment.title || 'Unknown Apartment';
    if (locationEl) locationEl.textContent = apartment.location || '';
    
    // Show payment methods config section
    const configSection = document.getElementById('paymentMethodsConfig');
    if (configSection) {
      configSection.style.display = 'block';
    }
    
    // Update UI (Payment History tab - uses defaults)
    updateRentalPaymentMethodsUI(paymentMethods, apartmentPaymentMethods, {});

  } catch (error) {
    console.error('Error loading rental payment methods:', error);
  }
}

// Update the rental payment methods UI (reusable for Payment History and apartment edit forms)
// Options: { container, checkboxName, onConfigComplete }
function updateRentalPaymentMethodsUI(availableMethods, selectedMethods, options) {
  const opts = options || {};
  const container = opts.container || document.getElementById('rentalPaymentMethodsContainer');
  const checkboxName = opts.checkboxName || 'rental-payment-methods';
  const onConfigComplete = opts.onConfigComplete || null;
  if (!container) return;
  
  // Clear existing content
  container.innerHTML = '';
  
  // Method display configuration - GCash only
  const methodConfig = {
    'gcash': {
      name: 'GCash',
      icon: 'fas fa-mobile-alt'
    }
  };
  
  // Create a map of configured methods for quick lookup
  const configuredMethods = new Map();
  (availableMethods || []).forEach(methodData => {
    const key = String(methodData?.payment_method || '').toLowerCase();
    if (!key) return;
    configuredMethods.set(key, methodData);
  });
  
  // Generate payment method rows for ALL methods (configured and unconfigured)
  Object.keys(methodConfig).forEach(method => {
    const config = methodConfig[method];
    const methodData = configuredMethods.get(method);
    const isConfigured = !!methodData;

    // If there is an explicit selection list (apartment has saved payment_methods),
    // respect it. Otherwise, automatically select all configured methods so that
    // newly configured payment methods are immediately enabled and their details
    // are shown for this apartment.
    const hasExplicitSelection = Array.isArray(selectedMethods) && selectedMethods.length > 0;
    const isSelected = hasExplicitSelection ? selectedMethods.includes(method) : isConfigured;
    
    const methodRow = document.createElement('div');
    methodRow.className = 'payment-method-row';
    methodRow.style.cssText = `
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 8px;
      background: var(--bg-primary);
      transition: all 0.2s ease;
    `;
    
    // Different display based on whether method is configured
    if (isConfigured) {
      // Method is configured - show enable/disable toggle and details
      methodRow.innerHTML = `
        <div class="payment-method-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; flex: 1;">
              <input type="checkbox" name="${checkboxName}" value="${method}" data-payment-method="${config.name}" ${isSelected ? 'checked' : ''} style="transform: scale(1.2);">
              <span class="payment-method-label" style="display: flex; align-items: center; gap: 8px; font-weight: 500;">
                <i class="${config.icon}" style="color: var(--primary-color);"></i> 
                <span>${config.name}</span>
                <span class="configured-badge" style="background: #28a745; color: white; font-size: 0.7rem; padding: 2px 6px; border-radius: 3px;">Configured</span>
                ${isSelected ? '<span class="enabled-badge" style="background: #007bff; color: white; font-size: 0.7rem; padding: 2px 6px; border-radius: 3px;">Enabled</span>' : '<span class="disabled-badge" style="background: #6c757d; color: white; font-size: 0.7rem; padding: 2px 6px; border-radius: 3px;">Disabled</span>'}
              </span>
            </label>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="edit-payment-btn" data-method="${method}" data-account-name="${(methodData.account_name || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;')}" data-account-number="${(methodData.account_number || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;')}" data-qr-url="${encodeURIComponent(methodData.qr_code_url || '')}" title="Edit ${config.name} details" style="background: var(--primary-color); color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button class="remove-payment-btn" data-method="${method}" title="Remove ${config.name}" style="background: var(--error-color, #dc3545); color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">
              <i class="fas fa-trash"></i> Remove
            </button>
          </div>
        </div>
        <div class="payment-method-info" id="${method}-info" style="display: ${isSelected ? 'block' : 'none'}; padding: 8px; background: var(--bg-secondary); border-radius: 4px; font-size: 0.9rem;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <small><strong>Account:</strong> <span class="account-name">${(methodData.account_name || '—').replace(/</g, '&lt;')}</span></small><br>
              <small><strong>Number:</strong> <span class="account-number">${(methodData.account_number || '—').replace(/</g, '&lt;')}</span></small>
            </div>
            <div style="color: var(--text-muted); font-size: 0.8rem;">
              ${isSelected ? '✅ Available to tenants' : '❌ Hidden from tenants'}
            </div>
          </div>
        </div>
      `;
    } else {
      // Method is not configured - show as disabled with configure option
      methodRow.innerHTML = `
        <div class="payment-method-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <label style="display: flex; align-items: center; gap: 8px; opacity: 0.6; flex: 1;">
              <input type="checkbox" name="${checkboxName}" value="${method}" data-payment-method="${config.name}" disabled style="transform: scale(1.2);">
              <span class="payment-method-label" style="display: flex; align-items: center; gap: 8px; font-weight: 500;">
                <i class="${config.icon}" style="color: var(--text-muted);"></i> 
                <span>${config.name}</span>
                <span class="not-configured-badge" style="background: #ffc107; color: #000; font-size: 0.7rem; padding: 2px 6px; border-radius: 3px;">Not Configured</span>
                <span class="disabled-badge" style="background: #6c757d; color: white; font-size: 0.7rem; padding: 2px 6px; border-radius: 3px;">Disabled</span>
              </span>
            </label>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="configure-payment-btn" data-method="${method}" title="Configure ${config.name}" style="background: var(--primary-color); color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">
              <i class="fas fa-plus"></i> Configure
            </button>
          </div>
        </div>
        <div class="payment-method-info" id="${method}-info" style="display: none; padding: 8px; background: var(--bg-secondary); border-radius: 4px; font-size: 0.9rem;">
          <small style="color: var(--text-muted);">Configure this payment method in the Dashboard to enable it for this apartment.</small>
        </div>
      `;
    }
    
    container.appendChild(methodRow);
  });
  
  // Add event listeners for configure buttons
  container.querySelectorAll('.configure-payment-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const method = this.getAttribute('data-method');
      const methodName = methodConfig[method]?.name || method;
      if (onConfigComplete) window._paymentConfigRefreshCallback = onConfigComplete;
      openPaymentMethodConfigModal(method, methodName, null);
    });
  });

  // Add event listeners for edit buttons (pass existing data from row so modal pre-fills)
  container.querySelectorAll('.edit-payment-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const method = this.getAttribute('data-method');
      const methodName = methodConfig[method]?.name || method;
      const fromRow = this.getAttribute('data-account-name') != null || this.getAttribute('data-account-number') != null;
      let qrUrlFromRow = (this.getAttribute('data-qr-url') || '').trim();
      if (qrUrlFromRow) try { qrUrlFromRow = decodeURIComponent(qrUrlFromRow); } catch (_) { qrUrlFromRow = ''; }
      const existing = fromRow ? {
        account_name: (this.getAttribute('data-account-name') || '').trim(),
        account_number: (this.getAttribute('data-account-number') || '').trim(),
        qr_code_url: qrUrlFromRow || null
      } : (window.landlordPaymentMethods && window.landlordPaymentMethods[method]) ? {
        account_name: window.landlordPaymentMethods[method].account_name || '',
        account_number: window.landlordPaymentMethods[method].account_number || '',
        qr_code_url: window.landlordPaymentMethods[method].qr_code_url || null
      } : null;
      if (onConfigComplete) window._paymentConfigRefreshCallback = onConfigComplete;
      openPaymentMethodConfigModal(method, methodName, existing);
    });
  });

  // Add event listeners for remove buttons
  container.querySelectorAll('.remove-payment-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const method = this.getAttribute('data-method');
      if (method) {
        removeLandlordPaymentMethod(method);
      }
    });
  });

  // Add event listeners for enable/disable checkboxes
  container.querySelectorAll(`input[name="${checkboxName}"]`).forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      const method = this.value;
      const infoDiv = document.getElementById(`${method}-info`);
      if (infoDiv) {
        infoDiv.style.display = this.checked ? 'block' : 'none';
        
        // Update status text
        const statusText = infoDiv.querySelector('div:last-child');
        if (statusText) {
          statusText.innerHTML = this.checked ? 
            '✅ Available to tenants' : 
            '❌ Hidden from tenants';
        }
      }
      
      // Update summary
      updateEnabledMethodsSummary();
    });
  });

  // Update the summary of enabled methods (only for Payment History - has summaryEl)
  const summaryEl = document.getElementById('enabledMethodsSummary');
  if (summaryEl) updateEnabledMethodsSummary(checkboxName);
}

// Update the summary of enabled payment methods (Payment History tab only)
function updateEnabledMethodsSummary(checkboxName) {
  const name = checkboxName || 'rental-payment-methods';
  const summaryEl = document.getElementById('enabledMethodsSummary');
  if (!summaryEl) return;

  const checkedBoxes = document.querySelectorAll(`input[name="${name}"]:checked`);
  const enabledCount = checkedBoxes.length;
  const totalMethods = document.querySelectorAll(`input[name="${name}"]`).length;

  if (enabledCount === 0) {
    summaryEl.innerHTML = '<i class="fas fa-exclamation-triangle" style="color: #ffc107;"></i> No payment methods enabled';
  } else if (enabledCount === totalMethods) {
    summaryEl.innerHTML = `<i class="fas fa-check-circle" style="color: #28a745;"></i> All ${enabledCount} payment methods enabled`;
  } else {
    summaryEl.innerHTML = `<i class="fas fa-info-circle" style="color: #007bff;"></i> ${enabledCount} of ${totalMethods} payment methods enabled`;
  }
}

// Remove/deactivate a landlord payment method (from Payment History management)
async function removeLandlordPaymentMethod(method) {
  const methodName = method.charAt(0).toUpperCase() + method.slice(1);
  const confirmed = window.confirm(`Remove ${methodName} payment method?\n\nTenants will no longer see this option. You can reconfigure it later if needed.`);
  if (!confirmed) return;

  try {
    const client = initSupabase();
    if (!client) {
      alert('Database connection not available.');
      return;
    }

    const { data: sess } = await client.auth.getSession();
    const landlordId = sess?.session?.user?.id || null;
    if (!landlordId) {
      alert('Please log in to manage payment methods.');
      return;
    }

    const methodKey = method.toLowerCase();
    const { error } = await client
      .from('landlord_payment_methods')
      .delete()
      .eq('landlord_id', landlordId)
      .eq('payment_method', methodKey);

    if (error) {
      console.error('Error removing payment method:', error);
      alert('Failed to remove payment method. Please try again.');
      return;
    }

    // Keep in-memory cache in sync
    if (window.landlordPaymentMethods) {
      delete window.landlordPaymentMethods[methodKey];
    }
    landlordMethodsCache = null;
    landlordMethodsCacheLandlordId = null;

    await loadLandlordPaymentMethods();

    updatePaymentMethodCheckboxes();

    if (window.currentRentedApartmentId) {
      await loadRentalPaymentMethods(window.currentRentedApartmentId);
    }

    const dashContainer = document.getElementById('dashboardPaymentMethodsContainer');
    if (dashContainer) {
      await loadPaymentMethodsConfigForApartmentEdit('dashboardPaymentMethodsContainer', null, 'payment-methods');
    }
    const advContainer = document.getElementById('advertisePaymentMethodsContainer');
    if (advContainer) {
      await loadPaymentMethodsConfigForApartmentEdit('advertisePaymentMethodsContainer', null, 'payment-methods');
    }

    alert(`${methodName} payment method removed.`);
  } catch (err) {
    console.error('Unexpected error removing payment method:', err);
    alert('Unexpected error while removing payment method.');
  }
}

// Open payment method configuration modal
function openPaymentMethodConfigModal(method, methodName, existingData) {
  existingData = existingData || null;
  // Get method-specific requirements
  const getMethodRequirements = (method) => {
    switch(method) {
      case 'gcash':
        return {
          accountLabel: 'Account Name:',
          accountPlaceholder: 'Enter your GCash account name',
          numberLabel: 'Mobile Number:',
          numberPlaceholder: '09XX XXX XXXX',
          showQR: true,
          qrLabel: 'QR Code Image:',
          qrHelp: 'Upload your GCash QR code for easier payments (PNG, JPG only, max 5MB)'
        };
      case 'paymaya':
        return {
          accountLabel: 'Account Name:',
          accountPlaceholder: 'Enter your PayMaya account name',
          numberLabel: 'Mobile Number:',
          numberPlaceholder: '09XX XXX XXXX',
          showQR: true,
          qrLabel: 'QR Code Image:',
          qrHelp: 'Upload your PayMaya QR code for easier payments (PNG, JPG only, max 5MB)'
        };
      case 'card':
        return {
          accountLabel: 'Cardholder Name:',
          accountPlaceholder: 'Enter cardholder name',
          numberLabel: 'Card Number (last 4 digits):',
          numberPlaceholder: 'XXXX XXXX XXXX 1234',
          showQR: false,
          qrLabel: '',
          qrHelp: ''
        };
      default:
        return {
          accountLabel: 'Account Name:',
          accountPlaceholder: 'Enter account holder name',
          numberLabel: 'Account Number:',
          numberPlaceholder: 'Enter account number',
          showQR: true,
          qrLabel: 'QR Code Image:',
          qrHelp: 'Upload QR code for easier payments (PNG, JPG only, max 5MB)'
        };
    }
  };

  const requirements = getMethodRequirements(method);

  // Create modal HTML with form on left, QR preview on right
  const modalHTML = `
    <div id="paymentConfigModal" style="display: flex; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.4); z-index: 10000; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s ease-in-out; transform: translateZ(0);">
      <div class="paymentdetspop">
        <div class="paymentModal" style="display: flex; flex-direction: column;">
          <span id="closeConfigModal" onclick="closePaymentConfigModal()" style="position: absolute; top: 10px; right: 16px; cursor: pointer; font-size: 20px;">&times;</span>
          <h3 id="paymentConfigTitle">Configure ${methodName}</h3>
          <div style="display: flex; gap: 24px; flex: 1; min-width: 0;">
            <form id="paymentConfigForm" onsubmit="event.preventDefault(); submitPaymentConfig();" style="flex: 1; min-width: 0;">
              <div class="payModalname">
                <label>${requirements.accountLabel}</label>
                <input type="text" name="payeeName" id="configAccountName" required style="width:100%;" placeholder="${requirements.accountPlaceholder}" maxlength="100">
              </div>
              <div class="payModalnum">
                <label>${requirements.numberLabel}</label>
                <input type="text" name="payeeNumber" id="configAccountNumber" required style="width:100%;" placeholder="${requirements.numberPlaceholder}" maxlength="20">
              </div>
              ${requirements.showQR ? `
              <div class="payModalqr">
                <label>${requirements.qrLabel}</label>
                <input id="configQRInput" type="file" name="payeeQR" accept="image/png,image/jpeg,image/jpg" style="width:100%;">
                <small style="color: #666; font-size: 0.8rem;">${requirements.qrHelp}</small>
              </div>
              ` : ''}
              <input type="hidden" name="paymentMethod" id="configPaymentMethodHidden" value="${method}">
              <div class="paySave">
                <button type="submit">Save</button>
              </div>
            </form>
            ${requirements.showQR ? `
            <div class="paymentModalPreview" style="flex-shrink: 0; width: 200px; display: flex; flex-direction: column; align-items: center;">
              <div id="configQRPreview" class="qr-preview" style="text-align: center; min-height: 180px; min-width: 180px; padding: 16px; background: var(--bg-secondary, #f5f5f5); border-radius: 8px; border: 1px dashed var(--border-color, #ddd); display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <img id="configQRPreviewImg" src="" alt="QR preview" style="max-width: 160px; max-height: 160px; object-fit: contain; display: none;">
                <span id="configQRPreviewPlaceholder" style="color: var(--text-muted, #666); font-size: 0.85rem;">No QR code selected</span>
              </div>
            </div>
            ` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Add modal to page
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Pre-fill when editing
  const nameEl = document.getElementById('configAccountName');
  const numberEl = document.getElementById('configAccountNumber');
  if (existingData) {
    if (nameEl && existingData.account_name) nameEl.value = existingData.account_name;
    if (numberEl && existingData.account_number) numberEl.value = existingData.account_number;
    window.currentConfigExistingQrUrl = existingData.qr_code_url || null;
  } else {
    window.currentConfigExistingQrUrl = null;
  }
  
  // Show existing QR in preview when editing (so it is retained if user does not upload a new file)
  if (requirements.showQR && existingData && existingData.qr_code_url) {
    const previewImg = document.getElementById('configQRPreviewImg');
    const placeholder = document.getElementById('configQRPreviewPlaceholder');
    const previewDiv = document.getElementById('configQRPreview');
    if (previewImg && placeholder) {
      previewImg.src = existingData.qr_code_url;
      previewImg.style.display = 'inline';
      placeholder.style.display = 'none';
      placeholder.textContent = 'No QR code selected';
      if (previewDiv) {
        const hint = previewDiv.querySelector('.qr-current-hint');
        if (!hint) {
          const span = document.createElement('span');
          span.className = 'qr-current-hint';
          span.style.cssText = 'display: block; margin-top: 6px; font-size: 0.75rem; color: var(--text-muted, #666);';
          span.textContent = 'Current QR code — upload a new image to replace.';
          previewDiv.appendChild(span);
        }
      }
    }
  }
  
  // QR file input: preview when user selects a new file
  if (requirements.showQR) {
    const qrInput = document.getElementById('configQRInput');
    const previewImg = document.getElementById('configQRPreviewImg');
    const placeholder = document.getElementById('configQRPreviewPlaceholder');
    if (qrInput && previewImg && placeholder) {
      qrInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = function(e) {
            previewImg.src = e.target.result;
            previewImg.style.display = 'inline';
            placeholder.style.display = 'none';
          };
          reader.readAsDataURL(file);
        } else {
          previewImg.src = '';
          previewImg.style.display = 'none';
          if (window.currentConfigExistingQrUrl) {
            previewImg.src = window.currentConfigExistingQrUrl;
            previewImg.style.display = 'inline';
            placeholder.style.display = 'none';
          } else {
            placeholder.style.display = 'inline';
            placeholder.textContent = 'No QR code selected';
          }
        }
      });
    }
  }
  
  // Show modal with smooth transition
  const modal = document.getElementById('paymentConfigModal');
  requestAnimationFrame(() => {
    modal.style.opacity = '1';
  });
  
  // Store current method for submission
  window.currentConfigMethod = method;
  window.currentConfigMethodName = methodName;
}

// Close payment configuration modal
function closePaymentConfigModal() {
  const modal = document.getElementById('paymentConfigModal');
  if (modal) {
    // Fade out
    modal.style.opacity = '0';
    setTimeout(() => {
      modal.remove();
    }, 200);
  }
  window.currentConfigMethod = null;
  window.currentConfigMethodName = null;
  window.currentConfigExistingQrUrl = null;
}

// Submit payment configuration
async function submitPaymentConfig() {
  const method = window.currentConfigMethod;
  const methodName = window.currentConfigMethodName;
  let originalText = 'Save';

  if (!method || !methodName) {
    alert('Configuration error. Please try again.');
    return;
  }

  try {
    const client = initSupabase();
    if (!client) {
      alert('Database connection not available');
      return;
    }

    const { data: sess } = await client.auth.getSession();
    const landlordId = sess?.session?.user?.id || null;
    if (!landlordId) {
      alert('Please log in to configure payment methods');
      return;
    }

    // Get form data using the same field names as existing modal
    const accountName = document.getElementById('configAccountName').value.trim();
    const accountNumber = document.getElementById('configAccountNumber').value.trim();
    const qrCodeFile = document.getElementById('configQRInput')?.files[0];

    if (!accountName || !accountNumber) {
      alert('Please fill in all required fields');
      return;
    }

    // Show loading
    const submitBtn = document.querySelector('#paymentConfigForm button[type="submit"]');
    if (submitBtn) originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = 'Saving...';
    submitBtn.disabled = true;

    let qrCodeUrl = window.currentConfigExistingQrUrl || null;

    // Upload QR code if user selected a new file; otherwise keep existing URL
    if (qrCodeFile) {
      try {
        const fileExt = qrCodeFile.name.split('.').pop();
        const fileName = `${landlordId}/${method}_qr_${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await client.storage
          .from('payment-qr-codes')
          .upload(fileName, qrCodeFile);

        if (uploadError) {
          console.warn('QR code upload failed:', uploadError);
        } else {
          const { data: urlData } = client.storage
            .from('payment-qr-codes')
            .getPublicUrl(fileName);
          qrCodeUrl = urlData.publicUrl;
        }
      } catch (uploadErr) {
        console.warn('QR code upload error:', uploadErr);
      }
    }

    // Save to database
    const { data, error } = await client
      .from('landlord_payment_methods')
      .upsert({
        landlord_id: landlordId,
        payment_method: method,
        account_name: accountName,
        account_number: accountNumber,
        qr_code_url: qrCodeUrl,
        is_active: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'landlord_id,payment_method'
      });

    if (error) {
      console.error('Error saving payment method:', error);
      alert('Failed to save payment method. Please try again.');
      return;
    }

    // Success
    alert(`${methodName} configured successfully!`);

    // Invalidate landlord methods cache so future loads see fresh data
    landlordMethodsCache = null;
    landlordMethodsCacheLandlordId = null;
    closePaymentConfigModal();
    
    // Refresh the payment methods display
    // Invalidate cached landlord methods so new config is reflected everywhere
    landlordMethodsCache = null;
    landlordMethodsCacheLandlordId = null;

    if (currentRentedApartmentId) {
      loadRentalPaymentMethods(currentRentedApartmentId);
    }

    // Force-refresh embedded payment method configs (Dashboard + Advertise)
    // so the "Not Configured" row immediately becomes "Configured" without F5.
    try {
      if (typeof loadPaymentMethodsConfigForApartmentEdit === 'function') {
        const dashContainer = document.getElementById('dashboardPaymentMethodsContainer');
        if (dashContainer) {
          loadPaymentMethodsConfigForApartmentEdit('dashboardPaymentMethodsContainer', null, 'payment-methods', null);
        }
        const advContainer = document.getElementById('advertisePaymentMethodsContainer');
        if (advContainer) {
          loadPaymentMethodsConfigForApartmentEdit('advertisePaymentMethodsContainer', null, 'payment-methods', null);
        }
      }
    } catch (_) {}

    // Also refresh apartment edit forms if callback was set (Dashboard/Advertise)
    if (typeof window._paymentConfigRefreshCallback === 'function') {
      try { window._paymentConfigRefreshCallback(); } catch (_) {}
      window._paymentConfigRefreshCallback = null;
    }

  } catch (error) {
    console.error('Error in submitPaymentConfig:', error);
    alert('An error occurred while saving. Please try again.');
  } finally {
    // Reset button
    const submitBtn = document.querySelector('#paymentConfigForm button[type="submit"]');
    if (submitBtn) {
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  }
}

// Update rental payment methods
async function updateRentalPaymentMethods() {
  if (!currentRentedApartmentId) {
    alert('No apartment selected');
    return;
  }

  try {
    const client = initSupabase();
    if (!client) {
      throw new Error('Supabase client not available');
    }

    // Get selected payment methods
    const checkboxes = document.querySelectorAll('[name="rental-payment-methods"]:checked');
    const selectedMethods = Array.from(checkboxes).map(cb => cb.value);
    
    console.log('🔧 DEBUG: All rental-payment-methods checkboxes:', document.querySelectorAll('[name="rental-payment-methods"]'));
    console.log('🔧 DEBUG: Selected checkboxes:', checkboxes);
    console.log('🔧 DEBUG: Selected methods:', selectedMethods);
    console.log('🔧 DEBUG: Number of selected methods:', selectedMethods.length);
    
    // Validate that we have selected methods
    if (selectedMethods.length === 0) {
        alert('Please select at least one payment method for this apartment.');
        return;
    }

    // Update apartment payment methods
    console.log('🔧 DEBUG: Updating apartment payment methods:', selectedMethods);
    console.log('🔧 DEBUG: Apartment ID:', currentRentedApartmentId);
    
    const { error } = await client
      .from('apartments')
      .update({
        payment_methods: selectedMethods
      })
      .eq('id', currentRentedApartmentId);
    
    if (error) {
      console.error('🔧 ERROR: Failed to update apartment payment methods:', error);
    } else {
      console.log('🔧 SUCCESS: Apartment payment methods updated successfully');
    }

    if (error) throw error;

    // Show success message
    alert('Payment methods updated successfully!');
    
    // Reload the payment methods display
    await loadRentalPaymentMethods(currentRentedApartmentId);
    
    // Notify client side to refresh payment methods
    console.log('🔧 DEBUG: Notifying client to refresh payment methods for apartment:', currentRentedApartmentId);
    // This will trigger the client to refresh their payment methods
    window.dispatchEvent(new CustomEvent('apartmentPaymentMethodsUpdated', {
        detail: { apartmentId: currentRentedApartmentId, selectedMethods: selectedMethods }
    }));

  } catch (error) {
    console.error('Error updating rental payment methods:', error);
    alert('Error updating payment methods. Please try again.');
  }
}


// Ensure Supabase client is ready with retry mechanism
async function ensureSupabaseClient(maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const client = initSupabase();
    if (client) {
      console.log('✅ Supabase client ready');
      return client;
    }
    
    console.log(`⏳ Waiting for Supabase client... (attempt ${i + 1}/${maxRetries})`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.error('❌ Failed to initialize Supabase client after', maxRetries, 'attempts');
  return null;
}

// Set up real-time payment updates for landlords
async function setupLandlordPaymentRealtime() {
  try {
    const client = await ensureSupabaseClient();
    if (!client) {
      console.error('❌ Cannot set up real-time updates: Supabase client not available');
      return;
    }

    const { data: sess } = await client.auth.getSession();
    const landlordId = sess?.session?.user?.id;
    if (!landlordId) {
      console.log('❌ No authenticated user found for real-time setup');
      return;
    }

    console.log('🔄 Setting up real-time payment updates for landlord:', landlordId);

    // Get landlord's apartments
    const { data: apartments } = await client
      .from('apartments')
      .select('id')
      .eq('landlord_id', landlordId);

    const apartmentIds = (apartments || []).map(apt => apt.id);
    if (!apartmentIds.length) {
      console.log('❌ No apartments found for real-time setup');
      return;
    }

    console.log('🏠 Setting up real-time for apartments:', apartmentIds);

    // Subscribe to payment changes for landlord's apartments
    const subscription = client
      .channel('landlord-payments')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'payments',
        filter: `apartment_id=in.(${apartmentIds.join(',')})`
      }, (payload) => {
        console.log('💰 New payment received in real-time:', payload.new);
        console.log('🔄 Refreshing payment history and income summary...');
        
        // Refresh payment history when new payment is received
        setTimeout(() => {
          renderPaymentHistory();
        }, 1000);
      })
      .subscribe();

    console.log('✅ Real-time payment subscription active');
    return subscription;

  } catch (error) {
    console.error('❌ Error setting up real-time payments:', error);
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
  // Clear old client-side caches to prevent stale/mismatched details
  try {
    localStorage.removeItem('apartrent_listings');
    localStorage.removeItem('landlord_modal_state');
    localStorage.removeItem('landlord_active_tab');
    localStorage.removeItem('lastUserEmail');
    localStorage.removeItem('lastUserName');
    localStorage.removeItem('lastUserRole');
    localStorage.removeItem('lastUserId');
    // Remove any walk-in tenant cached keys
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith('apartrent-walkin-tenant:')) {
        localStorage.removeItem(k);
      }
    }
  } catch (_) {}

  // Load payment history when Payment History tab is clicked
  document.addEventListener('click', function(e) {
    if (e.target.closest('[data-target="PaymentHistory"]')) {
      setTimeout(() => {
        renderPaymentHistory();
      }, 300);
    }
  });


  // Handle rental payment method checkbox changes (Payment History tab)
  document.addEventListener('change', function(e) {
    if (e.target.type === 'checkbox' && e.target.name === 'rental-payment-methods') {
      const method = e.target.value;
      const infoDiv = document.getElementById(`${method}-info`);
      
      if (infoDiv) {
        if (e.target.checked) {
          infoDiv.style.display = 'block';
        } else {
          infoDiv.style.display = 'none';
        }
      }
    }
  });

  // Setup search for Dashboard
  setupLandlordDashboardSearch();

  // Setup search for Payment History tab
  const paymentTab = document.querySelector('[data-target="PaymentHistory"]');
  if (paymentTab) {
    paymentTab.addEventListener('click', () => {
      setTimeout(() => {
        setupLandlordPaymentSearch();
      }, 100);
    });
  }
});

// Setup search for Landlord Dashboard
function setupLandlordDashboardSearch() {
  const input = document.getElementById('landlordSearch');
  if (!input) return;

  let currentFilter = 'default';
  let allListings = [];

  // Get listings from DOM
  const getListings = () => {
    const container = document.getElementById('landlordListings');
    if (!container) return [];
    const cards = container.querySelectorAll('.outerad');
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
    const container = document.getElementById('landlordListings');
    if (!container) return;
    
    // Remove any existing no results message
    const existingMsg = container.querySelector('.no-results-message');
    if (existingMsg) existingMsg.remove();
    
    const allCards = container.querySelectorAll('.outerad');
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
      noResults.textContent = 'No apartments match your search';
      container.appendChild(noResults);
    } else {
      // Reorder DOM elements based on sorted array
      filtered.forEach((item, index) => {
        if (item.element) {
          item.element.style.display = '';
          item.element.style.order = index; // Use CSS order for grid layout
        }
      });
    }
  };

  // Search functionality
  input.addEventListener('input', async () => {
    allListings = getListings();
    const q = input.value.toLowerCase();
    const filtered = allListings.filter(item => {
      return (
        item.location.toLowerCase().includes(q) ||
        item.price.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    });
    const sorted = await applySortFilterLandlord(filtered, currentFilter);
    renderFiltered(sorted);
  });

  // Filter dropdown
  const filterIcon = document.getElementById('landlordFilterIcon');
  const filterMenu = document.getElementById('landlordFilterMenu');
  const filterOptions = document.querySelectorAll('#landlordFilterMenu .filter-option');

  if (filterIcon && filterMenu) {
    filterIcon.addEventListener('click', (e) => {
      e.stopPropagation();
      filterMenu.classList.toggle('show');
      filterIcon.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#landlordFilterDropdown')) {
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

        allListings = getListings();
        const q = input.value.toLowerCase();
        let filtered = allListings;
        if (q) {
          filtered = allListings.filter(item => {
            return (
              item.location.toLowerCase().includes(q) ||
              item.price.toLowerCase().includes(q) ||
              item.description.toLowerCase().includes(q)
            );
          });
        }
        const sorted = await applySortFilterLandlord(filtered, filterType);
        renderFiltered(sorted);
      });
    });
  }
}

// Setup search for Landlord Rented apartments
function setupLandlordRentedSearch() {
  const input = document.getElementById('rentedSearch');
  if (!input) return;

  let currentFilter = 'default';
  let allListings = [];

  // Get listings from DOM
  const getListings = () => {
    const container = document.getElementById('landlordRentedListings');
    if (!container) return [];
    const cards = container.querySelectorAll('.outerad');
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
    const container = document.getElementById('landlordRentedListings');
    if (!container) return;
    const allCards = container.querySelectorAll('.outerad');
    allCards.forEach(card => card.style.display = 'none');
    // Reorder DOM elements based on sorted array
    filtered.forEach((item, index) => {
      if (item.element) {
        item.element.style.display = '';
        item.element.style.order = index; // Use CSS order for grid layout
      }
    });
  };

  // Search functionality
  input.addEventListener('input', async () => {
    allListings = getListings();
    const q = input.value.toLowerCase();
    const filtered = allListings.filter(item => {
      return (
        item.location.toLowerCase().includes(q) ||
        item.price.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    });
    const sorted = await applySortFilterLandlord(filtered, currentFilter);
    renderFiltered(sorted);
  });

  // Filter dropdown
  const filterIcon = document.getElementById('rentedFilterIcon');
  const filterMenu = document.getElementById('rentedFilterMenu');
  const filterOptions = document.querySelectorAll('#rentedFilterMenu .filter-option');

  if (filterIcon && filterMenu) {
    filterIcon.addEventListener('click', (e) => {
      e.stopPropagation();
      filterMenu.classList.toggle('show');
      filterIcon.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#rentedFilterDropdown')) {
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

        allListings = getListings();
        const q = input.value.toLowerCase();
        let filtered = allListings;
        if (q) {
          filtered = allListings.filter(item => {
            return (
              item.location.toLowerCase().includes(q) ||
              item.price.toLowerCase().includes(q) ||
              item.description.toLowerCase().includes(q)
            );
          });
        }
        const sorted = await applySortFilterLandlord(filtered, filterType);
        renderFiltered(sorted);
      });
    });
  }
}

// Setup search for Landlord Payment History
function setupLandlordPaymentSearch() {
  const input = document.getElementById('paymentSearch');
  if (!input) return;

  let currentFilter = 'default';

  // Search functionality
  input.addEventListener('input', () => {
    const q = input.value.toLowerCase();
    const table = document.getElementById('landlordHistoryTable');
    if (!table) return;
    
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(q) ? '' : 'none';
    });
  });

  // Filter dropdown
  const filterIcon = document.getElementById('paymentFilterIcon');
  const filterMenu = document.getElementById('paymentFilterMenu');
  const filterOptions = document.querySelectorAll('#paymentFilterMenu .filter-option');

  if (filterIcon && filterMenu) {
    filterIcon.addEventListener('click', (e) => {
      e.stopPropagation();
      filterMenu.classList.toggle('show');
      filterIcon.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#paymentFilterDropdown')) {
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
        sortLandlordPaymentTable(filterType);
      });
    });
  }
}

// Sort landlord payment table
function sortLandlordPaymentTable(filterType) {
  const table = document.getElementById('landlordHistoryTable');
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
        const amountB = parseFloat(a.cells[2]?.textContent.replace(/[₱,]/g, '') || 0);
        return amountB - amountA;
      default:
        return 0;
    }
  });

  rows.forEach(row => tbody.appendChild(row));
}

// Helper function to apply sorting filters for landlord
async function applySortFilterLandlord(listings, filterType) {
  const client = initSupabase();
  
  switch(filterType) {
    case 'price':
      return [...listings].sort((a, b) => {
        const priceA = parseFloat(a.price) || 0;
        const priceB = parseFloat(b.price) || 0;
        return priceA - priceB;
      });
      
    case 'rating':
      if (!client) return listings;
      try {
        const apartmentIds = listings.map(item => item.id);
        const { data: reviews } = await client
          .from('reviews')
          .select('apartment_id, rating, visible')
          .in('apartment_id', apartmentIds)
          .eq('visible', true);

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

        return [...listings].sort((a, b) => {
          const idA = String(a.id);
          const idB = String(b.id);
          const avgA = ratingMap.has(idA) ? ratingMap.get(idA).total / ratingMap.get(idA).count : 0;
          const avgB = ratingMap.has(idB) ? ratingMap.get(idB).total / ratingMap.get(idB).count : 0;
          return avgB - avgA;
        });
      } catch (error) {
        console.error('Error sorting by rating:', error);
        return listings;
      }

    case 'default':
    default:
      return listings;
  }
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
            // Show conversation list for landlords
            showConversationList();
            loadConversationList();
            listenForConversationUpdates();
            // Clear unread badge when opening
            const badge = document.getElementById('unreadBadge');
            if (badge) {
                badge.style.display = 'none';
                badge.textContent = '0';
            }
        }
    }
}

// Show conversation list view
function showConversationList() {
    const conversationsView = document.getElementById('chatConversationsView');
    const messagesView = document.getElementById('chatMessagesView');
    
    if (conversationsView && messagesView) {
        conversationsView.style.display = 'flex';
        messagesView.style.display = 'none';
    }
}

// Show individual chat view
async function showChatView(clientName, apartmentId, clientId) {
    const conversationsView = document.getElementById('chatConversationsView');
    const messagesView = document.getElementById('chatMessagesView');
    
    if (conversationsView && messagesView) {
        conversationsView.style.display = 'none';
        messagesView.style.display = 'flex';
        
        // Update chat context
        currentApartmentId = apartmentId;
        window.currentClientId = clientId;
        
        const chatName = document.getElementById('floatingChatName');
        // Only set the name if it's still the generic placeholder
        if (chatName && (chatName.textContent === 'Client' || !chatName.textContent)) {
            chatName.textContent = clientName;
        }
        
        // Try to fetch more accurate name from profiles if we have clientId
        if (clientId) {
            const client = initSupabase();
            if (client) {
                try {
                    const { data: profile } = await client
                        .from('profiles')
                        .select('full_name, email')
                        .eq('id', clientId)
                        .single();
                    
                    // Only override if header is still generic / empty
                    if (profile && chatName && (chatName.textContent === 'Client' || !chatName.textContent)) {
                        const properName = profile.full_name || profile.email?.split('@')[0] || clientName;
                        chatName.textContent = properName;
                    }
                } catch (e) {
                    console.log('Could not fetch client profile:', e);
                }
            }
        }

        const displayName = (chatName && chatName.textContent && chatName.textContent.trim())
            ? chatName.textContent.trim()
            : clientName;
        await checkLandlordChatRentDueReminder(apartmentId, clientId, displayName);
        await loadFloatingChatMessages();
        listenForFloatingMessages();
    }
}

// Load conversation list for landlord
async function loadConversationList() {
    const conversationList = document.getElementById('conversationList');
    const conversationCount = document.getElementById('conversationCount');
    
    if (!conversationList) return;
    
    const client = initSupabase();
    if (!client) return;
    
    try {
        // Get current landlord's user ID
        const { data: { user } } = await client.auth.getUser();
        if (!user) return;
        
        // First, get all apartments owned by this landlord
        const { data: landlordApartments, error: aptError } = await client
            .from('apartments')
            .select('id')
            .eq('landlord_id', user.id);
        
        if (aptError) throw aptError;
        
        const landlordApartmentIds = landlordApartments ? landlordApartments.map(apt => apt.id) : [];
        
        if (landlordApartmentIds.length === 0) {
            conversationList.innerHTML = '<div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">No apartments listed yet</div>';
            if (conversationCount) {
                conversationCount.textContent = '0 conversations';
            }
            return;
        }
        
        // Fetch all messages for landlord's apartments
        const { data: messages, error } = await client
            .from('messages')
            .select('*')
            .in('apartment_id', landlordApartmentIds)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Group messages by apartment_id and get latest message for each
        const conversationsMap = new Map();
        
        messages.forEach(msg => {
            const key = msg.apartment_id;
            if (!conversationsMap.has(key)) {
                conversationsMap.set(key, {
                    apartmentId: msg.apartment_id,
                    clientName: msg.sender_type === 'client' ? msg.sender_name : null,
                    clientId: msg.sender_type === 'client' ? msg.sender_id : null,
                    lastMessage: msg.message,
                    lastMessageTime: msg.created_at,
                    unreadCount: 0
                });
            } else {
                // Update client name if we find it
                const conv = conversationsMap.get(key);
                if (msg.sender_type === 'client' && msg.sender_name && !conv.clientName) {
                    conv.clientName = msg.sender_name;
                    conv.clientId = msg.sender_id;
                }
            }
        });
        
        // Convert to array and filter out conversations without client names
        let conversations = Array.from(conversationsMap.values())
            .filter(conv => conv.clientName);
        
        // Fetch proper names from profiles table
        const clientIds = [...new Set(conversations.map(c => c.clientId).filter(Boolean))];
        if (clientIds.length > 0) {
            const { data: profiles } = await client
                .from('profiles')
                .select('id, full_name, email')
                .in('id', clientIds);
            
            if (profiles) {
                const profileMap = new Map();
                profiles.forEach(p => {
                    const name = p.full_name || p.email?.split('@')[0] || null;
                    if (name) profileMap.set(p.id, name);
                });
                
                // Update conversation names with profile names
                conversations = conversations.map(conv => {
                    if (conv.clientId && profileMap.has(conv.clientId)) {
                        conv.clientName = profileMap.get(conv.clientId);
                    }
                    return conv;
                });
            }
        }
        
        // Update count
        if (conversationCount) {
            conversationCount.textContent = `${conversations.length} conversation${conversations.length !== 1 ? 's' : ''}`;
        }
        
        // Clear list
        conversationList.innerHTML = '';
        
        if (conversations.length === 0) {
            conversationList.innerHTML = '<div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">No conversations yet. Clients will appear here when they message you.</div>';
            return;
        }
        
        // Fetch apartment details for conversations
        const apartmentDetailsMap = new Map();
        if (conversations.length > 0) {
            const apartmentIds = conversations.map(c => c.apartmentId).filter(Boolean);
            if (apartmentIds.length > 0) {
                const { data: apartments } = await client
                    .from('apartments')
                    .select('id, location, price')
                    .in('id', apartmentIds);
                
                if (apartments) {
                    apartments.forEach(apt => {
                        apartmentDetailsMap.set(apt.id, apt);
                    });
                }
            }
        }
        
        // Render conversation items
        conversations.forEach(conv => {
            const item = document.createElement('div');
            item.className = 'conversation-item';
            item.onclick = () => showChatView(conv.clientName, conv.apartmentId, conv.clientId);
            
            const initials = conv.clientName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            const timeAgo = getTimeAgo(new Date(conv.lastMessageTime));
            
            // Get apartment details
            const aptDetails = apartmentDetailsMap.get(conv.apartmentId);
            const aptInfo = aptDetails ? `<small style="color: var(--text-muted); font-size: 11px; display: block; margin-top: 2px;">${aptDetails.location} - ₱${aptDetails.price}/mo</small>` : '';
            
            item.innerHTML = `
                <div class="conversation-avatar">${initials}</div>
                <div class="conversation-details">
                    <h4 class="conversation-name">${conv.clientName}</h4>
                    ${aptInfo}
                    <p class="conversation-preview">${conv.lastMessage}</p>
                </div>
                <div class="conversation-meta">
                    <span class="conversation-time">${timeAgo}</span>
                </div>
            `;
            
            conversationList.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading conversations:', error);
        conversationList.innerHTML = '<div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">Error loading conversations</div>';
    }
}

// Helper function to get time ago
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
}

// Listen for new messages to update conversation list
function listenForConversationUpdates() {
    const client = initSupabase();
    if (!client) return;

    // Clean up previous channel
    try {
        if (window.__conversationChannel && typeof window.__conversationChannel.unsubscribe === 'function') {
            window.__conversationChannel.unsubscribe();
        }
    } catch (_) {}

    const channel = client.channel('conversation-updates');
    window.__conversationChannel = channel;

    channel
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages'
        }, () => {
            // Reload conversation list when new message arrives
            loadConversationList();
        })
        .subscribe();
}

function landlordDateOnlyFromDate(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Same calendar day as move-in each month; daysUntil 0 = today, negative = overdue. */
function getRentDueStatusFromMoveIn(moveInRaw, ref = new Date()) {
    if (moveInRaw == null || String(moveInRaw).trim() === '') return null;
    const mi = new Date(moveInRaw);
    if (isNaN(mi.getTime())) return null;
    const refDay = landlordDateOnlyFromDate(ref);
    const dom = mi.getDate();
    const y = refDay.getFullYear();
    const m = refDay.getMonth();
    let dueThisMonth = new Date(y, m, dom);
    if (dueThisMonth.getMonth() !== m) {
        dueThisMonth = new Date(y, m + 1, 0);
    }
    const tRef = refDay.getTime();
    const tDue = landlordDateOnlyFromDate(dueThisMonth).getTime();
    if (tRef === tDue) return { dueDate: dueThisMonth, daysUntil: 0 };
    if (tRef < tDue) {
        return { dueDate: dueThisMonth, daysUntil: Math.round((tDue - tRef) / 86400000) };
    }
    const daysLate = Math.round((tRef - tDue) / 86400000);
    return { dueDate: dueThisMonth, daysUntil: -daysLate };
}

function prependLandlordRentDueReminderInto(el) {
    if (!el) return;
    el.querySelectorAll('[data-rent-due-reminder="1"]').forEach((n) => n.remove());
    const rem = window.__rentDueFloatingReminder;
    const apt = currentApartmentId;
    if (!rem || !rem.text || !apt || String(rem.apartmentId) !== String(apt)) return;
    const div = document.createElement('div');
    div.className = 'msg rent-due-reminder';
    div.setAttribute('data-rent-due-reminder', '1');
    div.setAttribute('role', 'status');
    div.textContent = rem.text;
    el.insertBefore(div, el.firstChild);
    // If the due-date notice is being shown in floating chat while closed,
    // ensure the bubble shows a "1" reminder.
    if (el.id === 'floatingChatMessages') {
        setChatBubbleReminderToOne();
    }
    try {
        el.scrollTop = el.scrollHeight;
    } catch (_) {}
}

/** Injects `.msg.rent-due-reminder` into floating chat and main dashboard `#messages`. */
function prependLandlordRentDueReminders() {
    prependLandlordRentDueReminderInto(document.getElementById('floatingChatMessages'));
    prependLandlordRentDueReminderInto(document.getElementById('messages'));
    // If we have a due reminder for the currently selected apartment, ensure the
    // chat bubble shows a "1" reminder when the widget is closed.
    try {
        const rem = window.__rentDueFloatingReminder;
        const apt = currentApartmentId;
        if (rem && rem.text && apt && String(rem.apartmentId) === String(apt)) {
            setChatBubbleReminderToOne(false);
        }
    } catch (_) {}
}

/** Sets banner text for dashboard listing chat (no toast). Conversation view uses checkLandlordChatRentDueReminder. */
async function hydrateLandlordRentDueReminderForDashboardApartment(apartmentId) {
    if (!apartmentId) return;
    const client = initSupabase();
    if (!client) return;
    try {
        const { data: rows, error } = await client
            .from('apartment_rentals')
            .select('user_id, move_in_date')
            .eq('apartment_id', apartmentId)
            .eq('rental_status', 'active');
        if (error || !rows?.length) {
            window.__rentDueFloatingReminder = null;
            return;
        }
        const dueLines = [];
        for (const row of rows) {
            const st = getRentDueStatusFromMoveIn(row.move_in_date);
            if (st && st.daysUntil <= 0) dueLines.push({ row, st });
        }
        if (!dueLines.length) {
            window.__rentDueFloatingReminder = null;
            return;
        }
        const uniqueIds = [...new Set(dueLines.map((d) => d.row.user_id).filter(Boolean))];
        const profileMap = new Map();
        if (uniqueIds.length) {
            const { data: profiles } = await client
                .from('profiles')
                .select('id, full_name, email')
                .in('id', uniqueIds);
            (profiles || []).forEach((p) => profileMap.set(p.id, p));
        }
        const parts = [];
        for (const { row, st } of dueLines) {
            const p = row.user_id ? profileMap.get(row.user_id) : null;
            const who = (p?.full_name || p?.email?.split('@')[0] || 'Tenant').trim() || 'Tenant';
            const dueStr = st.dueDate.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
            parts.push(
                st.daysUntil === 0
                    ? `${who}: monthly rent due today (${dueStr}), based on move-in date.`
                    : `${who}: rent was due ${dueStr} (${Math.abs(st.daysUntil)} day(s) overdue), based on move-in date.`
            );
        }
        window.__rentDueFloatingReminder = { apartmentId, text: parts.join(' ') };
    } catch (_) {
        window.__rentDueFloatingReminder = null;
    }
}

async function checkLandlordChatRentDueReminder(apartmentId, clientUserId, clientDisplayName) {
    window.__rentDueFloatingReminder = null;
    if (!apartmentId || !clientUserId) return;
    const client = initSupabase();
    if (!client) return;
    try {
        const { data: rows, error } = await client
            .from('apartment_rentals')
            .select('move_in_date')
            .eq('apartment_id', apartmentId)
            .eq('user_id', clientUserId)
            .eq('rental_status', 'active')
            .limit(1);
        if (error || !rows?.length) return;
        const row = rows[0];
        const dueSt = getRentDueStatusFromMoveIn(row.move_in_date);
        if (!dueSt || dueSt.daysUntil > 0) return;
        const dueStr = dueSt.dueDate.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
        const who = (clientDisplayName || 'Tenant').trim() || 'Tenant';
        const body =
            dueSt.daysUntil === 0
                ? `${who}'s monthly rent is due today (${dueStr}), based on their move-in date.`
                : `${who}'s rent was due on ${dueStr} (${Math.abs(dueSt.daysUntil)} day(s) overdue), based on their move-in date.`;
        const day = new Date().toISOString().slice(0, 10);
        const key = `apartrent-due-notify:landlord:${apartmentId}:${clientUserId}:${day}`;
        if (!localStorage.getItem(key)) {
            showMessageNotification('Tenant rent due reminder', body, 'warning', { category: 'Billing' });
            incrementChatBubbleReminder();
            localStorage.setItem(key, '1');
        }
        window.__rentDueFloatingReminder = { apartmentId, text: body };
    } catch (_) {
        /* ignore */
    }
}

// Load previous messages from database
async function loadFloatingChatMessages() {
    const messagesContainer = document.getElementById('floatingChatMessages');
    if (!messagesContainer) return;

    const client = initSupabase();
    if (!client) return;

    const apartmentId = currentApartmentId;
    const isUuid = typeof apartmentId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(apartmentId);
    
    if (!isUuid) {
        messagesContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-muted);">Select a conversation to start chatting</div>';
        return;
    }

    try {
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
            // Do NOT override the header name here.
            // The conversation list / showChatView already set a stable display name.
            messages.forEach(msg => {
                const messageDiv = document.createElement('div');
                messageDiv.className = `msg ${msg.sender_type === 'landlord' ? 'landlord' : 'renter'}`;
                messageDiv.textContent = msg.message;
                messagesContainer.appendChild(messageDiv);
            });
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        prependLandlordRentDueReminders();
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
    if (window.__lastLandlordMsgAt && Date.now() - window.__lastLandlordMsgAt < 1000) {
        return;
    }
    window.__lastLandlordMsgAt = Date.now();

    // Send to Supabase (real-time listener will add it to UI)
    const client = initSupabase();
    if (client) {
        try {
            const apartmentId = currentApartmentId;
            const isUuid = typeof apartmentId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(apartmentId);
            
            // Get current user info
            const { data: { user } } = await client.auth.getUser();
            const senderName = localStorage.getItem('lastUserName') || user?.user_metadata?.full_name || 'Landlord';
            const senderId = user?.id || null;
            
            const { error } = await client
                .from('messages')
                .insert([{
                    sender_type: 'landlord',
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

// Listen for new messages in floating chat
function listenForFloatingMessages() {
    const client = initSupabase();
    if (!client) {
        console.log('Landlord: No Supabase client available');
        return;
    }

    // Clean up previous channel
    try {
        if (window.__floatingChatChannel && typeof window.__floatingChatChannel.unsubscribe === 'function') {
            window.__floatingChatChannel.unsubscribe();
        }
    } catch (_) {}

    const apartmentId = currentApartmentId;
    const isUuid = typeof apartmentId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(apartmentId);
    
    if (!isUuid) {
        console.log('Landlord: Invalid apartment ID:', apartmentId);
        return;
    }
    
    console.log('Landlord: Setting up listener for apartment:', apartmentId);

    const channel = client.channel(`floating-messages-${apartmentId}`);
    window.__floatingChatChannel = channel;

    channel
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `apartment_id=eq.${apartmentId}`
        }, (payload) => {
            console.log('Landlord received message:', payload);
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

            // Show unread badge and notification only for client messages when chat is closed
            if (payload.new.sender_type === 'client' && chatContainer && !chatContainer.classList.contains('show')) {
                const badge = document.getElementById('unreadBadge');
                if (badge) {
                    const currentCount = parseInt(badge.textContent) || 0;
                    badge.textContent = currentCount + 1;
                    badge.style.display = 'flex';
                }
                
                // Show notification
                showMessageNotification('New message from client', payload.new.message);
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
    window.updateFloatingChatContext = function(apartmentId, clientName) {
        currentApartmentId = apartmentId;
        
        const chatName = document.getElementById('floatingChatName');
        if (chatName && clientName) {
            chatName.textContent = clientName;
        }
        
        const cid = window.currentClientId;
        const headerLabel = (chatName && chatName.textContent) ? chatName.textContent.trim() : clientName;
        checkLandlordChatRentDueReminder(apartmentId, cid, headerLabel).finally(() => {
            loadFloatingChatMessages();
            listenForFloatingMessages();
        });
    };
}

function walkInStorageKey(apartmentId, unitNumber) {
  return `apartrent-walkin-tenant:${String(apartmentId)}:${String(unitNumber)}`;
}

function getWalkInTenant(apartmentId, unitNumber) {
  // LocalStorage caching disabled; walk-in details must come from the database
  void apartmentId; void unitNumber;
  return null;
}

function setWalkInTenant(apartmentId, unitNumber, details) {
  // LocalStorage caching disabled
  void apartmentId; void unitNumber; void details;
}

async function clearWalkInTenant(apartmentId, unitNumber) {
  const aptId = apartmentId != null ? String(apartmentId) : '';
  const u = unitNumber != null && !isNaN(unitNumber) ? Number(unitNumber) : null;
  if (!aptId || u == null) return true;
  try {
    const client = initSupabase();
    if (!client) {
      alert('Cannot clear walk-in tenant: Supabase client not available.');
      return false;
    }
    const { error } = await client
      .from('walkin_rentals')
      .delete()
      .eq('apartment_id', aptId)
      .eq('unit_number', u);
    if (error) throw error;
    return true;
  } catch (e) {
    console.error('clearWalkInTenant failed:', e);
    alert('Failed to delete walk-in tenant from database. Please try again.');
    return false;
  }
}

function promptWalkInTenantDetails(apartmentId, unitNumber) {
  return new Promise((resolve) => {
    const modal = document.getElementById('walkInTenantModal');
    const errEl = document.getElementById('walkInTenantError');
    const fullNameEl = document.getElementById('walkInFullName');
    const emailEl = document.getElementById('walkInEmail');
    const phoneEl = document.getElementById('walkInPhone');
    const moveInEl = document.getElementById('walkInMoveInDate');
    const notesEl = document.getElementById('walkInNotes');
    const saveBtn = document.getElementById('walkInTenantSaveBtn');
    const cancelBtn = document.getElementById('walkInTenantCancelBtn');

    if (!modal || !saveBtn || !cancelBtn || !fullNameEl) {
      resolve(null);
      return;
    }

    if (errEl) errEl.textContent = '';
    fullNameEl.value = '';
    if (emailEl) emailEl.value = '';
    if (phoneEl) phoneEl.value = '';
    if (moveInEl) moveInEl.value = '';
    if (notesEl) notesEl.value = '';

    const cleanup = () => {
      try { saveBtn.removeEventListener('click', onSave); } catch (_) {}
      try { cancelBtn.removeEventListener('click', onCancel); } catch (_) {}
    };

    const onCancel = () => {
      cleanup();
      modal.style.display = 'none';
      resolve(null);
    };

    const onSave = async () => {
      const fullName = String(fullNameEl.value || '').trim();
      if (!fullName) {
        if (errEl) errEl.textContent = 'Full name is required.';
        return;
      }
      const details = {
        source: 'walkin',
        status: 'walk-in',
        approvedAt: '—',
        submittedAt: '—',
        fullName,
        email: String(emailEl?.value || '').trim(),
        phone: String(phoneEl?.value || '').trim(),
        moveInDate: String(moveInEl?.value || '').trim(),
        additionalInfo: String(notesEl?.value || '').trim(),
        unitNumber: Number(unitNumber),
        updatedAt: new Date().toISOString()
      };
      try {
        const client = initSupabase();
        if (!client) {
          // If we can't reach Supabase, still show details for this session only
          try { showRenterDetailsModal(details); } catch (_) {}
          cleanup();
          modal.style.display = 'none';
          resolve(details);
          return;
        }
        // Save walk-in tenant in separate walkin_rentals table
        const { data: sess } = await client.auth.getSession();
        const landlordId = sess?.session?.user?.id || null;
        const payload = {
          apartment_id: apartmentId,
          unit_number: Number(unitNumber),
          landlord_id: landlordId,
          full_name: details.fullName,
          email: details.email,
          phone: details.phone,
          move_in_date: details.moveInDate || null,
          additional_info: details.additionalInfo || ''
        };
        const { error } = await client
          .from('walkin_rentals')
          .insert(payload);
        if (error) {
          console.error('Failed to save walk-in tenant:', error);
          // On RLS/permission error, still show non-persistent details so UI is correct
          try { showRenterDetailsModal(details); } catch (_) {}
          cleanup();
          modal.style.display = 'none';
          resolve(details);
          return;
        }
        // After saving, immediately show renter details panel for this unit
        try { await showRenterDetailsByApartment(apartmentId, unitNumber); } catch (_) {}
        cleanup();
        modal.style.display = 'none';
        resolve(details);
      } catch (e) {
        console.error('Error saving walk-in tenant:', e);
        if (errEl) errEl.textContent = 'Unexpected error while saving.';
      }
    };

    saveBtn.addEventListener('click', onSave);
    cancelBtn.addEventListener('click', onCancel);
    modal.style.display = 'flex';
  });
}

// ========== TEMP-TEST-RENT-DUE — delete this entire IIFE when verification is done ==========
// (function () {
//     document.addEventListener('DOMContentLoaded', function () {
//         const btn = document.createElement('button');
//         btn.type = 'button';
//         btn.textContent = 'TEST rent-due UI';
//         btn.title = 'Disposable tester. Remove the TEMP-TEST-RENT-DUE block in landlord.js when finished.';
//         btn.setAttribute('data-temp-test-rent-due', '1');
//         btn.style.cssText =
//             'position:fixed;bottom:14px;left:14px;z-index:2147483000;padding:10px 14px;font-size:12px;font-weight:600;cursor:pointer;background:#f59e0b;color:#111827;border:2px dashed #92400e;border-radius:10px;box-shadow:0 4px 12px rgba(0,0,0,.2);font-family:system-ui,sans-serif;';
//         btn.onclick = function () {
//             const apt = currentApartmentId;
//             const msg =
//                 'TEST (disposable): Sample tenant rent-due banner — delete TEMP-TEST-RENT-DUE in landlord.js when done.';
//             // Always show the badge during testing (even if no apt is selected yet).
//             setChatBubbleReminderToOne(true);
//             if (apt) {
//                 window.__rentDueFloatingReminder = { apartmentId: apt, text: msg };
//                 prependLandlordRentDueReminders();
//                 // Force badge during testing even if chat is open.
//                 setChatBubbleReminderToOne(true);
//             }

//             // Also highlight the due/overdue rented unit card in the Rented tab UI (outerad).
//             try {
//                 const rentedContainer = document.getElementById('landlordRentedListings');
//                 if (rentedContainer) {
//                     rentedContainer.querySelectorAll('.outerad-due-unit').forEach((c) => c.classList.remove('outerad-due-unit'));

//                     const cards = Array.from(rentedContainer.querySelectorAll('.outerad'));
//                     let testAptId = apt != null ? String(apt) : null;
//                     let testUnitNum = null;

//                     if (testAptId) {
//                         const matched = cards.find((card) => {
//                             const cardApt = card.dataset.adId != null ? String(card.dataset.adId) : '';
//                             const unitStr = card.dataset.unitNumber;
//                             const u = unitStr != null && unitStr !== '' ? Number(unitStr) : NaN;
//                             return cardApt === testAptId && Number.isFinite(u);
//                         });
//                         if (matched) {
//                             testUnitNum = Number(matched.dataset.unitNumber);
//                         }
//                     }

//                     // Fallback: pick the first rented unit card with a unit number.
//                     if (testUnitNum == null) {
//                         const firstWithUnit = cards.find((card) => {
//                             const unitStr = card.dataset.unitNumber;
//                             return unitStr != null && unitStr !== '' && Number.isFinite(Number(unitStr));
//                         });
//                         if (firstWithUnit) {
//                             testAptId = firstWithUnit.dataset.adId != null ? String(firstWithUnit.dataset.adId) : null;
//                             testUnitNum = firstWithUnit.dataset.unitNumber != null ? Number(firstWithUnit.dataset.unitNumber) : null;
//                         }
//                     }

//                     if (testAptId && Number.isFinite(testUnitNum)) {
//                         window.__testRentDueOuterAdOverride = { apartmentId: testAptId, unitNumber: testUnitNum };
//                         const targetCard = cards.find((card) => {
//                             const cardApt = card.dataset.adId != null ? String(card.dataset.adId) : '';
//                             const unitStr = card.dataset.unitNumber;
//                             const u = unitStr != null && unitStr !== '' ? Number(unitStr) : NaN;
//                             return cardApt === String(testAptId) && u === Number(testUnitNum);
//                         });
//                         if (targetCard) {
//                             targetCard.classList.add('outerad-due-unit');
//                             targetCard.title = `TEST: Rent due reminder (Unit ${testUnitNum})`;
//                         }
//                     }
//                 }
//             } catch (_) {}

//             showMessageNotification(
//                 'TEST: Rent due reminder',
//                 apt
//                     ? 'Open the floating chat: you should see the amber banner at the top.'
//                     : 'Open a client conversation first, then click again for the banner.',
//                 'warning',
//                 { category: 'Test' }
//             );
//         };
//         document.body.appendChild(btn);
//     });
// })();
// ========== END TEMP-TEST-RENT-DUE ==========
