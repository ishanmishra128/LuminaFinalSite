// get element by id shortcut
function $(id) {
  return document.getElementById(id);
}

// hide all pages
function hideAllPages() {
  ["indexpage", "browsegroupspage", "contactpage", "aboutpage"].forEach((id) =>
    $(id).classList.add("is-hidden")
  );
}

// change color of active nav link
function setActiveNav(id) {
  ["navindex", "navbrowse", "navcontact", "navabout"].forEach((nav) =>
    $(nav).classList.remove("is-red-active")
  );
  if ($(id)) $(id).classList.add("is-red-active");
}

// navigation setup
const navMap = {
  navindex: "indexpage",
  navbrowse: "browsegroupspage",
  navabout: "aboutpage",
  navcontact: "contactpage",
  navbrowse2: "browsegroupspage",
  headlogo: "indexpage",
};

for (const [navId, pageId] of Object.entries(navMap)) {
  const navEl = $(navId);
  if (!navEl) continue;
  navEl.addEventListener("click", (e) => {
    e.preventDefault();
    hideAllPages();
    $(pageId).classList.remove("is-hidden");
    if (navId.startsWith("nav")) setActiveNav(navId);
  });
}

// modal setup functions
function setupModal({ openId, modalId, formId }) {
  const openBtn = $(openId);
  const modal = $(modalId);
  const form = $(formId);
  if (!openBtn || !modal) return;

  const closeTriggers = modal.querySelectorAll("[data-modal-close], .delete");
  const modalCard = modal.querySelector(".modal-card");

  function openModal() {
    modal.classList.add("is-active");
    modal.setAttribute("aria-hidden", "false");
    const firstInput = modal.querySelector("input, textarea, button");
    if (firstInput) firstInput.focus();
    document.addEventListener("keydown", handleEsc);
  }

  function closeModal() {
    modal.classList.remove("is-active");
    modal.setAttribute("aria-hidden", "true");
    document.removeEventListener("keydown", handleEsc);
    if (form) form.reset();
    if (openBtn) openBtn.focus();
  }

  function handleEsc(e) {
    if (e.key === "Escape") closeModal();
  }

  openBtn.addEventListener("click", openModal);
  closeTriggers.forEach((el) => el.addEventListener("click", closeModal));
  if (modalCard)
    modalCard.addEventListener("click", (e) => e.stopPropagation());
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  return { openModal, closeModal };
}

// ---------- Setup Sign Up and Log In Modals ----------
setupModal({
  openId: "navsignup",
  modalId: "signupModal",
  formId: "signupForm",
});
setupModal({ openId: "navlogin", modalId: "loginModal", formId: "loginForm" });

// Create group modal
(function () {
  const modal = $("createGroupModal");
  const openBtn = $("navcreate");
  const form = $("createGroupForm");
  const cards = $("browseGroupCards");
  const navBrowse = $("navbrowse");

  if (!modal || !openBtn) return;

  const closeTriggers = modal.querySelectorAll("[data-modal-close], .delete");
  const modalCard = modal.querySelector(".modal-card");

  function openModal() {
    modal.classList.add("is-active");
    modal.setAttribute("aria-hidden", "false");
    const firstInput = modal.querySelector("input, textarea");
    if (firstInput) firstInput.focus();
    document.addEventListener("keydown", handleEsc);
  }

  function closeModal() {
    modal.classList.remove("is-active");
    modal.setAttribute("aria-hidden", "true");
    document.removeEventListener("keydown", handleEsc);
    if (form) form.reset();
    if (openBtn) openBtn.focus();
  }

  function handleEsc(e) {
    if (e.key === "Escape") closeModal();
  }

  openBtn.addEventListener("click", openModal);
  closeTriggers.forEach((el) => el.addEventListener("click", closeModal));
  if (modalCard)
    modalCard.addEventListener("click", (e) => e.stopPropagation());
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // handle form submission
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = {
        className: form.className?.value || "",
        meetingTimes: form.meetingTimes?.value || "",
        meetingLocation: form.meetingLocation?.value || "",
        meetingFocus: form.meetingFocus?.value || "",
      };

      let studygroup = {
        className: data.className,
        meetingTimes: data.meetingTimes,
        meetingLocation: data.meetingLocation,
        meetingFocus: data.meetingFocus,
        author: auth.currentUser.email,
        members: [auth.currentUser.email],
      };
      db.collection("studygroups")
        .add(studygroup)
        .then(() => {
          showCards(auth.currentUser.email);
          showHomeCards(auth.currentUser.email);
        })
        .catch((err) => {
          alert("Error adding Study Group: " + err.message);
        });
      closeModal();
    });
  }
})();

