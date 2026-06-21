const dateSlider = document.getElementById('dateSlider');
const timeGrid = document.getElementById('timeGrid');
const bookingForm = document.getElementById('bookingForm');
const courseSelect = document.getElementById('courseSelect');
const selectedCourseLabel = document.getElementById('selectedCourseLabel');
const selectedSlotLabel = document.getElementById('selectedSlotLabel');
const bookingScreenshot = document.getElementById('bookingScreenshot');
const screenshotPreview = document.getElementById('screenshotPreview');
const screenshotPreviewImg = document.getElementById('screenshotPreviewImg');
const modalBackdrop = document.getElementById('modalBackdrop');
const confirmationModal = document.getElementById('confirmationModal');
const confirmationModalClose = document.getElementById('confirmationModalClose');
const confirmationModalText = document.getElementById('confirmationModalText');
const confirmationModalDetails = document.getElementById('confirmationModalDetails');
const modalWhatsappLink = document.getElementById('modalWhatsappLink');
const modalEmailLink = document.getElementById('modalEmailLink');
const modalDoneBtn = document.getElementById('modalDoneBtn');
const manageBooksBtn = document.getElementById('manageBooksBtn');
const adminModal = document.getElementById('adminModal');
const adminModalClose = document.getElementById('adminModalClose');
const adminModalList = document.getElementById('adminModalList');
const courseBookButtons = document.querySelectorAll('.course-book-button');
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const mobileNav = document.getElementById('mobileNav');
const mobileNavClose = document.getElementById('mobileNavClose');
let selectedDate = null;
let selectedTime = null;
let selectedCourse = '';
let adminMode = false;
const bookings = [];
let SUPABASE_URL = sessionStorage.getItem('ZENTRIX_SUPABASE_URL') || window.ZENTRIX_SUPABASE_URL;
let SUPABASE_KEY = sessionStorage.getItem('ZENTRIX_SUPABASE_KEY') || window.ZENTRIX_SUPABASE_ANON_KEY;

function promptForSupabaseCredentials() {
  const url = prompt('Enter Supabase Project URL (https://your-project.supabase.co):', SUPABASE_URL || '');
  const key = prompt('Enter Supabase anon/publishable key (for testing only):', SUPABASE_KEY || '');
  if (url) sessionStorage.setItem('ZENTRIX_SUPABASE_URL', url);
  if (key) sessionStorage.setItem('ZENTRIX_SUPABASE_KEY', key);
  SUPABASE_URL = url || SUPABASE_URL;
  SUPABASE_KEY = key || SUPABASE_KEY;
}

window.addEventListener('keydown', (e) => {
  if (e.shiftKey && e.key.toLowerCase() === 's') {
    promptForSupabaseCredentials();
    alert('Supabase credentials saved to sessionStorage. Reloading page...');
    location.reload();
  }
});

const SUPABASE_CONFIGURED = Boolean(
  SUPABASE_URL &&
  SUPABASE_KEY &&
  !SUPABASE_URL.includes('YOUR_PROJECT_ID') &&
  !SUPABASE_KEY.includes('YOUR_ANON_KEY')
);

const SUPABASE_HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

const supabaseClient = (window.supabase && window.supabase.createClient && SUPABASE_CONFIGURED)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

const coursePrices = {
  'HTML Fundamentals': 1000,
  'CSS Fundamentals': 1500,
  'JavaScript Fundamentals': 2000,
  'IoT and Robotics': 1000,
};

const bookingColumnFallbacks = {
  course: ['course_name', 'class', 'booking_course'],
  dateText: ['date_text', 'booking_date', 'date'],
  date: ['dateText', 'date_text', 'booking_date'],
  date_text: ['booking_date', 'date'],
  booking_date: ['date', 'dateText'],
  selectedTime: ['selected_time', 'time', 'booking_time'],
  selected_time: ['selectedTime', 'time', 'booking_time'],
  phone: ['phone_number', 'mobile', 'contact'],
  email: ['email_address', 'user_email'],
  screenshot: ['screenshot_data', 'image', 'booking_screenshot'],
};

function parseMissingSupabaseColumn(errorMessage) {
  const match = /Could not find the ['"]?([^'"\s]+)['"]? column/i.exec(errorMessage);
  return match ? match[1] : null;
}

