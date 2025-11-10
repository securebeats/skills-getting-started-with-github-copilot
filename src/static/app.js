document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Fetch and display activities
  async function loadActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      activitiesList.innerHTML = "";
      // reset activity select options
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      for (const [name, activity] of Object.entries(activities)) {
        // Create activity card
        const card = document.createElement("div");
        card.className = "activity-card";

        const participantsList = activity.participants
          .map((participant) => `
            <li class="participant-item">
              <span class="participant-email">${participant}</span>
              <button class="participant-delete" data-activity="${encodeURIComponent(
                name
              )}" data-email="${encodeURIComponent(participant)}" aria-label="Remove participant">✖</button>
            </li>`)
          .join("");

        card.innerHTML = `
          <h4>${name}</h4>
          <p><strong>Description:</strong> ${activity.description}</p>
          <p><strong>Schedule:</strong> ${activity.schedule}</p>
          <p><strong>Capacity:</strong> ${activity.participants.length}/${activity.max_participants}</p>
          <div class="participants-section">
            <h5>Registered Participants:</h5>
            <ul class="participants-list">
              ${participantsList}
            </ul>
          </div>
        `;

        activitiesList.appendChild(card);

        // Add activity to dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      }
    } catch (error) {
      console.error("Error loading activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        messageDiv.className = "message success";
        messageDiv.textContent = `✅ Successfully signed up for ${activity}!`;
        messageDiv.classList.remove("hidden");
        signupForm.reset();
        loadActivities();
      } else {
        const error = await response.json();
        messageDiv.className = "message error";
        messageDiv.textContent = `❌ Error: ${error.detail}`;
        messageDiv.classList.remove("hidden");
      }
    } catch (error) {
      messageDiv.className = "message error";
      messageDiv.textContent = `❌ Error: ${error.message}`;
      messageDiv.classList.remove("hidden");
    }
  });

  // Delegate click handler for participant delete buttons
  activitiesList.addEventListener("click", async (event) => {
    const target = event.target;
    if (!target.classList.contains("participant-delete")) return;

    const activityName = decodeURIComponent(target.dataset.activity);
    const email = decodeURIComponent(target.dataset.email);

    if (!confirm(`Remove ${email} from ${activityName}?`)) return;

    try {
      const res = await fetch(
        `/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        messageDiv.className = "message success";
        messageDiv.textContent = `✅ Removed ${email} from ${activityName}`;
        messageDiv.classList.remove("hidden");
        loadActivities();
      } else {
        const err = await res.json();
        messageDiv.className = "message error";
        messageDiv.textContent = `❌ Error: ${err.detail}`;
        messageDiv.classList.remove("hidden");
      }
    } catch (err) {
      messageDiv.className = "message error";
      messageDiv.textContent = `❌ Error: ${err.message}`;
      messageDiv.classList.remove("hidden");
    }
  });

  // Load activities on page load
  loadActivities();
});