// Join/Leave group button functionality
function attachJoinButtonHandlers() {
  const buttons = document.querySelectorAll(".join-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", function () {
      const groupId = this.getAttribute("data-group-id");
      const isLeaveButton = this.textContent.trim() === "Leave";

      if (!auth.currentUser) {
        alert("Please log in to join a study group");
        return;
      }

      const userEmail = auth.currentUser.email;
      const groupRef = db.collection("studygroups").doc(groupId);

      if (isLeaveButton) {
        // Remove user from members
        groupRef
          .update({
            members: firebase.firestore.FieldValue.arrayRemove(userEmail),
          })
          .then(() => {
            // Refresh cards
            showCards(userEmail);
            showHomeCards(userEmail);
          })
          .catch((err) => {
            console.error("Error leaving group:", err);
            alert("Error leaving group: " + err.message);
          });
      } else {
        // Add user to members
        groupRef
          .update({
            members: firebase.firestore.FieldValue.arrayUnion(userEmail),
          })
          .then(() => {
            // Refresh cards
            showCards(userEmail);
            showHomeCards(userEmail);
          })
          .catch((err) => {
            console.error("Error joining group:", err);
            alert("Error joining group: " + err.message);
          });
      }
    });
  });
}

// initialize on load
document.addEventListener("DOMContentLoaded", attachJoinButtonHandlers);

//function
function re(id) {
  return document.querySelector(`#${id}`);
}

// Hide buttons based on sign in or sign out
function configure_nav_bar(email) {
  // check if email was received => user is authenticated
  if (email) {
    // show all links with the class signedin, also hide all links with the class signedout
    document.querySelectorAll(".signedin").forEach((link) => {
      link.classList.remove("is-hidden");
    });

    document.querySelectorAll(".signedout").forEach((link) => {
      link.classList.add("is-hidden");
    });
  } else {
    // no user, so show all links with the class signedout,
    // also hide all links with the class signedin
    document.querySelectorAll(".signedin").forEach((link) => {
      link.classList.add("is-hidden");
    });

    document.querySelectorAll(".signedout").forEach((link) => {
      link.classList.remove("is-hidden");
    });
  }
}

// sign-up modal htting submit checks for proper authentication
//and collects information

re("signupForm").addEventListener("submit", (e) => {
  // prevent page from refreshing
  e.preventDefault();

  // collect user email and password from the form

  let email = re("signupemail").value;
  let pass = re("signuppassword").value;

  auth
    .createUserWithEmailAndPassword(email, pass)
    .then((user) => {
      // reset the form ... this will clear the form data
      re("signupForm").reset();

      // hide the modal
      re("signupModal").classList.remove("is-active");
      re("navsignout").classList.remove("is-hidden");
      re("navcreate").classList.remove("is-hidden");
      re("join_button").forEach((btn) => {
        //not working
        btn.classList.remove("is-hidden");
      });
    })
    .catch((err) => {
      re("signuperror").innerHTML = err;
    });
});

// sign out
re("navsignout").addEventListener("click", (e) => {
  e.preventDefault();
  auth.signOut().then(() => {
    configure_nav_bar(null);
  });
});

// log in
re("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();

  let email = re("loginemail").value;
  let pass = re("loginpassword").value;

  auth
    .signInWithEmailAndPassword(email, pass)
    .then((user) => {
      re("loginForm").reset();
      re("loginModal").classList.remove("is-active");
      ///////
      configure_nav_bar(email);

      re("navsignout").classList.remove("is-hidden");
      re("navcreate").classList.remove("is-hidden");
      re("loginerror").classList.add("is-hidden");
      re("join_button").classList.remove("is-hidden");
    })
    .catch((err) => {
      re("loginerror").classList.remove("is-hidden");
    });
});