function buildFallbackBookingObject(bookingObj, missingColumn) {
  const fallbackKeys = bookingColumnFallbacks[missingColumn];
  if (!fallbackKeys || fallbackKeys.length === 0) return null;

  const nextKey = fallbackKeys[0];
  const nextFallbacks = fallbackKeys.slice(1);
  const newBookingObj = { ...bookingObj };

  if (missingColumn in newBookingObj) {
    newBookingObj[nextKey] = newBookingObj[missingColumn];
    delete newBookingObj[missingColumn];
  } else {
    return null;
  }

  // Update the fallback list so if the nextKey also fails we can keep trying alternates.
  if (nextFallbacks.length > 0) {
    bookingColumnFallbacks[nextKey] = nextFallbacks;
  }

  return newBookingObj;
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function compressImage(dataUrl, maxWidth = 800, maxHeight = 600, quality = 0.6) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };
    img.src = dataUrl;
  });
}

function setCourseSelection(course) {
  selectedCourse = course;
  courseSelect.value = course;
  selectedCourseLabel.textContent = course || 'None';
}

function updateSelectedSlotLabel() {
  if (selectedDate && selectedTime) {
    const dateText = selectedDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    selectedSlotLabel.textContent = `${dateText} at ${selectedTime}`;
  } else {
    selectedSlotLabel.textContent = 'None';
  }
}

courseSelect.addEventListener('change', (event) => {
  setCourseSelection(event.target.value);
});

bookingScreenshot.addEventListener('change', () => {
  const file = bookingScreenshot.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      screenshotPreviewImg.src = event.target.result;
      screenshotPreview.hidden = false;
    };
    reader.readAsDataURL(file);
  } else {
    screenshotPreview.hidden = true;
  }
});

courseBookButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const course = button.dataset.course;
    setCourseSelection(course);
    document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
  });
});

mobileMenuToggle.addEventListener('click', () => {
  mobileNav.classList.remove('hidden');
  mobileNav.setAttribute('aria-hidden', 'false');
});

mobileNavClose.addEventListener('click', () => {
  mobileNav.classList.add('hidden');
  mobileNav.setAttribute('aria-hidden', 'true');
});

mobileNav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    mobileNav.classList.add('hidden');
    mobileNav.setAttribute('aria-hidden', 'true');
  });
});

function createDateItems() {
  const today = new Date();
  for (let i = 0; i < 8; i += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'date-item';
    item.innerHTML = `<span class="weekday">${date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
      <span class="day">${date.getDate()}</span>`;
    item.addEventListener('click', () => selectDate(item, date));
    dateSlider.appendChild(item);
  }
}

