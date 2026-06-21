const dateSlider = document.getElementById('dateSlider');
const timeGrid = document.getElementById('timeGrid');
const bookingForm = document.getElementById('bookingForm');
const courseSelect = document.getElementById('courseSelect');
const selectedCourseLabel = document.getElementById('selectedCourseLabel');
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
const adminIconBtn = document.getElementById('adminIconBtn');
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
const SUPABASE_URL = window.ZENTRIX_SUPABASE_URL || 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_KEY = window.ZENTRIX_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY';
const SUPABASE_HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

const coursePrices = {
  'HTML Fundamentals': 1000,
  'CSS Fundamentals': 1500,
  'JavaScript Fundamentals': 2000,
  'IoT and Robotics': 1000,
};

function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function setCourseSelection(course) {
  selectedCourse = course;
  courseSelect.value = course;
  selectedCourseLabel.textContent = course;
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

function selectDate(element, date) {
  selectedDate = date;
  document.querySelectorAll('.date-item').forEach((node) => node.classList.remove('active'));
  element.classList.add('active');
  renderTimeSlots();
  timeGrid.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function renderTimeSlots() {
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
}

function selectTime(element, time) {
  selectedTime = time;
  document.querySelectorAll('.time-slot').forEach((node) => node.classList.remove('active'));
  element.classList.add('active');
  document.getElementById('studentName').focus();
  document.getElementById('bookingForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

bookingForm.addEventListener('submit', (event) => {
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
  reader.onload = (event) => {
    const bookingObj = {
      name,
      course,
      dateText,
      selectedTime,
      phone,
      email,
      bookingText,
      screenshot: event.target.result,
      createdAt: new Date().toISOString(),
    };

    fetch(`${SUPABASE_URL}/rest/v1/bookings`, {
      method: 'POST',
      headers: SUPABASE_HEADERS,
      body: JSON.stringify(bookingObj),
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) {
          throw new Error(data?.message || 'Booking failed');
        }
        const saved = Array.isArray(data) ? data[0] : data;
        bookings.unshift(saved);
        refreshAdminList();
        openModal(confirmationModal);
      })
      .catch((error) => {
        console.error('Supabase booking error', error);
        alert('Booking could not be saved to Supabase. Please check your backend settings and try again.');
      });
  };
  reader.readAsDataURL(screenshotFile);

  bookingForm.reset();
  selectedCourse = '';
  selectedCourseLabel.textContent = 'None';
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
  bookings.forEach((booking) => {
    const entry = document.createElement('div');
    entry.className = 'booking-log-entry';
    entry.innerHTML = `
      <div class="booking-log-header">
        <strong>${booking.name}</strong>
        <span>${booking.dateText} • ${booking.selectedTime}</span>
      </div>
      <p><strong>Course:</strong> ${booking.course}</p>
      <p><strong>Phone:</strong> ${booking.phone}</p>
      <p><strong>Email:</strong> ${booking.email}</p>
      <pre>${booking.bookingText}</pre>
      <div class="booking-screenshot-preview">
        <img src="${booking.screenshot}" alt="Booking screenshot for ${booking.name}" />
      </div>
    `;
    adminModalList.appendChild(entry);
  });
}

// Fetch bookings from server (admin) when passphrase is provided
function fetchAdminBookings(passphrase) {
  return fetch(`${SUPABASE_URL}/rest/v1/bookings?select=*&order=id.desc`, {
    headers: SUPABASE_HEADERS,
  })
    .then((r) => {
      if (!r.ok) throw new Error('unauthorized');
      return r.json();
    })
    .catch((err) => {
      console.warn('fetchAdminBookings failed', err);
      return null;
    });
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
modalBackdrop.addEventListener('click', () => {
  closeModal(confirmationModal);
  closeModal(adminModal);
});

adminIconBtn.addEventListener('click', () => {
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

createDateItems();
renderTimeSlots();