// Show cards on home page - limit to 4 cards
function showHomeCards(email) {
  if (email) {
    // Show user's own study groups (max 4)
    db.collection("studygroups")
      .where("author", "==", email)
      .limit(4)
      .get()
      .then((data) => {
        let mydocs = data.docs;
        let html = "";
        mydocs.forEach((doc) => {
          const members = doc.data().members || [doc.data().author];
          const isMember = members.includes(email);
          const buttonText = isMember ? "Leave" : "Join Group";
          const buttonClass = isMember ? "is-light has-text-grey" : "is-red";
          html += `<div class="column is-5 m-2">
          <div class="box has-text-centered p-4 has-background-light">
            <button class="delete is-pulled-right has-background-red" onclick="del_doc('${
              doc.id
            }')"></button>
            <h2 class="title is-5 has-text-red">${doc.data().className}</h2>
            <p class="has-text-grey"><strong class="has-text-dark has-text-weight-semibold">When:</strong> ${
              doc.data().meetingTimes
            }</p>
            <p class="has-text-grey"><strong class="has-text-dark has-text-weight-semibold">Where:</strong> ${
              doc.data().meetingLocation
            }</p>
            <p class="has-text-grey mb-4"><strong class="has-text-dark has-text-weight-semibold">Focus:</strong> ${
              doc.data().meetingFocus
            }</p>
            <button class="button join-btn ${buttonClass}" data-group-id="${
            doc.id
          }">${buttonText}</button>
          </div>
        </div>`;
        });
        if (re("homeGroupCards")) {
          re("homeGroupCards").innerHTML = html;
          attachJoinButtonHandlers();
        }
      })
      .catch((err) => {});
  } else {
    // Show first 4 study groups from database
    db.collection("studygroups")
      .limit(4)
      .get()
      .then((data) => {
        let mydocs = data.docs;
        let html = "";
        mydocs.forEach((doc) => {
          html += `<div class="column is-5 m-2">
          <div class="box has-text-centered p-4 has-background-light">
            <h2 class="title is-5 has-text-red">${doc.data().className}</h2>
            <p class="has-text-grey"><strong class="has-text-dark has-text-weight-semibold">When:</strong> ${
              doc.data().meetingTimes
            }</p>
            <p class="has-text-grey"><strong class="has-text-dark has-text-weight-semibold">Where:</strong> ${
              doc.data().meetingLocation
            }</p>
            <p class="has-text-grey mb-4"><strong class="has-text-dark has-text-weight-semibold">Focus:</strong> ${
              doc.data().meetingFocus
            }</p>
            <button class="button is-red" disabled>Login to Join</button>
          </div>
        </div>`;
        });
        if (re("homeGroupCards")) {
          re("homeGroupCards").innerHTML = html;
        }
      })
      .catch((err) => {
        console.error("Error fetching study groups:", err);
      });
  }
}

function showCards(email) {
  //if email exists, In our project we want to check email for joining, not showing all things
  if (email) {
    db.collection("studygroups")
      .get()
      .then((data) => {
        let mydocs = data.docs;

        //loop through documents and show them on the page
        let html = "";
        mydocs.forEach((doc) => {
          const isOwner = doc.data().author === email;
          const members = doc.data().members || [doc.data().author];
          const isMember = members.includes(email);
          const buttonText = isMember ? "Leave" : "Join Group";
          const buttonClass = isMember ? "is-light has-text-grey" : "is-red";
          const deleteBtn = isOwner
            ? `<button class="delete is-pulled-right has-background-red" onclick="del_doc('${doc.id}')"></button>`
            : "";
          html += `<div class="column is-3 m-2">
          <div class="box has-text-centered p-4 has-background-light new-group-card">
            ${deleteBtn}
            <h2 class="title is-5 has-text-red">${doc.data().className}</h2>
            <p class="has-text-grey"><strong class="has-text-dark">When:</strong> ${
              doc.data().meetingTimes
            }</p>
            <p class="has-text-grey"><strong class="has-text-dark">Where:</strong> ${
              doc.data().meetingLocation
            }</p>
            <p class="has-text-grey mb-4"><strong class="has-text-dark">Focus:</strong> ${
              doc.data().meetingFocus
            }</p>
            <button class="button join-btn ${buttonClass}" data-group-id="${
            doc.id
          }">${buttonText}</button>
          </div>
        </div>`;
        });
        re("browseGroupCards").innerHTML = html;
        attachJoinButtonHandlers();
      });
  } else {
    db.collection("studygroups")
      .get()
      .then((data) => {
        let mydocs = data.docs;
        //loop through documents and show them on the page
        let html = "";
        mydocs.forEach((doc) => {
          html += `<div class="column is-3 m-2">
          <div class="box has-text-centered p-4 has-background-light new-group-card">
            <h2 class="title is-5 has-text-red">${doc.data().className}</h2>
            <p class="has-text-grey"><strong class="has-text-dark">When:</strong> ${
              doc.data().meetingTimes
            }</p>
            <p class="has-text-grey"><strong class="has-text-dark">Where:</strong> ${
              doc.data().meetingLocation
            }</p>
            <p class="has-text-grey mb-4"><strong class="has-text-dark">Focus:</strong> ${
              doc.data().meetingFocus
            }</p>
            <button class="button is-red" disabled>Login to Join</button>
          </div>
        </div>`;
        });
        re("browseGroupCards").innerHTML = html;
        attachJoinButtonHandlers();
      });
  }
}