function selectDate(element, date, scroll = true) {
  selectedDate = date;
  selectedTime = null;
  document.querySelectorAll('.date-item').forEach((node) => node.classList.remove('active'));
  element.classList.add('active');
  renderTimeSlots(false);
  updateSelectedSlotLabel();
  if (scroll) {
    timeGrid.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function renderTimeSlots(selectDefault = true) {
  const slots = ['10:00 AM', '12:00 PM', '2:00 PM', '4:00 PM', '6:00 PM'];
  timeGrid.innerHTML = '';
  slots.forEach((slot) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'time-slot';
    item.textContent = slot;
    item.addEventListener('click', () => selectTime(item, slot));
    timeGrid.appendChild(item);
  });

  if (selectDefault && timeGrid.firstElementChild) {
    selectTime(timeGrid.firstElementChild, slots[0], false, false);
  }
}

function selectTime(element, time, scroll = true, focus = true) {
  selectedTime = time;
  document.querySelectorAll('.time-slot').forEach((node) => node.classList.remove('active'));
  element.classList.add('active');
  updateSelectedSlotLabel();
  if (focus) {
    document.getElementById('studentName').focus();
  }
  if (scroll) {
    bookingForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

bookingForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = document.getElementById('studentName').value.trim();
  const email = document.getElementById('studentEmail').value.trim();
  const phone = document.getElementById('studentPhone').value.trim();
  const course = courseSelect.value;
  const screenshotFile = bookingScreenshot.files[0];

  if (!name || !email || !phone || !selectedDate || !selectedTime || !course || !screenshotFile) {
    alert('Complete all fields and upload a screenshot to confirm booking.');
    return;
  }

  const dateText = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const courseFee = coursePrices[course];
  const demoFee = 100;

  const bookingText = `Booking request from ${name}\nCourse: ${course}\nDemo slot: ${dateText} at ${selectedTime}\nPhone: ${phone}\nEmail: ${email}\nPayment: 6383103433@fam`;
  const message = encodeURIComponent(bookingText);
  modalWhatsappLink.href = `https://wa.me/?text=${message}`;
  modalEmailLink.href = `mailto:kamalesy1611@gmail.com?subject=Zentrix Booking Request&body=${message}`;
  confirmationModalText.innerHTML = `Thank you, <strong>${name}</strong>! Your booking will be processed after review.`;
  confirmationModalDetails.textContent = bookingText;

  const reader = new FileReader();
  reader.onload = async (event) => {
    // Compress the image before sending to reduce payload size
    const compressedScreenshot = await compressImage(event.target.result);

    // Also include an ISO `date` field (YYYY-MM-DD) because some Supabase
    // schemas use a DATE column named `date` which rejects human-readable
    // strings like "Sunday, June 28". Include both formats to be tolerant.
    const isoDate = selectedDate ? selectedDate.toISOString().slice(0, 10) : null;

    const bookingObj = {
      name,
      email,
      phone,
      course,
      dateText,
      date: isoDate,
      selectedTime,
      screenshot: compressedScreenshot,
    };

    try {
      const savedBooking = await submitBooking(bookingObj);
      bookings.unshift(savedBooking);
      refreshAdminList();
      openModal(confirmationModal);
    } catch (err) {
      console.error('Booking error:', err);
      alert(`Booking failed: ${err.message || 'Please try again.'}`);
    }
  };
  reader.readAsDataURL(screenshotFile);

  bookingForm.reset();
  selectedCourse = '';
  selectedCourseLabel.textContent = 'None';
  selectedSlotLabel.textContent = 'None';
  screenshotPreview.hidden = true;
});

function refreshAdminList() {
  adminModalList.innerHTML = '';
  const notice = document.getElementById('adminModalNotice');
  if (bookings.length === 0) {
    notice.textContent = 'No bookings yet.';
    return;
  }
  notice.textContent = `${bookings.length} booking(s) found.`;
  bookings.forEach((booking, index) => {
    const entry = document.createElement('div');
    entry.className = 'booking-log-entry';
    const bName = booking.name || booking.full_name || '';
    const bDate = booking.dateText || booking.date_text || booking.date || '';
    const bTime = booking.selectedTime || booking.selected_time || booking.time || '';
    const bCourse = booking.course || '';
    const bPhone = booking.phone || '';
    const bEmail = booking.email || '';
    const bText = booking.bookingText || booking.booking_text || booking.bookingtext || booking.booking || '';
    const bScreenshot = booking.screenshot || booking.screenshot_data || '';
    entry.innerHTML = `
      <div class="booking-log-header">
        <strong>${bName}</strong>
        <span>${bDate} • ${bTime}</span>
      </div>
      <p><strong>Course:</strong> ${bCourse}</p>
      <p><strong>Phone:</strong> ${bPhone}</p>
      <p><strong>Email:</strong> ${bEmail}</p>
      <pre>${bText}</pre>
      <button class="btn btn-secondary view-screenshot-btn" data-booking-index="${index}" style="margin-top: 1rem; width: auto; padding: 0.75rem 1.5rem;">View Screenshot</button>
      <div class="booking-screenshot-preview hidden" id="screenshot-${index}">
        <img src="${bScreenshot}" alt="Booking screenshot for ${bName}" />
      </div>
    `;
    adminModalList.appendChild(entry);
    
    // Add event listener to view button
    const viewBtn = entry.querySelector('.view-screenshot-btn');
    const screenshotDiv = entry.querySelector(`#screenshot-${index}`);
    viewBtn.addEventListener('click', () => {
      screenshotDiv.classList.toggle('hidden');
      viewBtn.textContent = screenshotDiv.classList.contains('hidden') ? 'View Screenshot' : 'Hide Screenshot';
    });
  });
}

async function submitBooking(bookingObj) {
  // Prefer Supabase when configured; otherwise use a local API proxy if available.
  const useSupabase = SUPABASE_CONFIGURED && supabaseClient;

  if (!useSupabase && (typeof navigator !== 'undefined' && !navigator.onLine)) {
    throw new Error('No internet connection. Please reconnect and try again.');
  }

  if (!useSupabase && (!window.ZENTRIX_API_BASE || window.ZENTRIX_API_BASE === '')) {
    throw new Error('No backend configured. Add Supabase credentials in index.html or run the local API and set ZENTRIX_API_BASE.');
  }

  // If Supabase is available, attempt to insert there but fall back to the local API on network errors.
  if (useSupabase) {
    let currentBookingObj = { ...bookingObj };
    const triedColumns = new Set();

    while (true) {
      try {
        const { data, error } = await supabaseClient
          .from('bookings')
          .insert([currentBookingObj])
          .select();

        if (!error) {
          return Array.isArray(data) ? data[0] : data;
        }

        const errorMessage = String(error.message || '').toLowerCase();
        if (errorMessage.includes('failed to fetch') || errorMessage.includes('internet_disconnected') || errorMessage.includes('networkerror')) {
          // network issue — fall back to local API below
          console.warn('Supabase network issue detected, will try local API fallback:', error.message || error);
          break;
        }

        if (error.code === '42501' || errorMessage.includes('permission denied')) {
          throw new Error('Permission denied for table bookings. Make sure the Supabase anon role has INSERT privileges and an RLS policy exists for public inserts.');
        }

        const missingColumn = parseMissingSupabaseColumn(error.message || '');
        if (!missingColumn || triedColumns.has(missingColumn)) {
          console.error('Supabase API Error:', error);
          throw new Error(error.message || 'Booking failed via Supabase. Check table permissions and API key.');
        }

        triedColumns.add(missingColumn);
        const fallback = buildFallbackBookingObject(currentBookingObj, missingColumn);
        if (!fallback) {
          console.error('Supabase API Error:', error);
          throw new Error(error.message || 'Booking failed via Supabase. Check table permissions and API key.');
        }

        currentBookingObj = fallback;
      } catch (err) {
        // If the error looks like a network/fetch failure, fall through to local API.
        if (err instanceof TypeError || /failed to fetch/i.test(err.message || '')) {
          console.warn('Supabase network error, falling back to local API:', err.message);
          break;
        }
        throw err;
      }
    }
  }

  // Local API fallback (POST /api/bookings) — server.js provides this endpoint.
  try {
    const apiBase = window.ZENTRIX_API_BASE || '';
    const res = await fetch(`${apiBase.replace(/\/$/, '')}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: bookingObj.name,
        email: bookingObj.email,
        phone: bookingObj.phone,
        bookingText: `Course: ${bookingObj.course}\nSlot: ${bookingObj.dateText} at ${bookingObj.selectedTime}`,
        screenshot: bookingObj.screenshot,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Local API error: ${res.status} ${res.statusText} - ${errBody}`);
    }

    const body = await res.json();
    return body.booking || body;
  } catch (err) {
    console.error('Booking failed (local API)', err);
    throw new Error(err.message || 'Booking failed via local API.');
  }
}

