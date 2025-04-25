const joinGame = async (e) => {
  e.preventDefault();

  const characterForm = document.getElementById("character-form");
  const formData = new FormData(characterForm);
  const character = formData.get("character");

  try {
    const response = await fetch("http://localhost:8080/join-game", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ character }),
    });

    const data = await response.json();

    if (data.status === "success") {
      window.location.href = `http://localhost:3001/index.html?token=${data.token}&character=${character}`;
    } else {
      console.error("Failed to join game:", data.message);
    }
  } catch (error) {
    console.error("Error submitting form:", error);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const characterForm = document.getElementById("character-form");
  characterForm.addEventListener("submit", joinGame);
});
