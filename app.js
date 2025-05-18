// Replace below with your actual Firebase config object
const firebaseConfig = {
  apiKey: "AIzaSyBv14PL2MBtbnAOs184WP7ePRfv_zJ5D88",
  authDomain: "bike-on-rent-aa4ad.firebaseapp.com",
  projectId: "bike-on-rent-aa4ad",
  storageBucket: "bike-on-rent-aa4ad.firebasestorage.app",
  messagingSenderId: "1058463733791",
  appId: "1:1058463733791:web:a169e2482c45ce21585d2a",
  measurementId: "G-QREKS73DVT"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const storage = firebase.storage();

const form = document.getElementById('rentalForm');
const rentalList = document.getElementById('rentalList');

let editDocId = null;  // null means adding new rental

// Helper function to upload image and get URL
async function uploadFile(file, path) {
  const storageRef = storage.ref(path);
  await storageRef.put(file);
  return await storageRef.getDownloadURL();
}

// Load rentals and display on page
async function loadRentals() {
  rentalList.innerHTML = ''; // clear previous rentals

  try {
    const snapshot = await db.collection('rentals').orderBy('createdAt', 'desc').get();

    snapshot.forEach(doc => {
      const data = doc.data();

      const rentalDiv = document.createElement('div');
      rentalDiv.classList.add('rental');

      rentalDiv.innerHTML = `
        <h3>Bike: ${data.bikeNumber}</h3>
        <img src="${data.bikeImageUrl}" alt="Bike Image" width="200" /><br />
        <b>Renter:</b> ${data.renterName} <br />
        <b>Hotel:</b> ${data.hotelAddress} <br />
        <b>Payment Mode:</b> ${data.paymentMode} <br />
        <b>Security Amount:</b> ₹${data.securityAmount} <br />
        <b>Rent Amount:</b> ₹${data.rentAmount} <br />
        <b>Rent Duration:</b> ${data.rentStart.toDate().toLocaleString()} - ${data.rentEnd.toDate().toLocaleString()} <br />
        <b>Customer ID Proof:</b><br />
        <img src="${data.idProofUrl}" alt="ID Proof" width="150" /><br />
        <b>Driving License:</b><br />
        <img src="${data.licenseUrl}" alt="License" width="150" /><br />
        <b>Bike With Customer:</b><br />
        <img src="${data.bikeWithCustomerUrl}" alt="Bike with Customer" width="200" /><br />

        <button class="edit-btn" data-id="${doc.id}">Edit</button>
        <button class="delete-btn" data-id="${doc.id}">Delete</button>
      `;

      rentalList.appendChild(rentalDiv);

      // Edit button event
      rentalDiv.querySelector('.edit-btn').addEventListener('click', () => {
        editDocId = doc.id;
        form.bikeNumber.value = data.bikeNumber;
        form.renterName.value = data.renterName;
        form.hotelAddress.value = data.hotelAddress;
        form.paymentMode.value = data.paymentMode;
        form.securityAmount.value = data.securityAmount;
        form.rentAmount.value = data.rentAmount;
        form.rentStart.value = data.rentStart.toDate().toISOString().slice(0,16);
        form.rentEnd.value = data.rentEnd.toDate().toISOString().slice(0,16);

        alert("Edit mode: To change images, delete the entry and add again.");

        window.scrollTo(0, 0);
      });

      // Delete button event
      rentalDiv.querySelector('.delete-btn').addEventListener('click', async () => {
        if(confirm("Are you sure you want to delete this rental?")) {
          try {
            await db.collection('rentals').doc(doc.id).delete();
            alert("Rental deleted.");
            loadRentals();
          } catch (error) {
            alert("Failed to delete: " + error.message);
          }
        }
      });
    });

  } catch (error) {
    alert("Failed to load rentals: " + error.message);
  }
}

// Handle form submit for Add or Edit rental
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const bikeNumber = form.bikeNumber.value.trim();
  const renterName = form.renterName.value.trim();
  const hotelAddress = form.hotelAddress.value.trim();
  const paymentMode = form.paymentMode.value;
  const securityAmount = parseFloat(form.securityAmount.value);
  const rentAmount = parseFloat(form.rentAmount.value);
  const rentStart = form.rentStart.value;
  const rentEnd = form.rentEnd.value;

  try {
    if (!editDocId) {
      // New rental: upload images first
      if (
        !form.bikeImage.files[0] ||
        !form.idProof.files[0] ||
        !form.license.files[0] ||
        !form.bikeWithCustomer.files[0]
      ) {
        alert("Please upload all images.");
        return;
      }

      const bikeImageUrl = await uploadFile(form.bikeImage.files[0], `bikes/${bikeNumber}/bikeImage`);
      const idProofUrl = await uploadFile(form.idProof.files[0], `bikes/${bikeNumber}/idProof`);
      const licenseUrl = await uploadFile(form.license.files[0], `bikes/${bikeNumber}/license`);
      const bikeWithCustomerUrl = await uploadFile(form.bikeWithCustomer.files[0], `bikes/${bikeNumber}/bikeWithCustomer`);

      await db.collection('rentals').add({
        bikeNumber,
        renterName,
        hotelAddress,
        paymentMode,
        securityAmount,
        rentAmount,
        rentStart: new Date(rentStart),
        rentEnd: new Date(rentEnd),
        bikeImageUrl,
        idProofUrl,
        licenseUrl,
        bikeWithCustomerUrl,
        createdAt: new Date()
      });

      alert("Rental added successfully!");
    } else {
      // Editing rental - no image change allowed in edit mode
      await db.collection('rentals').doc(editDocId).update({
        bikeNumber,
        renterName,
        hotelAddress,
        paymentMode,
        securityAmount,
        rentAmount,
        rentStart: new Date(rentStart),
        rentEnd: new Date(rentEnd)
      });

      alert("Rental updated successfully!");
      editDocId = null;
    }

    form.reset();
    loadRentals();

  } catch (error) {
    alert("Error: " + error.message);
  }
});

// Load rentals on page load
window.onload = () => {
  loadRentals();
};