// Fetch bookings from server (admin) when passphrase is provided
async function fetchAdminBookings(passphrase) {
  // If Supabase is configured, fetch from Supabase. Otherwise try the local API.
  if (SUPABASE_CONFIGURED && supabaseClient) {
    const { data, error } = await supabaseClient
      .from('bookings')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.warn('Supabase admin fetch failed', error);
      if (error.code === '42501' || (error.message && error.message.toLowerCase().includes('permission denied'))) {
        console.warn('Admin fetch requires SELECT privileges on public.bookings for the anon role. Run: GRANT SELECT ON public.bookings TO anon;');
      }
      // fall through to local API attempt
    } else {
      return data;
    }
  }

  // Local API fallback
  try {
    const apiBase = window.ZENTRIX_API_BASE || '';
    const url = `${apiBase.replace(/\/$/, '')}/api/bookings?pass=${encodeURIComponent(passphrase)}`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) {
      console.warn('Local API admin fetch failed', res.status, res.statusText);
      return null;
    }
    const body = await res.json();
    return Array.isArray(body.bookings) ? body.bookings : body.bookings || null;
  } catch (err) {
    console.warn('Local API admin fetch error', err);
    return null;
  }
}


function openModal(modal) {
  modalBackdrop.classList.remove('hidden');
  modal.classList.remove('hidden');
}

function closeModal(modal) {
  modalBackdrop.classList.add('hidden');
  modal.classList.add('hidden');
}

confirmationModalClose.addEventListener('click', () => closeModal(confirmationModal));
modalDoneBtn.addEventListener('click', () => closeModal(confirmationModal));
adminModalClose.addEventListener('click', () => closeModal(adminModal));
manageBooksBtn.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  if (!adminMode) {
    const password = prompt('Enter admin passphrase to view submitted bookings:');
    if (password && password.toLowerCase() === 'zentrix') {
      adminMode = true;
      // attempt to fetch server-side bookings
      fetchAdminBookings(password).then((serverList) => {
        if (Array.isArray(serverList)) {
          // replace local view with server list
          bookings.splice(0, bookings.length, ...serverList);
        }
        refreshAdminList();
        openModal(adminModal);
      });
    } else {
      alert('Incorrect passphrase.');
    }
  } else {
    openModal(adminModal);
  }
});
modalBackdrop.addEventListener('click', () => {
  closeModal(confirmationModal);
  closeModal(adminModal);
});

createDateItems();
renderTimeSlots();