auth.onAuthStateChanged((user) => {
  // check if there is a current user
  if (user) {
    configure_nav_bar(user.email);
    showCards(user.email);
    showHomeCards(user.email);
    re("signupprompt").classList.add("is-hidden");
  } else {
    configure_nav_bar(null);
    showCards();
    showHomeCards();
    re("signupprompt").classList.remove("is-hidden");
  }
});

function del_doc(doc_id) {
  // delete document from firestore collection
  if (confirm("Are you sure you want to delete this study group?")) {
    db.collection("studygroups")
      .doc(doc_id)
      .delete()
      .then(() => {
        // refresh the cards
        if (auth.currentUser) {
          showCards(auth.currentUser.email);
          showHomeCards(auth.currentUser.email);
        } else {
          showCards();
          showHomeCards();
        }
      })
      .catch((err) => {
        console.error("Error deleting study group:", err);
        alert("Error deleting study group: " + err.message);
      });
  }
}

// Search functionality
re("searchbtn").addEventListener("click", (e) => {
  e.preventDefault();
  const searchInput = re("searchInput");
  const query = searchInput ? searchInput.value : "";
  
  if (query.trim() === "") {
    // If search is empty, show all cards (cancel search)
    if (auth.currentUser) {
      showCards(auth.currentUser.email);
    } else {
      showCards();
    }
  } else {
    searchGroups("className", "==", query);
  }
});

function searchGroups(field, operator, value) {
  const email = auth.currentUser ? auth.currentUser.email : null;
  
  db.collection("studygroups")
    .where(field, operator, value)
    .get()
    .then((data) => {
      let mydocs = data.docs;
      let html = "";
      
      if (mydocs.length === 0) {
        html = `<div class="column is-12 has-text-centered">
          <p class="has-text-grey is-size-5 mt-6">No results found. Search is case sensitive.</p>
        </div>`;
      } else {
        mydocs.forEach((doc) => {
          const isOwner = email && doc.data().author === email;
          const members = doc.data().members || [doc.data().author];
          const isMember = email && members.includes(email);
          const buttonText = isMember ? "Leave" : "Join Group";
          const buttonClass = isMember ? "is-light has-text-grey" : "is-red";
          const deleteBtn = isOwner
            ? `<button class="delete is-pulled-right has-background-red" onclick="del_doc('${
                doc.id
              }')"></button>`
            : "";
          
          // Show join button only if logged in
          const joinButton = email
            ? `<button class="button join-btn ${buttonClass}" data-group-id="${
                doc.id
              }">${buttonText}</button>`
            : "";
          
          html += `<div class="column is-3 m-2">
            <div class="box has-text-centered p-4 has-background-light new-group-card">
              ${deleteBtn}
              <h2 class="title is-5 has-text-red">${doc.data().className}</h2>
              <p class="has-text-grey"><strong class="has-text-dark">When:</strong> ${
                doc.data().meetingTimes
              }</p>
              <p class="has-text-grey"><strong class="has-text-dark">Where:</strong> ${
                doc.data().meetingLocation
              }</p>
              <p class="has-text-grey mb-4"><strong class="has-text-dark">Focus:</strong> ${
                doc.data().meetingFocus
              }</p>
              ${joinButton}
            </div>
          </div>`;
        });
      }
      
      re("browseGroupCards").innerHTML = html;
      if (email) {
        attachJoinButtonHandlers();
      }
    })
    .catch((err) => {
      console.error("Error searching study groups:", err);
    });
}
